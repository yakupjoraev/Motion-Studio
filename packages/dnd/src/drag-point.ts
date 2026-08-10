import type { Point, Rect } from '@motion-studio/utils'

/** dnd-kit reports rects as edges; the rect cache reports them as an origin and a size. */
export interface EdgeRect {
  readonly left: number
  readonly top: number
  readonly width: number
  readonly height: number
}

/**
 * The one place "where is this drag" is answered. A pointer drag has a cursor; a keyboard drag has
 * only the box dnd-kit is translating, so its centre stands in for the cursor and both paths resolve
 * a target the same way.
 */
export function dragPoint(pointer: Point | null, box: EdgeRect): Point
export function dragPoint(pointer: Point | null, box: EdgeRect | null): Point | null
export function dragPoint(pointer: Point | null, box: EdgeRect | null): Point | null {
  if (pointer !== null) {
    return pointer
  }

  return box === null ? null : centre(box)
}

export const edgeRect = (rect: Rect): EdgeRect => ({
  left: rect.x,
  top: rect.y,
  width: rect.width,
  height: rect.height,
})

export const contains = (box: EdgeRect, point: Point): boolean =>
  point.x >= box.left &&
  point.x <= box.left + box.width &&
  point.y >= box.top &&
  point.y <= box.top + box.height

export const centre = (box: EdgeRect): Point => ({
  x: box.left + box.width / 2,
  y: box.top + box.height / 2,
})
