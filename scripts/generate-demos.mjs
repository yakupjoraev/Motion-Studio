#!/usr/bin/env node
/**
 * The README's demos — `prompts/59` § Why generate rather than record.
 *
 *   pnpm generate:demos
 *   pnpm generate:demos --flow compose-page
 *
 * Playwright drives each of the four flows in PRODUCT.md § User flows against a **production**
 * build, records it, and ffmpeg turns the recording into a GIF small enough for a README. A
 * hand-recorded demo is stale the first time the UI moves; this one is regenerated on release, which
 * is why it is in `DEVOPS.md` § Release checklist rather than in somebody's notes.
 *
 * The server is expected to be running already — `pnpm --filter web start` — because a script that
 * starts and stops a Next server around a twenty-minute recording is a script that leaves one behind.
 */
import { mkdir, rm, stat } from 'node:fs/promises'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { FLOWS } from './demos/flows.mjs'
import {
  MAX_GIF_BYTES,
  durationOf,
  playwright,
  publish,
  record,
  scratchDir,
  toGif,
} from './demos/record.mjs'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const OUT_DIR = join(ROOT, 'docs', 'assets', 'demos')

const argument = (name) => {
  const index = process.argv.indexOf(`--${name}`)

  return index === -1 ? null : process.argv[index + 1]
}

const PORT = argument('port') ?? process.env['PORT'] ?? '3000'
const ORIGIN = `http://localhost:${PORT}`

const selected = argument('flow')

if (selected !== null && FLOWS[selected] === undefined) {
  console.error(`Unknown flow "${selected}". One of: ${Object.keys(FLOWS).join(', ')}`)
  process.exit(1)
}

const wanted = selected === null ? Object.keys(FLOWS) : [selected]

const reachable = async () => {
  try {
    const response = await fetch(`${ORIGIN}/studio`, { redirect: 'manual' })

    return response.status < 500
  } catch {
    return false
  }
}

if (!(await reachable())) {
  console.error(
    `Nothing is answering on ${ORIGIN}. Build and start the app first:
  pnpm build
  PORT=${PORT} pnpm --filter web start`,
  )
  process.exit(1)
}

const { chromium } = playwright(ROOT)

const browser = await chromium.launch({ channel: 'chrome' })

await mkdir(OUT_DIR, { recursive: true })

const report = []

try {
  for (const name of wanted) {
    const flow = FLOWS[name]
    const videoDir = await scratchDir(name)

    process.stdout.write(`${name}: recording…\n`)

    const recorded = await record(browser, flow.run, { origin: ORIGIN, videoDir })
    const webm = await publish(recorded, OUT_DIR, name)
    const gif = join(OUT_DIR, `${name}.gif`)

    process.stdout.write(`${name}: encoding…\n`)

    const encoding = await toGif(webm, gif)
    const seconds = await durationOf(webm)

    await rm(videoDir, { recursive: true, force: true })

    report.push({
      name,
      title: flow.title,
      seconds,
      gifBytes: encoding.bytes,
      webmBytes: (await stat(webm)).size,
      fps: encoding.fps,
      colors: encoding.colors,
      width: encoding.width,
    })
  }
} finally {
  await browser.close()
}

const mb = (bytes) => `${(bytes / (1024 * 1024)).toFixed(2)} MB`

console.log('')

for (const entry of report) {
  const over = entry.gifBytes > MAX_GIF_BYTES ? '  ← OVER THE 3 MB CAP' : ''

  console.log(
    `${entry.name.padEnd(14)} ${String(entry.seconds?.toFixed(1) ?? '?').padStart(5)}s  ` +
      `gif ${mb(entry.gifBytes).padStart(8)} (${entry.width}px, ${entry.fps} fps, ${entry.colors} colours)  ` +
      `webm ${mb(entry.webmBytes)}${over}`,
  )
}

console.log(`\nWritten to ${relative(ROOT, OUT_DIR)}`)

if (report.some((entry) => entry.gifBytes > MAX_GIF_BYTES)) {
  process.exit(1)
}
