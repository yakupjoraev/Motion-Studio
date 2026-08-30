import type { MotionDocument, Node, NodeId } from '@motion-studio/schema'

import { type Builder, builder, document, push } from '../fixtures/builder'

export type { Builder }
export { builder }

/**
 * `push` with a props patch merged over the block's defaults, which is what a template is: the
 * catalogue's own copy where it fits, and this page's copy where it does not.
 */
export const place = (
  target: Builder,
  block: string,
  parentId: NodeId | null,
  slot: string,
  props: Record<string, unknown> = {},
  overrides: Partial<Node> = {},
): NodeId => {
  const id = push(target, block, parentId, slot, overrides)
  const node = target.nodes.find((candidate) => candidate.id === id)

  if (node === undefined) {
    throw new Error(`${block} was not placed`)
  }

  Object.assign(node, { props: { ...node.props, ...props } })

  return id
}

/** A section with a container inside it: the wrapper every band of prose in these templates uses. */
export const band = (target: Builder, root: NodeId, props: Record<string, unknown> = {}): NodeId =>
  place(target, 'container', place(target, 'section', root, 'children', props), 'children')

export interface TemplateSpec {
  readonly slug: string
  readonly name: string
  /** One line, shown under the name in the picker. */
  readonly description: string
  build(): MotionDocument
}

/** `meta.template: true` — FILE_FORMAT.md § Templates. Loading one clones it with fresh ids. */
export const templateDocument = (
  name: string,
  slug: string,
  nodes: readonly Node[],
): MotionDocument => {
  const base = document(name, slug.replaceAll('-', ''), nodes)

  return { ...base, meta: { ...base.meta, template: true } }
}
