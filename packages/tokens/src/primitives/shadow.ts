/**
 * `DESIGN_SYSTEM.md` § Elevation. Shadows are layered — a tight contact shadow plus a diffuse ambient
 * one — and mode-specific, because a black shadow on a dark surface is invisible. Dark mode adds a
 * top inner highlight instead of a stronger shadow.
 *
 * The document writes the values in a shorthand where a drop layer's colour is `oklch(0% 0 0 / a)`
 * and an `inset` layer's is `oklch(100% 0 0 / a)`. They are written out in full here, since the
 * generator emits these strings verbatim.
 */
export interface ShadowSet {
  readonly xs: string
  readonly sm: string
  readonly md: string
  readonly lg: string
  readonly xl: string
  readonly '2xl': string
}

const BLACK = (alpha: string): string => `oklch(0% 0 0 / ${alpha})`
const HIGHLIGHT = (alpha: string): string => `oklch(100% 0 0 / ${alpha})`

const SOFT_LIGHT = {
  xs: `0 1px 2px ${BLACK('0.05')}`,
  sm: `0 1px 2px ${BLACK('0.06')}, 0 1px 3px ${BLACK('0.10')}`,
  md: `0 2px 4px ${BLACK('0.06')}, 0 4px 8px ${BLACK('0.10')}`,
  lg: `0 4px 8px ${BLACK('0.06')}, 0 12px 24px ${BLACK('0.12')}`,
  xl: `0 8px 16px ${BLACK('0.06')}, 0 24px 48px ${BLACK('0.14')}`,
  '2xl': `0 16px 32px ${BLACK('0.08')}, 0 40px 80px ${BLACK('0.16')}`,
} as const satisfies ShadowSet

const SOFT_DARK = {
  xs: `inset 0 1px 0 ${HIGHLIGHT('0.04')}`,
  sm: `0 1px 2px ${BLACK('0.40')}, inset 0 1px 0 ${HIGHLIGHT('0.05')}`,
  md: `0 2px 6px ${BLACK('0.45')}, inset 0 1px 0 ${HIGHLIGHT('0.06')}`,
  lg: `0 8px 20px ${BLACK('0.50')}, inset 0 1px 0 ${HIGHLIGHT('0.07')}`,
  xl: `0 16px 40px ${BLACK('0.55')}, inset 0 1px 0 ${HIGHLIGHT('0.08')}`,
  '2xl': `0 32px 64px ${BLACK('0.60')}, inset 0 1px 0 ${HIGHLIGHT('0.09')}`,
} as const satisfies ShadowSet

/** `flat`: every level → `none`. Depth is carried by `border` alone. */
const FLAT = {
  xs: 'none',
  sm: 'none',
  md: 'none',
  lg: 'none',
  xl: 'none',
  '2xl': 'none',
} as const satisfies ShadowSet

/** `sharp` — light: the ambient layer dropped, the contact blur halved, its opacity doubled. */
const SHARP_LIGHT = {
  xs: `0 1px 1px ${BLACK('0.10')}`,
  sm: `0 1px 1px ${BLACK('0.12')}`,
  md: `0 2px 2px ${BLACK('0.12')}`,
  lg: `0 4px 4px ${BLACK('0.12')}`,
  xl: `0 8px 8px ${BLACK('0.12')}`,
  '2xl': `0 16px 16px ${BLACK('0.16')}`,
} as const satisfies ShadowSet

/** `sharp` — dark. The inset highlight goes: it belongs to a soft, layered look. */
const SHARP_DARK = {
  xs: `0 1px 1px ${BLACK('0.50')}`,
  sm: `0 1px 1px ${BLACK('0.55')}`,
  md: `0 2px 3px ${BLACK('0.60')}`,
  lg: `0 8px 10px ${BLACK('0.65')}`,
  xl: `0 16px 20px ${BLACK('0.70')}`,
  '2xl': `0 32px 32px ${BLACK('0.75')}`,
} as const satisfies ShadowSet

/**
 * The accent glow, as a percentage of `--ms-color-accent` mixed toward transparent.
 *
 * The document writes this layer as `0 0 16px var(--ms-color-accent) / 0.10`, which is shorthand: CSS
 * has no `/ alpha` on a `var()` reference. `color-mix()` is the form that does it, and it adds no
 * browser requirement the tokens do not already impose — every colour in this package is an `oklch()`
 * literal, and `oklch()` and `color-mix()` shipped in the same generation of engines.
 */
const glow = (color: string, percentage: string): string =>
  `color-mix(in oklab, ${color} ${percentage}, transparent)`

const ACCENT = 'var(--ms-color-accent)'

/**
 * `glow`: `soft`, plus an accent-tinted outer glow from `md` upward. `xs` and `sm` are `soft`
 * unchanged — a glow under 8 px of elevation reads as a rendering artefact rather than as light.
 */
const withGlow = (base: ShadowSet): ShadowSet => ({
  xs: base.xs,
  sm: base.sm,
  md: `${base.md}, 0 0 16px ${glow(ACCENT, '10%')}`,
  lg: `${base.lg}, 0 0 24px ${glow(ACCENT, '14%')}`,
  xl: `${base.xl}, 0 0 40px ${glow(ACCENT, '18%')}`,
  '2xl': `${base['2xl']}, 0 0 64px ${glow(ACCENT, '22%')}`,
})

/**
 * `theme.elevationStyle` selects one set. Each style is a stated transform of `soft`, so a change to
 * `soft` carries through instead of leaving three tables to update by hand.
 *
 * `glow` is the one style whose shadows reference a semantic colour. That is why the generator emits
 * shadows as variables rather than inlining them: changing the accent must change the glow in the
 * same frame, with no re-render.
 */
export const SHADOW = {
  flat: { light: FLAT, dark: FLAT },
  soft: { light: SOFT_LIGHT, dark: SOFT_DARK },
  sharp: { light: SHARP_LIGHT, dark: SHARP_DARK },
  glow: { light: withGlow(SOFT_LIGHT), dark: withGlow(SOFT_DARK) },
} as const satisfies Record<string, Record<'light' | 'dark', ShadowSet>>

/**
 * Not elevation levels, and identical in all four styles — a focus ring that changed with the
 * elevation style would be a focus ring that sometimes disappears. Both reference semantic colours,
 * so both resolve through the runtime variables.
 */
export const SHADOW_STATIC = {
  focus: '0 0 0 2px var(--ms-color-surface-0), 0 0 0 4px var(--ms-color-accent-ring)',
  'glow-accent': `0 0 24px ${glow(ACCENT, '35%')}, 0 0 64px ${glow(ACCENT, '15%')}`,
} as const

export type ElevationStyle = keyof typeof SHADOW
export type ShadowToken = keyof ShadowSet
export type StaticShadowToken = keyof typeof SHADOW_STATIC
