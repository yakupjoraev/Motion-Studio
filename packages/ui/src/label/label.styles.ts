import { cva } from 'class-variance-authority'

import { LABEL_COLUMN_CLASS } from '../styles/density'

/** § Control rows: fixed 88 px column, `text-xs`, `foreground-muted`, sentence case, no colon. */
export const labelStyles = cva([
  'shrink-0 select-none text-foreground-muted text-xs',
  LABEL_COLUMN_CLASS,
])
