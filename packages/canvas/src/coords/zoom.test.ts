import { describe, expect, it } from 'vitest'

import { MAX_ZOOM, MIN_ZOOM } from './constants'
import { canvasToScreen, screenToCanvas } from './convert'
import type { ViewportRect, ViewportTransform } from './coords.types'
import { screenPoint } from './points'
import { ZOOM_STEPS, clampZoom, quantizeZoom, zoomAt } from './zoom'

const VIEWPORT: ViewportRect = { left: 40, top: 24, width: 1200, height: 800 }
const START: ViewportTransform = { zoom: 1, pan: { x: 120, y: -60 } }

describe('clampZoom', () => {
  it('holds both bounds', () => {
    expect(clampZoom(0.01)).toBe(MIN_ZOOM)
    expect(clampZoom(9)).toBe(MAX_ZOOM)
    expect(clampZoom(1.5)).toBe(1.5)
  })

  it('quantises away the float noise the percentage would show', () => {
    expect(clampZoom(0.9999998)).toBe(1)
    expect(quantizeZoom(1.000000001)).toBe(1)
    expect(quantizeZoom(1.00005)).toBeCloseTo(1.0001, 10)
    expect(Math.round(clampZoom(1.000000001) * 100)).toBe(100)
  })

  it('lists the dropdown steps inside the bounds', () => {
    expect(ZOOM_STEPS).toEqual([0.25, 0.5, 0.75, 1, 1.5, 2, 4])

    for (const step of ZOOM_STEPS) {
      expect(clampZoom(step)).toBe(step)
    }
  })
})

describe('zoomAt', () => {
  it('leaves the anchor exactly where it was on screen', () => {
    const anchor = screenPoint(500, 300)
    const before = screenToCanvas(anchor, START, VIEWPORT)
    const next = zoomAt(START, 1.6, anchor, VIEWPORT)
    const after = canvasToScreen(before, next, VIEWPORT)

    expect(next.zoom).toBeCloseTo(1.6, 10)
    expect(after.x).toBeCloseTo(anchor.x, 9)
    expect(after.y).toBeCloseTo(anchor.y, 9)
  })

  it('returns to the starting pan after 100 alternating operations', () => {
    const anchor = screenPoint(742, 511)
    let transform = START

    for (let step = 0; step < 100; step += 1) {
      transform = zoomAt(transform, step % 2 === 0 ? 1.2 : 1 / 1.2, anchor, VIEWPORT)
    }

    expect(transform.zoom).toBeCloseTo(START.zoom, 6)
    expect(Math.abs(transform.pan.x - START.pan.x)).toBeLessThan(0.01)
    expect(Math.abs(transform.pan.y - START.pan.y)).toBeLessThan(0.01)
  })

  it('holds the anchor at the bounds, where the zoom stops changing', () => {
    const anchor = screenPoint(200, 700)
    const atMax = zoomAt({ zoom: MAX_ZOOM, pan: { x: 5, y: 5 } }, 2, anchor, VIEWPORT)
    const atMin = zoomAt({ zoom: MIN_ZOOM, pan: { x: 5, y: 5 } }, 0.5, anchor, VIEWPORT)

    expect(atMax.zoom).toBe(MAX_ZOOM)
    expect(atMin.zoom).toBe(MIN_ZOOM)
    expect(atMax.pan).toEqual({ x: 5, y: 5 })
    expect(atMin.pan.x).toBeCloseTo(5, 9)
  })

  it('quantises the zoom it produces', () => {
    const next = zoomAt(START, 1.0000001, screenPoint(100, 100), VIEWPORT)

    // Idempotence rather than a modulo: `round(z / q) * q` is a float multiplication, so an exact
    // multiple of 0.0001 is not representable — what matters is that quantising again moves nothing.
    expect(quantizeZoom(next.zoom)).toBe(next.zoom)
    expect(next.zoom).toBe(1)
  })
})
