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
