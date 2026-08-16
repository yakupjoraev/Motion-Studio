import type { MotionChannel, MotionSpec } from '@motion-studio/schema'

/**
 * What the block animates unless the user says otherwise. A spec, not an animation: the resolver in
 * `packages/motion` turns it into a transition, and the block never hard-codes one — § Rules 7.
 *
 * The section is the band a page is read in, so it is the one layout block that arrives: everything
 * it holds inherits the 60 ms stagger instead of declaring an entrance of its own. Times are
 * milliseconds throughout, which is the unit the resolver and both engines read.
 */
export const sectionMotion: Readonly<Partial<Record<MotionChannel, MotionSpec>>> = {
  entrance: {
    presetId: 'fade-up',
    channel: 'entrance',
    trigger: { kind: 'inView', amount: 0.2, once: true, margin: '0px 0px -10% 0px' },
    params: { distance: 24, duration: 500 },
    stagger: { each: 60, from: 'first' },
  },
}
