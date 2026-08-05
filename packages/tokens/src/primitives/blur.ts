/** `DESIGN_SYSTEM.md` § Blur and glass. */
export const BLUR = {
  none: '0px',
  xs: '2px',
  sm: '4px',
  md: '8px',
  lg: '16px',
  xl: '24px',
  '2xl': '40px',
  '3xl': '64px',
} as const

export type BlurToken = keyof typeof BLUR
