import {
  type BlockRegistry,
  type MotionDocument,
  type Node,
  type NodeId,
  type UnknownProps,
  blockId,
  doc,
  fakeRegistry,
  fixtureBlockId,
  node,
  tree,
  treeId,
} from '@motion-studio/schema'
import type { Rect } from '@motion-studio/utils'

import type { DragRectSource } from '../dnd.types'

export const rect = (x: number, y: number, width: number, height: number): Rect => ({
  x,
  y,
  width,
  height,
})

export const rectsFrom = (entries: Readonly<Record<string, Rect>>): DragRectSource => ({
  get: (id: NodeId) => entries[id],
})

/**
 * The blocks the drop tests need: one of each orientation, one that reads its axis off its own props,
 * one bounded slot with a label the rejection quotes, and two leaves.
 */
export function dropRegistry(): BlockRegistry {
  const open = { accepts: '*', minChildren: 0, maxChildren: null } as const

  return fakeRegistry({
    page: {
      slots: [
        { name: 'children', label: 'Content', ...open, orientation: () => 'vertical' as const },
      ],
    },
    row: {
      slots: [
        { name: 'children', label: 'Content', ...open, orientation: () => 'horizontal' as const },
      ],
    },
    grid: {
      slots: [{ name: 'children', label: 'Cells', ...open, orientation: () => 'grid' as const }],
    },
    flex: {
      slots: [
        {
          name: 'children',
          label: 'Content',
          ...open,
          orientation: (props: UnknownProps) =>
            props['direction'] === 'row' ? ('horizontal' as const) : ('vertical' as const),
        },
      ],
    },
    plain: {
      slots: [{ name: 'children', label: 'Content', ...open }],
    },
    navbar: {
      slots: [
        {
          name: 'children',
          label: 'Links',
          accepts: [fixtureBlockId('link')],
          minChildren: 0,
          maxChildren: 2,
        },
      ],
    },
    columns: {
      slots: [
        { name: 'left', label: 'Left', accepts: '*', minChildren: 0, maxChildren: 1 },
        { name: 'right', label: 'Right', accepts: '*', minChildren: 0, maxChildren: 1 },
      ],
    },
    heading: { slots: [] },
    link: { slots: [] },
  })
}

export interface BuildOptions {
  /** Name → block id. Anything unnamed is a `heading`, which declares no slot of its own. */
  readonly blocks?: Readonly<Record<string, string>>
  readonly props?: Readonly<Record<string, UnknownProps>>
  readonly responsive?: Readonly<Record<string, Node['responsive']>>
  readonly locked?: readonly string[]
  readonly hidden?: readonly string[]
  /** Name → slot of its parent, for the blocks with more than one. */
  readonly slots?: Readonly<Record<string, string>>
}

/** `tree()` with a block, some props and the odd flag per node — the shape a drop test describes. */
export function build(
  shape: Readonly<Record<string, readonly string[]>>,
  options: BuildOptions = {},
): MotionDocument {
  const nodes = tree(shape).map((entry) =>
    node({
      ...entry,
      blockId: blockId(options.blocks?.[entry.name] ?? 'heading'),
      props: options.props?.[entry.name] ?? {},
      responsive: options.responsive?.[entry.name] ?? {},
      locked: options.locked?.includes(entry.name) ?? false,
      hidden: options.hidden?.includes(entry.name) ?? false,
      slot: options.slots?.[entry.name] ?? entry.slot,
    }),
  )

  return doc(nodes)
}

export const id = treeId
