import { type VariantProps, cva } from 'class-variance-authority'

import { HEIGHT_CLASS } from '../styles/density'
import { FLOATING_SURFACE, FOCUS_RING, TRANSITION_CONTROL } from '../styles/variants'

/** A field, so it matches `Input`. */
export const selectTriggerStyles = cva(
  [
    'flex w-full items-center justify-between gap-1.5 rounded-sm border bg-surface-2 px-2 text-xs text-foreground',
    TRANSITION_CONTROL,
    'data-[placeholder]:text-foreground-subtle',
    'disabled:pointer-events-none disabled:opacity-50',
    HEIGHT_CLASS.input,
    FOCUS_RING,
  ],
  {
    variants: {
      invalid: { true: 'border-danger', false: 'border-border-strong' },
    },
    defaultVariants: { invalid: false },
  },
)

/** The entrance is in `chrome.css`. `z-index` is applied inline because Radix portals the content out. */
export const selectContentStyles = cva([FLOATING_SURFACE, 'overflow-hidden p-1'])

export const selectItemStyles = cva([
  'relative flex cursor-default select-none items-center rounded-xs pr-2 pl-6 text-xs text-foreground outline-none',
  HEIGHT_CLASS.layerRow,
  TRANSITION_CONTROL,
  'data-[highlighted]:bg-surface-2 data-[highlighted]:text-foreground',
  'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
])

export type SelectStyleProps = VariantProps<typeof selectTriggerStyles>
