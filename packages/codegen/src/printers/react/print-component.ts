import type { ImportSpec } from '@motion-studio/schema'

import type { IRComponent } from '../../ir/ir.types'
import { collectImports } from '../../ir/passes/collect-imports'
import type { ExportOptions } from '../../options.types'

import { INDENT, REACT_TYPE_IMPORT, needsStyleType, printElement } from './print-element'
import { printHoisted } from './print-hoisted'
import { printImports } from './print-imports'
import { printPropsInterface, printPropsParameter } from './print-props'

/**
 * `IRComponent` → one `.tsx` file — EXPORT_ENGINE.md § React, the example read top to bottom: the
 * directive, the imports, the hoisted constants, the props interface, then the component.
 *
 * The order is the example's and the blank lines are ours, because the point of the whole prompt is
 * output a reviewer cannot tell from a file somebody wrote.
 */
export interface ComponentInput {
  readonly component: IRComponent
  readonly options: ExportOptions
  /** The components this one references, as import specs the caller resolved against the file tree. */
  readonly references: readonly ImportSpec[]
  /** `default` for Next's `page.tsx`; a named export everywhere else — the codebase convention. */
  readonly exportKind: 'named' | 'default'
}

export const USE_CLIENT = "'use client'"

export function printComponent(input: ComponentInput): string {
  const { component, options, references, exportKind } = input
  const styleType = needsStyleType(component.root) ? [REACT_TYPE_IMPORT] : []
  const imports = collectImports([
    ...component.imports,
    ...references,
    ...(options.language === 'ts' ? styleType : []),
  ])
  const declaration = exportKind === 'default' ? 'export default function' : 'export function'
  const signature = `${declaration} ${component.name}(`
  const parameter = printPropsParameter(
    component.name,
    component.props,
    options,
    signature.length + 3,
  )
  const propsInterface = printPropsInterface(component.name, component.props, options)
  const body = [
    ...component.hooks.map((hook) => `${INDENT}${hook}`),
    ...(component.hooks.length > 0 ? [''] : []),
    `${INDENT}return (`,
    ...(component.root.notes ?? []).map((note) => `${INDENT.repeat(2)}// ${note}`),
    printElement(component.root, 2),
    `${INDENT})`,
  ]

  return [
    ...(component.client.emit ? [USE_CLIENT, ''] : []),
    ...(imports.length > 0 ? [printImports(imports), ''] : []),
    ...(component.hoisted.length > 0 ? [printHoisted(component.hoisted), ''] : []),
    ...(propsInterface === undefined ? [] : [propsInterface, '']),
    `${signature}${parameter}) {`,
    ...body,
    '}',
  ]
    .join('\n')
    .concat('\n')
}
