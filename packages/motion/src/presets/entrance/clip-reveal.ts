import { z } from 'zod'

import { definePreset } from '../../model/define-preset'
import {
  IN_VIEW,
  REDUCED_ENTRANCE,
  delaySchema,
  durationControl,
  durationSchema,
  easingControl,
  easingNameSchema,
  motionFragment,
  selectControl,
  timing,
} from '../shared'

const DIRECTIONS = ['up', 'down', 'left', 'right'] as const

type Direction = (typeof DIRECTIONS)[number]

/** The side the wipe starts from, as the inset that hides everything else. */
const HIDDEN: Readonly<Record<Direction, string>> = {
  up: 'inset(100% 0 0 0)',
  down: 'inset(0 0 100% 0)',
  left: 'inset(0 0 0 100%)',
  right: 'inset(0 100% 0 0)',
}

const SHOWN = 'inset(0 0 0 0)'

/** A wipe rather than a fade: the element is whole from the first frame and the mask uncovers it. */
export const clipReveal = definePreset({
  id: 'clip-reveal',
  name: 'Clip reveal',
  channel: 'entrance',
  engine: 'motion',
  paramsSchema: z.object({
    direction: z.enum(DIRECTIONS).default('up'),
    duration: durationSchema(720),
    delay: delaySchema(),
    easing: easingNameSchema.default('emphasizedDecelerate'),
  }),
  defaults: { direction: 'up', duration: 720, delay: 0, easing: 'emphasizedDecelerate' },
  controls: [
    selectControl(
      'direction',
      'Direction',
      DIRECTIONS.map((value) => ({ value, label: value })),
    ),
    durationControl('duration'),
    durationControl('delay', 'Delay'),
    easingControl(),
  ],
  capabilities: { composableWith: ['hover', 'cursor'], cost: 'cheap' },
  resolve: (params) => ({
    engine: 'motion',
    variants: {
      hidden: { clipPath: HIDDEN[params.direction] },
      visible: { clipPath: SHOWN },
    },
    transition: timing(params),
    listeners: IN_VIEW,
  }),
  resolveReduced: () => REDUCED_ENTRANCE,
  codegen: (params) =>
    motionFragment({
      name: 'clipReveal',
      variants: { hidden: { clipPath: HIDDEN[params.direction] }, visible: { clipPath: SHOWN } },
      transition: { duration: params.duration / 1000, delay: params.delay / 1000 },
    }),
})
