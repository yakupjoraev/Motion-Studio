import { BLUR } from '../primitives/blur'
import { EASING } from '../primitives/easing'
import { RADIUS } from '../primitives/radius'
import { SHADOW_STATIC } from '../primitives/shadow'
import { SPACE } from '../primitives/space'
import { FONT_FAMILY, FONT_WEIGHT, TYPE_SCALE } from '../primitives/type'
import { LIGHT } from '../semantic/light'

/**
 * Emits the `@theme` block: Tailwind's utility namespaces pointing at the runtime `--ms-*` variables,
 * never at values.
 *
 * `class="bg-surface-1 rounded-lg"` therefore resolves through `--ms-color-surface-1` and
 * `--ms-radius-lg`. Change those on the root and every element using them repaints; React is never
 * involved. Inlining a value here would break that in a way nothing else would catch.
 *
 * The key set comes from the light map because the two modes are typed `SemanticColors` and so declare
 * the same keys — a utility exists per *token*, not per mode.
 *
 * Token names pass through unchanged, including the one capital in `foreground-onAccent`: that is its
 * name in `DESIGN_SYSTEM.md`, and one name from document to utility class beats a second spelling to
 * remember. Tailwind emits `.text-foreground-onAccent` for it, verified against a real build.
 */

const SHADOW_LEVELS = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'] as const

type Mapping = readonly [tailwind: string, ms: string]

const mappings = (): Mapping[] => [
  ...Object.keys(LIGHT).map((token): Mapping => [`--color-${token}`, `--ms-color-${token}`]),
  ...Object.keys(RADIUS).map((token): Mapping => [`--radius-${token}`, `--ms-radius-${token}`]),
  ...Object.keys(SPACE).map((token): Mapping => [`--spacing-${token}`, `--ms-space-${token}`]),
  ...Object.keys(FONT_FAMILY).map((token): Mapping => [`--font-${token}`, `--ms-font-${token}`]),
  ...Object.keys(FONT_WEIGHT).map(
    (token): Mapping => [`--font-weight-${token}`, `--ms-font-weight-${token}`],
  ),
  // Tailwind reads the two `--text-*--*` modifiers as the size's paired line height and tracking, so
  // `text-base` sets all three at once instead of leaving them to be remembered separately.
  ...Object.keys(TYPE_SCALE).flatMap((token): Mapping[] => [
    [`--text-${token}`, `--ms-text-${token}`],
    [`--text-${token}--line-height`, `--ms-text-${token}-line-height`],
    [`--text-${token}--letter-spacing`, `--ms-text-${token}-tracking`],
  ]),
  ...SHADOW_LEVELS.map((level): Mapping => [`--shadow-${level}`, `--ms-shadow-${level}`]),
  ...Object.keys(SHADOW_STATIC).map(
    (token): Mapping => [`--shadow-${token}`, `--ms-shadow-${token}`],
  ),
  ...Object.keys(BLUR).map((token): Mapping => [`--blur-${token}`, `--ms-blur-${token}`]),
  ...Object.keys(EASING).map((token): Mapping => [`--ease-${token}`, `--ms-ease-${token}`]),
]

export function toTailwind(): string {
  return `@theme {\n${declarations()}\n}`
}

/**
 * The same mappings again, on any element carrying a colour mode of its own — which is what
 * `applyTheme` marks a `ThemeScope` with.
 *
 * Without this a scoped theme reaches `var(--ms-color-surface-0)` and nothing else. Tailwind's
 * `@theme` puts `--color-surface-0: var(--ms-color-surface-0)` on `:root`, CSS substitutes it *there*,
 * and every descendant inherits the already-resolved colour — so `class="bg-surface-0"` inside a
 * scope keeps the root's value however many variables the scope overwrites. Measured on
 * `/blocks/hero-centered`: switching to the light `paper` preset moved `--ms-color-surface-0` to
 * `oklch(98.5% …)` and left the painted background at `oklch(9.5% …)`. ADR-306.
 *
 * Re-declaring the aliases inside the scope makes them substitute in the scope's context instead.
 * `:root` carries the attribute too and is matched with identical values, which is why this is
 * additive rather than a second source of truth.
 */
export function toScopedTailwind(): string {
  return `[data-color-mode] {\n${declarations()}\n}`
}

const declarations = (): string =>
  mappings()
    .map(([tailwind, ms]) => `  ${tailwind}: var(${ms});`)
    .join('\n')
