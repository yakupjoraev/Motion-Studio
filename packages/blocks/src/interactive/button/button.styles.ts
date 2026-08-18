import { cn } from '@motion-studio/utils'

import { controlStyles } from '../interactive.styles'

import type { ControlSize, ControlVariant } from '../interactive.schema'

export interface ButtonStyleProps {
  readonly variant: ControlVariant
  readonly size: ControlSize
  readonly fullWidth: boolean
  readonly hidden: boolean
}

/**
 * The control's own class list, with no wrapper element around it. `hidden` goes on the button itself
 * rather than on a `<div>`, because a wrapper would be one more box in the exported markup and the
 * responsive prop (ADR-117) needs an element, not a container.
 */
export const buttonStyles = ({ variant, size, fullWidth, hidden }: ButtonStyleProps): string =>
  cn(controlStyles({ variant, size, fullWidth }), hidden && 'hidden')

/** The spinner. `ms-spin` is in `blocks.css`, where the keyframes and the reduced-motion rule live. */
export const BUTTON_SPINNER = 'ms-spin shrink-0'
