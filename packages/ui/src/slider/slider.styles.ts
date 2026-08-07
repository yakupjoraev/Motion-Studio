import { cva } from 'class-variance-authority'

import { GLYPH_CLASS, HEIGHT_CLASS } from '../styles/density'
import { FOCUS_RING, TRANSITION_CONTROL } from '../styles/variants'

/**
 * The root is a full control row so the slider drops into an inspector row without the row growing around a
 * 4 px bar. `touch-none select-none` is Radix's requirement, not decoration: without it a drag on a touch
 * screen scrolls the panel instead of moving the thumb.
 */
export const sliderRootStyles = cva([
  'relative flex w-full touch-none select-none items-center',
  'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
  HEIGHT_CLASS.controlRow,
])

/**
 * The well: 4 px, the chrome's thinnest interactive line (ADR-030), inset-valued rather than bordered — at
 * 4 px tall a hairline top and bottom would be half the object.
 */
export const sliderTrackStyles = cva([
  'relative w-full grow overflow-hidden rounded-full bg-surface-inset',
  GLYPH_CLASS.sliderTrack,
])

/**
 * The fill. `foreground`, not `accent` — ADR-032, the same inversion the switch and the checkbox use.
 *
 * No `transition` of any kind: the width follows a pointer frame by frame, and easing it would put the bar a
 * fixed 120 ms behind the number beside it for the whole drag (ADR-031).
 */
export const sliderRangeStyles = cva(['absolute h-full rounded-full bg-foreground'])

/**
 * The thumb is 12 px and the target is 24 × 24, reached by a transparent `::after` rather than by growing
 * the circle — ADR-030. The pseudo-element is why the knob stays a knob while the grab area stays legal.
 */
export const sliderThumbStyles = cva([
  'relative block rounded-full border border-foreground bg-surface-0',
  'after:absolute after:-inset-[6px] after:block after:content-[""]',
  // Hover and press move the fill, not the border: the border is already at `foreground`, so the only
  // direction left for it is weaker, and feedback that reduces contrast is not feedback.
  'hover:bg-surface-2 active:bg-surface-3',
  /*
   * Radix moves the thumb with `left`, which this class does not list, so the knob tracks the pointer
   * exactly rather than trailing it by 120 ms (ADR-031). The `transform` channel the class does list holds
   * Radix's constant `translateX(-50%)` and never animates.
   */
  TRANSITION_CONTROL,
  GLYPH_CLASS.sliderThumb,
  FOCUS_RING,
])
