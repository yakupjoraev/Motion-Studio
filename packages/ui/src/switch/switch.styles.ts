import { cva } from 'class-variance-authority'

import { GLYPH_CLASS, MIN_TARGET_CLASS } from '../styles/density'
import { FOCUS_RING, TRANSITION_TRAVEL } from '../styles/variants'

/** The root is the 24 × 24 target; the track inside it is the glyph. ADR-030. */
export const switchRootStyles = cva([
  'group relative inline-grid shrink-0 place-items-center rounded-full outline-none',
  'disabled:pointer-events-none disabled:opacity-50',
  MIN_TARGET_CLASS,
])

/**
 * The ring goes here, not on the root: a ring around the transparent target sits clear of the pill.
 * Checked state comes from `data-state` because an uncontrolled switch does not know its own value.
 * "On" is `foreground`, not `accent` — ADR-032.
 */
export const switchTrackStyles = cva([
  'relative rounded-full border border-border-strong bg-surface-inset',
  TRANSITION_TRAVEL,
  'group-data-[state=checked]:border-foreground group-data-[state=checked]:bg-foreground',
  GLYPH_CLASS.switchTrack,
  FOCUS_RING.replace('focus-visible:', 'group-focus-visible:'),
])

export const switchThumbStyles = cva([
  'pointer-events-none absolute top-[2px] left-[2px] rounded-full bg-foreground-muted',
  TRANSITION_TRAVEL,
  // 24 track − 2 inset − 10 thumb − 2 inset. As wide as the thumb, which is the point.
  'data-[state=checked]:translate-x-[10px] data-[state=checked]:bg-surface-0',
  GLYPH_CLASS.switchThumb,
])
