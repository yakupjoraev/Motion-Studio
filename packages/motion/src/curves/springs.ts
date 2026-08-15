import type { SpringConfig } from './simulate'

/**
 * ANIMATION_SYSTEM.md § Curves, the seven named springs. Stiffness in N/m, damping in N·s/m, mass in
 * kg — the three numbers `simulateSpring` integrates, and the three a preset hands to Motion.
 *
 * Not tokens: `DESIGN_SYSTEM.md` § Motion tokens holds durations and Béziers, which the chrome
 * consumes as CSS. A spring has no CSS form, so nothing downstream could read it from there.
 */
export const SPRINGS = {
  gentle: { stiffness: 120, damping: 20, mass: 1 },
  smooth: { stiffness: 180, damping: 24, mass: 1 },
  snappy: { stiffness: 300, damping: 26, mass: 0.9 },
  bouncy: { stiffness: 400, damping: 18, mass: 1 },
  stiff: { stiffness: 550, damping: 32, mass: 0.8 },
  wobbly: { stiffness: 220, damping: 12, mass: 1.2 },
  molasses: { stiffness: 60, damping: 26, mass: 1.6 },
} as const satisfies Record<string, SpringConfig>

export type SpringName = keyof typeof SPRINGS

export const SPRING_NAMES = Object.keys(SPRINGS) as readonly SpringName[]

/**
 * ζ = c / (2·√(k·m)). Below 1 the spring overshoots, at 1 it arrives without overshoot, above it
 * crawls in. The inspector reads it to label the curve it is drawing.
 */
export const dampingRatio = ({ stiffness, damping, mass }: SpringConfig): number =>
  damping / (2 * Math.sqrt(stiffness * mass))
