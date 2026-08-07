import { cva } from 'class-variance-authority'

import { FLOATING_SURFACE, FOCUS_RING } from '../styles/variants'

/**
 * A floating panel. Glass belongs here — § Character allows it on floating surfaces and nowhere else in the
 * chrome — and so does a shadow, which the flat panels are denied.
 *
 * `max-w` rather than a fixed width: a colour picker and a two-line confirmation are both popovers, and the
 * only thing they share is that neither should run off the panel. The entrance is `styles/chrome.css`.
 */
export const popoverContentStyles = cva([
  FLOATING_SURFACE,
  FOCUS_RING,
  'max-w-[min(320px,calc(100vw-16px))] p-2 text-xs text-foreground',
])
