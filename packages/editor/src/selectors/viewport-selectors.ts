import type { BreakpointId } from '@motion-studio/schema'
import type { Point } from '@motion-studio/utils'

import type { EditorState, ViewportState } from '../store/store.types'

// All reference-stable: each returns an object the state already holds, replaced only by a committed
// setter. None of them needs `useShallow`, and none allocates — PERFORMANCE.md § Selector discipline.
export const selectViewport = (state: EditorState): ViewportState => state.viewport
export const selectZoom = (state: EditorState): number => state.viewport.zoom
export const selectPan = (state: EditorState): Point => state.viewport.pan
export const selectBreakpoint = (state: EditorState): BreakpointId => state.viewport.breakpoint
export const selectGrid = (state: EditorState): ViewportState['grid'] => state.viewport.grid
export const selectGuides = (state: EditorState): ViewportState['guides'] => state.viewport.guides
export const selectRulers = (state: EditorState): boolean => state.viewport.rulers
export const selectMotionPaused = (state: EditorState): boolean => state.viewport.motionPaused
export const selectPreviewReducedMotion = (state: EditorState): boolean =>
  state.viewport.previewReducedMotion

/**
 * The pair the canvas subscribes to together. It returns a **new object**, so the call site needs
 * `useShallow` — STATE_MANAGEMENT.md § Component subscription rules. Memoising it here would be the
 * wrong trade: it is two numbers and a point, and the canvas reads them once per committed gesture.
 */
export const selectTransform = (state: EditorState): { zoom: number; pan: Point } => ({
  zoom: state.viewport.zoom,
  pan: state.viewport.pan,
})
