import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { blockRegistry } from '@motion-studio/blocks/registry'
import {
  type ExportTarget,
  buildIR,
  formatFiles,
  printHtml,
  printJsonTarget,
  printNext,
  printReact,
  printTokens,
  resolveOptions,
} from '@motion-studio/codegen'
import { presetRegistry } from '@motion-studio/motion'
import { documentSchema } from '@motion-studio/schema'
import {
  COLOR_MODE_SCRIPT,
  COLOR_MODE_STORAGE_KEY,
  TOKEN_FORMATS,
  resolveForExport,
  toCssVariables,
} from '@motion-studio/theme'

/**
 * The measurement `prompts/45` sets a threshold for: `buildIR` + print + format on the sixty-node
 * fixture, median of nine runs. Under 100 ms the dialog generates on the main thread inside a
 * transition; at or over it, the work moves to a worker.
 *
 * ```
 * pnpm measure:export                       # every target
 * pnpm measure:export --target react --runs 9
 * ```
 *
 * It runs the same three calls the dialog runs, in the same order, so the number is about the
 * pipeline rather than about a harness. Node rather than the browser: both are V8, and the browser
 * number is taken again from the dialog itself once it exists.
 */
const RUNS = 9

const flags = new Map<string, string>()

for (let index = 2; index < process.argv.length; index += 2) {
  const flag = process.argv[index]
  const value = process.argv[index + 1]

  if (flag?.startsWith('--') === true && value !== undefined) {
    flags.set(flag.slice(2), value)
  }
}

const here = dirname(fileURLToPath(import.meta.url))
const fixture = flags.get('fixture') ?? 'export-landing'
const runs = Number(flags.get('runs') ?? RUNS)
const path = join(here, '..', 'e2e', 'fixtures', 'documents', `${fixture}.motion.json`)
const document = documentSchema.parse(JSON.parse(readFileSync(path, 'utf8')))
const exported = resolveForExport(document.theme)
const theme = {
  css: toCssVariables(exported),
  colorModeScript: COLOR_MODE_SCRIPT,
  colorModeStorageKey: COLOR_MODE_STORAGE_KEY,
  tokens: TOKEN_FORMATS.map((format) => ({
    id: format.id,
    filename: format.filename,
    contents: format.print(exported),
  })),
}

const PRINTERS = { react: printReact, next: printNext, html: printHtml }

interface Sample {
  readonly ir: number
  readonly print: number
  readonly format: number
  readonly total: number
  readonly files: number
}

async function once(target: ExportTarget): Promise<Sample> {
  const options = resolveOptions({ target })
  const before = performance.now()

  if (target === 'json' || target === 'tokens') {
    const result = target === 'json' ? printJsonTarget({ document }) : printTokens({ theme })
    const printed = performance.now()
    const formatted = await formatFiles(result.files)
    const done = performance.now()

    return {
      ir: 0,
      print: printed - before,
      format: done - printed,
      total: done - before,
      files: formatted.files.length,
    }
  }

  const ir = buildIR({ document, registry: blockRegistry, presets: presetRegistry, options })
  const built = performance.now()
  const result = (PRINTERS[target] ?? printReact)({ ir, options, theme })
  const printed = performance.now()
  const formatted = await formatFiles(result.files)
  const done = performance.now()

  return {
    ir: built - before,
    print: printed - built,
    format: done - printed,
    total: done - before,
    files: formatted.files.length,
  }
}

const median = (values: readonly number[]): number => {
  const sorted = [...values].sort((a, b) => a - b)

  return sorted[Math.floor(sorted.length / 2)] ?? 0
}

const round = (value: number): string => value.toFixed(1)

const targets: readonly ExportTarget[] =
  flags.get('target') === undefined
    ? ['react', 'next', 'html', 'json', 'tokens']
    : [flags.get('target') as ExportTarget]

console.log(`${fixture}: ${Object.keys(document.nodes).length} nodes, ${runs} runs each`)
console.log('target      files    IR    print   format    total (median ms)')

for (const target of targets) {
  const samples: Sample[] = []

  // One discarded run: the first pays for Prettier's plugins and for every module the printer touches.
  await once(target)

  for (let run = 0; run < runs; run += 1) {
    samples.push(await once(target))
  }

  const totals = samples.map((sample) => sample.total)

  console.log(
    [
      target.padEnd(10),
      String(samples[0]?.files ?? 0).padStart(5),
      round(median(samples.map((sample) => sample.ir))).padStart(6),
      round(median(samples.map((sample) => sample.print))).padStart(7),
      round(median(samples.map((sample) => sample.format))).padStart(8),
      round(median(totals)).padStart(9),
      `   (min ${round(Math.min(...totals))}, max ${round(Math.max(...totals))})`,
    ].join(''),
  )
}
