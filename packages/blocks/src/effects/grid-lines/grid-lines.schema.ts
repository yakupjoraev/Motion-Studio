import { z } from 'zod'

import { effectIntensity, effectTint } from '../shared'

export const LINE_SPACING = { min: 8, max: 160, step: 1, unit: 'px' } as const
export const LINE_WIDTH = { min: 0.5, max: 3, step: 0.5, unit: 'px' } as const

export const GRID_AXES = ['both', 'horizontal', 'vertical'] as const

export type GridAxis = (typeof GRID_AXES)[number]

export const gridLinesSchema = z.object({
  tint: effectTint.default('foreground'),
  intensity: effectIntensity.default(0.1),
  spacing: z.number().min(LINE_SPACING.min).max(LINE_SPACING.max).default(48),
  lineWidth: z.number().min(LINE_WIDTH.min).max(LINE_WIDTH.max).default(1),
  axis: z.enum(GRID_AXES).default('both'),
  fade: z.boolean().default(true),
})
