import type { Rect } from '@motion-studio/utils'

/**
 * CANVAS.md § Coordinate spaces. The brand is a `unique symbol` that is declared here and never
 * exported, so no other module can name the property: `points.ts` holds the only constructors, and
 * an object literal cannot pretend to be a coordinate in a space it was not measured in.
 */
declare const SPACE: unique symbol

export type ScreenPoint = { x: number; y: number; readonly [SPACE]: 'screen' }
export type CanvasPoint = { x: number; y: number; readonly [SPACE]: 'canvas' }
export type NodePoint = { x: number; y: number; readonly [SPACE]: 'node' }

/** The same brand over the shape `utils` already defines — ADR-011 puts the space here, not there. */
export type ScreenRect = Rect & { readonly [SPACE]: 'screen' }
export type CanvasRect = Rect & { readonly [SPACE]: 'canvas' }

export interface ViewportTransform {
  /** `MIN_ZOOM` – `MAX_ZOOM`, quantised by `clampZoom`. */
  readonly zoom: number
  /** Canvas units. The scene is translated by this before it is scaled. */
  readonly pan: { readonly x: number; readonly y: number }
}

/**
 * What the conversions read off the canvas element: `DOMRect` satisfies it, and so does a plain
 * object in a test that has no element to measure.
 */
export interface ViewportRect {
  readonly left: number
  readonly top: number
  readonly width: number
  readonly height: number
}
