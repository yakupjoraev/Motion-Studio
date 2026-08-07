import { cva } from 'class-variance-authority'

import { GLYPH_CLASS, MIN_TARGET_CLASS } from '../styles/density'
import { FOCUS_RING, TRANSITION_TRAVEL } from '../styles/variants'

/**
 * The root is the **target**, not the glyph: 24 × 24 from `MIN_TARGET_CLASS`, transparent, with the 24 × 14
 * track centred inside it by the grid. ADR-030 — what you see and what you hit are two different sizes, and
 * a 14 px-tall hit area would fail WCAG 2.2 § 2.5.8 no matter how tidy it looked.
 */
export const switchRootStyles = cva([
  'group relative inline-grid shrink-0 place-items-center rounded-full outline-none',
  'disabled:pointer-events-none disabled:opacity-50',
  MIN_TARGET_CLASS,
])

/**
 * The visible pill. Two things about it are deliberate.
 *
 * It carries the focus ring rather than the root, because a ring drawn around the transparent 24 × 24 target
 * would sit clear of the thing it is pointing at. Same substitution `Input` makes for its wrapper, so the
 * fragment in `styles/variants.ts` stays the single definition of the ring.
 *
 * Its checked appearance comes from the root's `data-state` through `group-data-*`, not from a React prop.
 * An uncontrolled `Switch` has no idea whether it is on; only the DOM does, and reading the state from the
 * DOM is what makes controlled and uncontrolled look identical.
 *
 * "On" is `foreground`, not `accent` — ADR-032. An inspector shows six to ten of these at rest, and
 * § Character spends the accent on the four things that appear once.
 *
 * Colour transitions at 120 ms `standard` (ADR-031), through the token, so `motionScale: 0` and
 * `prefers-reduced-motion` each zero it without a branch here.
 */
export const switchTrackStyles = cva([
  'relative rounded-full border border-border-strong bg-surface-inset',
  TRANSITION_TRAVEL,
  'group-data-[state=checked]:border-foreground group-data-[state=checked]:bg-foreground',
  GLYPH_CLASS.switchTrack,
  FOCUS_RING.replace('focus-visible:', 'group-focus-visible:'),
])

/**
 * The thumb, inset 2 px on every side of the track — the inset that produced its 10 px size in ADR-030, so
 * the offset and the size are one decision read twice.
 *
 * `TRANSITION_TRAVEL` rather than `TRANSITION_CONTROL`: the thumb's transform is a move to a new position,
 * which § Timing eases on `standard`, not a press, which it eases on `accelerate`.
 */
export const switchThumbStyles = cva([
  'pointer-events-none absolute top-[2px] left-[2px] rounded-full bg-foreground-muted',
  TRANSITION_TRAVEL,
  // 10 px of travel: 24 track − 2 inset − 10 thumb − 2 inset. As wide as the thumb, which is the point.
  'data-[state=checked]:translate-x-[10px] data-[state=checked]:bg-surface-0',
  GLYPH_CLASS.switchThumb,
])
