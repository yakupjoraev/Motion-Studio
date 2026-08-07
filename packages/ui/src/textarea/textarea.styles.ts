import { type VariantProps, cva } from 'class-variance-authority'

import { DISABLED, FOCUS_RING, TRANSITION_CONTROL } from '../styles/variants'

/**
 * No fixed height here: the element's height is measured and set by the component, which is the whole point
 * of an auto-growing field. `resize-none` follows from that — a manual resize handle would fight the growth.
 */
export const textareaStyles = cva(
  [
    'block w-full resize-none overflow-hidden rounded-sm border bg-surface-2 px-2 py-1 text-xs text-foreground',
    'placeholder:text-foreground-subtle',
    TRANSITION_CONTROL,
    FOCUS_RING,
    DISABLED,
  ],
  {
    variants: {
      invalid: { true: 'border-danger', false: 'border-border-strong' },
      scrolls: { true: 'overflow-y-auto', false: '' },
    },
    defaultVariants: { invalid: false, scrolls: false },
  },
)

export type TextareaStyleProps = VariantProps<typeof textareaStyles>
