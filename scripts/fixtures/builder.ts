import { blockRegistry } from '@motion-studio/blocks/registry'
import {
  type EffectInstance,
  type MotionDocument,
  type Node,
  type NodeId,
  blockId,
  effectBlockId,
  effectId,
  nodeId,
} from '@motion-studio/schema'
import { studioDark } from '@motion-studio/theme'

/**
 * How every committed fixture is written: block defaults for props, the block's `defaultMotion`
 * materialised into the node (ADR-154), and ids that are a counter — a fixture nobody can reproduce
 * is a measurement nobody can repeat.
 */
const FIXED_TIME = '2026-01-01T00:00:00.000Z'

export interface Builder {
  readonly nodes: Node[]
  next: number
}

export const builder = (): Builder => ({ nodes: [], next: 0 })

export const push = (
  builder: Builder,
  block: string,
  parentId: NodeId | null,
  slot: string,
  overrides: Partial<Node> = {},
): NodeId => {
  const definition = blockRegistry.require(blockId(block))

  builder.next += 1

  const id = nodeId(`node_f${String(builder.next).padStart(3, '0')}`)

  builder.nodes.push({
    id,
    blockId: definition.id,
    name: definition.name,
    parentId,
    slot,
    children: [],
    props: definition.propsSchema.parse(definition.defaults) as Record<string, unknown>,
    responsive: {},
    motion: structuredClone(definition.defaultMotion),
    effects: [],
    locked: false,
    hidden: false,
    ...overrides,
  })

  if (parentId !== null) {
    const parent = builder.nodes.find((node) => node.id === parentId)

    if (parent === undefined) {
      throw new Error(`No parent ${parentId} for ${block}`)
    }

    Object.assign(parent, { children: [...parent.children, id] })
  }

  return id
}

/** A surface effect on a node, with the catalogue's own defaults for its parameters. */
export const effect = (id: string, catalogue: string): EffectInstance => {
  const definition = blockRegistry.require(effectBlockId(effectId(catalogue)))

  return {
    id: `fx_${id}`,
    effectId: effectId(catalogue),
    params: definition.propsSchema.parse(definition.defaults) as Record<string, unknown>,
    layer: 'behind',
    blendMode: 'normal',
    opacity: 1,
  }
}

export const document = (name: string, id: string, nodes: readonly Node[]): MotionDocument => {
  const root = nodes[0]

  if (root === undefined) {
    throw new Error(`${name} has no root`)
  }

  return {
    version: 1,
    meta: {
      id: `doc_${id}`,
      name,
      createdAt: FIXED_TIME,
      updatedAt: FIXED_TIME,
      generator: 'motion-studio@0.0.0',
      canvas: { width: 1440, background: 'surface-0' },
    },
    theme: studioDark,
    rootId: root.id,
    nodes: Object.fromEntries(nodes.map((node) => [node.id, node])),
    assets: {},
  }
}
