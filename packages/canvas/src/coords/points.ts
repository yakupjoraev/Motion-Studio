import type { Rect } from '@motion-studio/utils'

import type { CanvasPoint, CanvasRect, NodePoint, ScreenPoint, ScreenRect } from './coords.types'

/**
 * The only way into a coordinate space. Each one is a cast at exactly one place, which is the trade
 * the brand makes: one unchecked line here in exchange for the compiler refusing every screen point
 * that is handed to a function expecting canvas units.
 */
export const screenPoint = (x: number, y: number): ScreenPoint => ({ x, y }) as ScreenPoint

export const canvasPoint = (x: number, y: number): CanvasPoint => ({ x, y }) as CanvasPoint

export const nodePoint = (x: number, y: number): NodePoint => ({ x, y }) as NodePoint

export const screenRect = (rect: Rect): ScreenRect => rect as ScreenRect

export const canvasRect = (rect: Rect): CanvasRect => rect as CanvasRect
