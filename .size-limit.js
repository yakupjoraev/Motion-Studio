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
import { existsSync, globSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const NEXT = join(process.cwd(), 'apps', 'web', '.next')
const MANIFEST = join(NEXT, 'app-build-manifest.json')

const KIB = 1024

/*
 * The pages carry a locale segment since ADR-361. The budget is per route, not per language: both
 * locales load the same JavaScript — the dictionaries travel as data in the RSC payload — so the
 * manifest entry for either one measures the route.
 */
const LOCALE = '/[locale]'

const FIRST_LOAD = [
  { name: 'landing first-load JS (120 KiB)', page: `${LOCALE}/page`, limit: 120 * KIB },
  { name: 'studio first-load JS (250 KiB)', page: `${LOCALE}/studio/page`, limit: 250 * KIB },
]

const ROUTE_CHUNK = [
  { name: 'playground route chunk (90 KiB)', page: `${LOCALE}/playground/page`, limit: 90 * KIB },
  { name: 'blocks route chunk (140 KiB)', page: `${LOCALE}/blocks/page`, limit: 140 * KIB },
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
const shared = new Set(filesOf(`${LOCALE}/page`))

/**
 * `size-limit` reads every `path` as a glob, and since ADR-361 a route's own chunk lives at
 * `static/chunks/app/[locale]/studio/page-<hash>.js` — where `[locale]` is a character class
 * matching none of `l`, `o`, `c`, `a`, `e`. The file matched nothing, was measured as nothing, and
 * the gate reported the studio 28.5 kB lighter than it is (ADR-371).
 *
 * A backslash does not fix it: Node's `glob` treats `\` as a path separator on Windows, so the
 * escaped pattern matches nothing there either — measured, both forms return zero files. `?` matches
 * one character on every platform, so each special character becomes one, and the count is asserted:
 * a pattern that resolves to anything other than the single file it was built from throws rather
 * than quietly measuring the wrong set.
 */
const patternFor = (file) => {
  const path = `apps/web/.next/${file}`

  if (!existsSync(join(process.cwd(), path))) {
    throw new Error(`${path} is in the manifest and not on disk — the build is incomplete`)
  }

  const pattern = path.replace(/[!*?[\]{}()]/g, '?')
  const matched = globSync(pattern)

  if (matched.length !== 1) {
    throw new Error(
      `${pattern} matches ${matched.length} files — the budget would measure the wrong set`,
    )
  }

  return pattern
}

export default [
  ...FIRST_LOAD.map(({ name, page, limit }) => ({
    name,
    limit: `${limit} B`,
    gzip: true,
    path: filesOf(page).map(patternFor),
  })),
  ...ROUTE_CHUNK.map(({ name, page, limit }) => ({
    name,
    limit: `${limit} B`,
    gzip: true,
    path: filesOf(page)
      .filter((file) => !shared.has(file))
      .map(patternFor),
  })),
]
