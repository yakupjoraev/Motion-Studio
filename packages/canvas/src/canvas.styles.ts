import { VIEWPORT_VARS } from './viewport/use-viewport'

/**
 * The scene is one composited element: `scale()` before `translate()`, from the top-left origin, so
 * the CSS matches `(canvas + pan) * zoom` exactly — CANVAS.md § DOM structure. `will-change` is not
 * set here; the gesture hooks add it for the length of a gesture, per PERFORMANCE.md § Layer count.
 */
export const SCENE_TRANSFORM = `scale(var(${VIEWPORT_VARS.zoom}, 1)) translate(var(${VIEWPORT_VARS.x}, 0px), var(${VIEWPORT_VARS.y}, 0px))`

export const CANVAS_ROOT_CLASS =
  'relative h-full w-full overflow-hidden bg-canvas-bg outline-none [contain:layout_paint] data-[pan-mode=true]:cursor-grab data-[panning=true]:cursor-grabbing'

export const SCENE_CLASS = 'absolute top-0 left-0 origin-top-left'

export const ARTBOARD_CLASS = 'relative min-h-[600px] bg-surface-0'

/**
 * Two radial gradients on one element: the dots and every tenth one stronger. Sized in canvas units,
 * so the grid scales with the scene and costs no elements and no renders — CANVAS.md § Grid.
 */
export const GRID_CLASS = 'pointer-events-none absolute inset-0'
