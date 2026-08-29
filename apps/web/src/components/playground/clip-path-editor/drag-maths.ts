import type { ShapeUnit, TargetSize, Vertex } from './parse-polygon'

/**
 * Pointer → vertex. Pure, because "does a 40 px drag on a 400 px target move the vertex 10 %" is a
 * question with one right answer and no DOM in it.
 */
export interface Point {
  readonly x: number
  readonly y: number
}

const clamp = (value: number, max: number): number => Math.min(max, Math.max(0, value))

export function pointerToVertex(pointer: Point, box: TargetSize, unit: ShapeUnit): Vertex {
  if (unit === 'px') {
    return { x: clamp(pointer.x, box.width), y: clamp(pointer.y, box.height) }
  }

  return {
    x: box.width === 0 ? 0 : clamp((pointer.x / box.width) * 100, 100),
    y: box.height === 0 ? 0 : clamp((pointer.y / box.height) * 100, 100),
  }
}

/** A keyboard nudge is in the shape's own unit, so the step means the same thing as the label. */
export function nudgeVertex(
  vertex: Vertex,
  dx: number,
  dy: number,
  box: TargetSize,
  unit: ShapeUnit,
): Vertex {
  const max = unit === 'px' ? box : { width: 100, height: 100 }

  return { x: clamp(vertex.x + dx, max.width), y: clamp(vertex.y + dy, max.height) }
}
