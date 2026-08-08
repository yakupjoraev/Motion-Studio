import { clamp } from '@motion-studio/utils'

/**
 * The panel layout's values and pure functions, split out of `use-panel-layout.ts` because the
 * studio's **server** layout renders the boot script below. Next refuses to import a module that
 * calls a React hook into a Server Component, and the split is the only way to share one definition
 * of the bounds between the two.
 */

/** Which panel a width or a collapse belongs to. */
export type PanelSide = 'left' | 'right'

export interface PanelLayout {
  readonly left: number
  readonly right: number
  readonly leftCollapsed: boolean
  readonly rightCollapsed: boolean
}

/** UI_GUIDELINES.md § Layout: left 240–360 default 280, right 280–420 default 320. */
export const PANEL_BOUNDS = {
  left: { min: 240, max: 360, initial: 280 },
  right: { min: 280, max: 420, initial: 320 },
} as const satisfies Record<PanelSide, { min: number; max: number; initial: number }>

/**
 * `track` is what the grid reads, and it is zero while the panel is collapsed. `size` is the width the
 * user set, which the overlay layout still needs after the track beside it has collapsed to nothing.
 */
export const PANEL_VARIABLE = {
  left: { track: '--ms-panel-left', size: '--ms-panel-left-size' },
  right: { track: '--ms-panel-right', size: '--ms-panel-right-size' },
} as const satisfies Record<PanelSide, { track: string; size: string }>

export const PANEL_LAYOUT_KEY = 'motion-studio.panel-layout'

export const DEFAULT_PANEL_LAYOUT: PanelLayout = {
  left: PANEL_BOUNDS.left.initial,
  right: PANEL_BOUNDS.right.initial,
  leftCollapsed: false,
  rightCollapsed: false,
}

const readWidth = (value: unknown, side: PanelSide): number => {
  const bounds = PANEL_BOUNDS[side]

  return typeof value === 'number' && Number.isFinite(value)
    ? clamp(value, bounds.min, bounds.max)
    : bounds.initial
}

/**
 * A stored layout is untrusted input: it survives a schema change, a half-written value, and a user
 * with devtools. Anything unreadable resolves to the default rather than throwing, because the
 * alternative is a studio that will not open until localStorage is cleared by hand.
 */
export function parsePanelLayout(raw: string | null): PanelLayout {
  if (raw === null) {
    return DEFAULT_PANEL_LAYOUT
  }

  let parsed: unknown

  try {
    parsed = JSON.parse(raw)
  } catch {
    return DEFAULT_PANEL_LAYOUT
  }

  if (typeof parsed !== 'object' || parsed === null) {
    return DEFAULT_PANEL_LAYOUT
  }

  const record = parsed as Record<string, unknown>

  return {
    left: readWidth(record['left'], 'left'),
    right: readWidth(record['right'], 'right'),
    leftCollapsed: record['leftCollapsed'] === true,
    rightCollapsed: record['rightCollapsed'] === true,
  }
}

export const isCollapsed = (layout: PanelLayout, side: PanelSide): boolean =>
  side === 'left' ? layout.leftCollapsed : layout.rightCollapsed

/** A collapsed panel is a zero-width track, so the grid definition never changes — ADR-049. */
export const trackWidth = (layout: PanelLayout, side: PanelSide): number =>
  isCollapsed(layout, side) ? 0 : layout[side]

export const paintPanelLayout = (side: PanelSide, layout: PanelLayout): void => {
  const style = document.documentElement.style

  style.setProperty(PANEL_VARIABLE[side].track, `${trackWidth(layout, side)}px`)
  style.setProperty(PANEL_VARIABLE[side].size, `${layout[side]}px`)
}

/**
 * The transient half of the resize, called on every pointer move. It reaches past React on purpose —
 * contract § 5, and ADR-049 measured what it buys.
 */
export const paintPanelWidth = (side: PanelSide, width: number): void => {
  const style = document.documentElement.style

  style.setProperty(PANEL_VARIABLE[side].track, `${width}px`)
  style.setProperty(PANEL_VARIABLE[side].size, `${width}px`)
}

/**
 * The blocking script that restores the widths before the first paint. It is the panel counterpart of
 * `COLOR_MODE_SCRIPT`, and for the same reason: a width restored in an effect is a width the user
 * watches jump. The bounds are interpolated from `PANEL_BOUNDS` so the two copies cannot drift.
 */
export const PANEL_LAYOUT_SCRIPT = `(function(){try{
var raw=localStorage.getItem(${JSON.stringify(PANEL_LAYOUT_KEY)});
if(raw===null)return;
var v=JSON.parse(raw);
if(typeof v!=='object'||v===null)return;
var s=document.documentElement.style;
var w=function(n,min,max,fallback){
return typeof n==='number'&&isFinite(n)?Math.min(max,Math.max(min,n)):fallback};
var side=function(track,size,width,collapsed){
s.setProperty(track,(collapsed===true?0:width)+'px');s.setProperty(size,width+'px')};
side(${JSON.stringify(PANEL_VARIABLE.left.track)},${JSON.stringify(PANEL_VARIABLE.left.size)},w(v.left,${PANEL_BOUNDS.left.min},${PANEL_BOUNDS.left.max},${PANEL_BOUNDS.left.initial}),v.leftCollapsed);
side(${JSON.stringify(PANEL_VARIABLE.right.track)},${JSON.stringify(PANEL_VARIABLE.right.size)},w(v.right,${PANEL_BOUNDS.right.min},${PANEL_BOUNDS.right.max},${PANEL_BOUNDS.right.initial}),v.rightCollapsed);
}catch(e){}})()`
