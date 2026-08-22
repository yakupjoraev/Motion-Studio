import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'

import {
  COLOR_MODE_SCRIPT,
  COLOR_MODE_STORAGE_KEY,
  TOKEN_FORMATS,
  resolveForExport,
  toCssVariables,
} from '@motion-studio/theme'

import { EXPORT_TARGETS, type ExportTarget } from '../src/options.types'
import type { PrintedTheme } from '../src/printers/printer.types'
import { GOLDEN_DOCUMENTS } from '../src/test/documents'
import type { GoldenCase } from '../src/test/golden-cases'
import { printCase } from '../src/test/print-case'

/**
 * Writes one export to a directory on disk, so the claim "builds with zero edits" can be checked the
 * way a user would check it: `npm install && npm run build && npm run dev`.
 *
 * ```
 * pnpm generate:export-fixture --document full-landing --target next --out ../exported
 * pnpm generate:export-fixture --document full-landing --target html --out ../exported
 * ```
 *
 * It runs against the fixture catalogue rather than `packages/blocks`, because `codegen` may not import
 * that package and because the shipped catalogue has 53 entries with no declared client boundary — the
 * export refuses those by design (ADR-199), and prompt 42's report escalated it.
 */
const flags = new Map<string, string>()

for (let index = 2; index < process.argv.length; index += 2) {
  const flag = process.argv[index]
  const value = process.argv[index + 1]

  if (flag?.startsWith('--') === true && value !== undefined) {
    flags.set(flag.slice(2), value)
  }
}

const documentName = flags.get('document') ?? 'full-landing'
const requested = flags.get('target') ?? 'next'
const target = (EXPORT_TARGETS as readonly string[]).includes(requested)
  ? (requested as ExportTarget)
  : 'next'
const out = resolve(flags.get('out') ?? join(process.cwd(), 'exported'))
const make = GOLDEN_DOCUMENTS[documentName]

if (make === undefined) {
  const names = Object.keys(GOLDEN_DOCUMENTS).join(', ')

  throw new Error(`No document '${documentName}'. Available: ${names}`)
}

const goldenCase: GoldenCase = {
  id: `${documentName}/${target}`,
  document: documentName,
  options: { target },
}
const document = make()

/**
 * The real theme, resolved and printed the way the export dialog will do it — ADR-232 and ADR-236.
 * `printCase` defaults to the short test stylesheet, which is right for a golden file and wrong here:
 * a manual proof against a theme with no `--ms-space-*` in it measures nothing.
 */
const exported = resolveForExport(document.theme)
const theme: PrintedTheme = {
  css: toCssVariables(exported),
  colorModeScript: COLOR_MODE_SCRIPT,
  colorModeStorageKey: COLOR_MODE_STORAGE_KEY,
  tokens: TOKEN_FORMATS.map((format) => ({
    id: format.id,
    filename: format.filename,
    contents: format.print(exported),
  })),
}
const result = await printCase(goldenCase, document, theme)

for (const file of result.files) {
  const path = join(out, file.path)

  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, file.contents, 'utf8')
}

console.log(`${result.files.length} files → ${out}`)

for (const entry of result.warnings) {
  console.log(`  [${entry.code}] ${entry.message}`)
}
