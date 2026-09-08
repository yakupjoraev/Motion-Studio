import { KeyboardCode } from '@dnd-kit/core'
import type { Point } from '@motion-studio/utils'

import type { DropZone } from '../dnd.types'
import { type EdgeRect, centre, contains } from '../drag-point'
import { type PlacementChild, placeInSlot, pointForPosition } from '../drop-placement'
import { dragPayload, draggedNodeIds, dropZone } from '../payload'

export interface CanvasKeyboardOptions {
  /** Read at the moment of the key press: the viewport is a ref, not React state. */
  readonly zoom: () => number
  /** The canvas grid, in canvas units. */
  readonly gridSize: () => number
  /**
   * The boxes of a zone's children, in document order — geometry only the surface that drew the zone
   * has, which is why it arrives as an option rather than being measured here.
   */
  readonly siblings: (zone: DropZone) => readonly PlacementChild[]
}

/**
 * What the getter reads out of dnd-kit's sensor context, and nothing more — a narrower parameter is a
 * smaller fixture in a test, and dnd-kit's own context satisfies it.
 */
export interface KeyboardDragContext {
  /** What is being dragged: its own boxes are not positions the drag can step onto. */
  readonly active: { readonly data: { readonly current?: unknown } } | null
  readonly collisionRect: EdgeRect | null
  readonly over: {
    readonly id: string | number
    readonly rect: EdgeRect
    /** The zone the surface registered, which is what says how its children are arranged. */
    readonly data?: { readonly current?: unknown }
  } | null
  readonly droppableRects: ReadonlyMap<string | number, EdgeRect>
  readonly droppableContainers: { getEnabled(): readonly { readonly id: string | number }[] }
}

export interface KeyboardDragArguments {
  readonly currentCoordinates: Point
  readonly context: KeyboardDragContext
}

const DIRECTIONS: Readonly<Record<string, Point>> = {
  [KeyboardCode.Right]: { x: 1, y: 0 },
  [KeyboardCode.Left]: { x: -1, y: 0 },
  [KeyboardCode.Down]: { x: 0, y: 1 },
  [KeyboardCode.Up]: { x: 0, y: -1 },
}

/** ADR-127: a grid cell is `gridSize` canvas units, which is `gridSize × zoom` on screen. */
export const keyboardStep = (gridSize: number, zoom: number): number => gridSize * zoom

/**
 * DRAG_AND_DROP.md § Sensors, in three modes, in the order they are asked. Along the axis its zone
 * flows a press moves one **position**, because that is the unit a reorder is measured in and a grid
 * cell is not: ADR-359 measured a section 623 px tall against a step of 8, and five presses left the
 * drop where it began. Across that axis, and wherever no zone can say where its positions are, a
 * press still moves one visual grid cell (ADR-127); a press that would leave the container moves to
 * the next container in document order instead.
 */
export function canvasAwareCoordinateGetter(options: CanvasKeyboardOptions) {
  return (
    event: KeyboardEvent,
    { currentCoordinates, context }: KeyboardDragArguments,
  ): Point | undefined => {
    const direction = DIRECTIONS[event.code]

    if (direction === undefined || context.collisionRect === null) {
      return undefined
    }

    const step = keyboardStep(options.gridSize(), options.zoom())
    const from = centre(context.collisionRect)
    const positioned = positionStep({ context, direction, from, options })

    if (positioned !== null) {
      return {
        x: currentCoordinates.x + (positioned.x - from.x),
        y: currentCoordinates.y + (positioned.y - from.y),
      }
    }

    const stepped = { x: from.x + direction.x * step, y: from.y + direction.y * step }
    const here = context.over?.rect ?? null
    // With a zone under the drag, the question is whether the step leaves it. With none — which is
    // where every keyboard drag begins, because `over` is only known after a move — the question is
    // whether the step lands in one at all. Jumping from a point that is already inside a container
    // skips every position in it.
    const stays = here === null ? zoneUnder(context, stepped) : contains(here, stepped)

    if (stays) {
      return {
        x: currentCoordinates.x + direction.x * step,
        y: currentCoordinates.y + direction.y * step,
      }
    }

    const next = nextZone(context, direction.x + direction.y > 0)

    if (next === null) {
      return undefined
    }

    const destination = centre(next)

    return {
      x: currentCoordinates.x + (destination.x - from.x),
      y: currentCoordinates.y + (destination.y - from.y),
    }
  }
}

interface PositionStepArgs {
  readonly context: KeyboardDragContext
  readonly direction: Point
  /** Where the drag is, which for a keyboard drag is the centre of the box being translated. */
  readonly from: Point
  readonly options: CanvasKeyboardOptions
}

/**
 * The drag point one position along, or `null` when this press is not a position step: no zone under
 * the drag, an arrow across the axis the zone flows along, a zone with no measured children, or a
 * position past either end of the list — the last of which is how a press leaves a container, and so
 * belongs to the caller's next-container path rather than here.
 *
 * The position is read with `placeInSlot`, the same function that resolves the drop, so a step can
 * never disagree with where the indicator says the node would land.
 */
function positionStep({ context, direction, from, options }: PositionStepArgs): Point | null {
  const zone = dropZone(context.over?.data?.current)

  if (zone === null || !movesPositions(zone.orientation, direction)) {
    return null
  }

  const payload = dragPayload(context.active?.data.current)
  const moved = payload === null ? [] : draggedNodeIds(payload)
  const children = options.siblings(zone).filter((child) => !moved.includes(child.id))

  if (children.length === 0) {
    return null
  }

  const container = edgeToRect(context.over?.rect ?? null)
  const { position } = placeInSlot({
    orientation: zone.orientation,
    point: from,
    container,
    children,
  })

  return pointForPosition({
    orientation: zone.orientation,
    position: position + (direction.x + direction.y > 0 ? 1 : -1),
    point: from,
    children,
  })
}

/** A column reorders on the vertical arrows, a row on the horizontal ones, a grid on all four. */
function movesPositions(orientation: DropZone['orientation'], direction: Point): boolean {
  if (orientation === 'grid') {
    return true
  }

  return orientation === 'horizontal' ? direction.x !== 0 : direction.y !== 0
}

const edgeToRect = (box: EdgeRect | null) =>
  box === null
    ? { x: 0, y: 0, width: 0, height: 0 }
    : { x: box.left, y: box.top, width: box.width, height: box.height }

/** Whether any measured zone holds the point — the rects are dnd-kit's, measured at drag start. */
function zoneUnder(context: KeyboardDragContext, point: Point): boolean {
  return context.droppableContainers.getEnabled().some((entry) => {
    const rect = context.droppableRects.get(entry.id)

    return rect !== undefined && contains(rect, point)
  })
}

/**
 * Document order for any layout that flows: top edge first, left edge to break a tie. The rects are
 * dnd-kit's, measured once when the drag started.
 */
function nextZone(context: KeyboardDragContext, forward: boolean): EdgeRect | null {
  const ordered = context.droppableContainers
    .getEnabled()
    .flatMap((entry) => {
      const rect = context.droppableRects.get(entry.id)

      return rect === undefined ? [] : [{ id: entry.id, rect }]
    })
    .sort((first, second) => first.rect.top - second.rect.top || first.rect.left - second.rect.left)

  const from = ordered.findIndex((entry) => entry.id === context.over?.id)
  const index = from === -1 ? (forward ? 0 : ordered.length - 1) : from + (forward ? 1 : -1)

  return ordered[index]?.rect ?? null
}
