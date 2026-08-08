/** CANVAS.md § Zoom. The viewport transform lives inside these bounds and nothing widens them. */
export const MIN_ZOOM = 0.1
export const MAX_ZOOM = 4

/**
 * Zoom is rounded to this before it is stored, so the percentage in the toolbar reads `100 %` rather
 * than flickering between 99.99998 and 100.00001 as float error accumulates through a gesture.
 */
export const ZOOM_QUANTUM = 0.0001

/** Screen-space padding around a fitted rect — prompt 17 § fitToRect. */
export const FIT_PADDING = 64

/** Fitting a tiny node must not slam the canvas to 400 %. */
export const MAX_FIT_SELECTION_ZOOM = 2

/** Fitting the whole document stops at 1:1: a document smaller than the viewport is not magnified. */
export const MAX_FIT_DOCUMENT_ZOOM = 1
