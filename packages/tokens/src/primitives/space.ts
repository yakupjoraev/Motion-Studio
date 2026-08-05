/**
 * The 4 px base scale from `DESIGN_SYSTEM.md` § Space. Only these values exist — a spacing value
 * that is not on the scale is a missing token, not a one-off.
 *
 * The key is the multiple of the 4 px base, so `space[6]` is 24 px. Studio chrome uses 1–4 almost
 * exclusively; blocks use 6–32 for section rhythm.
 */
export const SPACE = {
  0: '0px',
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
  10: '40px',
  12: '48px',
  16: '64px',
  20: '80px',
  24: '96px',
  32: '128px',
  40: '160px',
  48: '192px',
  64: '256px',
} as const

export type SpaceToken = keyof typeof SPACE
