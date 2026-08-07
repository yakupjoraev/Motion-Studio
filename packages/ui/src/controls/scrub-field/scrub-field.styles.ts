import { cva } from 'class-variance-authority'

import { HEIGHT_CLASS } from '../../styles/density'
import { DISABLED, FOCUS_RING, TRANSITION_CONTROL } from '../../styles/variants'

/**
 * `UI_GUIDELINES.md` § Cursors: a scrub field is `ew-resize`. It becomes a text caret once focused,
 * because at that point the field is a text field.
 */
export const scrubFieldStyles = cva(
  [
    'w-full min-w-0 cursor-ew-resize select-none rounded-sm border bg-surface-2 px-2 text-right text-foreground text-xs tabular-nums',
    'focus:cursor-text focus:select-auto focus:text-left',
    'placeholder:text-foreground-subtle',
    TRANSITION_CONTROL,
    FOCUS_RING,
    DISABLED,
    HEIGHT_CLASS.input,
  ],
  {
    variants: {
      dragging: {
        true: 'border-accent',
        false: 'border-border-strong hover:border-border-strong/80',
      },
    },
    defaultVariants: { dragging: false },
  },
)
