/**
 * Imports the Uiverse element library into `packages/uiverse`, from the upstream repository rather
 * than from the website: `uiverse-io/galaxy` is the same catalogue published as files, under MIT with
 * no additional clause (verified 2026-09-11, see `packages/uiverse/LICENSES.md`).
 *
 * One file per element, named `<author>_<slug>.html`, each carrying its markup, an optional `<style>`
 * block, and an attribution comment that also lists the element's tags. Elements without a `<style>`
 * block are Tailwind ones: the classes are the styling, and there is nothing else to extract.
 *
 * Usage:
 *   git clone --depth 1 https://github.com/uiverse-io/galaxy.git <dir>
 *   pnpm tsx scripts/import-uiverse.ts <dir>
 *
 * The view counts are not here. They live on the website, one request per element, and
 * `scripts/enrich-uiverse-views.ts` collects them into `data/views.json` as a separate pass so a
 * failed or throttled crawl never leaves the catalogue itself half-written.
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const source = process.argv[2]

if (source === undefined || !existsSync(source)) {
  throw new Error(
    'usage: pnpm tsx scripts/import-uiverse.ts <path to a clone of uiverse-io/galaxy>',
  )
}

const OUT = join(process.cwd(), 'packages', 'uiverse', 'data')

/** The directory names upstream, mapped to the ids this repository uses. */
const CATEGORIES: Readonly<Record<string, string>> = {
  Buttons: 'buttons',
  Cards: 'cards',
  Checkboxes: 'checkboxes',
  Forms: 'forms',
  Inputs: 'inputs',
  Notifications: 'notifications',
  Patterns: 'patterns',
  'Radio-buttons': 'radio-buttons',
  'Toggle-switches': 'toggle-switches',
  Tooltips: 'tooltips',
  loaders: 'loaders',
}

/**
 * `From Uiverse.io by <author>` opens the attribution every one of the 3 802 files carries. It sits
 * in a CSS comment on a styled element and in an HTML comment on a Tailwind one, where there is no
 * `<style>` block to put it in, so both delimiters are matched.
 *
 * What follows the author varies: nothing, `- Tags: a, b, c`, or a re-publication's fuller form
 * `- Website: <url> - Name: <original author> - Tags: …`. Labels are therefore read by name rather
 * than by position, and the hyphen is not a separator to split on — it appears inside tags.
 */
const ATTRIBUTION = /(?:\/\*|<!--)([\s\S]*?From Uiverse\.io by [\s\S]*?)(?:\*\/|-->)/
const AUTHOR = /From Uiverse\.io by (\S+)/
const TAGS = /-\s*Tags:\s*([\s\S]*)$/
/** A re-publication names the element it came from; both are credited. */
const ORIGIN = /-\s*Website:\s*(\S+)/

interface Element {
  readonly id: string
  readonly category: string
  readonly author: string
  readonly slug: string
  readonly tags: readonly string[]
  readonly html: string
  readonly css: string
  /** Tailwind elements carry their styling in class names and have no `<style>` block at all. */
  readonly styling: 'css' | 'tailwind'
  /** The element this one was republished from, when the attribution names one. */
  readonly origin?: string
}

const parse = (category: string, fileName: string, source: string): Element => {
  const base = fileName.replace(/\.html$/, '')
  const split = base.indexOf('_')

  if (split <= 0) {
    throw new Error(`${category}/${fileName}: the name is not <author>_<slug>`)
  }

  const style = source.match(/<style>([\s\S]*?)<\/style>/)
  const css = style?.[1]?.trim() ?? ''
  const comment = source.match(ATTRIBUTION)?.[1]

  if (comment === undefined) {
    throw new Error(`${category}/${fileName}: no Uiverse attribution comment`)
  }

  const author = comment.match(AUTHOR)?.[1]

  if (author === undefined) {
    throw new Error(`${category}/${fileName}: the attribution names no author`)
  }

  const tags = (comment.match(TAGS)?.[1] ?? '')
    .split(',')
    .map((tag) => tag.trim())
    .filter((tag) => tag !== '')

  const origin = comment.match(ORIGIN)?.[1]

  return {
    id: `${category}/${base}`,
    category,
    author,
    slug: base.slice(split + 1),
    tags,
    html: source.replace(/<style>[\s\S]*?<\/style>/, '').trim(),
    css,
    styling: css === '' ? 'tailwind' : 'css',
    ...(origin === undefined ? {} : { origin }),
  }
}

/** One line per element: a diff on this file names the elements that changed, not the whole array. */
const serialise = (elements: readonly Element[]): string =>
  `[\n${elements.map((element) => JSON.stringify(element)).join(',\n')}\n]\n`

mkdirSync(OUT, { recursive: true })

const summary: { category: string; elements: number; tailwind: number; authors: number }[] = []

for (const [directory, category] of Object.entries(CATEGORIES)) {
  const path = join(source, directory)

  if (!existsSync(path) || !statSync(path).isDirectory()) {
    throw new Error(`${directory} is missing from the clone — the upstream layout changed`)
  }

  const elements = readdirSync(path)
    .filter((name) => name.endsWith('.html'))
    .map((name) => parse(category, name, readFileSync(join(path, name), 'utf8')))
    .sort((a, b) => a.id.localeCompare(b.id))

  writeFileSync(join(OUT, `${category}.json`), serialise(elements), 'utf8')

  summary.push({
    category,
    elements: elements.length,
    tailwind: elements.filter((element) => element.styling === 'tailwind').length,
    authors: new Set(elements.map((element) => element.author)).size,
  })
}

writeFileSync(
  join(OUT, 'index.json'),
  `${JSON.stringify(
    {
      source: 'https://github.com/uiverse-io/galaxy',
      licence: 'MIT',
      imported: new Date().toISOString().slice(0, 10),
      categories: summary,
      total: summary.reduce((sum, entry) => sum + entry.elements, 0),
    },
    null,
    2,
  )}\n`,
  'utf8',
)

for (const entry of summary) {
  console.log(
    `${entry.category.padEnd(16)} ${String(entry.elements).padStart(5)}  tailwind ${String(entry.tailwind).padStart(4)}  authors ${entry.authors}`,
  )
}
console.log(`total ${summary.reduce((sum, entry) => sum + entry.elements, 0)}`)
