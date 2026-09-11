/**
 * Collects the one popularity signal Uiverse publishes: `viewCount`, which sits in the page data of
 * each element's own page. Likes and saves are **not** public — the listing shows neither, and the
 * site's `/api/posts` answers 401 — so "popular" here means "seen", and `data/views.json` says so by
 * carrying the date it was read.
 *
 * One request per element, in order, with a delay between them. That is 3 802 requests against
 * somebody else's website, so the delay is the point rather than an inconvenience: the default is one
 * request per second, `robots.txt` disallows only `/admin`, and the run is resumable so a stop costs
 * nothing.
 *
 * Usage:
 *   pnpm tsx scripts/enrich-uiverse-views.ts [--limit N] [--delay MS] [--category NAME]
 *
 * Results are written after every batch, so an interrupted run keeps what it collected and the next
 * run skips those ids.
 */
import { execFile } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { promisify } from 'node:util'

const run = promisify(execFile)

const DATA = join(process.cwd(), 'packages', 'uiverse', 'data')
const OUT = join(DATA, 'views.json')

const argument = (name: string): string | undefined => {
  const index = process.argv.indexOf(`--${name}`)

  return index === -1 ? undefined : process.argv[index + 1]
}

const limit = Number(argument('limit') ?? Number.POSITIVE_INFINITY)
const delay = Number(argument('delay') ?? 1000)
const only = argument('category')

/**
 * A browser's user agent, because the site answers a bare one with 403 — and `curl` rather than
 * `fetch` for the same reason one layer down: Node's client is refused with the identical headers,
 * measured, so the difference is the TLS handshake rather than anything this script can set.
 */
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36'

interface Element {
  readonly id: string
  readonly author: string
  readonly slug: string
}

interface Views {
  collected: string
  views: Record<string, number>
}

const index = JSON.parse(readFileSync(join(DATA, 'index.json'), 'utf8')) as {
  categories: { category: string }[]
}

const elements = index.categories
  .filter((summary) => only === undefined || summary.category === only)
  .flatMap(
    (summary) =>
      JSON.parse(readFileSync(join(DATA, `${summary.category}.json`), 'utf8')) as Element[],
  )

const collected: Views = existsSync(OUT)
  ? (JSON.parse(readFileSync(OUT, 'utf8')) as Views)
  : { collected: new Date().toISOString().slice(0, 10), views: {} }

const pending = elements.filter((element) => collected.views[element.id] === undefined)
const work = pending.slice(0, Number.isFinite(limit) ? limit : pending.length)

console.log(
  `${elements.length} elements, ${Object.keys(collected.views).length} already counted, ${work.length} to read`,
)

const VIEW_COUNT = /"viewCount":\s*(\d+)/

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms))

const save = (): void => {
  collected.collected = new Date().toISOString().slice(0, 10)
  writeFileSync(OUT, `${JSON.stringify(collected, null, 1)}\n`, 'utf8')
}

let read = 0
let missing = 0
let failed = 0

for (const [position, element] of work.entries()) {
  const url = `https://uiverse.io/${element.author}/${element.slug}`

  try {
    const { stdout } = await run(
      'curl',
      ['-sS', '--compressed', '--max-time', '25', '-H', `User-Agent: ${USER_AGENT}`, url],
      { maxBuffer: 32 * 1024 * 1024 },
    )
    const count = stdout.match(VIEW_COUNT)?.[1]

    if (count === undefined) {
      missing += 1
    } else {
      collected.views[element.id] = Number(count)
      read += 1
    }
  } catch {
    // A network error is one element's count, not the run's: the next pass picks it up.
    failed += 1
  }

  if (position % 25 === 24) {
    save()
    console.log(
      `${position + 1}/${work.length} · read ${read} · missing ${missing} · failed ${failed}`,
    )
  }

  await sleep(delay)
}

save()
console.log(`done · read ${read} · missing ${missing} · failed ${failed} · file ${OUT}`)
