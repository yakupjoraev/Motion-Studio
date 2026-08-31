/**
 * The four route budgets, each measured as the metric its own document states — ADR-314.
 *
 * `/` and `/studio` are **first-load JS**: PERFORMANCE.md § Public pages and § Studio, and
 * ENGINEERING_CONTRACT.md § 6, all say first load, so the entry is the exact file list the route
 * downloads, read from `.next/app-build-manifest.json`. A glob over `app/studio/**` would have matched
 * 47 kB of a 246 kB first load and passed on every day the route was 120 kB over.
 *
 * `/playground` and `/blocks` are the **route's own chunk**: PERFORMANCE.md § Route budgets writes
 * them as globs at `app/<route>/page-*.js`, and 90 kB cannot be a first-load number when the shared
 * framework baseline alone is 105 kB.
 *
 * **The limits are in bytes on purpose.** "250 kB" is ambiguous by a factor of 1.024, and the
 * repository's own history settles which reading it was: ADR-292 recorded `/studio` at "370 kB gzip"
 * for a build whose files gzip to 369.7 KiB and which `next build` printed as 378 kB. Every number in
 * PERFORMANCE.md is therefore KiB, `size-limit` parses `kB` as 1000 bytes, and a limit written in
 * bytes cannot be read two ways.
 *
 * Run `pnpm --filter web build` first. `pnpm measure:routes` prints the same numbers in both units.
 */
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const NEXT = join(process.cwd(), 'apps', 'web', '.next')
const MANIFEST = join(NEXT, 'app-build-manifest.json')

const KIB = 1024

const FIRST_LOAD = [
  { name: 'landing first-load JS (120 KiB)', page: '/page', limit: 120 * KIB },
  { name: 'studio first-load JS (250 KiB)', page: '/studio/page', limit: 250 * KIB },
]

const ROUTE_CHUNK = [
  { name: 'playground route chunk (90 KiB)', page: '/playground/page', limit: 90 * KIB },
  { name: 'blocks route chunk (140 KiB)', page: '/blocks/page', limit: 140 * KIB },
]

if (!existsSync(MANIFEST)) {
  throw new Error('No build to measure. Run `pnpm --filter web build` first.')
}

const pages = JSON.parse(readFileSync(MANIFEST, 'utf8')).pages ?? {}

const filesOf = (page) => {
  const files = pages[page]

  if (files === undefined) {
    throw new Error(`${page} is not in the build manifest — the budget cannot be checked`)
  }

  return files
}

/** The chunks only this route loads: everything the landing does not also load. */
const shared = new Set(filesOf('/page'))

export default [
  ...FIRST_LOAD.map(({ name, page, limit }) => ({
    name,
    limit: `${limit} B`,
    gzip: true,
    path: filesOf(page).map((file) => `apps/web/.next/${file}`),
  })),
  ...ROUTE_CHUNK.map(({ name, page, limit }) => ({
    name,
    limit: `${limit} B`,
    gzip: true,
    path: filesOf(page)
      .filter((file) => !shared.has(file))
      .map((file) => `apps/web/.next/${file}`),
  })),
]
