import { MotionStudioError } from '@motion-studio/utils'

import type { CodegenIR, IRComponent } from '../../ir/ir.types'
import type { ExportOptions } from '../../options.types'
import { withoutExtension } from '../printer.types'
import { printComponent } from '../react/print-component'
import { referencesOf } from '../react/print-react'

/**
 * `app/page.tsx` — EXPORT_ENGINE.md § Next.js: "`page.tsx` is intentionally boring. That readability is
 * the point. A reviewer should see structure immediately."
 *
 * It is the entry component printed as a default export and nothing more. The composition it shows is
 * the one pass 1 decided, so the page cannot drift from the components beside it, and the file has no
 * `'use client'` unless the entry itself holds state — which is the failure ADR-230 exists to prevent.
 */
export const COMPONENTS_DIR = 'components'

export const componentSpecifier = (component: IRComponent): string =>
  `@/${COMPONENTS_DIR}/${withoutExtension(component.fileName)}`

export const MISSING_ENTRY = 'MISSING_ENTRY_COMPONENT'

export function printPage(ir: CodegenIR, options: ExportOptions): string {
  const entry = ir.components.find((component) => component.name === ir.entry)

  if (entry === undefined) {
    throw new MotionStudioError(
      `The IR names '${ir.entry}' as its entry and carries no component by that name.`,
      MISSING_ENTRY,
    )
  }

  const byName = new Map(ir.components.map((component) => [component.name, component]))

  return printComponent({
    component: entry,
    options,
    references: referencesOf(entry, byName, componentSpecifier),
    exportKind: 'default',
  })
}
