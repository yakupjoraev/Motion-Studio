import type { Point } from '@motion-studio/utils'

export interface EdgeBox {
  readonly left: number
  readonly top: number
  readonly right: number
  readonly bottom: number
}

export interface EdgeSpeedOptions {
  /** How close to an edge the pointer has to be before anything moves. */
  readonly threshold: number
  /** The speed at the very edge, in pixels per frame. */
  readonly maxSpeed: number
}

/**
 * DRAG_AND_DROP.md § Auto-behaviours. One ramp for both the canvas and the tree: nothing until the
 * pointer is inside the threshold, then linearly up to `maxSpeed` at the edge itself. Linear rather
 * than eased, because the user is aiming — an accelerating pan overshoots the target they can see.
 */
export function edgeSpeed(point: Point, box: EdgeBox, options: EdgeSpeedOptions): Point {
  return {
    x: axisSpeed(point.x, box.left, box.right, options),
    y: axisSpeed(point.y, box.top, box.bottom, options),
  }
}

function axisSpeed(at: number, near: number, far: number, options: EdgeSpeedOptions): number {
  const { threshold, maxSpeed } = options
  const intoNear = at - near
  const intoFar = far - at

  if (intoNear < threshold) {
    return -ramp(intoNear, threshold, maxSpeed)
  }

  if (intoFar < threshold) {
    return ramp(intoFar, threshold, maxSpeed)
  }

  return 0
}

/** Outside the box counts as the edge: a pointer dragged past it should not stop the scroll. */
const ramp = (distance: number, threshold: number, maxSpeed: number): number =>
  maxSpeed * Math.min(1, Math.max(0, (threshold - distance) / threshold))
