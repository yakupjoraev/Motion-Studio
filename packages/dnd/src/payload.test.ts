import { describe, expect, it } from 'vitest'

import { dragPayload, draggedNodeIds, dropZone, payloadLabel } from './payload'

const palette = { kind: 'palette-block', blockId: 'hero-aurora', label: 'Aurora hero' }
const nodes = {
  kind: 'canvas-nodes',
  blockId: 'hero-aurora',
  nodeIds: ['node_a', 'node_b'],
  labels: ['Hero', 'Section'],
}

describe('dragPayload', () => {
  it('reads a palette payload back', () => {
    expect(dragPayload(palette)).toEqual(palette)
  })

  it('reads a node payload back', () => {
    expect(dragPayload(nodes)).toEqual(nodes)
  })

  it.each([
    ['not an object', 'hero'],
    ['no block id', { kind: 'palette-block', label: 'Aurora' }],
    ['an unknown kind', { kind: 'layer', blockId: 'hero-aurora', label: 'Aurora' }],
    ['no label', { kind: 'palette-block', blockId: 'hero-aurora' }],
    ['no node ids', { kind: 'canvas-nodes', blockId: 'hero-aurora', labels: ['Hero'] }],
    [
      'an empty node list',
      { kind: 'canvas-nodes', blockId: 'hero-aurora', nodeIds: [], labels: [] },
    ],
    [
      'a malformed node id',
      { kind: 'canvas-nodes', blockId: 'hero-aurora', nodeIds: ['hero'], labels: ['Hero'] },
    ],
    ['a malformed block id', { kind: 'palette-block', blockId: 'Hero Aurora', label: 'Aurora' }],
  ])('rejects data with %s', (_, data) => {
    expect(dragPayload(data)).toBeNull()
  })
})

describe('dropZone', () => {
  const valid = {
    parentId: 'node_root',
    slot: 'children',
    orientation: 'grid',
    label: 'Grid',
    childIds: ['node_a'],
    surface: 'canvas',
  }

  it('reads a zone back', () => {
    expect(dropZone(valid)).toEqual(valid)
  })

  it.each([
    ['not an object', null],
    ['no parent', { ...valid, parentId: undefined }],
    ['a malformed parent id', { ...valid, parentId: 'root' }],
    ['an unknown orientation', { ...valid, orientation: 'diagonal' }],
    ['children that are not ids', { ...valid, childIds: [7] }],
    ['an unknown surface', { ...valid, surface: 'inspector' }],
  ])('rejects a zone with %s', (_, data) => {
    expect(dropZone(data)).toBeNull()
  })
})

describe('payloadLabel', () => {
  it('names a palette block', () => {
    const payload = dragPayload(palette)

    expect(payload === null ? '' : payloadLabel(payload)).toBe('Aurora hero')
  })

  it('names a single node', () => {
    const payload = dragPayload({ ...nodes, nodeIds: ['node_a'], labels: ['Hero'] })

    expect(payload === null ? '' : payloadLabel(payload)).toBe('Hero')
  })

  it('counts a multi-node drag instead of naming it', () => {
    const payload = dragPayload(nodes)

    expect(payload === null ? '' : payloadLabel(payload)).toBe('2 layers')
  })
})

describe('draggedNodeIds', () => {
  it('is empty for a palette drag', () => {
    const payload = dragPayload(palette)

    expect(payload === null ? ['x'] : draggedNodeIds(payload)).toEqual([])
  })

  it('is the dragged set for a node drag', () => {
    const payload = dragPayload(nodes)

    expect(payload === null ? [] : draggedNodeIds(payload)).toEqual(['node_a', 'node_b'])
  })
})
