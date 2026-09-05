export interface TypeScaleEntry {
  readonly size: string
  readonly lineHeight: string
  readonly tracking: string
}

/**
 * `DESIGN_SYSTEM.md` § Typography. Loaded with `next/font`, self-hosted, `display: swap`, subset
 * `latin` + `latin-ext`.
 *
 * `display` carries the same stack as `sans`: the document distinguishes them by tracking, and the
 * tracking is per size token in `TYPE_SCALE` rather than per family. The trailing generic keyword is
 * a CSS requirement, not a fourth fallback choice.
 */
export const FONT_FAMILY = {
  sans: "'Geist Sans', system-ui, sans-serif",
  display: "'Geist Sans', system-ui, sans-serif",
  mono: "'Geist Mono', ui-monospace, monospace",
} as const

/**
 * Modular, ratio 1.2 for UI and 1.25 for display. The studio's default is `base` at 14 px, not
 * 16 px — professional tools are dense. Content pages use `md`.
 *
 * The two `display-*` entries are fluid: their size is a `clamp()` and their line height is unitless
 * so it tracks the clamped size instead of a fixed pixel value.
 *
 * The fluid middle term is `cqw`, not `vw` — ADR-356. A block section declares `@container/frame`, so
 * a headline is sized by the band it sits in. That is what makes the studio's 375 px artboard show
 * the 40 px headline a phone gets: with `vw` it read the 1920 px browser window the artboard is drawn
 * inside and printed 80 px, so the mobile frame previewed a desktop headline. Outside a container
 * `cqw` falls back to the small viewport, which is the old behaviour.
 */
export const TYPE_SCALE = {
  '2xs': { size: '10px', lineHeight: '14px', tracking: '0.04em' },
  xs: { size: '11px', lineHeight: '16px', tracking: '0.02em' },
  sm: { size: '12px', lineHeight: '18px', tracking: '0.005em' },
  base: { size: '14px', lineHeight: '21px', tracking: '0em' },
  md: { size: '16px', lineHeight: '24px', tracking: '0em' },
  lg: { size: '18px', lineHeight: '27px', tracking: '-0.005em' },
  xl: { size: '22px', lineHeight: '30px', tracking: '-0.01em' },
  '2xl': { size: '28px', lineHeight: '36px', tracking: '-0.015em' },
  '3xl': { size: '36px', lineHeight: '42px', tracking: '-0.02em' },
  '4xl': { size: '48px', lineHeight: '54px', tracking: '-0.025em' },
  '5xl': { size: '64px', lineHeight: '68px', tracking: '-0.03em' },
  '6xl': { size: '80px', lineHeight: '82px', tracking: '-0.035em' },
  'display-1': { size: 'clamp(2.5rem, 6cqw, 5rem)', lineHeight: '1.05', tracking: '-0.03em' },
  'display-2': { size: 'clamp(2rem, 4.5cqw, 3.5rem)', lineHeight: '1.1', tracking: '-0.02em' },
} as const satisfies Record<string, TypeScaleEntry>

/** No 300: it fails contrast at small sizes on dark surfaces. */
export const FONT_WEIGHT = {
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
} as const

export type FontFamilyToken = keyof typeof FONT_FAMILY
export type TypeScaleToken = keyof typeof TYPE_SCALE
export type FontWeightToken = keyof typeof FONT_WEIGHT
