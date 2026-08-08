import { studioDark } from '@motion-studio/theme'
import { z } from 'zod'

import type { MotionDocument, Node } from '../document/document.types'
import { type BlockId, type NodeId, blockId, nodeId } from '../ids/ids'
import { createRegistry } from '../registry/create-registry'
import type { BlockDefinition, BlockRegistry } from '../registry/registry.types'

/**
 * The fixtures every downstream package builds its tests from. **Deterministic**: ids come from a
 * counter and the clock is frozen, so a failing test names the same node twice in a row and a
 * snapshot does not change because a second elapsed — TESTING.md § Determinism.
 */
const FROZEN_TIME = '2026-01-01T00:00:00.000Z'

let counter = 0

/** Called between tests that assert on specific ids. Nothing in production reads this. */
export function resetFactories(): void {
  counter = 0
}

export function nextNodeId(): NodeId {
  counter += 1

  return nodeId(`node_${counter}`)
}

export function node(overrides: Partial<Node> = {}): Node {
  const id = overrides.id ?? nextNodeId()

  return {
    id,
    blockId: blockId('container'),
    name: 'Node',
    parentId: null,
    slot: 'children',
    children: [],
    props: {},
    responsive: {},
    motion: {},
    effects: [],
    locked: false,
    hidden: false,
    ...overrides,
  }
}

/**
 * Builds a document around the nodes given. The first node is the root unless one already declares
 * itself parentless — the caller writes the tree it means, and this fills in the envelope.
 */
export function doc(
  nodes: readonly Node[] = [],
  overrides: Partial<MotionDocument> = {},
): MotionDocument {
  const list = nodes.length > 0 ? nodes : [node({ name: 'Page', slot: 'root' })]
  const root = list[0] as Node
  const map: Record<string, Node> = {}

  for (const entry of list) {
    map[entry.id] = entry
  }

  return {
    version: 1,
    meta: {
      id: 'doc_1',
      name: 'Fixture',
      createdAt: FROZEN_TIME,
      updatedAt: FROZEN_TIME,
      generator: 'motion-studio@0.0.0',
      canvas: { width: 1440, background: 'surface-0' },
    },
    theme: studioDark,
    rootId: root.id,
    nodes: map as MotionDocument['nodes'],
    assets: {},
    ...overrides,
  }
}

/** The id `tree()` gives a name, so a test can name the root it just described. */
export const treeId = (name: string): NodeId => nodeId(`node_${name}`)

/**
 * A tree built from `parent → children` shorthand, with `parentId` and `children` already agreeing.
 * Names are short (`root`, `a`, `b`) and become real ids, so a failing assertion reads as the shape
 * the test wrote rather than as a column of random strings.
 */
export function tree(shape: Readonly<Record<string, readonly string[]>>): readonly Node[] {
  const parents = new Map<string, string>()

  for (const [parent, children] of Object.entries(shape)) {
    for (const child of children) {
      parents.set(child, parent)
    }
  }

  const names = [...new Set([...Object.keys(shape), ...Object.values(shape).flat()])]

  return names.map((name) => {
    const parent = parents.get(name)

    return node({
      id: treeId(name),
      name,
      parentId: parent === undefined ? null : treeId(parent),
      slot: parent === undefined ? 'root' : 'children',
      children: (shape[name] ?? []).map(treeId),
    })
  })
}

const definition = (id: string, overrides: Partial<BlockDefinition> = {}): BlockDefinition => ({
  id: blockId(id),
  name: id,
  description: `The ${id} block`,
  category: 'layout',
  tags: [],
  icon: 'card',
  propsSchema: z.object({}).passthrough(),
  defaults: {},
  previewProps: {},
  slots: [
    { name: 'root', label: 'Root', accepts: '*', minChildren: 0, maxChildren: null },
    { name: 'children', label: 'Children', accepts: '*', minChildren: 0, maxChildren: null },
  ],
  controls: [],
  capabilities: {
    resizable: true,
    fullWidth: false,
    requiresBackdrop: false,
    supportsMotion: ['entrance'],
    costClass: 'cheap',
  },
  defaultMotion: {},
  codegen: { tag: 'div' },
  a11y: { notes: [] },
  ...overrides,
})

/**
 * A registry with one permissive `container` unless the caller says otherwise. Three entries is
 * usually enough to test the editor, and none of them is a React component — that separation is the
 * whole point of the seam.
 */
export function fakeRegistry(
  blocks: Readonly<Record<string, Partial<BlockDefinition>>> = {},
): BlockRegistry {
  const entries = Object.entries(blocks)
  const definitions =
    entries.length > 0
      ? entries.map(([id, overrides]) => definition(id, overrides))
      : [definition('container')]

  return createRegistry(definitions)
}

export const fixtureBlockId = (id: string): BlockId => blockId(id)
