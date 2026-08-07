import { cva } from 'class-variance-authority'

import { GLYPH_CLASS, HEIGHT_CLASS } from '../styles/density'
import { FOCUS_RING, TRANSITION_CONTROL } from '../styles/variants'

/** `touch-none` is Radix's requirement: without it a touch drag scrolls the panel. */
export const sliderRootStyles = cva([
  'relative flex w-full touch-none select-none items-center',
  'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
  HEIGHT_CLASS.controlRow,
])

/** Valued rather than bordered: at 4 px tall a hairline top and bottom is half the object. */
export const sliderTrackStyles = cva([
  'relative w-full grow overflow-hidden rounded-full bg-surface-inset',
  GLYPH_CLASS.sliderTrack,
])

/** `foreground`, not `accent` (ADR-032). No transition: the width follows the pointer (ADR-031). */
export const sliderRangeStyles = cva(['absolute h-full rounded-full bg-foreground'])

/** 12 px knob, 24 × 24 target through the `::after` — ADR-030. */
export const sliderThumbStyles = cva([
  'relative block rounded-full border border-foreground bg-surface-0',
  'after:absolute after:-inset-[6px] after:block after:content-[""]',
  // The border is already at `foreground`, so hover moves the fill instead.
  'hover:bg-surface-2 active:bg-surface-3',
  // Colours only. Radix moves the thumb with `left`, which this does not list.
  TRANSITION_CONTROL,
  GLYPH_CLASS.sliderThumb,
  FOCUS_RING,
])
