import { nodeId } from '@motion-studio/schema'
import { describe, expect, it } from 'vitest'

import type { DropZone } from '../dnd.types'
import type { EdgeRect } from '../drag-point'
import type { PlacementChild } from '../drop-placement'
import {
  type KeyboardDragContext,
  canvasAwareCoordinateGetter,
  keyboardStep,
} from './keyboard-sensor'

const box = (left: number, top: number, width: number, height: number): EdgeRect => ({
  left,
  top,
  width,
  height,
})

/** Two stacked containers, and a dragged box that starts in the middle of the upper one. */
const ZONES: Readonly<Record<string, EdgeRect>> = {
  top: box(0, 0, 400, 200),
  bottom: box(0, 200, 400, 200),
}

interface Situation {
  /** `null` is "over nothing", which is not the same as "not specified". */
  readonly overId?: string | null
  readonly dragged?: EdgeRect
}

function context({
  overId = 'top',
  dragged = box(180, 80, 40, 40),
}: Situation = {}): KeyboardDragContext {
  const rect = overId === null ? undefined : ZONES[overId]

  return {
    active: null,
    collisionRect: dragged,
    over: overId === null || rect === undefined ? null : { id: overId, rect },
    droppableRects: new Map(Object.entries(ZONES)),
    droppableContainers: { getEnabled: () => Object.keys(ZONES).map((id) => ({ id })) },
  }
}

const move = (code: string, zoom: number, situation?: Situation) =>
  canvasAwareCoordinateGetter({ zoom: () => zoom, gridSize: () => 8, siblings: () => [] })(
    new KeyboardEvent('keydown', { code }),
    { currentCoordinates: { x: 180, y: 80 }, context: context(situation) },
  )

describe('keyboardStep', () => {
  it('is one grid cell as it appears on screen — ADR-127', () => {
    expect([0.5, 1, 2].map((zoom) => keyboardStep(8, zoom))).toEqual([4, 8, 16])
  })
})

describe('canvasAwareCoordinateGetter', () => {
  it.each([
    [0.5, 4],
    [1, 8],
    [2, 16],
  ])('steps one visual cell inside the container at zoom %s', (zoom, expected) => {
    expect(move('ArrowRight', zoom)).toEqual({ x: 180 + expected, y: 80 })
  })

  it('steps up and left as well', () => {
    expect(move('ArrowUp', 1)).toEqual({ x: 180, y: 72 })
    expect(move('ArrowLeft', 1)).toEqual({ x: 172, y: 80 })
  })

  it('ignores a key that is not an arrow', () => {
    expect(move('Space', 1)).toBeUndefined()
  })

  it('does not move when nothing has been measured yet', () => {
    const getter = canvasAwareCoordinateGetter({
      zoom: () => 1,
      gridSize: () => 8,
      siblings: () => [],
    })

    expect(
      getter(new KeyboardEvent('keydown', { code: 'ArrowDown' }), {
        currentCoordinates: { x: 0, y: 0 },
        context: { ...context(), collisionRect: null },
      }),
    ).toBeUndefined()
  })

  it('crosses to the next container when a step would leave this one', () => {
    // The dragged box's centre is at y 190; one cell down is 198, still inside `top`, so pick a box
    // whose centre is closer to the edge: 195 + 8 = 203 is out.
    const result = move('ArrowDown', 1, { dragged: box(180, 190, 40, 10) })

    // Its centre moves from (200, 195) to the centre of `bottom`, (200, 300): 105 px down.
    expect(result).toEqual({ x: 180, y: 185 })
  })

  it('crosses backwards on the opposite arrow', () => {
    const result = move('ArrowUp', 1, { overId: 'bottom', dragged: box(180, 200, 40, 10) })

    // Centre (200, 205) → centre of `top`, (200, 100): 105 px up.
    expect(result).toEqual({ x: 180, y: -25 })
  })

  it('steps by pixels when nothing is over yet and the step lands in a container', () => {
    // Where every keyboard drag starts: the box is inside `top`, and `over` is only known after a
    // move. Jumping to a container from inside one would skip every position in it.
    expect(move('ArrowDown', 1, { overId: null })).toEqual({ x: 180, y: 88 })
  })

  it('starts from the first container when the drag is over nothing', () => {
    const result = move('ArrowDown', 1, { overId: null, dragged: box(1000, 1000, 40, 40) })

    // Centre (1020, 1020) → centre of `top`, (200, 100).
    expect(result).toEqual({ x: 180 - 820, y: 80 - 920 })
  })

  it('refuses to move when there is no next container', () => {
    expect(
      move('ArrowDown', 1, { overId: 'bottom', dragged: box(180, 390, 40, 10) }),
    ).toBeUndefined()
  })
})

