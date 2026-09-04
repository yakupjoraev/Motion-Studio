import type { MotionDocument } from '@motion-studio/schema'

import type { IRProp } from '../ir.types'

import type { ComponentUnit } from './detect-components'

const typeOf = (value: unknown): IRProp['type'] => {
  switch (typeof value) {
    case 'number':
      return 'number'
    case 'boolean':
      return 'boolean'
    case 'string':
      return 'string'
    default:
      return 'json'
  }
}

/**
 * The props a repeated component takes, with the first instance's values as the defaults — the
 * instances that differ are what `detect-components` put in `propNames`, so this pass only has to
 * type them and print a default.
 */
export function propsFor(unit: ComponentUnit, document: MotionDocument): readonly IRProp[] {
  const first = document.nodes[unit.source]

  if (first === undefined) {
    return []
  }

  return unit.propNames.map((name) => {
    const value = first.props[name]

    return {
      name,
      type: typeOf(value),
      defaultValue:
        typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
          ? { kind: 'literal' as const, value }
          : { kind: 'expression' as const, code: JSON.stringify(value ?? null) },
    }
  })
}
