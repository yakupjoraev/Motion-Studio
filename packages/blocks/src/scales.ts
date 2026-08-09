import { z } from 'zod'

/**
 * ADR-106: size-like props are names from the token scale, not free numbers, because a class has to
 * be a literal for Tailwind to emit it and for the exported project to compile.
 *
 * One vocabulary for every block: a user who has learned `md` on a section knows it on a container.
 */
export const SPACE_SCALE = ['none', 'xs', 'sm', 'md', 'lg', 'xl'] as const

export type SpaceScale = (typeof SPACE_SCALE)[number]

export const spaceScale = z.enum(SPACE_SCALE)

/**
 * The same spacing, in pixels, for the surfaces that need a number rather than a class — the canvas
 * padding overlay is the first. `scales.test.ts` asserts each entry against the class the block
 * actually spends, so the two cannot drift apart in silence.
 */
export const SPACE_PX: Readonly<Record<SpaceScale, number>> = {
  none: 0,
  xs: 8,
  sm: 16,
  md: 24,
  lg: 40,
  xl: 56,
}

export const MAX_WIDTH_SCALE = ['sm', 'md', 'lg', 'xl', 'full'] as const

export type MaxWidthScale = (typeof MAX_WIDTH_SCALE)[number]

export const maxWidthScale = z.enum(MAX_WIDTH_SCALE)

/** Token names rather than colours: a document repaints when the theme changes — DESIGN_SYSTEM.md. */
export const SURFACE_TOKENS = ['transparent', 'surface-0', 'surface-1', 'surface-2'] as const

export type SurfaceToken = (typeof SURFACE_TOKENS)[number]

export const surfaceToken = z.enum(SURFACE_TOKENS)

export const ALIGNMENTS = ['start', 'center', 'end'] as const

export type Alignment = (typeof ALIGNMENTS)[number]

export const alignment = z.enum(ALIGNMENTS)

/** The options an inspector control shows, built from a scale so the two cannot drift. */
export const optionsFrom = (
  values: readonly string[],
): readonly { readonly value: string; readonly label: string }[] =>
  values.map((value) => ({ value, label: value }))
