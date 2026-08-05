export interface GlassRecipe {
  readonly backdropFilter: string
  readonly background: string
  readonly border: string
}

/**
 * `DESIGN_SYSTEM.md` § Blur and glass. Glass is a composed recipe, not a single value: the blur, the
 * translucent fill, and the hairline border only read as glass together.
 *
 * Three rules travel with these values and are enforced by their consumers, not here:
 * glass requires something behind it; `backdrop-filter` is capped at four simultaneous surfaces in
 * the viewport; and a `@supports not (backdrop-filter: blur(1px))` fallback resolves to an opaque
 * `surface-2`.
 */
export const GLASS = {
  subtle: {
    backdropFilter: 'blur(8px) saturate(140%)',
    background: 'oklch(100% 0 0 / 0.04)',
    border: 'oklch(100% 0 0 / 0.06)',
  },
  medium: {
    backdropFilter: 'blur(16px) saturate(160%)',
    background: 'oklch(100% 0 0 / 0.07)',
    border: 'oklch(100% 0 0 / 0.10)',
  },
  strong: {
    backdropFilter: 'blur(32px) saturate(180%)',
    background: 'oklch(100% 0 0 / 0.11)',
    border: 'oklch(100% 0 0 / 0.14)',
  },
  frosted: {
    backdropFilter: 'blur(48px) saturate(120%) brightness(110%)',
    background: 'oklch(100% 0 0 / 0.14)',
    border: 'oklch(100% 0 0 / 0.18)',
  },
} as const satisfies Record<string, GlassRecipe>

export type GlassToken = keyof typeof GLASS
