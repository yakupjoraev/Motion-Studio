import { z } from 'zod'

import { definePreset } from '../../model/define-preset'
import {
  IN_VIEW,
  REDUCED_ENTRANCE,
  durationControl,
  motionFragment,
  selectControl,
  sliderControl,
} from '../shared'

const FROM = ['first', 'last', 'center'] as const

/**
 * The orchestrator: it animates nothing itself and hands its children the timing. `childPreset` is an
 * id rather than a preset, because a document stores ids — the applier looks it up in the same
 * catalogue the parent came from.
 */
export const staggerChildren = definePreset({
  id: 'stagger-children',
  name: 'Stagger children',
  channel: 'entrance',
  engine: 'motion',
  paramsSchema: z.object({
    each: z.number().min(0).max(600).default(60),
    from: z.enum(FROM).default('first'),
    childPreset: z.string().default('fade-up'),
    delay: z.number().min(0).max(3000).default(0),
  }),
  defaults: { each: 60, from: 'first', childPreset: 'fade-up', delay: 0 },
  controls: [
    sliderControl('each', 'Each', 0, 600, { step: 10, unit: 'ms' }),
    selectControl(
      'from',
      'From',
      FROM.map((value) => ({ value, label: value })),
    ),
    durationControl('delay', 'Delay'),
  ],
  capabilities: { composableWith: ['hover', 'cursor'], requiresChildren: true, cost: 'cheap' },
  resolve: (params) => ({
    engine: 'motion',
    // No variant of its own: the parent is a container whose only output is the timing its children
    // inherit, which is what `staggerChildren` means in the engine.
    transition: {
      duration: 0,
      ...(params.delay === 0 ? {} : { delay: params.delay }),
      stagger: { each: params.each, from: params.from },
    },
    listeners: IN_VIEW,
  }),
  resolveReduced: () => ({ ...REDUCED_ENTRANCE, transition: { duration: 120 } }),
  codegen: (params) =>
    motionFragment({
      name: 'staggerChildren',
      variants: { hidden: {}, visible: {} },
      transition: {
        staggerChildren: params.each / 1000,
        delayChildren: params.delay / 1000,
      },
    }),
})
