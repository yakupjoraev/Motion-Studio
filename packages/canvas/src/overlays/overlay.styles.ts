import type { CSSProperties } from 'react'

import { VIEWPORT_VARS } from '../viewport/use-viewport'

/** The node's box in canvas units, written on the overlay element itself — ADR-091. */
export const OVERLAY_VARS = {
  x: '--ms-ol-x',
  y: '--ms-ol-y',
  width: '--ms-ol-w',
  height: '--ms-ol-h',
} as const

export const SPACING_VARS = {
  padding: {
    top: '--ms-ol-pt',
    right: '--ms-ol-pr',
    bottom: '--ms-ol-pb',
    left: '--ms-ol-pl',
  },
  margin: {
    top: '--ms-ol-mt',
    right: '--ms-ol-mr',
    bottom: '--ms-ol-mb',
    left: '--ms-ol-ml',
  },
} as const

const zoom = `var(${VIEWPORT_VARS.zoom}, 1)`

/** `canvasToScreen` as CSS: the browser recomputes it when the viewport variables change. */
const place = (axis: 'x' | 'y', value: string): string =>
  `calc((var(${axis === 'x' ? VIEWPORT_VARS.x : VIEWPORT_VARS.y}, 0px) + ${value}) * ${zoom})`

const scale = (value: string): string => `calc(${value} * ${zoom})`

/** Shared by every overlay that tracks a box: one declaration, four variables, zero writes per frame. */
export const OVERLAY_BOX_STYLE: CSSProperties = {
  left: place('x', `var(${OVERLAY_VARS.x}, 0px)`),
  top: place('y', `var(${OVERLAY_VARS.y}, 0px)`),
  width: scale(`var(${OVERLAY_VARS.width}, 0px)`),
  height: scale(`var(${OVERLAY_VARS.height}, 0px)`),
}

const BOX = 'pointer-events-none absolute hidden data-[active]:block'

/**
 * A ring — a spread `box-shadow` — rather than `outline` or `border`: it is painted outside the
 * border box, which is what UI_GUIDELINES.md § Canvas presentation means by "outside the node's
 * box"; it takes no layout; and unlike an outline it is not rounded to whole pixels (ADR-101).
 * Nothing here wraps the node — see the note in `selection-outline.tsx`.
 */
export const SELECTION_OUTLINE_CLASS = `${BOX} ring-[1.5px] ring-canvas-selection data-[member=true]:ring-1`

export const SELECTION_CHIP_CLASS = [
  'pointer-events-none absolute left-0 bottom-full max-w-[160px] truncate rounded-t-xs bg-canvas-selection',
  'px-1 py-px text-2xs leading-[1.4] text-canvas-bg',
  // ADR-091: the flip is the one thing about a chip that CSS cannot decide, so the loop sets it.
  'data-[flipped=true]:bottom-auto data-[flipped=true]:top-full data-[flipped=true]:rounded-t-none data-[flipped=true]:rounded-b-xs',
].join(' ')

export const MULTI_SELECTION_CLASS = `${BOX} border border-canvas-selection border-dashed`

export const HOVER_OUTLINE_CLASS = `${BOX} ring-1 ring-canvas-hover`

/** The group is the node's box; the handles sit on its corners and edge midpoints. */
export const HANDLE_GROUP_CLASS = `${BOX} data-[zoomed-out=true]:hidden`

export const HANDLE_CLASS = [
  'pointer-events-auto absolute size-2 border border-accent bg-surface-3 outline-none',
  'focus-visible:shadow-focus',
].join(' ')

export const SPACING_BOX_CLASS = `${BOX} overflow-visible`

export const SPACING_BAND_CLASS = [
  'absolute flex items-center justify-center overflow-hidden text-[10px] leading-none tabular-nums',
  'text-foreground data-[zero=true]:hidden',
  'data-[kind=padding]:bg-accent/12 data-[kind=margin]:bg-warning/12',
].join(' ')

export const BREAKPOINT_FRAME_CLASS = `${BOX} ring-1 ring-border`

export const BREAKPOINT_LABEL_CLASS =
  'absolute bottom-full left-0 pb-1 text-2xs text-foreground-muted tabular-nums'

export type SpacingKind = 'padding' | 'margin'
export type SpacingSide = 'top' | 'right' | 'bottom' | 'left'

const along = (side: SpacingSide, value: string): CSSProperties =>
  side === 'top' || side === 'bottom'
    ? { left: 0, width: '100%', height: scale(value) }
    : { top: 0, height: '100%', width: scale(value) }

/** Padding grows inwards from its side; margin grows outwards from the same one. */
const anchor = (kind: SpacingKind, side: SpacingSide): CSSProperties => {
  const outside = kind === 'margin'
  const at = outside ? '100%' : 0

  switch (side) {
    case 'top':
      return outside ? { bottom: at } : { top: at }
    case 'bottom':
      return outside ? { top: at } : { bottom: at }
    case 'left':
      return outside ? { right: at } : { left: at }
    default:
      return outside ? { left: at } : { right: at }
  }
}

export function spacingBandStyle(kind: SpacingKind, side: SpacingSide): CSSProperties {
  return { ...along(side, `var(${SPACING_VARS[kind][side]}, 0px)`), ...anchor(kind, side) }
}
