import { type IRWarning, warning } from '../../warnings'
import type { ExportFile, ExportResult, PrintedTheme } from '../printer.types'

/**
 * The tokens target — `THEME_ENGINE.md` § Theme in export: CSS variables, a Tailwind config, JSON and
 * Figma Tokens, "all generated from one resolved theme so they cannot disagree".
 *
 * They are generated in `packages/theme/src/export/` and arrive here already printed — ADR-236. This
 * file writes no token syntax, holds no format ids and holds no file names; a second set of generators
 * is precisely the disagreement that sentence forbids, and importing the first set would put React in
 * this package's runtime graph. What is decided here is what a target decides: which files exist, in
 * what order, and what the report says when there is nothing to write.
 */
const MISSING_TOKENS =
  'The export carries no printed token formats, so the tokens target has nothing to write.'

const DUPLICATE = (filename: string): string =>
  `Two token formats claim '${filename}'; only the first is written.`

export interface TokensPrintInput {
  readonly theme?: PrintedTheme | undefined
}

export function printTokens(input: TokensPrintInput): ExportResult {
  const formats = input.theme?.tokens ?? []

  if (formats.length === 0) {
    return { files: [], warnings: [warning('unsupported', MISSING_TOKENS)], dependencies: {} }
  }

  const taken = new Set<string>()
  const files: ExportFile[] = []
  const warnings: IRWarning[] = []

  for (const format of formats) {
    if (taken.has(format.filename)) {
      warnings.push(warning('unsupported', DUPLICATE(format.filename)))

      continue
    }

    taken.add(format.filename)
    files.push({ path: format.filename, contents: format.contents })
  }

  return { files, warnings, dependencies: {} }
}
