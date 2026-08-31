#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
/**
 * What every route actually downloads before it is interactive, in gzipped bytes on disk.
 *
 * `next build`'s own table is the summary; this is the list it summarises. The source is
 * `app-build-manifest.json` — the same base ADR-300 established for the landing islands, because a
 * `<script src>` read from a live DOM includes chunks Next appends after hydration.
 *
 * `--attribute <route>` additionally prints the route's chunks largest-first, and
 * `--markers` says which chunk holds each module PERFORMANCE.md § Mandatory dynamic imports names.
 */
import { gzipSync } from 'node:zlib'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const NEXT = join(ROOT, 'apps', 'web', '.next')
const MANIFEST = join(NEXT, 'app-build-manifest.json')

if (!existsSync(MANIFEST)) {
  process.stderr.write('No build found. Run `pnpm --filter web build` first.\n')
  process.exit(1)
}

/**
 * PERFORMANCE.md § Mandatory dynamic imports, one string that only that module can produce.
 *
 * A string probe over built chunks, which is a check rather than the authority: module paths are gone
 * from a production chunk, so the answer to "which module is in this chunk" comes from
 * `pnpm analyze`'s treemap. This is what catches the same question in two seconds.
 */
const MARKERS = [
  ['@motion-studio/codegen', 'printReactComponent'],
  ['prettier', 'prettier/standalone'],
  ['gsap', 'ScrollTrigger'],
  ['CodeMirror 6', '@codemirror/view'],
  ['colour picker', 'react-stately'],
  ['jszip', 'JSZip'],
  ['particles effect', 'particle-field'],
  ['mesh-gradient', 'mesh-gradient'],
  ['chart-preview', 'chart-preview'],
  ['blocks/highlight', 'TOKEN_KINDS'],
]

const manifest = JSON.parse(readFileSync(MANIFEST, 'utf8'))
const pages = manifest.pages ?? {}

const gzipOf = (file) => {
  const path = join(NEXT, file)

  return existsSync(path) ? gzipSync(readFileSync(path)).length : 0
}

const sizes = new Map()

for (const files of Object.values(pages)) {
  for (const file of files) {
    if (!sizes.has(file)) {
      sizes.set(file, gzipOf(file))
    }
  }
}

/**
 * Both units, because the budgets are ambiguous by a factor of 1.024 and the gate resolves it in
 * bytes — ADR-314. KiB is the unit every number in PERFORMANCE.md was taken in; the decimal kB beside
 * it is what `next build` and `size-limit` print.
 */
const kb = (bytes) => `${(bytes / 1024).toFixed(1)} KiB`

const both = (bytes) => `${(bytes / 1024).toFixed(1)} KiB / ${(bytes / 1000).toFixed(1)} kB`

const totals = Object.entries(pages)
  .map(([route, files]) => ({
    route,
    files,
    total: files.reduce((sum, file) => sum + (sizes.get(file) ?? 0), 0),
  }))
  .sort((a, b) => b.total - a.total)

process.stdout.write('First-load JS, gzipped from disk\n')
for (const { route, files, total } of totals) {
  process.stdout.write(
    `  ${route.padEnd(34)} ${both(total).padStart(22)}  (${files.length} files)\n`,
  )
}

const attribute = process.argv.indexOf('--attribute')

if (attribute !== -1) {
  const wanted = process.argv[attribute + 1]
  const entry = totals.find(({ route }) => route === wanted)

  if (entry === undefined) {
    process.stderr.write(`\nNo route ${wanted}. One of: ${totals.map((t) => t.route).join(', ')}\n`)
    process.exit(1)
  }

  process.stdout.write(`\n${wanted}, chunk by chunk\n`)
  const shared = new Set(pages['/page'] ?? [])

  for (const file of [...entry.files].sort((a, b) => (sizes.get(b) ?? 0) - (sizes.get(a) ?? 0))) {
    const tag = shared.has(file) ? 'shared with /' : 'route only'

    process.stdout.write(`  ${kb(sizes.get(file) ?? 0).padStart(10)}  ${file}  [${tag}]\n`)
  }
}

if (process.argv.includes('--markers')) {
  process.stdout.write('\nMandatory dynamic imports\n')

  const allChunks = [...new Set(Object.values(pages).flat())]
  const everyChunk = new Set(allChunks)

  for (const [name, marker] of MARKERS) {
    const holders = []

    for (const file of everyChunk) {
      const path = join(NEXT, file)

      if (existsSync(path) && readFileSync(path, 'utf8').includes(marker)) {
        holders.push(file)
      }
    }

    const routes = totals
      .filter(({ files }) => files.some((file) => holders.includes(file)))
      .map(({ route }) => route)

    process.stdout.write(
      `  ${name.padEnd(24)} ${holders.length === 0 ? 'not in any first-load chunk' : `IN FIRST LOAD of ${routes.join(', ')} — ${holders.join(', ')}`}\n`,
    )
  }
}
