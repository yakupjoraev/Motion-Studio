import { describe, expect, it } from 'vitest'

import { createTestStore } from '../test/create-test-store'

import {
  selectBreakpoint,
  selectGrid,
  selectGuides,
  selectMotionPaused,
  selectPan,
  selectPreviewReducedMotion,
  selectRulers,
  selectTransform,
  selectViewport,
  selectZoom,
} from './viewport-selectors'

describe('viewport selectors', () => {
  it('read the committed values', () => {
    const store = createTestStore()

    store.getState().setZoom(2)
    store.getState().setPan({ x: 10, y: 20 })
    store.getState().setBreakpoint('md')

    const state = store.getState()

    expect(selectZoom(state)).toBe(2)
    expect(selectPan(state)).toEqual({ x: 10, y: 20 })
    expect(selectBreakpoint(state)).toBe('md')
    expect(selectGrid(state)).toEqual({ enabled: true, size: 8 })
    expect(selectGuides(state)).toEqual({ enabled: true, snapThreshold: 4 })
    expect(selectRulers(state)).toBe(true)
    expect(selectMotionPaused(state)).toBe(false)
    expect(selectPreviewReducedMotion(state)).toBe(false)
  })

  it('hand back the object the state already holds', () => {
    const state = createTestStore().getState()

    expect(selectViewport(state)).toBe(state.viewport)
    expect(selectPan(state)).toBe(state.viewport.pan)
  })

  /** The documented exception: it allocates, so its call site needs `useShallow`. */
  it('build a fresh transform each call', () => {
    const state = createTestStore().getState()

    expect(selectTransform(state)).not.toBe(selectTransform(state))
    expect(selectTransform(state)).toEqual({ zoom: 1, pan: { x: 0, y: 0 } })
  })
})
