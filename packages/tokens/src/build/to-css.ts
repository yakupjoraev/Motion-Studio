import { BLUR } from '../primitives/blur'
import { DURATION } from '../primitives/duration'
import { EASING } from '../primitives/easing'
import { GLASS } from '../primitives/glass'
import { NOISE, NOISE_TEXTURE } from '../primitives/noise'
import { RADIUS } from '../primitives/radius'
import { SHADOW, SHADOW_STATIC } from '../primitives/shadow'
import { SPACE } from '../primitives/space'
import { FONT_FAMILY, FONT_WEIGHT, TYPE_SCALE } from '../primitives/type'
import { COLOR_MODES, SEMANTIC } from '../semantic/semantic'

import type { ElevationStyle, ShadowSet } from '../primitives/shadow'
import type { ColorMode } from '../semantic/semantic.types'

/**
 * Emits the actual token values as `--ms-*` custom properties.
 *
 * This sheet is one half of a deliberate indirection: Tailwind utilities point at these variables
 * (`to-tailwind.ts`) rather than at values, so a theme change is a variable write with zero classes
 * changed and zero components re-rendered. It is the single most important structural decision in the
 * styling layer — see `THEME_ENGINE.md` § Why it works that way. Do not collapse it into direct values.
 */

type Declaration = readonly [name: string, value: string]

interface Block {
  readonly selector: string
  readonly comment: string
  readonly declarations: readonly Declaration[]
  /** Wraps the rule in an at-rule. Used for the system colour preference — ADR-026. */
  readonly media?: string
}

const SHADOW_LEVELS = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'] as const
const ELEVATION_STYLES = ['flat', 'sharp', 'glow'] as const

/** The mode and style a bare `:root` already carries, so neither needs a block of its own. */
const DEFAULT_MODE: ColorMode = 'light'
const DEFAULT_ELEVATION: ElevationStyle = 'soft'

const colorDeclarations = (mode: ColorMode): Declaration[] =>
  Object.entries(SEMANTIC[mode]).map(([token, value]) => [`--ms-color-${token}`, value])

const shadowDeclarations = (style: ElevationStyle, mode: ColorMode): Declaration[] => {
  const set: ShadowSet = SHADOW[style][mode]

  return SHADOW_LEVELS.map((level) => [`--ms-shadow-${level}`, set[level]])
}

/**
 * Everything that does not depend on the colour mode. Scales, families, motion curves and the two
 * composed recipes: one copy in `:root`, inherited by every mode and elevation block.
 */
const modelessDeclarations = (): Declaration[] => [
  ...Object.entries(RADIUS).map(([token, value]): Declaration => [`--ms-radius-${token}`, value]),
  ...Object.entries(SPACE).map(([token, value]): Declaration => [`--ms-space-${token}`, value]),
  ...Object.entries(FONT_FAMILY).map(
    ([token, value]): Declaration => [`--ms-font-${token}`, value],
  ),
  ...Object.entries(FONT_WEIGHT).map(
    ([token, value]): Declaration => [`--ms-font-weight-${token}`, String(value)],
  ),
  ...Object.entries(TYPE_SCALE).flatMap(([token, entry]): Declaration[] => [
    [`--ms-text-${token}`, entry.size],
    [`--ms-text-${token}-line-height`, entry.lineHeight],
    [`--ms-text-${token}-tracking`, entry.tracking],
  ]),
  ...Object.entries(BLUR).map(([token, value]): Declaration => [`--ms-blur-${token}`, value]),
  // Two independent factors, not one: the theme's scale is written inline by `applyTheme`, and an
  // inline declaration outranks the media query below. Sharing one variable let a theme change put a
  // reduced-motion user back on full animation — measured, ADR-021.
  ['--ms-motion-scale', '1'],
  ['--ms-reduced-motion', '1'],
  ...Object.entries(DURATION).map(
    ([token, value]): Declaration => [
      `--ms-duration-${token}`,
      `calc(${value}ms * var(--ms-motion-scale) * var(--ms-reduced-motion))`,
    ],
  ),
  ...Object.entries(EASING).map(
    ([token, curve]): Declaration => [`--ms-ease-${token}`, `cubic-bezier(${curve.join(', ')})`],
  ),
  ...Object.entries(GLASS).flatMap(([token, recipe]): Declaration[] => [
    [`--ms-glass-${token}-filter`, recipe.backdropFilter],
    [`--ms-glass-${token}-background`, recipe.background],
    [`--ms-glass-${token}-border`, recipe.border],
  ]),
  ...Object.entries(NOISE).map(
    ([token, amount]): Declaration => [`--ms-noise-${token}`, String(amount)],
  ),
  ['--ms-noise-texture', `url("${NOISE_TEXTURE}")`],
  // Not elevation levels: identical in all four styles, so they sit outside every style block.
  ...Object.entries(SHADOW_STATIC).map(
    ([token, value]): Declaration => [`--ms-shadow-${token}`, value],
  ),
]

