import type { NodeId, SlotOrientation } from '@motion-studio/schema'
import type { Point, Rect } from '@motion-studio/utils'

import type { DropIndicator } from './dnd.types'

export interface PlacementChild {
  readonly id: NodeId
  readonly rect: Rect
}

export interface Placement {
  /** Position among the slot's children, with the dragged ones already excluded. */
  readonly position: number
  readonly indicator: DropIndicator
}

export interface PlacementArgs {
  readonly orientation: SlotOrientation
  readonly point: Point
  readonly container: Rect
  /** Document order, dragged nodes excluded, every rect known. */
  readonly children: readonly PlacementChild[]
}

/** The hairline a line indicator is; the rest of the rect is the sibling's own edge. */
export const LINE_THICKNESS_PX = 2

/**
 * DRAG_AND_DROP.md § Drop position resolution, step 5. Pure geometry over rects that were measured
 * once: a midpoint comparison per sibling on the axis the slot flows along, the nearest cell centre
 * for a grid, and the whole container when there is nothing to sit between.
 */
export function placeInSlot({ orientation, point, container, children }: PlacementArgs): Placement {
  if (children.length === 0) {
    return { position: 0, indicator: { kind: 'fill', rect: container } }
  }

  if (orientation === 'grid') {
    return placeInGrid(point, container, children)
  }

  const axis = orientation === 'horizontal' ? 'x' : 'y'
  const position = children.filter((child) => midpoint(child.rect, axis) <= point[axis]).length

  return { position, indicator: { kind: 'line', rect: lineRect(children, position, axis), axis } }
}

const midpoint = (rect: Rect, axis: 'x' | 'y'): number =>
  axis === 'x' ? rect.x + rect.width / 2 : rect.y + rect.height / 2

/**
 * The line sits on the edge between the two siblings it would come between: the far edge of the one
 * before it, or the near edge of the first child when the drop is above everything.
 */
function lineRect(children: readonly PlacementChild[], position: number, axis: 'x' | 'y'): Rect {
  const before = children[position - 1]?.rect
  const anchor = before ?? children[position]?.rect

  if (anchor === undefined) {
    return { x: 0, y: 0, width: 0, height: 0 }
  }

  const near = axis === 'x' ? anchor.x : anchor.y
  const size = axis === 'x' ? anchor.width : anchor.height
  const edge = (before === undefined ? near : near + size) - LINE_THICKNESS_PX / 2

  return axis === 'x'
    ? { x: edge, y: anchor.y, width: LINE_THICKNESS_PX, height: anchor.height }
    : { x: anchor.x, y: edge, width: anchor.width, height: LINE_THICKNESS_PX }
}

/**
 * A grid has two axes, so "before the pointer" is reading order: a cell in a row above comes first,
 * and inside the pointer's own row it is the cells to its left. Expressed that way the empty cell
 * past the last child is a position like any other, which is what makes it a valid target.
 */
function placeInGrid(
  point: Point,
  container: Rect,
  children: readonly PlacementChild[],
): Placement {
  const position = children.filter((child) => precedes(child.rect, point)).length
  const occupied = children[position]?.rect

  return {
    position,
    indicator: { kind: 'cell', rect: occupied ?? nextCell(container, children) },
  }
}

function precedes(rect: Rect, point: Point): boolean {
  const sameRow = point.y >= rect.y && point.y <= rect.y + rect.height

  return sameRow ? rect.x + rect.width / 2 < point.x : rect.y + rect.height / 2 < point.y
}

/** One step to the right of the last child while the container has room, else the start of a new row. */
function nextCell(container: Rect, children: readonly PlacementChild[]): Rect {
  const last = children[children.length - 1]?.rect

  if (last === undefined) {
    return container
  }

  const columnGap = gapOf(children, 'x')
  const rowGap = gapOf(children, 'y')
  const right = last.x + last.width + columnGap

  return right + last.width <= container.x + container.width
    ? { ...last, x: right }
    : { ...last, x: firstColumn(children), y: last.y + last.height + rowGap }
}

const firstColumn = (children: readonly PlacementChild[]): number =>
  Math.min(...children.map((child) => child.rect.x))

/** The smallest positive distance between two neighbours on an axis, which is the grid's gap. */
function gapOf(children: readonly PlacementChild[], axis: 'x' | 'y'): number {
  const size = axis === 'x' ? 'width' : 'height'
  const gaps: number[] = []

  for (const [index, child] of children.entries()) {
    const next = children[index + 1]?.rect

    if (next !== undefined) {
      const gap = next[axis] - (child.rect[axis] + child.rect[size])

      if (gap > 0) {
        gaps.push(gap)
      }
    }
  }

  return gaps.length === 0 ? 0 : Math.min(...gaps)
}
