import { ICON_GEOMETRY } from './geometry'

/**
 * Derived from the geometry table rather than declared beside it, so the two cannot disagree: adding a
 * glyph adds a name, and there is no second list to forget. `ICON_REGISTRY` is annotated with this type,
 * so a name with no component fails to compile; `registry.test.tsx` closes the other half of the loop by
 * asserting every icon module on disk has an entry here.
 */
export type IconName = keyof typeof ICON_GEOMETRY

export const ICON_NAMES = Object.keys(ICON_GEOMETRY) as readonly IconName[]
