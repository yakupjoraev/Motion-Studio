import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { markupRegistry } from '@motion-studio/blocks/markup'
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
 * Writes one export to a directory, so "installs and builds with zero edits" can be checked the way a
 * user checks it: `npm install && npm run build && npm start`.
 *
 * ```
 * pnpm generate:export-fixture --document export-landing --target next --out ../exported
 * ```
 *
 * It runs against the **shipped** catalogue — ADR-254. The fixture catalogue inside `codegen` renders
 * stub elements, so a Lighthouse or axe score taken over it would be a score for the harness.
 */
const flags = new Map<string, string>()

for (let index = 2; index < process.argv.length; index += 2) {
  const flag = process.argv[index]
  const value = process.argv[index + 1]

  if (flag?.startsWith('--') === true && value !== undefined) {
    flags.set(flag.slice(2), value)
  }
}

const here = dirname(fileURLToPath(import.meta.url))
const documentName = flags.get('document') ?? 'export-landing'
const target = (flags.get('target') ?? 'next') as ExportTarget
const out = resolve(flags.get('out') ?? join(process.cwd(), 'exported'))
const path = join(here, '..', 'e2e', 'fixtures', 'documents', `${documentName}.motion.json`)
const document = documentSchema.parse(JSON.parse(readFileSync(path, 'utf8')))
const options = resolveOptions({ target })
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

function print(): {
  files: readonly { path: string; contents: string }[]
  warnings: readonly { code: string; message: string }[]
} {
  if (target === 'json') {
    return printJsonTarget({ document })
  }

  if (target === 'tokens') {
    return printTokens({ theme })
  }

  const ir = buildIR({
    document,
    registry: blockRegistry,
    presets: presetRegistry,
    markup: markupRegistry,
    options,
  })

  return (PRINTERS[target] ?? printReact)({ ir, options, theme })
}

const result = print()
const formatted = await formatFiles(result.files)

// The directory is written into, never emptied: `--out` is a path a user typed.
for (const file of formatted.files) {
  const destination = join(out, file.path)

  mkdirSync(dirname(destination), { recursive: true })
  writeFileSync(destination, file.contents, 'utf8')
}

console.log(`${formatted.files.length} files → ${out}`)

for (const entry of [...result.warnings, ...formatted.warnings]) {
  console.log(`  [${entry.code}] ${entry.message}`)
}
