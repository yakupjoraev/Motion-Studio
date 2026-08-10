import type { Active, ClientRect, DroppableContainer } from '@dnd-kit/core'
import { type NodeId, nodeId } from '@motion-studio/schema'
import type { Point, Rect } from '@motion-studio/utils'
import { describe, expect, it, vi } from 'vitest'

import type { DropZone } from '../dnd.types'
import { rectCacheCollision } from './rect-cache-collision'

const OUTER = nodeId('node_outer')
const INNER = nodeId('node_inner')
const ASIDE = nodeId('node_aside')

const rect = (x: number, y: number, width: number, height: number): Rect => ({
  x,
  y,
  width,
  height,
})

const clientRect = (box: Rect): ClientRect => ({
  width: box.width,
  height: box.height,
  top: box.y,
  left: box.x,
  right: box.x + box.width,
  bottom: box.y + box.height,
})

const zone = (parentId: NodeId): DropZone => ({
  parentId,
  slot: 'children',
  orientation: 'vertical',
  label: parentId,
  childIds: [],
})

const container = (id: string, data: Record<string, unknown>): DroppableContainer => ({
  id,
  key: id,
  disabled: false,
  data: { current: data },
  node: { current: null },
  rect: { current: null },
})

const active: Active = {
  id: 'node_hero',
  data: { current: {} },
  rect: { current: { initial: null, translated: null } },
}

interface Scenario {
  readonly cache?: Readonly<Record<string, Rect>>
  readonly containers: readonly DroppableContainer[]
  readonly point?: Point | null
  readonly measured?: readonly (readonly [string, Rect])[]
}

function detect({ cache = {}, containers, point = null, measured = [] }: Scenario) {
  const get = vi.fn((id: NodeId) => cache[id])
  const collisions = rectCacheCollision({ get })({
    active,
    collisionRect: clientRect(rect(0, 0, 20, 20)),
    droppableRects: new Map(measured.map(([id, box]) => [id, clientRect(box)])),
    droppableContainers: [...containers],
    pointerCoordinates: point,
  })

  return { get, ids: collisions.map((collision) => collision.id) }
}

describe('rectCacheCollision', () => {
  it('picks the deepest container under the pointer', () => {
    const { ids } = detect({
      cache: { [OUTER]: rect(0, 0, 400, 400), [INNER]: rect(100, 100, 100, 100) },
      containers: [
        container(`${OUTER}/children`, zone(OUTER)),
        container(`${INNER}/children`, zone(INNER)),
      ],
      point: { x: 150, y: 150 },
    })

    expect(ids).toEqual([`${INNER}/children`, `${OUTER}/children`])
  })

  it('leaves out a container the pointer is not inside', () => {
    const { ids } = detect({
      cache: { [OUTER]: rect(0, 0, 400, 400), [ASIDE]: rect(500, 0, 100, 100) },
      containers: [
        container(`${OUTER}/children`, zone(OUTER)),
        container(`${ASIDE}/children`, zone(ASIDE)),
      ],
      point: { x: 150, y: 150 },
    })

    expect(ids).toEqual([`${OUTER}/children`])
  })

  it('asks the cache for the container’s node, never the DOM', () => {
    const { get, ids } = detect({
      cache: { [OUTER]: rect(0, 0, 400, 400) },
      containers: [container(`${OUTER}/children`, zone(OUTER))],
      point: { x: 10, y: 10 },
    })

    expect(get).toHaveBeenCalledWith(OUTER)
    expect(ids).toEqual([`${OUTER}/children`])
  })

  it('falls back to dnd-kit’s measured rect for a zone that is not a canvas node', () => {
    const { ids } = detect({
      containers: [container('tree-row', zone(OUTER))],
      point: { x: 10, y: 10 },
      measured: [['tree-row', rect(0, 0, 50, 20)]],
    })

    expect(ids).toEqual(['tree-row'])
  })

  it('uses the dragged box’s centre when there is no pointer', () => {
    const { ids } = detect({
      cache: { [OUTER]: rect(5, 5, 20, 20) },
      containers: [container(`${OUTER}/children`, zone(OUTER))],
    })

    expect(ids).toEqual([`${OUTER}/children`])
  })

  it('ignores a droppable whose data is not a zone and has no measured rect', () => {
    const { ids } = detect({
      cache: { [OUTER]: rect(0, 0, 400, 400) },
      containers: [container('stray', { kind: 'other' })],
      point: { x: 10, y: 10 },
    })

    expect(ids).toEqual([])
  })
})