/**
 * Every style block names both attributes, so the cascade never has to fall back to source order.
 * `:root[data-color-mode='dark'][data-elevation='sharp']` outranks both single-attribute blocks, which
 * is what keeps a dark document on a non-default elevation style from picking up the light shadow set.
 */
const blocks = (): Block[] => [
  {
    selector: ':root',
    comment: `${DEFAULT_MODE} mode, ${DEFAULT_ELEVATION} elevation — the values a document carries with no attributes set`,
    declarations: [
      ...colorDeclarations(DEFAULT_MODE),
      ...shadowDeclarations(DEFAULT_ELEVATION, DEFAULT_MODE),
      ...modelessDeclarations(),
    ],
  },
  ...COLOR_MODES.filter((mode) => mode !== DEFAULT_MODE).flatMap((mode): Block[] => {
    const declarations = [
      ...colorDeclarations(mode),
      ...shadowDeclarations(DEFAULT_ELEVATION, mode),
    ]

    return [
      {
        selector: `:root[data-color-mode='${mode}']`,
        comment: `${mode} mode. Not an inversion: the elevation direction, the accent ladder and the status step all differ`,
        declarations,
      },
      {
        // The system preference, handled in CSS so it needs no JavaScript: a first-time visitor whose OS
        // is dark paints dark before any script runs, which leaves the blocking head script with nothing
        // to do but apply a *stored* choice. ADR-026.
        selector: ':root:not([data-color-mode])',
        comment: `${mode} mode for a root that has not been told yet — the system preference, no script involved`,
        declarations,
        media: `(prefers-color-scheme: ${mode})`,
      },
    ]
  }),
  ...ELEVATION_STYLES.flatMap((style) =>
    COLOR_MODES.map(
      (mode): Block => ({
        selector:
          mode === DEFAULT_MODE
            ? `:root[data-elevation='${style}']`
            : `:root[data-color-mode='${mode}'][data-elevation='${style}']`,
        comment: `${style} elevation, ${mode} mode`,
        declarations: shadowDeclarations(style, mode),
      }),
    ),
  ),
]

const renderBlock = (block: Block): string => {
  const indent = block.media === undefined ? '  ' : '    '
  const body = block.declarations.map(([name, value]) => `${indent}${name}: ${value};`).join('\n')
  const comment = `/* ${block.comment} */`

  if (block.media === undefined) {
    return `${comment}\n${block.selector} {\n${body}\n}`
  }

  return `${comment}\n@media ${block.media} {\n  ${block.selector} {\n${body}\n  }\n}`
}

/**
 * The environment's factor. The theme engine never writes this one — that separation is the whole
 * point of ADR-021.
 */
const REDUCED_MOTION = [
  '@media (prefers-reduced-motion: reduce) {',
  '  :root {',
  '    --ms-reduced-motion: 0;',
  '  }',
  '}',
].join('\n')

export function toCss(): string {
  return [...blocks().map(renderBlock), REDUCED_MOTION].join('\n\n')
}
