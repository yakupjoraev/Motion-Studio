import { nodeId } from '@motion-studio/schema'
import { describe, expect, it } from 'vitest'

import {
  type DragState,
  announceDragCancel,
  announceDragEnd,
  announceDragOver,
  announceDragStart,
} from './announcements'
import type { DropIndicator, DropZone } from './dnd.types'

const zone: DropZone = {
  parentId: nodeId('node_root'),
  slot: 'children',
  orientation: 'vertical',
  label: 'Section',
  childIds: [nodeId('node_a'), nodeId('node_b')],
  surface: 'canvas',
}

const line: DropIndicator = { kind: 'line', rect: { x: 0, y: 0, width: 10, height: 1 }, axis: 'y' }

const state = (indicator: DropIndicator): DragState => ({
  label: 'Aurora hero',
  zone,
  count: 3,
  target: {
    parentId: zone.parentId,
    slot: zone.slot,
    index: 1,
    orientation: 'vertical',
    indicator,
  },
})

describe('announceDragStart', () => {
  it('says what was picked up and what the keys do', () => {
    expect(announceDragStart('Aurora hero')).toBe(
      'Picked up Aurora hero. Use arrow keys to move, space to drop, escape to cancel.',
    )
  })
})

describe('announceDragOver', () => {
  it('gives the position within the container', () => {
    expect(announceDragOver(state(line))).toBe('Aurora hero over Section, position 2 of 3.')
  })

  it('gives the reason a target refused, not just that it did', () => {
    const rejected = state({
      kind: 'reject',
      rect: { x: 0, y: 0, width: 10, height: 10 },
      reason: 'Section only accepts layout blocks',
    })

    expect(announceDragOver(rejected)).toBe(
      'Aurora hero cannot go into Section. Section only accepts layout blocks.',
    )
  })

  it('says so when the pointer is over nothing', () => {
    expect(announceDragOver({ label: 'Aurora hero', zone: null, target: null, count: 0 })).toBe(
      'Aurora hero is not over a valid target.',
    )
  })
})

describe('announceDragEnd', () => {
  it('reports where the drop landed', () => {
    expect(announceDragEnd(state(line))).toBe('Dropped Aurora hero into Section at position 2.')
  })

  it('reports a rejected release as a cancellation', () => {
    const rejected = state({
      kind: 'reject',
      rect: { x: 0, y: 0, width: 10, height: 10 },
      reason: 'Cannot drop into itself',
    })

    expect(announceDragEnd(rejected)).toBe(
      'Cancelled. Aurora hero returned to its original position.',
    )
  })
})

describe('announceDragCancel', () => {
  it('says the block went back', () => {
    expect(announceDragCancel('3 layers')).toBe(
      'Cancelled. 3 layers returned to its original position.',
    )
  })
})
