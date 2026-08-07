import { cva } from 'class-variance-authority'

import { FLOATING_SURFACE } from '../styles/variants'

/**
 * A floating surface like the other overlays, but the smallest one the chrome has: `text-2xs`, one line, no
 * padding worth the name. § Character keeps glass for floating panels, and a tooltip is one.
 *
 * The entrance is `styles/chrome.css`, keyed on `data-ms-overlay="tooltip"` — § Timing gives the tooltip a
 * shorter fade than the dropdowns, and Radix decides when to unmount by looking for a running animation.
 */
export const tooltipContentStyles = cva([
  FLOATING_SURFACE,
  'flex items-center gap-1.5 px-2 py-1 text-2xs text-foreground',
])
