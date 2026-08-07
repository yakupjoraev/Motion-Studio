import { cva } from 'class-variance-authority'

import { FLOATING_SURFACE } from '../styles/variants'

/** The entrance is in `chrome.css`, keyed on `data-ms-overlay="tooltip"`. */
export const tooltipContentStyles = cva([
  FLOATING_SURFACE,
  'flex items-center gap-1.5 px-2 py-1 text-2xs text-foreground',
])
