import type {
  CanvasPoint,
  CanvasRect,
  ScreenPoint,
  ScreenRect,
  ViewportRect,
  ViewportTransform,
} from './coords.types'
import { canvasPoint, canvasRect, screenPoint, screenRect } from './points'

/**
 * CANVAS.md § Coordinate spaces, transcribed. The scene is translated by `pan` and then scaled by
 * `zoom`, so going the other way divides first and subtracts second — reversing those two is the
 * sign error the round-trip property test exists to catch.
 */
export function screenToCanvas(
  point: ScreenPoint,
  transform: ViewportTransform,
  rect: ViewportRect,
): CanvasPoint {
  return canvasPoint(
    (point.x - rect.left) / transform.zoom - transform.pan.x,
    (point.y - rect.top) / transform.zoom - transform.pan.y,
  )
}

export function canvasToScreen(
  point: CanvasPoint,
  transform: ViewportTransform,
  rect: ViewportRect,
): ScreenPoint {
  return screenPoint(
    (point.x + transform.pan.x) * transform.zoom + rect.left,
    (point.y + transform.pan.y) * transform.zoom + rect.top,
  )
}

/**
 * A rect converts as its origin plus its size over the zoom. Converting both corners instead would
 * give the same numbers with one more subtraction and one more chance to write `top` where `left`
 * belongs.
 */
export function screenRectToCanvas(
  rect: ScreenRect,
  transform: ViewportTransform,
  viewport: ViewportRect,
): CanvasRect {
  const origin = screenToCanvas(screenPoint(rect.x, rect.y), transform, viewport)

  return canvasRect({
    x: origin.x,
    y: origin.y,
    width: rect.width / transform.zoom,
    height: rect.height / transform.zoom,
  })
}

export function canvasRectToScreen(
  rect: CanvasRect,
  transform: ViewportTransform,
  viewport: ViewportRect,
): ScreenRect {
  const origin = canvasToScreen(canvasPoint(rect.x, rect.y), transform, viewport)

  return screenRect({
    x: origin.x,
    y: origin.y,
    width: rect.width * transform.zoom,
    height: rect.height * transform.zoom,
  })
}
