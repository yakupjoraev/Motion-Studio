import { type MotionDocument, nodeId } from '@motion-studio/schema'

import { buildIR } from '../ir/build-ir'
import { resolveOptions } from '../options.types'
import { formatFiles } from '../printers/format/format'
import { printNext } from '../printers/next/print-next'
import type { ExportResult, PrintedTheme } from '../printers/printer.types'
import { printReact } from '../printers/react/print-react'

import { fixtureRegistry } from './blocks'
import type { GoldenCase } from './golden-cases'
import { fixturePresets } from './presets'
import { fixtureTheme } from './theme'

/**
 * One golden case, start to finish: build the IR, print it, format it. Three calls, in the order
 * EXPORT_ENGINE.md § Pipeline draws them.
 *
 * It lives beside the fixtures rather than in `src/printers/` because the export orchestrator — the
 * thing that picks a printer for all five targets and streams files to the dialog — is prompt 45's,
 * and inventing it here would be the second decision site the IR exists to prevent.
 */
export async function printCase(
  goldenCase: GoldenCase,
  document: MotionDocument,
  theme: PrintedTheme = fixtureTheme(),
): Promise<ExportResult> {
  const options = resolveOptions(goldenCase.options)
  const ir = buildIR({
    document,
    registry: fixtureRegistry(),
    presets: fixturePresets(),
    options,
    ...(goldenCase.selection === undefined ? {} : { selection: nodeId(goldenCase.selection) }),
  })
  const printed = options.target === 'next' ? printNext : printReact
  const result = printed({ ir, options, ...(options.includeTheme ? { theme } : {}) })

  if (!options.format) {
    return result
  }

  const formatted = await formatFiles(result.files)

  return {
    files: formatted.files,
    warnings: [...result.warnings, ...formatted.warnings],
    dependencies: result.dependencies,
  }
}
