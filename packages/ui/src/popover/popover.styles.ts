import { cva } from 'class-variance-authority'

import { FLOATING_SURFACE, FOCUS_RING } from '../styles/variants'

/** `max-w` rather than a width: a colour picker and a two-line confirmation are both popovers. */
export const popoverContentStyles = cva([
  FLOATING_SURFACE,
  FOCUS_RING,
  'max-w-[min(320px,calc(100vw-16px))] p-2 text-xs text-foreground',
])
