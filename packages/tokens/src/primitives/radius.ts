/**
 * `DESIGN_SYSTEM.md` § Radius. The theme's `radiusScale` multiplier (0 / 0.5 / 1 / 1.5 / 2) scales
 * every token at once, which is how one control takes a whole document from sharp to soft.
 *
 * `full` is 9999px rather than 50% so a pill keeps its shape at any width.
 */
export const RADIUS = {
  none: '0px',
  xs: '4px',
  sm: '6px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  '2xl': '24px',
  '3xl': '32px',
  full: '9999px',
} as const

export type RadiusToken = keyof typeof RADIUS
