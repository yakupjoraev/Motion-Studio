import { blockId, nodeId } from '@motion-studio/schema'
import { describe, expect, it } from 'vitest'

import type { DragPayload, DropTarget } from './dnd.types'
import { commandForDrop } from './on-drop'

const PARENT = nodeId('node_root')

const target = (overrides: Partial<DropTarget> = {}): DropTarget => ({
  parentId: PARENT,
  slot: 'children',
  index: 2,
  orientation: 'vertical',
  indicator: { kind: 'line', rect: { x: 0, y: 0, width: 10, height: 2 }, axis: 'y' },
  ...overrides,
})

const palette: DragPayload = {
  kind: 'palette-block',
  blockId: blockId('hero-aurora'),
  label: 'Aurora hero',
}

const nodes: DragPayload = {
  kind: 'canvas-nodes',
  blockId: blockId('hero-aurora'),
  nodeIds: [nodeId('node_a'), nodeId('node_b')],
  labels: ['A', 'B'],
}

describe('commandForDrop', () => {
  it('inserts the block a palette drag carried', () => {
    const command = commandForDrop(target(), palette)

    expect(command).toMatchObject({
      type: 'insertBlock',
      payload: { blockId: 'hero-aurora', parentId: PARENT, slot: 'children', index: 2 },
    })
  })

  it('moves every node a canvas drag carried, in one command', () => {
    const command = commandForDrop(target(), nodes)

    expect(command).toMatchObject({
      type: 'moveNodes',
      payload: {
        ids: nodes.kind === 'canvas-nodes' ? nodes.nodeIds : [],
        parentId: PARENT,
        index: 2,
      },
    })
  })

  it('has nothing to do for a rejected target', () => {
    const rejected = target({
      indicator: {
        kind: 'reject',
        rect: { x: 0, y: 0, width: 10, height: 10 },
        reason: 'Layer is locked',
      },
    })

    expect(commandForDrop(rejected, palette)).toBeNull()
  })
})
