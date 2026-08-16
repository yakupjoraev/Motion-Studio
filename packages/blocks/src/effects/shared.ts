import { z } from 'zod'

/**
 * What every effect in the category shares. COMPONENT_LIBRARY.md § Effects: an effect attaches to a
 * node rather than replacing it, so all thirteen are the same shape — an absolutely positioned,
 * `aria-hidden`, `pointer-events: none` layer inside the target — and differ only in what they paint.
 *
 * Built from technique, not from source: no reference implementation was adapted (ADR-144).
 */

/** Semantic colour tokens an effect may tint itself with. A raw colour would not follow the theme. */
export const EFFECT_TINTS = [
  'accent',
  'info',
  'success',
  'warning',
  'danger',
  'foreground',
] as const

export type EffectTint = (typeof EFFECT_TINTS)[number]

export const effectTint = z.enum(EFFECT_TINTS)

export const tintVar = (tint: EffectTint): string => `var(--ms-color-${tint})`

/**
 * Intensity and speed are numbers rather than scales, and the exception to ADR-106 is exact: they
 * reach the DOM as custom properties, never as class names, so nothing has to be a literal for
 * Tailwind to emit it.
 */
export const effectIntensity = z.number().min(0).max(1)

/** A multiplier on the duration tokens. `0` is not offered — a stopped effect is the reduced one. */
export const effectSpeed = z.number().min(0.25).max(3)

export const EFFECT_INTENSITY_OPTIONS = { min: 0, max: 1, step: 0.01 } as const
export const EFFECT_SPEED_OPTIONS = { min: 0.25, max: 3, step: 0.05, unit: '×' } as const

/**
 * The base layer class. `isolate` matters: a blend mode inside the effect composites against the
 * effect's own stack rather than against whatever the page put behind the node.
 */
export const EFFECT_LAYER_CLASS = 'pointer-events-none absolute inset-0 isolate overflow-hidden'

/**
 * Controls every effect offers, so the inspector reads the same for all thirteen.
 *
 * The type parameter is the *path*, not the props: a helper generic over the props would have to
 * infer them from a string argument, which infers `{ tint: any }` and then fails to assign. Naming
 * the path keeps the literal, and the definition's own `TypedControl<P>` still checks it against the
 * block's schema at the point of use.
 */
export function tintControl<Path extends string>(path: Path) {
  return {
    path,
    kind: 'select',
    label: 'Tint',
    options: { options: EFFECT_TINTS.map((value) => ({ value, label: value })) },
  } as const
}

export function intensityControl<Path extends string>(path: Path, label = 'Intensity') {
  return { path, kind: 'slider', label, options: EFFECT_INTENSITY_OPTIONS } as const
}

export function speedControl<Path extends string>(path: Path) {
  return {
    path,
    kind: 'slider',
    label: 'Speed',
    hint: 'Multiplies the duration tokens; reduced motion stops it entirely',
    options: EFFECT_SPEED_OPTIONS,
  } as const
}

/** The accessibility notes every effect repeats, plus whatever it adds of its own. */
export const EFFECT_A11Y_NOTES: readonly string[] = [
  'Decorative: aria-hidden and pointer-events: none, so it is absent from the accessibility tree and never intercepts a click.',
  'Reduced motion resolves to a static composition rather than a slower one — the layer still reads as finished when nothing moves.',
  'Nothing repeats faster than 3 Hz at any speed the schema allows.',
]

/** `capabilities` is identical bar the cost class, which is the one thing an effect really differs on. */
export const effectCapabilities = (costClass: 'cheap' | 'moderate' | 'heavy') =>
  ({
    resizable: false,
    fullWidth: true,
    requiresBackdrop: false,
    supportsMotion: [],
    costClass,
  }) as const
