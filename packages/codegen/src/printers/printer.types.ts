import type { CodegenIR } from '../ir/ir.types'
import type { ExportOptions } from '../options.types'
import type { IRWarning } from '../warnings'

/**
 * What a printer returns — EXPORT_ENGINE.md § Pipeline, `ExportResult { files, warnings, dependencies }`.
 *
 * A file is a path and its bytes and nothing else. Size, media type and syntax language are all
 * derivable from those two, and the export dialog is where they are needed.
 */
export interface ExportFile {
  readonly path: string
  readonly contents: string
}

export interface ExportResult {
  readonly files: readonly ExportFile[]
  readonly warnings: readonly IRWarning[]
  readonly dependencies: Readonly<Record<string, string>>
}

/**
 * The theme, already printed by `packages/theme` and handed over — ADR-232. `codegen` may not import
 * that package, and restating a palette generator here would be the worse of the two failures.
 */
export interface PrintedTheme {
  /** `toCssVariables(resolveForExport(config))`: the `:root` blocks for both colour modes. */
  readonly css: string
  /** `COLOR_MODE_SCRIPT`: the blocking `<head>` script that sets `data-color-mode` before first paint. */
  readonly colorModeScript: string
}

/**
 * `options` is the resolved set the IR was built from, not a second one. A caller that builds with
 * `singleFile` and prints without it gets a project whose page composes components that were never
 * emitted, so the two travel together from the dialog.
 */
export interface PrintInput {
  readonly ir: CodegenIR
  readonly options: ExportOptions
  readonly theme?: PrintedTheme
}

/** `hero-section.tsx` → `hero-section`, which is what an import specifier carries. */
export const withoutExtension = (fileName: string): string =>
  fileName.replace(/\.(tsx|jsx|ts|js)$/, '')

/** `.ts` for a TypeScript export, `.js` for a JavaScript one — modules, not components. */
export const moduleExtension = (options: ExportOptions): string =>
  options.language === 'ts' ? '.ts' : '.js'
