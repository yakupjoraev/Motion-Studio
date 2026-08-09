import type { MotionChannel, MotionSpec } from '@motion-studio/schema'

/**
 * What the block animates unless the user says otherwise. A spec, not an animation: the resolver in
 * `packages/motion` turns it into a transition, and the block never hard-codes one — § Rules 7.
 */
export const sectionMotion: Readonly<Partial<Record<MotionChannel, MotionSpec>>> = {
  entrance: {
    presetId: 'fade-up',
    channel: 'entrance',
    trigger: { kind: 'inView', amount: 0.2, once: true, margin: '0px 0px -10% 0px' },
    params: { distance: 24, duration: 0.5 },
  },
}
