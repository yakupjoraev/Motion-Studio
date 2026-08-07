import { cva } from 'class-variance-authority'

import { LABEL_COLUMN_CLASS } from '../styles/density'

/** § Control rows: 88 px column, sentence case, no colon. */
export const labelStyles = cva([
  'shrink-0 select-none text-foreground-muted text-xs',
  LABEL_COLUMN_CLASS,
])
