import fc from 'fast-check'
import { describe, expect, expectTypeOf, it } from 'vitest'

import { MAX_ZOOM, MIN_ZOOM } from './constants'
import { canvasRectToScreen, canvasToScreen, screenRectToCanvas, screenToCanvas } from './convert'
import type {
  CanvasPoint,
  CanvasRect,
  NodePoint,
  ScreenPoint,
  ScreenRect,
  ViewportRect,
  ViewportTransform,
} from './coords.types'
import { canvasPoint, canvasRect, nodePoint, screenPoint, screenRect } from './points'

const VIEWPORT: ViewportRect = { left: 40, top: 24, width: 1200, height: 800 }

const arbCoordinate = (): fc.Arbitrary<number> =>
  fc.double({ min: -5000, max: 5000, noNaN: true, noDefaultInfinity: true })

const arbTransform = (): fc.Arbitrary<ViewportTransform> =>
  fc.record({
    // The extremes are included deliberately: a clamp written into a conversion shows up here.
    zoom: fc.double({ min: MIN_ZOOM, max: MAX_ZOOM, noNaN: true, noDefaultInfinity: true }),
    pan: fc.record({ x: arbCoordinate(), y: arbCoordinate() }),
  })

const arbViewport = (): fc.Arbitrary<ViewportRect> =>
  fc.record({
    left: arbCoordinate(),
    top: arbCoordinate(),
    width: fc.double({ min: 1, max: 3000, noNaN: true, noDefaultInfinity: true }),
    height: fc.double({ min: 1, max: 3000, noNaN: true, noDefaultInfinity: true }),
  })

const arbScreenPoint = (): fc.Arbitrary<ScreenPoint> =>
  fc.record({ x: arbCoordinate(), y: arbCoordinate() }).map((p) => screenPoint(p.x, p.y))

const arbCanvasPoint = (): fc.Arbitrary<CanvasPoint> =>
  fc.record({ x: arbCoordinate(), y: arbCoordinate() }).map((p) => canvasPoint(p.x, p.y))

const arbSize = (): fc.Arbitrary<number> =>
  fc.double({ min: 0, max: 4000, noNaN: true, noDefaultInfinity: true })

describe('screen ↔ canvas', () => {
  it('round-trips a point in both directions', () => {
    fc.assert(
      fc.property(arbScreenPoint(), arbTransform(), arbViewport(), (point, transform, viewport) => {
        const back = canvasToScreen(screenToCanvas(point, transform, viewport), transform, viewport)

        expect(back.x).toBeCloseTo(point.x, 3)
        expect(back.y).toBeCloseTo(point.y, 3)
      }),
    )

    fc.assert(
      fc.property(arbCanvasPoint(), arbTransform(), arbViewport(), (point, transform, viewport) => {
        const back = canvasToScreen(point, transform, viewport)

        expect(screenToCanvas(back, transform, viewport).x).toBeCloseTo(point.x, 3)
        expect(screenToCanvas(back, transform, viewport).y).toBeCloseTo(point.y, 3)
      }),
    )
  })

  it('round-trips a rect in both directions', () => {
    const arbRect = fc.record({
      x: arbCoordinate(),
      y: arbCoordinate(),
      width: arbSize(),
      height: arbSize(),
    })

    fc.assert(
      fc.property(arbRect, arbTransform(), arbViewport(), (rect, transform, viewport) => {
        const back = canvasRectToScreen(
          screenRectToCanvas(screenRect(rect), transform, viewport),
          transform,
          viewport,
        )

        expect(back.x).toBeCloseTo(rect.x, 3)
        expect(back.y).toBeCloseTo(rect.y, 3)
        expect(back.width).toBeCloseTo(rect.width, 3)
        expect(back.height).toBeCloseTo(rect.height, 3)
      }),
    )

    fc.assert(
      fc.property(arbRect, arbTransform(), arbViewport(), (rect, transform, viewport) => {
        const back = screenRectToCanvas(
          canvasRectToScreen(canvasRect(rect), transform, viewport),
          transform,
          viewport,
        )

        expect(back.x).toBeCloseTo(rect.x, 3)
        expect(back.width).toBeCloseTo(rect.width, 3)
      }),
    )
  })

  it('places the viewport origin at the pan, scaled', () => {
    const transform: ViewportTransform = { zoom: 2, pan: { x: 10, y: -5 } }
    const origin = screenToCanvas(screenPoint(VIEWPORT.left, VIEWPORT.top), transform, VIEWPORT)

    expect(origin).toEqual({ x: -10, y: 5 })
    expect(canvasToScreen(canvasPoint(0, 0), transform, VIEWPORT)).toEqual({ x: 60, y: 14 })
  })

  it('scales a rect by the zoom and leaves the size zoom-independent in canvas units', () => {
    const transform: ViewportTransform = { zoom: 0.5, pan: { x: 0, y: 0 } }
    const inCanvas = screenRectToCanvas(
      screenRect({ x: 40, y: 24, width: 100, height: 50 }),
      transform,
      VIEWPORT,
    )

    expect(inCanvas).toEqual({ x: 0, y: 0, width: 200, height: 100 })
  })
})

describe('coordinate spaces', () => {
  it('keeps the three point spaces mutually non-assignable', () => {
    expectTypeOf<ScreenPoint>().not.toMatchTypeOf<CanvasPoint>()
    expectTypeOf<CanvasPoint>().not.toMatchTypeOf<ScreenPoint>()
    expectTypeOf<ScreenPoint>().not.toMatchTypeOf<NodePoint>()
    expectTypeOf<NodePoint>().not.toMatchTypeOf<ScreenPoint>()
    expectTypeOf<CanvasPoint>().not.toMatchTypeOf<NodePoint>()
    expectTypeOf<NodePoint>().not.toMatchTypeOf<CanvasPoint>()
    expectTypeOf<ScreenRect>().not.toMatchTypeOf<CanvasRect>()
    expectTypeOf<CanvasRect>().not.toMatchTypeOf<ScreenRect>()
  })

  it('refuses a plain object as a point', () => {
    expectTypeOf<{ x: number; y: number }>().not.toMatchTypeOf<ScreenPoint>()
    expectTypeOf(screenPoint(1, 2)).toMatchTypeOf<ScreenPoint>()
    expectTypeOf(nodePoint(1, 2)).toMatchTypeOf<NodePoint>()

    expect(nodePoint(1, 2)).toEqual({ x: 1, y: 2 })
  })
})
