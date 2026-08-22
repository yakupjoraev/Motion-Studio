import { type IRWarning, warning } from '../../warnings'
import type { ExportFile } from '../printer.types'

/**
 * EXPORT_ENGINE.md § Formatting. Prettier standalone plus the estree, typescript, postcss, html and
 * babel plugins, **dynamically imported** — roughly 180 kB that has no business in the studio's first
 * load, and it only loads when somebody exports.
 *
 * The html parser pulls babel with it: Prettier formats an inline `<script>` with the same estree
 * printer it uses for a `.js` file, and it reaches that printer through babel rather than typescript.
 *
 * The failure path is not a thrown error. Offline, or behind a chunk that will not load, the export
 * ships unformatted with a warning: working unformatted code beats a failed export.
 */

/**
 * Our own style, from `packages/config/biome.json` — 2 spaces, single quotes in TS and double in JSX,
 * no semicolons, 100 columns, trailing commas. The user is likely to paste this into a codebase like
 * ours, and output that has to be reformatted on arrival is output that announces where it came from.
 */
export const FORMAT_CONFIG = {
  tabWidth: 2,
  useTabs: false,
  semi: false,
  singleQuote: true,
  jsxSingleQuote: false,
  printWidth: 100,
  trailingComma: 'all',
  bracketSpacing: true,
  arrowParens: 'always',
} as const

/**
 * One parser per extension. `typescript` reads plain JSX as well as TSX, which is why the babel plugin
 * is not in the list: `language: 'js'` output is a subset of what this parser already accepts.
 *
 * JSON is absent on purpose. `JSON.stringify(value, null, 2)` is already Prettier's JSON output, and
 * routing it through a parser would add a plugin to buy nothing.
 */
const PARSERS: Readonly<Record<string, string>> = {
  ts: 'typescript',
  tsx: 'typescript',
  js: 'typescript',
  jsx: 'typescript',
  css: 'css',
  html: 'html',
}

export const parserFor = (path: string): string | undefined =>
  PARSERS[path.slice(path.lastIndexOf('.') + 1).toLowerCase()]

type Format = (source: string, parser: string) => Promise<string>

/**
 * Exported so the tests can drive the failure path with the real function rather than a mock: nothing
 * here replaces a module, and a loader that throws is the one thing this file exists to survive.
 */
export async function loadPrettier(): Promise<Format | undefined> {
  try {
    const [standalone, estree, typescript, postcss, html, babel] = await Promise.all([
      import('prettier/standalone'),
      import('prettier/plugins/estree'),
      import('prettier/plugins/typescript'),
      import('prettier/plugins/postcss'),
      import('prettier/plugins/html'),
      import('prettier/plugins/babel'),
    ])

    return (source, parser) =>
      standalone.format(source, {
        ...FORMAT_CONFIG,
        parser,
        plugins: [estree, typescript, postcss, html, babel],
      })
  } catch {
    return undefined
  }
}

export interface FormatOutcome {
  readonly files: readonly ExportFile[]
  readonly warnings: readonly IRWarning[]
}

const LOAD_FAILED =
  'Prettier could not be loaded, so the export is unformatted. The code is otherwise complete.'

/**
 * A file Prettier rejects keeps its unformatted contents and is named in a warning. That case is a
 * defect in a printer rather than in the user's document, so it says which file rather than which node.
 */
export async function formatFiles(
  files: readonly ExportFile[],
  load: () => Promise<Format | undefined> = loadPrettier,
): Promise<FormatOutcome> {
  const format = await load()

  if (format === undefined) {
    return { files, warnings: [warning('unsupported', LOAD_FAILED)] }
  }

  const warnings: IRWarning[] = []
  const formatted: ExportFile[] = []

  for (const file of files) {
    const parser = parserFor(file.path)

    if (parser === undefined) {
      formatted.push(file)
      continue
    }

    try {
      formatted.push({ path: file.path, contents: await format(file.contents, parser) })
    } catch (error) {
      const detail = error instanceof Error ? error.message.split('\n')[0] : String(error)

      warnings.push(warning('unsupported', `${file.path} could not be formatted: ${detail}`))
      formatted.push(file)
    }
  }

  return { files: formatted, warnings }
}
