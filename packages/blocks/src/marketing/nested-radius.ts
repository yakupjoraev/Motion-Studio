import { RADIUS, type RadiusToken } from '@motion-studio/tokens'
import { innerRadius } from '@motion-studio/utils'

/**
 * The nested radius rule as a **class**, which is the form a block can actually spend.
 *
 * `innerRadius(outer, gap)` in `utils` answers the arithmetic in pixels; DESIGN_SYSTEM.md § Radius is
 * the rule, and prompt 38 requires every card-in-container to go through it rather than eyeballing a
 * corner. But a Tailwind class has to be a literal (ADR-106), so the pixel answer has to come back to
 * a token before it can be painted — that is the whole of this module.
 *
 * The step chosen is the largest token **not exceeding** the computed radius. Rounding the other way
 * would put the inner corner outside the outer one, which is the visible defect the rule exists to
 * prevent; rounding down at worst leaves a corner very slightly squarer than ideal.
 */
const LADDER: readonly (readonly [RadiusToken, number])[] = (
  Object.entries(RADIUS) as readonly (readonly [RadiusToken, string])[]
)
  // `full` is a pill rather than a step: 9999 px is not a radius that can contain anything.
  .filter(([token]) => token !== 'full')
  .map(([token, value]) => [token, Number.parseInt(value, 10)] as const)
  .sort((a, b) => a[1] - b[1])

export const RADIUS_CLASS: Readonly<Record<RadiusToken, string>> = {
  none: 'rounded-none',
  xs: 'rounded-xs',
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  '2xl': 'rounded-2xl',
  '3xl': 'rounded-3xl',
  full: 'rounded-full',
}

export function radiusPx(token: RadiusToken): number {
  return Number.parseInt(RADIUS[token], 10)
}

/**
 * The token a child gets when it sits `gap` pixels inside a parent rounded at `outer`.
 *
 * The arithmetic is done on the base scale, and the theme's `radiusScale` multiplier then scales both
 * corners by the same factor — so the *ratio* survives a theme change even though the difference does
 * not. A document at `radiusScale: 2` has a 32 px card holding a 16 px child where the rule would say
 * 24; both are concentric enough to read as intentional, and the alternative is a runtime measurement
 * a block is not allowed to take (COMPONENT_LIBRARY.md § Rules 1).
 */
export function innerRadiusToken(outer: RadiusToken, gap: number): RadiusToken {
  const target = innerRadius(radiusPx(outer), gap)

  let chosen: RadiusToken = 'none'

  for (const [token, value] of LADDER) {
    if (value <= target) {
      chosen = token
    }
  }

  return chosen
}

/** The class for that child, which is what a `cva` variant map holds. */
export function innerRadiusClass(outer: RadiusToken, gap: number): string {
  return RADIUS_CLASS[innerRadiusToken(outer, gap)]
}
