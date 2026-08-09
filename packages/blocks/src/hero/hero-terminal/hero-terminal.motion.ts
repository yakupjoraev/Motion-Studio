import type { MotionChannel, MotionSpec } from '@motion-studio/schema'

import { heroEntrance } from '../hero.motion'

/**
 * The typing is a preset reference, which is ANIMATION_SYSTEM.md § Rules 7 — a block declares what it
 * animates and the resolver decides how. The spec is written now and `packages/motion` implements
 * `typewriter` in prompt 32; until then the transcript simply renders finished, which is also exactly
 * what the `continuous` reduced-motion policy asks for (disabled entirely, not slowed).
 *
 * The preset's own `phrases` parameter is not set here: `MotionSpec.params` holds scalars, and the
 * phrases *are* the block's `lines` prop. The resolver reads the element it is given.
 */
export const heroTerminalMotion: Readonly<Partial<Record<MotionChannel, MotionSpec>>> = {
  entrance: heroEntrance,
  continuous: {
    presetId: 'typewriter',
    channel: 'continuous',
    trigger: { kind: 'inView', amount: 0.4, once: true, margin: '0px' },
    params: { speed: 26, caret: true },
  },
}
