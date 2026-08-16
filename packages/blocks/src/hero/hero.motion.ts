import type { MotionChannel, MotionSpec } from '@motion-studio/schema'

/**
 * The entrance every hero declares: `fade-up` on the band, staggered into its children. A spec, not
 * an animation — the resolver in `packages/motion` turns it into a transition and the reduced-motion
 * policy in ANIMATION_SYSTEM.md § Reduced motion drops the transform, leaving the opacity.
 *
 * `once: true` because a hero is the first thing on the page: replaying it on scroll-back is a page
 * that will not settle.
 *
 * Every time here is milliseconds, which is the unit `MotionSpec.params` and `MotionStagger.each`
 * carry all the way to the engines — `framer-motion.tsx` is the one place that divides by 1000.
 */
export const heroEntrance: MotionSpec = {
  presetId: 'fade-up',
  channel: 'entrance',
  trigger: { kind: 'mount' },
  params: { distance: 28, duration: 600 },
  stagger: { each: 80, from: 'first' },
}

export const heroMotion: Readonly<Partial<Record<MotionChannel, MotionSpec>>> = {
  entrance: heroEntrance,
}
