import { describe, expect, it } from 'vitest'

import { FIT_PADDING, MAX_FIT_DOCUMENT_ZOOM, MAX_FIT_SELECTION_ZOOM, MIN_ZOOM } from './constants'
import { canvasRectToScreen } from './convert'
import type { ViewportRect } from './coords.types'
import { fitToRect, fitToSelection } from './fit'
import { canvasRect } from './points'

const VIEWPORT: ViewportRect = { left: 40, top: 24, width: 1200, height: 800 }

const middleOf = (rect: ViewportRect): { x: number; y: number } => ({
  x: rect.left + rect.width / 2,
  y: rect.top + rect.height / 2,
})

describe('fitToRect', () => {
  it('centres the rect in the viewport', () => {
    const rect = canvasRect({ x: 300, y: 120, width: 400, height: 200 })
    const transform = fitToRect(rect, VIEWPORT)
    const onScreen = canvasRectToScreen(rect, transform, VIEWPORT)
    const centre = middleOf(VIEWPORT)

    expect(onScreen.x + onScreen.width / 2).toBeCloseTo(centre.x, 6)
    expect(onScreen.y + onScreen.height / 2).toBeCloseTo(centre.y, 6)
  })

  it('leaves the padding around a rect that fills the rest', () => {
    const rect = canvasRect({
      x: 0,
      y: 0,
      width: VIEWPORT.width - FIT_PADDING * 2,
      height: VIEWPORT.height - FIT_PADDING * 2,
    })
    const transform = fitToRect(rect, VIEWPORT)
    const onScreen = canvasRectToScreen(rect, transform, VIEWPORT)

    expect(transform.zoom).toBe(1)
    expect(onScreen.x - VIEWPORT.left).toBeCloseTo(FIT_PADDING, 6)
    expect(VIEWPORT.left + VIEWPORT.width - (onScreen.x + onScreen.width)).toBeCloseTo(
      FIT_PADDING,
      6,
    )
  })

  it('fits by the tighter axis', () => {
    // Tall and narrow: the height decides, and the padded height is 672 canvas units.
    const transform = fitToRect(canvasRect({ x: 0, y: 0, width: 100, height: 1344 }), VIEWPORT)

    expect(transform.zoom).toBeCloseTo(0.5, 6)
  })

  it('never magnifies the document past 1:1', () => {
    const transform = fitToRect(canvasRect({ x: 0, y: 0, width: 100, height: 80 }), VIEWPORT)

    expect(transform.zoom).toBe(MAX_FIT_DOCUMENT_ZOOM)
  })

  it('stops at 200 % when fitting a selection, and still centres it', () => {
    const rect = canvasRect({ x: -50, y: 400, width: 20, height: 20 })
    const transform = fitToSelection(rect, VIEWPORT)
    const onScreen = canvasRectToScreen(rect, transform, VIEWPORT)
    const centre = middleOf(VIEWPORT)

    expect(transform.zoom).toBe(MAX_FIT_SELECTION_ZOOM)
    expect(onScreen.x + onScreen.width / 2).toBeCloseTo(centre.x, 6)
    expect(onScreen.y + onScreen.height / 2).toBeCloseTo(centre.y, 6)
  })

  it('floors at the minimum zoom for a rect far larger than the viewport', () => {
    const transform = fitToRect(canvasRect({ x: 0, y: 0, width: 400_000, height: 10 }), VIEWPORT)

    expect(transform.zoom).toBe(MIN_ZOOM)
  })

  it('falls back to the cap for a rect with no size', () => {
    const transform = fitToSelection(canvasRect({ x: 10, y: 10, width: 0, height: 0 }), VIEWPORT)

    expect(transform.zoom).toBe(MAX_FIT_SELECTION_ZOOM)
    expect(transform.pan.x).toBeCloseTo(VIEWPORT.width / (2 * MAX_FIT_SELECTION_ZOOM) - 10, 6)
  })

  it('floors at the minimum zoom when the viewport cannot hold the padding', () => {
    const cramped: ViewportRect = { left: 0, top: 0, width: 80, height: 60 }
    const transform = fitToRect(canvasRect({ x: 0, y: 0, width: 200, height: 200 }), cramped)

    expect(transform.zoom).toBe(MIN_ZOOM)
  })
})
