import { EASING, type EasingCurve } from '@motion-studio/tokens'

export type { EasingCurve }

/**
 * ANIMATION_SYSTEM.md § Curves: the twelve named curves every preset composes from. Eight of them are
 * design tokens already — `DESIGN_SYSTEM.md` § Motion tokens owns those values and emits them as CSS
 * variables — so they are read from `packages/tokens` rather than transcribed a second time. A curve
 * that exists in two tables is a curve that will differ in one of them.
 *
 * `overshoot` is the token named `spring`: ANIMATION_SYSTEM.md renamed it, because a cubic Bézier is
 * not a spring and the two live side by side in this package.
 *
 * The remaining four have no token because nothing in the chrome uses them; they exist for the preset
 * catalogue, which is where a curve with a long tail belongs.
 */
export const EASINGS = {
  linear: EASING.linear,
  standard: EASING.standard,
  decelerate: EASING.decelerate,
  accelerate: EASING.accelerate,
  emphasized: EASING.emphasized,
  emphasizedDecelerate: [0.05, 0.7, 0.1, 1],
  emphasizedAccelerate: [0.3, 0, 0.8, 0.15],
  overshoot: EASING.spring,
  bounce: EASING.bounce,
  anticipate: EASING.anticipate,
  expoOut: [0.16, 1, 0.3, 1],
  circOut: [0, 0.55, 0.45, 1],
} as const satisfies Record<string, EasingCurve>

export type EasingName = keyof typeof EASINGS

export const EASING_NAMES = Object.keys(EASINGS) as readonly EasingName[]
