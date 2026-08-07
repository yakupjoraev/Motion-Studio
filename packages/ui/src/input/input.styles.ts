import { type VariantProps, cva } from 'class-variance-authority'

import { HEIGHT_CLASS } from '../styles/density'
import { DISABLED, FOCUS_RING, TRANSITION_CONTROL } from '../styles/variants'

/** The ring goes on the wrapper: with a prefix or suffix, that is the field the user sees. */
export const inputWrapperStyles = cva(
  [
    'flex items-center gap-1.5 rounded-sm border bg-surface-2 px-2 text-xs text-foreground',
    TRANSITION_CONTROL,
    HEIGHT_CLASS.input,
    FOCUS_RING.replace('focus-visible:', 'focus-within:has(:focus-visible):'),
  ],
  {
    variants: {
      invalid: {
        true: 'border-danger',
        false: 'border-border-strong hover:border-border-strong/80',
      },
      disabled: { true: 'pointer-events-none opacity-50', false: '' },
    },
    defaultVariants: { invalid: false, disabled: false },
  },
)

/** The wrapper owns the border, the background and the ring. */
export const inputStyles = cva([
  'min-w-0 flex-1 bg-transparent text-xs text-foreground outline-none',
  'placeholder:text-foreground-subtle',
  DISABLED,
])

export const slotStyles = cva('shrink-0 text-foreground-subtle')

export type InputStyleProps = VariantProps<typeof inputWrapperStyles>
