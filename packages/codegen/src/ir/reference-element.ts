import type { NodeId } from '@motion-studio/schema'

import type { ElementContext } from './build-element'
import type { IRElement, IRValue } from './ir.types'
import type { ComponentUnit } from './passes/detect-components'

/** A node's prop as an attribute value. JSON for anything that is not a scalar — an object is code. */
export const literal = (value: unknown): IRValue | undefined => {
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return { kind: 'literal', value }
  }

  return value === undefined || value === null
    ? undefined
    : { kind: 'expression', code: JSON.stringify(value) }
}

/**
 * `<PlanCard plan={…} />`: the boundary's name, and the props this instance differs in.
 *
 * No `key`. Three siblings written out in JSX are not a mapped array, and the only value available was
 * the node's id — the first editor artifact EXPORT_ENGINE.md § React's rule table bans (ADR-234).
 */
export function referenceElement(
  nodeId: NodeId,
  unit: ComponentUnit,
  context: ElementContext,
): IRElement | undefined {
  const name = context.nameOf.get(unit.source)
  const node = context.document.nodes[nodeId]

  if (name === undefined || node === undefined) {
    return undefined
  }

  const attributes: Record<string, IRValue> = {}

  for (const prop of unit.propNames) {
    const value = literal(node.props[prop])

    if (value !== undefined) {
      attributes[prop] = value
    }
  }

  return {
    kind: 'element',
    tag: name,
    classNames: [],
    attributes,
    children: [],
  }
}
