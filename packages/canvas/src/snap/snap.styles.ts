import { VIEWPORT_VARS } from '../viewport/use-viewport'

import type { SnapAxis } from './snap.types'

/**
 * Every overlay in this module is one absolutely-positioned element whose geometry is CSS variables
 * written inside a `rAF` — the marquee's mechanism, for the same reason: a guide that appeared by
 * rendering would appear a frame late and cost a render in the middle of a gesture.
 */

/**
 * A canvas coordinate as a screen offset inside the overlay layer, expressed in CSS so the browser
 * recomputes it when the transform variables change — ADR-086. This is `canvasToScreen` written as
 * `calc()`: pan and zoom move a ruler label and a user guide with no JavaScript at all.
 */
export const placeOnAxis = (axis: SnapAxis, value: number): string =>
  `calc((var(${axis === 'x' ? VIEWPORT_VARS.x : VIEWPORT_VARS.y}, 0px) + ${value}px) * var(${VIEWPORT_VARS.zoom}, 1))`

const DASH_X =
  '[background-image:repeating-linear-gradient(to_bottom,var(--ms-color-canvas-snap,currentColor)_0_4px,transparent_4px_8px)]'

const DASH_Y =
  '[background-image:repeating-linear-gradient(to_right,var(--ms-color-canvas-snap,currentColor)_0_4px,transparent_4px_8px)]'

export const SNAP_LINE_CLASS = [
  'absolute hidden bg-canvas-snap data-[active]:block',
  // A centre alignment reads as dashed — CANVAS.md § Guides.
  'data-[dashed=true]:bg-transparent',
  `data-[dashed=true]:data-[axis=x]:${DASH_X}`,
  `data-[dashed=true]:data-[axis=y]:${DASH_Y}`,
].join(' ')

export const GAP_BAR_CLASS = 'group absolute hidden bg-canvas-snap data-[active]:block'

/** End caps: a short stroke across the bar at each end, so a gap reads as measured, not drawn. */
const CAP =
  'absolute bg-canvas-snap group-data-[axis=x]:h-2 group-data-[axis=x]:w-px group-data-[axis=x]:-top-1 group-data-[axis=y]:w-2 group-data-[axis=y]:h-px group-data-[axis=y]:-left-1'

export const GAP_CAP_START_CLASS = `${CAP} group-data-[axis=x]:left-0 group-data-[axis=y]:top-0`

export const GAP_CAP_END_CLASS = `${CAP} group-data-[axis=x]:right-0 group-data-[axis=y]:bottom-0`

export const GAP_LABEL_CLASS = [
  'absolute rounded-xs bg-canvas-snap px-1 py-px text-[10px] leading-none text-canvas-bg tabular-nums',
  'group-data-[axis=x]:-top-4 group-data-[axis=x]:left-1/2 group-data-[axis=x]:-translate-x-1/2',
  'group-data-[axis=y]:left-2 group-data-[axis=y]:top-1/2 group-data-[axis=y]:-translate-y-1/2',
].join(' ')

/** Rulers take pointer events back: the overlay layer is inert, and a guide is dragged off these. */
export const RULER_STRIP_CLASS =
  'pointer-events-auto absolute bg-surface-1/90 text-foreground-muted [background-repeat:repeat] data-[axis=x]:top-0 data-[axis=x]:right-0 data-[axis=x]:left-0 data-[axis=x]:h-6 data-[axis=x]:cursor-row-resize data-[axis=y]:top-0 data-[axis=y]:bottom-0 data-[axis=y]:left-0 data-[axis=y]:w-6 data-[axis=y]:cursor-col-resize'

export const RULER_CORNER_CLASS =
  'absolute top-0 left-0 size-6 border-border border-r border-b bg-surface-1'

export const RULER_LABEL_CLASS =
  'pointer-events-none absolute text-[10px] leading-none tabular-nums select-none data-[axis=x]:top-1 data-[axis=x]:pl-1 data-[axis=y]:left-1 data-[axis=y]:pt-1 data-[axis=y]:[writing-mode:vertical-rl]'

export const RULER_CURSOR_CLASS =
  'pointer-events-none absolute bg-foreground data-[axis=x]:top-0 data-[axis=x]:h-6 data-[axis=x]:w-px data-[axis=y]:left-0 data-[axis=y]:h-px data-[axis=y]:w-6'

export const USER_GUIDE_CLASS =
  'pointer-events-auto absolute bg-canvas-guide data-[axis=x]:top-0 data-[axis=x]:bottom-0 data-[axis=x]:w-px data-[axis=x]:cursor-col-resize data-[axis=y]:right-0 data-[axis=y]:left-0 data-[axis=y]:h-px data-[axis=y]:cursor-row-resize'

/** The hit area a 1 px line needs to be grabbable — 8 px, centred on it, and invisible. */
export const USER_GUIDE_HANDLE_CLASS =
  'absolute data-[axis=x]:top-0 data-[axis=x]:bottom-0 data-[axis=x]:-left-1 data-[axis=x]:w-2 data-[axis=y]:right-0 data-[axis=y]:left-0 data-[axis=y]:-top-1 data-[axis=y]:h-2'

export const GUIDE_INPUT_CLASS =
  'pointer-events-auto absolute w-16 rounded-xs border border-canvas-guide bg-surface-1 px-1 py-px text-[10px] leading-none text-foreground tabular-nums outline-none'
