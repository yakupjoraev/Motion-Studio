import type { CSSProperties } from 'react'

/** Screen pixels, written on the element itself: a pointer move is four variable writes and no render. */
export const INDICATOR_VARS = {
  x: '--ms-drop-x',
  y: '--ms-drop-y',
  width: '--ms-drop-w',
  height: '--ms-drop-h',
} as const

/**
 * `position: fixed` because the rect cache measures in viewport coordinates: the indicator sits over
 * the canvas without living inside its transform, so pan and zoom cannot drag it out of alignment.
 */
export const INDICATOR_BOX_STYLE: CSSProperties = {
  position: 'fixed',
  left: `var(${INDICATOR_VARS.x}, 0px)`,
  top: `var(${INDICATOR_VARS.y}, 0px)`,
  width: `var(${INDICATOR_VARS.width}, 0px)`,
  height: `var(${INDICATOR_VARS.height}, 0px)`,
}

const BASE = 'pointer-events-none z-[200]'

export const LINE_CLASS = `${BASE} rounded-full bg-accent`

export const FILL_CLASS = `${BASE} rounded-sm bg-accent/10 ring-2 ring-accent ring-inset`

export const CELL_CLASS = `${BASE} rounded-xs bg-accent/15 ring-2 ring-accent ring-dashed`

export const REJECT_CLASS = `${BASE} rounded-sm bg-danger/10 ring-2 ring-danger`

export const REJECT_LABEL_CLASS =
  'absolute top-full left-0 mt-1 max-w-[220px] truncate rounded-xs bg-danger px-1.5 py-0.5 text-2xs text-foreground-onAccent'
