import {
  BLUR,
  type ColorMode,
  DURATION,
  EASING,
  GLASS,
  NOISE,
  RADIUS,
  type RampStep,
  SHADOW,
  SHADOW_STATIC,
  SPACE,
} from '@motion-studio/tokens'

import { type PaletteRamps, buildRamps, buildSemanticColors } from './build-palette'
import { repairContrast } from './repair-contrast'
import { FONT_PAIRING, scaleTypeScale } from './typography'

import type { BorderStyle, GlassLevel, ThemeConfig, ThemeResolution } from '../theme.types'

/**
 * `ThemeConfig` → the full `--ms-*` variable set for one mode. Pure, and memoised on the config so that
 * dragging a hue slider does not regenerate identical output sixty times a second.
 *
 * `system` is resolved by the caller and passed in: reading `matchMedia` here would make the function
 * impure and untestable in `node`. `applyTheme` does the reading.
 */

/** Widths for `surface.borderStyle`. Derived, not documented — ADR-024. */
const BORDER_WIDTH: Readonly<Record<BorderStyle, string>> = {
  hairline: '1px',
  solid: '2px',
  none: '0px',
}

/** `none` is the absence of glass, which is what these three values mean literally. */
const NO_GLASS = { backdropFilter: 'none', background: 'transparent', border: 'transparent' }

const glassRecipe = (level: GlassLevel) => (level === 'none' ? NO_GLASS : GLASS[level])

const px = (value: string, scale: number): string =>
  `${Math.round(Number.parseFloat(value) * scale * 1000) / 1000}px`

function buildVariables(
  config: ThemeConfig,
  mode: ColorMode,
  ramps: PaletteRamps,
  accentStep: RampStep,
): Record<string, string> {
  const colors = buildSemanticColors(mode, ramps, accentStep)
  const type = scaleTypeScale(config.typography.baseSize)
  const pairing = FONT_PAIRING[config.typography.pairing]
  const shadows = SHADOW[config.elevationStyle][mode]
  const glass = glassRecipe(config.surface.glassLevel)

  const variables: Record<string, string> = {}

  for (const [token, value] of Object.entries(colors)) {
    variables[`--ms-color-${token}`] = value
  }
  for (const [token, value] of Object.entries(RADIUS)) {
    variables[`--ms-radius-${token}`] = px(value, config.radiusScale)
  }
  for (const [token, value] of Object.entries(SPACE)) {
    variables[`--ms-space-${token}`] = px(value, config.spacingScale)
  }

  variables['--ms-font-sans'] = pairing.sans
  variables['--ms-font-display'] = pairing.display
  variables['--ms-font-mono'] = pairing.mono
  variables['--ms-font-size-base'] = `${config.typography.baseSize}px`
  variables['--ms-font-scale-ratio'] = String(config.typography.scaleRatio)

  for (const [token, entry] of Object.entries(type)) {
    variables[`--ms-text-${token}`] = entry.size
    variables[`--ms-text-${token}-line-height`] = entry.lineHeight
    variables[`--ms-text-${token}-tracking`] = entry.tracking
  }

  for (const [token, value] of Object.entries(shadows)) {
    variables[`--ms-shadow-${token}`] = value
  }
  for (const [token, value] of Object.entries(SHADOW_STATIC)) {
    variables[`--ms-shadow-${token}`] = value
  }
  for (const [token, value] of Object.entries(BLUR)) {
    variables[`--ms-blur-${token}`] = value
  }

  // The environment's `--ms-reduced-motion` is deliberately absent: an inline write would outrank the
  // media query and put a reduced-motion user back on full animation — ADR-021.
  variables['--ms-motion-scale'] = String(config.motionScale)
  for (const [token, value] of Object.entries(DURATION)) {
    variables[`--ms-duration-${token}`] =
      `calc(${value}ms * var(--ms-motion-scale) * var(--ms-reduced-motion))`
  }
  for (const [token, curve] of Object.entries(EASING)) {
    variables[`--ms-ease-${token}`] = `cubic-bezier(${curve.join(', ')})`
  }

  variables['--ms-glass-backdrop-filter'] = glass.backdropFilter
  variables['--ms-glass-background'] = glass.background
  variables['--ms-glass-border'] = glass.border
  // `--ms-noise-texture` is absent on purpose: the asset is immutable and no config field changes it,
  // so the generated stylesheet declares it once. § Variable groups lists only the opacity for noise.
  variables['--ms-noise-opacity'] = String(NOISE[config.surface.noiseLevel])
  variables['--ms-border-width'] = BORDER_WIDTH[config.surface.borderStyle]

  return variables
}

const cache = new Map<string, ThemeResolution>()

/** ADR-174: 6.5 kB a resolution, so 128 of them is 0.83 MB — under a tenth of the studio's heap. */
export const CACHE_LIMIT = 128

/** Canonical, so two configs that differ only in key order hash the same. */
function hashConfig(config: ThemeConfig, mode: ColorMode): string {
  return JSON.stringify([
    mode,
    config.id,
    config.colorMode,
    config.palette.accent,
    config.palette.neutral,
    config.palette.accentHueShift,
    config.palette.saturation,
    config.palette.repairContrast,
    config.radiusScale,
    config.spacingScale,
    config.motionScale,
    config.elevationStyle,
    config.typography.pairing,
    config.typography.baseSize,
    config.typography.scaleRatio,
    config.surface.glassLevel,
    config.surface.noiseLevel,
    config.surface.borderStyle,
  ])
}

export interface ResolveOptions {
  /** What `system` means right now. `applyTheme` reads it from `matchMedia`. */
  readonly environmentMode?: ColorMode
}

export function resolveTheme(config: ThemeConfig, options: ResolveOptions = {}): ThemeResolution {
  const mode =
    config.colorMode === 'system' ? (options.environmentMode ?? 'light') : config.colorMode
  const key = hashConfig(config, mode)
  const cached = cache.get(key)

  if (cached !== undefined) {
    return cached
  }

  const ramps = buildRamps(config.palette)
  const repair = repairContrast(mode, ramps)
  // "Keep mine" — ADR-170. The check still runs and the failing pair is still reported; what changes
  // is which step the variables are built from, and which of the two lists the report goes into.
  const declined = !config.palette.repairContrast
  const resolution: ThemeResolution = {
    config,
    mode,
    variables: buildVariables(config, mode, ramps, declined ? ramps.accentStep : repair.accentStep),
    repairs: declined ? [] : repair.repairs,
    overrides: declined ? repair.repairs : [],
    warnings: repair.warnings,
  }

  remember(key, resolution)

  return resolution
}

/**
 * The cache is bounded because the theme builder makes its keys unbounded: a hue drag produces a new
 * config per frame, so an unbounded `Map` would grow for as long as the session lasts. Oldest-first
 * eviction, and the size is measured rather than picked — ADR-174.
 */
function remember(key: string, resolution: ThemeResolution): void {
  if (cache.size >= CACHE_LIMIT) {
    const oldest = cache.keys().next()

    if (!oldest.done) {
      cache.delete(oldest.value)
    }
  }

  cache.set(key, resolution)
}

/** Test seam: the cache is process-wide, and a memoisation test has to be able to start from empty. */
export function clearThemeCache(): void {
  cache.clear()
}
