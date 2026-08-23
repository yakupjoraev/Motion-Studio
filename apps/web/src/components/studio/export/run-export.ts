import { blockRegistry } from '@motion-studio/blocks/registry'
import {
  type CodegenIR,
  type ExportFile,
  type ExportResult,
  type FormatOutcome,
  type IRWarning,
  type PrintInput,
  type PrintedTheme,
  buildIR,
  formatFiles,
  loadPrettier,
  printHtml,
  printJsonTarget,
  printNext,
  printReact,
  printTokens,
} from '@motion-studio/codegen'
import {
  type ExportOptions,
  type ExportTarget,
  resolveOptions,
} from '@motion-studio/codegen/options'
import { presetRegistry } from '@motion-studio/motion'
import type { MotionDocument, NodeId } from '@motion-studio/schema'
import {
  COLOR_MODE_SCRIPT,
  COLOR_MODE_STORAGE_KEY,
  TOKEN_FORMATS,
  type ThemeConfig,
  resolveForExport,
  toCssVariables,
} from '@motion-studio/theme'

/**
 * The export pipeline, run from the studio — ADR-246. There is no `exportDocument` in `codegen`
 * because a document and an option set are not enough to run it: the block registry, the preset
 * catalogue and the printed theme are the caller's to supply, and `codegen` is forbidden from
 * importing any of the three (ADR-226, ADR-232).
 *
 * The whole module is behind a dynamic `import()` from `use-export`, which is what keeps `codegen`,
 * Prettier and the theme printers out of the studio's first load — PERFORMANCE.md § Mandatory
 * dynamic imports. Nothing here is a React component and nothing here reads the store.
 */
export interface ExportRequest {
  readonly document: MotionDocument
  readonly options: ExportOptions
  /** Required by `scope: 'selection'` and ignored otherwise — the subtree Copy React copies. */
  readonly selection?: NodeId | undefined
}

const PRINTERS: Partial<Record<ExportTarget, (input: PrintInput) => ExportResult>> = {
  react: printReact,
  next: printNext,
  html: printHtml,
}

/**
 * One entry, keyed on the config object itself. The dialog prints the same theme once per option
 * toggle otherwise, and the config is a store value: a new object means the theme actually changed.
 */
let cached: { readonly config: ThemeConfig; readonly theme: PrintedTheme } | null = null

export function printedTheme(config: ThemeConfig): PrintedTheme {
  if (cached?.config === config) {
    return cached.theme
  }

  const exported = resolveForExport(config)
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

  cached = { config, theme }

  return theme
}

/**
 * Pass 1 to 6. `null` for the two targets that read no IR — ADR-236 and ADR-240 — so the caller can
 * cache this result on its own key and toggle "include theme" without rebuilding it.
 */
export function buildExportIR(request: ExportRequest): CodegenIR | null {
  const options = resolveOptions(request.options)

  if (options.target === 'json' || options.target === 'tokens') {
    return null
  }

  return buildIR({
    document: request.document,
    registry: blockRegistry,
    presets: presetRegistry,
    options,
    ...(request.selection === undefined ? {} : { selection: request.selection }),
  })
}

/** The printed files, unformatted. Under a millisecond, which is what lets the dialog show them at once. */
export function printExport(request: ExportRequest, ir: CodegenIR | null): ExportResult {
  const options = resolveOptions(request.options)
  const theme = printedTheme(request.document.theme)

  if (options.target === 'json') {
    return printJsonTarget({ document: request.document })
  }

  if (options.target === 'tokens') {
    return printTokens({ theme })
  }

  if (ir === null) {
    throw new Error(`No IR to print for target ${options.target}`)
  }

  const printer = PRINTERS[options.target] ?? printReact

  return printer({ ir, options, ...(options.includeTheme ? { theme } : {}) })
}

/**
 * Copy React: the same two calls the dialog makes, and then the one file the user asked for. The
 * entry component is the subtree they selected; the rest of the printed result is the barrel and any
 * shared module, which belong to an export and not to a clipboard.
 */
export async function copyEntry(request: ExportRequest): Promise<ExportFile> {
  const ir = buildExportIR(request)
  const printed = printExport(request, ir)
  const entry = ir?.components.find((component) => component.name === ir.entry)?.fileName
  const [first] = printed.files
  const file = printed.files.find((one) => one.path === entry) ?? first

  if (file === undefined) {
    throw new Error('The export produced no files')
  }

  if (!request.options.format) {
    return file
  }

  const formatting = await loadFormatting()
  const outcome = await formatting.format?.(file)
  const [formatted = file] = outcome?.files ?? []

  return formatted
}

export interface Formatting {
  /** Absent when Prettier did not load. The warning says so and the files ship as they were printed. */
  readonly format: ((file: ExportFile) => Promise<FormatOutcome>) | undefined
  readonly warnings: readonly IRWarning[]
}

/**
 * Prettier once, then a formatter that takes one file. The dialog formats file by file so each one
 * appears as it lands rather than all twenty at the end — on the sixty-node fixture the whole step is
 * 46 ms of the 48 (ADR-244), and it is the only part of the pipeline a user can watch happen.
 */
export async function loadFormatting(): Promise<Formatting> {
  const format = await loadPrettier()

  if (format === undefined) {
    // The sentence belongs to `formatFiles`; asking it with no files is how to read it without
    // restating it here, and it does not load Prettier a second time to answer.
    const outcome = await formatFiles([], () => Promise.resolve(undefined))

    return { format: undefined, warnings: outcome.warnings }
  }

  const load = (): Promise<typeof format> => Promise.resolve(format)

  return { format: (file) => formatFiles([file], load), warnings: [] }
}
