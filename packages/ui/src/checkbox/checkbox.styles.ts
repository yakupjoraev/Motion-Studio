import { cva } from 'class-variance-authority'

import { GLYPH_CLASS, MIN_TARGET_CLASS } from '../styles/density'
import { FOCUS_RING, TRANSITION_CONTROL } from '../styles/variants'

/**
 * As with `Switch`: the root is the 24 × 24 target and the box inside it is the 16 × 16 glyph (ADR-030). The
 * grid centres the one in the other, so no offset is written down anywhere.
 */
export const checkboxRootStyles = cva([
  'group relative inline-grid shrink-0 place-items-center rounded-xs outline-none',
  'disabled:pointer-events-none disabled:opacity-50',
  MIN_TARGET_CLASS,
])

/**
 * The visible box, one panel icon cell wide. "On" is `foreground` with the mark cut out in `surface-0`
 * — ADR-032, the same inversion the switch and the slider use, and for the same reason: an inspector shows
 * many of these at once and § Character spends the accent on the four things that appear once.
 *
 * The indeterminate state paints exactly like the checked one. The two differ by their mark, which is what
 * `ACCESSIBILITY.md` § Non-negotiables 4 asks for — colour is never the only carrier.
 */
export const checkboxBoxStyles = cva([
  'grid place-items-center rounded-xs border border-border-strong bg-surface-2 text-surface-0',
  'group-hover:border-foreground-muted',
  'group-data-[state=checked]:border-foreground group-data-[state=checked]:bg-foreground',
  'group-data-[state=indeterminate]:border-foreground group-data-[state=indeterminate]:bg-foreground',
  GLYPH_CLASS.checkboxBox,
  TRANSITION_CONTROL,
  FOCUS_RING.replace('focus-visible:', 'group-focus-visible:'),
])

/**
 * Radix mounts the indicator only when the box is checked or indeterminate, and tags it with which. Both
 * marks are rendered and the wrong one is hidden by that tag: the component cannot read the state itself
 * when it is uncontrolled, and a mark that only appears for controlled callers is worse than none.
 */
export const checkboxIndicatorStyles = cva(['group/mark grid place-items-center'])

export const checkboxCheckStyles = cva(['group-data-[state=indeterminate]/mark:hidden'])

export const checkboxDashStyles = cva(['group-data-[state=checked]/mark:hidden'])
