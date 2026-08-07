import { cva } from 'class-variance-authority'

import { HEIGHT_CLASS } from '../../styles/density'
import { FOCUS_RING, TRANSITION_CONTROL } from '../../styles/variants'

export const stepperFieldStyles = cva([
  'flex items-center gap-0.5 rounded-sm border border-border-strong bg-surface-2',
  TRANSITION_CONTROL,
  HEIGHT_CLASS.input,
])

export const stepperValueStyles = cva([
  'min-w-0 flex-1 cursor-default select-none text-center text-foreground text-xs tabular-nums',
  TRANSITION_CONTROL,
  FOCUS_RING,
])
