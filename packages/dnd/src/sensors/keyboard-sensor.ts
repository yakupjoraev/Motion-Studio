import { KeyboardCode } from '@dnd-kit/core'
import type { Point } from '@motion-studio/utils'

import { type EdgeRect, centre, contains } from '../drag-point'

export interface CanvasKeyboardOptions {
  /** Read at the moment of the key press: the viewport is a ref, not React state. */
  readonly zoom: () => number
  /** The canvas grid, in canvas units. */
  readonly gridSize: () => number
}

/**
 * What the getter reads out of dnd-kit's sensor context, and nothing more — a narrower parameter is a
 * smaller fixture in a test, and dnd-kit's own context satisfies it.
 */
export interface KeyboardDragContext {
  readonly collisionRect: EdgeRect | null
  readonly over: { readonly id: string | number; readonly rect: EdgeRect } | null
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
 * DRAG_AND_DROP.md § Sensors, in two modes. Inside a container a press moves one visual grid cell; a
 * press that would leave the container moves to the next container in document order instead — which
 * is what "the pointer is at a container boundary" means once the boundary is the answer rather than
 * a threshold.
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
