// UI_GUIDELINES.md § Density scale, transcribed. `density.test.ts` asserts it against the document.

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

/** Written out, never interpolated: Tailwind finds utilities by scanning source text. */
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

export const LABEL_COLUMN_CLASS = 'w-[88px]'

/** § Control glyphs. Each size is derived from a row above rather than chosen — ADR-030. */
export const GLYPH = {
  checkboxBox: 16,
  switchTrackWidth: 24,
  switchTrackHeight: 14,
  switchThumb: 10,
  sliderTrack: 4,
  sliderThumb: 12,
} as const

export type GlyphToken = keyof typeof GLYPH

export const GLYPH_CLASS = {
  checkboxBox: 'h-[16px] w-[16px]',
  switchTrack: 'h-[14px] w-[24px]',
  switchThumb: 'h-[10px] w-[10px]',
  sliderTrack: 'h-[4px]',
  sliderThumb: 'h-[12px] w-[12px]',
} as const

/** WCAG 2.2 AA § 2.5.8. A glyph reaches it by padding, never by growing. */
export const MIN_TARGET = DENSITY.smallButton
export const MIN_TARGET_CLASS = 'h-[24px] w-[24px]'
