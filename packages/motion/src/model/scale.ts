import type { ResolvedMotion, TransitionConfig } from './preset.types'

/** `theme.motionScale` — DESIGN_SYSTEM.md § Motion tokens. Anything else is clamped into it. */
export const MOTION_SCALES = [0, 0.5, 1, 1.5] as const

export type MotionScale = (typeof MOTION_SCALES)[number]

/** Rounded to whole milliseconds: a duration is fed to an engine, and half a millisecond is noise. */
export const scaleDuration = (ms: number, scale: number): number => Math.round(ms * scale)

/**
 * Applies `motionScale` to every time in a resolution. At zero there is nothing left to time, so the
 * spring goes with the durations: a spring has no duration to multiply, and leaving one in place would
 * make `scale: 0` play a full animation while claiming to be instant (ADR-141).
 */
export function scaleMotion(resolved: ResolvedMotion, scale: number): ResolvedMotion {
  if (scale === 1 || resolved.transition === undefined) {
    return resolved
  }

  return { ...resolved, transition: scaleTransition(resolved.transition, scale) }
}

function scaleTransition(transition: TransitionConfig, scale: number): TransitionConfig {
  const { spring, stagger, ...rest } = transition

  const scaled: TransitionConfig = {
    ...rest,
    ...(transition.duration === undefined
      ? {}
      : { duration: scaleDuration(transition.duration, scale) }),
    ...(transition.delay === undefined ? {} : { delay: scaleDuration(transition.delay, scale) }),
    ...(stagger === undefined ? {} : { stagger: { ...stagger, each: stagger.each * scale } }),
  }

  if (scale === 0) {
    return { ...scaled, duration: 0, delay: 0 }
  }

  return spring === undefined ? scaled : { ...scaled, spring }
}
