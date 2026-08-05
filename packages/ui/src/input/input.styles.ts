import { type VariantProps, cva } from 'class-variance-authority'

import { HEIGHT_CLASS } from '../styles/density'
import { DISABLED, FOCUS_RING } from '../styles/variants'

/**
 * The focus ring goes on the **wrapper**, not the `input`: with a prefix or a suffix the field the user sees
 * is the wrapper, and a ring around the bare text node would leave the slots outside it.
 */
export const inputWrapperStyles = cva(
  [
    'flex items-center gap-1.5 rounded-sm border bg-surface-2 px-2 text-xs text-foreground',
    'transition-colors duration-[--ms-duration-fast] ease-[--ms-ease-standard]',
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

/** The text node itself carries no border, background or ring — the wrapper owns all three. */
export const inputStyles = cva([
  'min-w-0 flex-1 bg-transparent text-xs text-foreground outline-none',
  'placeholder:text-foreground-subtle',
  DISABLED,
])

export const slotStyles = cva('shrink-0 text-foreground-subtle')

export type InputStyleProps = VariantProps<typeof inputWrapperStyles>
