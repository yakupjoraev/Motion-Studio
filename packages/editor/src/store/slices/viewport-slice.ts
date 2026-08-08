import { type Point, clamp, round } from '@motion-studio/utils'

import type { ViewportSlice, ViewportState } from '../store.types'

import type { SliceCreator } from './slice.types'

/** CANVAS.md § Viewport: zoom 0.1–4, quantised to 0.0001 so the percentage has no float noise. */
const ZOOM_MIN = 0.1
const ZOOM_MAX = 4
const ZOOM_PRECISION = 4

/**
 * PRODUCT.md § 3 lists the grid, the alignment guides and the rulers as things the canvas has, not
 * as things a user switches on: 8 px grid, 4 px snap threshold, both axes ruled.
 */
export const INITIAL_VIEWPORT: ViewportState = {
  zoom: 1,
  pan: { x: 0, y: 0 },
  breakpoint: 'base',
  grid: { enabled: true, size: 8 },
  guides: { enabled: true, snapThreshold: 4 },
  rulers: true,
  motionPaused: false,
  previewReducedMotion: false,
}

const quantise = (zoom: number): number => round(clamp(zoom, ZOOM_MIN, ZOOM_MAX), ZOOM_PRECISION)

/**
 * **There is no per-frame setter here, and adding one is the mistake this comment exists to prevent.**
 *
 * During a pan or a pinch the canvas mutates a ref and writes `--ms-viewport-x/y/zoom`; React renders
 * nothing until the gesture ends, and then exactly once — PERFORMANCE.md § The core rule. A
 * `setPanLive` added "for convenience" would put a store write, a subscription notification and a
 * reconciliation on every pointer move, which is the difference between 60 fps and a slideshow with
 * 200 nodes on the canvas.
 *
 * Everything below is a **committed** setter: called on `pointerup`, on gesture end, or from a menu.
 */
export const createViewportSlice: () => SliceCreator<ViewportSlice> = () => (set, get) => ({
  viewport: INITIAL_VIEWPORT,

  /**
   * `origin` is the canvas point to hold still — the cursor under a `Mod+scroll`. Pan is in canvas
   * units, so the anchor correction needs no element rect: the screen position of `origin` is
   * `(origin + pan) * zoom`, and holding it fixed across a zoom change gives the pan below.
   */
  setZoom(zoom, origin) {
    const current = get().viewport
    const next = quantise(zoom)

    if (next === current.zoom) {
      return
    }

    const pan: Point =
      origin === undefined
        ? current.pan
        : {
            x: ((origin.x + current.pan.x) * current.zoom) / next - origin.x,
            y: ((origin.y + current.pan.y) * current.zoom) / next - origin.y,
          }

    set({ viewport: { ...current, zoom: next, pan } }, false, 'setZoom')
  },

  setPan(pan) {
    set({ viewport: { ...get().viewport, pan } }, false, 'setPan')
  },

  setBreakpoint(id) {
    set({ viewport: { ...get().viewport, breakpoint: id } }, false, 'setBreakpoint')
  },

  toggleGrid() {
    const current = get().viewport

    set(
      { viewport: { ...current, grid: { ...current.grid, enabled: !current.grid.enabled } } },
      false,
      'toggleGrid',
    )
  },

  toggleSnapping() {
    const current = get().viewport

    set(
      { viewport: { ...current, guides: { ...current.guides, enabled: !current.guides.enabled } } },
      false,
      'toggleSnapping',
    )
  },

  toggleRulers() {
    const current = get().viewport

    set({ viewport: { ...current, rulers: !current.rulers } }, false, 'toggleRulers')
  },

  toggleMotionPaused() {
    const current = get().viewport

    set(
      { viewport: { ...current, motionPaused: !current.motionPaused } },
      false,
      'toggleMotionPaused',
    )
  },

  setPreviewReducedMotion(preview) {
    set(
      { viewport: { ...get().viewport, previewReducedMotion: preview } },
      false,
      'setPreviewReducedMotion',
    )
  },
})
