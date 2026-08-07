import { cva } from 'class-variance-authority'

import { FOCUS_RING, TRANSITION_CONTROL } from '../../styles/variants'

export const alignFieldStyles = cva([
  'grid grid-cols-3 gap-px rounded-sm border border-border-strong bg-border p-px',
])

/** ADR-032: the chosen cell inverts rather than taking the accent — nine of them are visible at once. */
export const alignCellStyles = cva(
  ['flex h-[20px] w-[20px] items-center justify-center', TRANSITION_CONTROL, FOCUS_RING],
  {
    variants: {
      selected: {
        true: 'bg-foreground text-surface-1',
        false: 'bg-surface-2 text-foreground-subtle hover:bg-surface-3',
      },
    },
    defaultVariants: { selected: false },
  },
)

export const alignDotStyles = cva('h-[4px] w-[4px] rounded-full bg-current')
