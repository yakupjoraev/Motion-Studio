/**
 * `UI_GUIDELINES.md` § Density scale, as the only place a chrome height is written. The scale is a design
 * decision: "Row height 28 px with `text-xs` labels is the studio's rhythm. Everything else follows it."
 *
 * A literal `h-7` in a component would be that decision restated where nobody can find it, so components
 * read from here and `density.test.ts` asserts the numbers against the document's table.
 */
export const DENSITY = {
  topBar: 48,
  statusBar: 28,
  tabStrip: 36,
  sectionHeader: 32,
  controlRow: 28,
  input: 26,
  smallButton: 24,
  iconButton: 28,
  layerRow: 26,
  blockCard: 88,
} as const

export type DensityToken = keyof typeof DENSITY

/**
 * Tailwind arbitrary-value classes for the heights above. Written out rather than interpolated because
 * Tailwind finds utilities by scanning source text — `h-[${n}px]` produces no CSS at all.
 */
export const HEIGHT_CLASS = {
  topBar: 'h-[48px]',
  statusBar: 'h-[28px]',
  tabStrip: 'h-[36px]',
  sectionHeader: 'h-[32px]',
  controlRow: 'h-[28px]',
  input: 'h-[26px]',
  smallButton: 'h-[24px]',
  iconButton: 'h-[28px] w-[28px]',
  layerRow: 'h-[26px]',
  blockCard: 'h-[88px]',
} as const satisfies Record<DensityToken, string>

/** The label column in a control row — `UI_GUIDELINES.md` § Control rows fixes it at 88 px. */
export const LABEL_COLUMN_CLASS = 'w-[88px]'

/**
 * `UI_GUIDELINES.md` § Control glyphs: the marks drawn *inside* a row, as opposed to the rows above.
 *
 * Each number is derived from one in `DENSITY` rather than chosen — the derivations and the four rules that
 * admit them are ADR-030. The glyph is deliberately smaller than what the user hits; see `MIN_TARGET`.
 */
export const GLYPH = {
  checkboxBox: 16,
  switchTrackWidth: 24,
  switchTrackHeight: 14,
  switchThumb: 10,
  sliderTrack: 4,
  sliderThumb: 12,
} as const

export type GlyphToken = keyof typeof GLYPH

/** As with `HEIGHT_CLASS`, written out literally: Tailwind finds utilities by scanning source text. */
export const GLYPH_CLASS = {
  checkboxBox: 'h-[16px] w-[16px]',
  switchTrack: 'h-[14px] w-[24px]',
  switchThumb: 'h-[10px] w-[10px]',
  sliderTrack: 'h-[4px]',
  sliderThumb: 'h-[12px] w-[12px]',
} as const

/**
 * The smallest interactive target the chrome ships — WCAG 2.2 AA § 2.5.8, which `ACCESSIBILITY.md` adopts in
 * its first line. It is the small-button row of the density scale, and a glyph reaches it by padding rather
 * than by growing: what you see and what you hit are two different sizes on purpose.
 */
export const MIN_TARGET = DENSITY.smallButton
export const MIN_TARGET_CLASS = 'h-[24px] w-[24px]'
