import { cva } from 'class-variance-authority'

import { GLYPH_CLASS, MIN_TARGET_CLASS } from '../styles/density'
import { FOCUS_RING, TRANSITION_CONTROL } from '../styles/variants'

/** Root is the 24 × 24 target, box inside it is the glyph. ADR-030. */
export const checkboxRootStyles = cva([
  'group relative inline-grid shrink-0 place-items-center rounded-xs outline-none',
  'disabled:pointer-events-none disabled:opacity-50',
  MIN_TARGET_CLASS,
])

/** "On" is `foreground`, not `accent` (ADR-032). Mixed paints the same box and differs by its mark. */
export const checkboxBoxStyles = cva([
  'grid place-items-center rounded-xs border border-border-strong bg-surface-2 text-surface-0',
  'group-hover:border-foreground-muted',
  'group-data-[state=checked]:border-foreground group-data-[state=checked]:bg-foreground',
  'group-data-[state=indeterminate]:border-foreground group-data-[state=indeterminate]:bg-foreground',
  GLYPH_CLASS.checkboxBox,
  TRANSITION_CONTROL,
  FOCUS_RING.replace('focus-visible:', 'group-focus-visible:'),
])

/** Both marks render; `data-state` on the indicator hides the wrong one. */
export const checkboxIndicatorStyles = cva(['group/mark grid place-items-center'])

export const checkboxCheckStyles = cva(['group-data-[state=indeterminate]/mark:hidden'])

export const checkboxDashStyles = cva(['group-data-[state=checked]/mark:hidden'])
