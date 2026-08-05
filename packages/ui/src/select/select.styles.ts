import { type VariantProps, cva } from 'class-variance-authority'

import { HEIGHT_CLASS } from '../styles/density'
import { FLOATING_SURFACE, FOCUS_RING } from '../styles/variants'

/** The trigger is a field, so it matches `Input`: 26 px, `surface-2`, hairline border. */
export const selectTriggerStyles = cva(
  [
    'flex w-full items-center justify-between gap-1.5 rounded-sm border bg-surface-2 px-2 text-xs text-foreground',
    'transition-colors duration-[--ms-duration-fast] ease-[--ms-ease-standard]',
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

/**
 * The entrance and exit come from `styles/chrome.css`, keyed on `data-ms-overlay` — Radix decides when to
 * unmount by looking for a running CSS animation, so a class-string transition would make every exit
 * instant. § Timing: open 160 ms `decelerate`, close 120 ms `accelerate`.
 *
 * `z-index` is `Z_INDEX.dropdown` applied inline rather than a utility: Radix portals the content out of the
 * panel, and § Z-index says named and centralized, no magic numbers anywhere.
 */
export const selectContentStyles = cva([FLOATING_SURFACE, 'overflow-hidden p-1'])

export const selectItemStyles = cva([
  'relative flex cursor-default select-none items-center rounded-xs pr-2 pl-6 text-xs text-foreground outline-none',
  HEIGHT_CLASS.layerRow,
  'transition-colors duration-[--ms-duration-fast] ease-[--ms-ease-standard]',
  'data-[highlighted]:bg-surface-2 data-[highlighted]:text-foreground',
  'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
])

export type SelectStyleProps = VariantProps<typeof selectTriggerStyles>
