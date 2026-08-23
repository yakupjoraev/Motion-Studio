import type { MarkupChild, MarkupElement, MarkupValue } from '@motion-studio/schema'
import { type ReactNode, createElement } from 'react'

/**
 * A `MarkupElement` tree as React elements, so the parity test can render what the export will print
 * and compare it with what the canvas renders — ADR-249. It is a test helper and stays one: the real
 * consumers of these nodes are the three printers, which emit source rather than mount anything, and
 * what this proves is that the tree *describes* the same DOM.
 */

/**
 * A reference is resolved against the props, which is what pass 6 does when props are not extracted.
 * Rendering it as `{name}` would compare a placeholder with the component's real value and call the
 * difference a defect.
 */
const attributeValue = (value: MarkupValue, props: Record<string, unknown>): unknown => {
  if (value.kind === 'literal') {
    return value.value
  }

  return value.kind === 'reference' ? props[value.name] : value.code
}

/** React's prop names for the handful of attributes whose DOM name differs. */
const REACT_NAME: Readonly<Record<string, string>> = {
  class: 'className',
  for: 'htmlFor',
}

const propsOf = (node: MarkupElement, values: Record<string, unknown>): Record<string, unknown> => {
  const props: Record<string, unknown> = {}

  for (const [name, value] of Object.entries(node.attributes)) {
    props[REACT_NAME[name] ?? name] = attributeValue(value, values)
  }

  if (node.classNames.length > 0) {
    props['className'] = node.classNames.join(' ')
  }

  if (node.cssVars !== undefined) {
    props['style'] = node.cssVars
  }

  return props
}

export function renderMarkupNode(
  node: MarkupChild,
  values: Record<string, unknown>,
  key?: number,
): ReactNode {
  if (node.kind === 'text') {
    return node.value
  }

  if (node.kind === 'expression') {
    return node.code
  }

  if (node.kind === 'slot') {
    // The document fills a slot; a parity test renders one block on its own, so it renders as empty.
    return null
  }

  // Which is also the answer for a gated element: nothing was dropped into any slot here.
  if (node.slotGate?.when === 'filled') {
    return null
  }

  return createElement(
    node.tag,
    { ...propsOf(node, values), ...(key === undefined ? {} : { key }) },
    ...node.children.map((child, index) => renderMarkupNode(child, values, index)),
  )
}
