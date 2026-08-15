import { z } from 'zod'

import type { EasingName } from '../../curves/easings'
import { definePreset } from '../../model/define-preset'
import type { MotionPreset } from '../../model/preset.types'
import {
  IN_VIEW,
  REDUCED_ENTRANCE,
  delaySchema,
  durationControl,
  durationSchema,
  easingControl,
  easingNameSchema,
  motionFragment,
  sliderControl,
  timing,
} from '../shared'

/** A `type`, not an `interface`: only a type alias gets the implicit index signature `PresetParams` asks for. */
type DirectionalParams = {
  readonly distance: number
  readonly duration: number
  readonly delay: number
  readonly easing: EasingName
}

/**
 * ANIMATION_SYSTEM.md § Entrance lists the four directions as one row with the same parameters, so
 * they are one factory: four ids, four labels, one behaviour, and no chance of the four drifting
 * apart when someone changes the curve.
 */
const directional = (
  id: string,
  name: string,
  axis: 'x' | 'y',
  sign: 1 | -1,
): MotionPreset<DirectionalParams> =>
  definePreset({
    id,
    name,
    channel: 'entrance',
    engine: 'motion',
    paramsSchema: z.object({
      distance: z.number().min(0).max(200).default(24),
      duration: durationSchema(600),
      delay: delaySchema(),
      easing: easingNameSchema.default('expoOut'),
    }),
    defaults: { distance: 24, duration: 600, delay: 0, easing: 'expoOut' },
    controls: [
      sliderControl('distance', 'Distance', 0, 200, { unit: 'px' }),
      durationControl('duration'),
      durationControl('delay', 'Delay'),
      easingControl(),
    ],
    capabilities: { composableWith: ['hover', 'cursor'], cost: 'cheap' },
    resolve: (params) => ({
      engine: 'motion',
      variants: {
        hidden: { opacity: 0, [axis]: params.distance * sign },
        visible: { opacity: 1, [axis]: 0 },
      },
      transition: timing(params),
      listeners: IN_VIEW,
    }),
    /** § Reduced motion: opacity only. The translate is exactly what the setting asks us to drop. */
    resolveReduced: () => REDUCED_ENTRANCE,
    codegen: (params) =>
      motionFragment({
        name: id.replace(/-([a-z])/g, (_match, letter: string) => letter.toUpperCase()),
        variants: {
          hidden: { opacity: 0, [axis]: params.distance * sign },
          visible: { opacity: 1, [axis]: 0 },
        },
        transition: { duration: params.duration / 1000, delay: params.delay / 1000 },
      }),
  })

export const fadeUp = directional('fade-up', 'Fade up', 'y', 1)
export const fadeDown = directional('fade-down', 'Fade down', 'y', -1)
export const fadeLeft = directional('fade-left', 'Fade left', 'x', 1)
export const fadeRight = directional('fade-right', 'Fade right', 'x', -1)
