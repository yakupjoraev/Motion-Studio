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

/**
 * ADR-164: the width transition is a CSS declaration on the element that owns the width, so
 * switching breakpoints costs the canvas one render rather than one per frame. The token carries
 * `--ms-reduced-motion`, so the transition is 0 s under a reduced-motion preference and under the
 * studio's own reduced preview without a branch here — ADR-021.
 */
export const ARTBOARD_CLASS =
  'relative min-h-[600px] bg-surface-0 [transition:width_var(--ms-duration-quick)_var(--ms-ease-standard)]'

/**
 * Two radial gradients on one element: the dots and every tenth one stronger. Sized in canvas units,
 * so the grid scales with the scene and costs no elements and no renders — CANVAS.md § Grid.
 */
export const GRID_CLASS = 'pointer-events-none absolute inset-0'

/**
 * One promoted layer for every overlay, outside the scene transform so line weights stay constant at
 * any zoom — CANVAS.md § DOM structure, and the "one promoted element, not one per overlay" rule of
 * PERFORMANCE.md § Layer count.
 */
export const OVERLAYS_CLASS =
  'pointer-events-none absolute inset-0 [transform:translateZ(0)] [contain:layout_paint]'

/**
 * Geometry comes from four CSS variables the marquee hook writes inside a `rAF`; `data-active` is
 * what turns the band on, so an idle canvas holds an element with no size rather than none at all.
 */
export const MARQUEE_CLASS =
  'absolute hidden data-[active]:block border border-canvas-selection bg-canvas-selection/10 left-[var(--ms-marquee-x,0px)] top-[var(--ms-marquee-y,0px)] h-[var(--ms-marquee-h,0px)] w-[var(--ms-marquee-w,0px)]'

/**
 * `contain: layout paint` bounds invalidation to the subtree, per PERFORMANCE.md § Canvas specifics:
 * editing one node must not make the browser re-lay-out the page around it.
 *
 * The two `data-resizing` rules are the transient half of a resize: the gesture writes the draft size
 * into the variables at frame rate and the store hears one `setProp` on release.
 */
export const NODE_WRAPPER_CLASS =
  '[contain:layout_paint] data-[resizing]:w-[var(--ms-node-w)] data-[resizing]:h-[var(--ms-node-h)]'