/**
 * ADR-359 measured the gap this covers, in the browser and with these numbers: a page of a navbar, a
 * hero and a feature grid, the grid picked up, and five presses that produced five identical
 * announcements because a grid cell is 8 px and the hero is 569 px tall.
 */
describe('a step of one position', () => {
  const NAVBAR = nodeId('node_navbar')
  const HERO = nodeId('node_hero')
  const GRID = nodeId('node_grid')

  const BOXES: Readonly<Record<string, PlacementChild>> = {
    [NAVBAR]: { id: NAVBAR, rect: { x: 344, y: -554, width: 375, height: 65 } },
    [HERO]: { id: HERO, rect: { x: 344, y: -473, width: 375, height: 569 } },
    [GRID]: { id: GRID, rect: { x: 344, y: 112, width: 375, height: 623.5625 } },
  }

  const PAGE: DropZone = {
    parentId: nodeId('node_page'),
    slot: 'children',
    orientation: 'vertical',
    label: 'Page',
    childIds: [NAVBAR, HERO, GRID],
    surface: 'canvas',
  }

  const DRAGGED = box(344, 112, 375, 623.5625)
  const CURRENT = { x: 344, y: 112 }

  const press = (code: string, zone: DropZone = PAGE) =>
    canvasAwareCoordinateGetter({
      zoom: () => 1,
      gridSize: () => 8,
      siblings: (asked) => asked.childIds.flatMap((id) => BOXES[id] ?? []),
    })(new KeyboardEvent('keydown', { code }), {
      currentCoordinates: CURRENT,
      context: {
        active: {
          data: {
            current: {
              kind: 'canvas-nodes',
              blockId: 'section',
              nodeIds: [GRID],
              labels: ['Feature grid'],
            },
          },
        },
        collisionRect: DRAGGED,
        over: {
          id: 'canvas:node_page/children',
          rect: box(344, -598, 375, 1289.5625),
          data: { current: zone },
        },
        droppableRects: new Map([['canvas:node_page/children', box(344, -598, 375, 1289.5625)]]),
        droppableContainers: { getEnabled: () => [{ id: 'canvas:node_page/children' }] },
      },
    })

  it('moves the drag past the neighbour it has to clear', () => {
    // The grid's centre is at y 423.78 and the positions either side of the hero are separated by the
    // midpoints of the navbar (-521.5) and the hero (-188.5): the step lands between them, at -355.
    expect(press('ArrowUp')).toEqual({ x: 344, y: 112 + (-355 - 423.78125) })
  })

  it('is one press per position, in both directions', () => {
    const up = press('ArrowUp')
    const down = press('ArrowDown')

    // Down from the last position has nowhere to go, so the grid-cell path answers instead.
    expect(down).toEqual({ x: 344, y: 120 })
    expect(up?.y).toBeLessThan(0)
  })

  it('leaves the cross axis to the grid cell it always was', () => {
    expect(press('ArrowRight')).toEqual({ x: 352, y: 112 })
  })

  it('steps by pixels when the zone declares no children with boxes', () => {
    expect(press('ArrowUp', { ...PAGE, childIds: [] })).toEqual({ x: 344, y: 104 })
  })
})
