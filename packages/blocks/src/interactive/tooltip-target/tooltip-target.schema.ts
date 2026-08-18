import { z } from 'zod'

import {
  BODY_MAX_LENGTH,
  LABEL_MAX_LENGTH,
  controlSize,
  controlVariant,
  iconNameField,
  interactiveFrameFields,
} from '../interactive.schema'

export const TOOLTIP_SIDES = ['top', 'right', 'bottom', 'left'] as const

export type TooltipSide = (typeof TOOLTIP_SIDES)[number]

/**
 * How long the pointer has to rest before the bubble appears. Focus never waits — a keyboard user has already
 * committed by the time they land on the control, and a delay there reads as a dropped key.
 */
export const MIN_TOOLTIP_DELAY = 0
export const MAX_TOOLTIP_DELAY = 1000
export const TOOLTIP_DELAY_STEP = 50

export const tooltipTargetSchema = z.object({
  label: z.string().min(1).max(LABEL_MAX_LENGTH).default('Publish'),
  icon: iconNameField,
  variant: controlVariant.default('secondary'),
  size: controlSize.default('md'),
  /** Required: a tooltip with nothing in it is a control with an empty description attached to it. */
  content: z
    .string()
    .min(1)
    .max(BODY_MAX_LENGTH)
    .default('Everyone with the link will see the current version.'),
  side: z.enum(TOOLTIP_SIDES).default('top'),
  delay: z.number().int().min(MIN_TOOLTIP_DELAY).max(MAX_TOOLTIP_DELAY).default(200),
  ...interactiveFrameFields(),
})

export type TooltipTargetProps = z.infer<typeof tooltipTargetSchema>
