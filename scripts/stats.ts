import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { gzipSync } from 'node:zlib'

import { DEFINITIONS } from '@motion-studio/blocks'
import { PRESETS } from '@motion-studio/motion'

/**
 * The README's numbers, counted rather than remembered — `prompts/59` § Project stats.
 *
 *   pnpm stats
 *   pnpm stats --json
 *
 * A reader who checks one number and finds it wrong stops trusting all of them, so every figure here
 * comes from the thing it describes: the registries are imported, the tests are counted by running
 * them, the bundle is measured off the build manifest. Nothing is estimated and nothing is cached —
 * a stat that cannot be recomputed is a claim, not a measurement.
 *
 * Two numbers are deliberately **not** here: Lighthouse, which needs a production server and a quiet
 * machine (ADR-332 — the score is a property of the host as much as of the page), and coverage,
 * which needs a full instrumented run. Both are printed by their own commands and the README says
 * when each was taken.
 */
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const json = process.argv.includes('--json')

/**
 * Colour is stripped before anything is parsed. Turbo replays a cached task's log verbatim, and a log
 * captured from a colour terminal carries `[2m` between "Test Files" and the count — which is
 * how `Unit tests 0 in 0 files` was printed by a repository with 8,273 of them. A counter that can
 * report zero without failing is worse than no counter.
 */
const ANSI = new RegExp(`${String.fromCodePoint(27)}\\[[0-9;]*m`, 'g')

const run = (command: string, args: readonly string[]): string =>
  execFileSync(command, [...args], {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    shell: process.platform === 'win32',
    env: { ...process.env, FORCE_COLOR: '0', NO_COLOR: '1' },
  }).replace(ANSI, '')

/** Blocks by category, which is also the palette's grouping — COMPONENT_LIBRARY.md § Catalogue. */
const blocks = (): Record<string, number> => {
  const counts: Record<string, number> = {}

  for (const definition of DEFINITIONS) {
    counts[definition.category] = (counts[definition.category] ?? 0) + 1
  }

  return counts
}

const presets = (): Record<string, number> => {
  const counts: Record<string, number> = {}

  for (const preset of PRESETS) {
    counts[preset.channel] = (counts[preset.channel] ?? 0) + 1
  }

  return counts
}

/**
 * Vitest's own count, from a real run. Parsed from the reporter line rather than from a JSON report,
 * because the JSON reporter writes a file per project and the sum of those is a number nobody else
 * can reproduce with one command.
 */
const unitTests = (): { files: number; tests: number } => {
  const output = run('pnpm', ['test', '--', '--reporter=basic'])
  const files = [...output.matchAll(/Test Files\s+(\d+) passed/g)].reduce(
    (total, match) => total + Number(match[1]),
    0,
  )
  const tests = [...output.matchAll(/Tests\s+(\d+) passed/g)].reduce(
    (total, match) => total + Number(match[1]),
    0,
  )

  return { files, tests }
}

/**
 * Playwright lists without running, so this costs a second rather than twenty minutes.
 *
 * Two counts, because they answer different questions: `cases` is what a full run executes — every
 * test once per browser project — and `unique` is how many distinct tests were written. Reporting
 * only the first reads as padding; only the second hides that most of them run three times.
 */
const e2eTests = (): { files: number; cases: number; unique: number } => {
  const output = run('pnpm', ['--filter', 'e2e', 'exec', 'playwright', 'test', '--list'])
  const summary = /Total: (\d+) tests? in (\d+) files?/.exec(output)
  // Each line is `[project] › path:line:col › title`; dropping the project makes duplicates equal.
  const unique = new Set(
    [...output.matchAll(/^\s+\[[^\]]+\] › (.+)$/gm)].map((match) => match[1]?.trim() ?? ''),
  )

  return { files: Number(summary?.[2] ?? 0), cases: Number(summary?.[1] ?? 0), unique: unique.size }
}

/**
 * The route's first load, gzipped, off the build manifest — the same file list `.size-limit.js`
 * measures, so the README and the budget gate cannot disagree.
 */
const firstLoad = (page: string): number | null => {
  const manifest = join(ROOT, 'apps', 'web', '.next', 'app-build-manifest.json')

  if (!existsSync(manifest)) {
    return null
  }

  const pages = JSON.parse(readFileSync(manifest, 'utf8')).pages as Record<string, string[]>
  const files = pages[page]

  if (files === undefined) {
    return null
  }

  return files.reduce(
    (total, file) =>
      total + gzipSync(readFileSync(join(ROOT, 'apps', 'web', '.next', file))).length,
    0,
  )
}

const kib = (bytes: number | null): string =>
  bytes === null ? 'no build to measure' : `${(bytes / 1024).toFixed(1)} KiB gzip`

const sum = (counts: Record<string, number>): number =>
  Object.values(counts).reduce((total, count) => total + count, 0)

const byCount = (counts: Record<string, number>): string =>
  Object.entries(counts)
    .sort(([, left], [, right]) => right - left)
    .map(([name, count]) => `${name} ${count}`)
    .join(', ')

const blocksByCategory = blocks()
const presetsByChannel = presets()
const unit = unitTests()
const e2e = e2eTests()
const studio = firstLoad('/studio/page')
const landing = firstLoad('/page')

if (json) {
  console.log(
    JSON.stringify(
      {
        blocks: { total: sum(blocksByCategory), byCategory: blocksByCategory },
        presets: { total: sum(presetsByChannel), byChannel: presetsByChannel },
        unitTests: unit,
        e2eTests: e2e,
        firstLoadBytes: { studio, landing },
      },
      null,
      2,
    ),
  )
} else {
  const lines = [
    `Blocks                 ${sum(blocksByCategory)}   (${byCount(blocksByCategory)})`,
    `Motion presets         ${sum(presetsByChannel)}   (${byCount(presetsByChannel)})`,
    `Unit tests             ${unit.tests}   in ${unit.files} files`,
    `E2E tests              ${e2e.unique}   in ${e2e.files} specs (${e2e.cases} runs across the browser projects)`,
    `Studio first-load JS   ${kib(studio)}`,
    `Landing first-load JS  ${kib(landing)}`,
  ]

  console.log(lines.join('\n'))
}
