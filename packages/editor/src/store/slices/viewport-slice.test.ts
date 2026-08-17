import type { Point } from '@motion-studio/utils'
import { describe, expect, it } from 'vitest'

import { createTestStore } from '../../test/create-test-store'

/** Where a canvas point lands on screen under a transform — CANVAS.md § Coordinate spaces. */
const screenOf = (point: Point, pan: Point, zoom: number): Point => ({
  x: (point.x + pan.x) * zoom,
  y: (point.y + pan.y) * zoom,
})

describe('setZoom', () => {
  it('clamps to the 0.1 – 4 range', () => {
    const store = createTestStore()

    store.getState().setZoom(12)
    expect(store.getState().viewport.zoom).toBe(4)

    store.getState().setZoom(0.01)
    expect(store.getState().viewport.zoom).toBe(0.1)
  })

  it('quantises to four decimals, so the displayed percentage has no float noise', () => {
    const store = createTestStore()

    store.getState().setZoom(1 / 3)

    expect(store.getState().viewport.zoom).toBe(0.3333)
  })

  it('does nothing when the quantised value is the one already set', () => {
    const store = createTestStore()
    const before = store.getState().viewport

    store.getState().setZoom(1.000_004)

    expect(store.getState().viewport).toBe(before)
  })

  it('holds the origin still when one is given', () => {
    const store = createTestStore()
    const origin: Point = { x: 100, y: 50 }
    const before = store.getState().viewport
    const anchoredBefore = screenOf(origin, before.pan, before.zoom)

    store.getState().setZoom(2, origin)

    const after = store.getState().viewport

    expect(after.zoom).toBe(2)
    expect(screenOf(origin, after.pan, after.zoom)).toEqual(anchoredBefore)
  })

  it('leaves the pan alone when no origin is given', () => {
    const store = createTestStore()

    store.getState().setPan({ x: 20, y: 30 })
    store.getState().setZoom(2)

    expect(store.getState().viewport.pan).toEqual({ x: 20, y: 30 })
  })
})

describe('committed setters', () => {
  it('sets the pan and the breakpoint', () => {
    const store = createTestStore()

    store.getState().setPan({ x: -40, y: 12 })
    store.getState().setBreakpoint('lg')

    expect(store.getState().viewport.pan).toEqual({ x: -40, y: 12 })
    expect(store.getState().viewport.breakpoint).toBe('lg')
  })

  it('toggles the grid, snapping, rulers and motion without disturbing their settings', () => {
    const store = createTestStore()

    store.getState().toggleGrid()
    store.getState().toggleSnapping()
    store.getState().toggleRulers()
    store.getState().toggleMotionPaused()
    store.getState().setPreviewReducedMotion(true)

    const { viewport } = store.getState()

    expect(viewport.grid).toEqual({ enabled: false, size: 8 })
    expect(viewport.guides).toEqual({ enabled: false, snapThreshold: 4 })
    expect(viewport.rulers).toBe(false)
    expect(viewport.motionPaused).toBe(true)
    expect(viewport.previewReducedMotion).toBe(true)
  })

  it('toggles multi-frame comparison, which starts off', () => {
    const store = createTestStore()

    expect(store.getState().viewport.multiFrame).toBe(false)

    store.getState().toggleMultiFrame()

    expect(store.getState().viewport.multiFrame).toBe(true)
    expect(store.getState().viewport.breakpoint).toBe('base')

    store.getState().toggleMultiFrame()

    expect(store.getState().viewport.multiFrame).toBe(false)
  })

  it('is not undoable and does not touch the document', () => {
    const store = createTestStore()

    store.getState().setZoom(2)

    expect(store.getState().version).toBe(0)
    expect(store.getState().dirty).toBe(false)
  })
})
