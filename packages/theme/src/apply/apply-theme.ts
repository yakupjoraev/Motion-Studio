import { resolveTheme } from '../resolve/resolve-theme'

import type { ColorMode } from '@motion-studio/tokens'
import type { ThemeConfig, ThemeResolution } from '../theme.types'

/**
 * `THEME_ENGINE.md` § Application. One batched write, then the three data attributes the generated
 * stylesheet selects on. React is never involved — a theme change is a `style.setProperty` loop, not a
 * state update, and `apply-theme.test.tsx` asserts the render count does not move.
 */

export interface ApplyOptions {
  /** Defaults to `document.documentElement`. `<ThemeScope>` passes its own wrapper. */
  readonly root?: HTMLElement
}

/** What `system` means right now. Returns `light` where `matchMedia` is unavailable. */
export function environmentMode(): ColorMode {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return 'light'
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function applyTheme(config: ThemeConfig, options: ApplyOptions = {}): ThemeResolution {
  const root = options.root ?? document.documentElement
  const resolved = resolveTheme(config, { environmentMode: environmentMode() })

  const style = root.style
  for (const [name, value] of Object.entries(resolved.variables)) {
    style.setProperty(name, value)
  }

  root.dataset['colorMode'] = resolved.mode
  root.dataset['elevation'] = config.elevationStyle
  root.dataset['glass'] = config.surface.glassLevel

  return resolved
}

/**
 * The drag path. During a slider drag the engine writes only the affected variables, so a hue scrub is a
 * handful of property writes per frame instead of the whole set.
 *
 * A key the resolution does not carry is skipped rather than written as `undefined`: a partial write is
 * a subset of a full one, never a way to introduce a variable.
 */
export function applyThemePartial(
  keys: readonly string[],
  resolved: ThemeResolution,
  options: ApplyOptions = {},
): void {
  const style = (options.root ?? document.documentElement).style

  for (const key of keys) {
    const value = resolved.variables[key]
    if (value !== undefined) {
      style.setProperty(key, value)
    }
  }
}

/**
 * Gates the 180 ms root transition so page load never animates — `THEME_ENGINE.md` § Colour mode. Set
 * after the first paint, which is what the `requestAnimationFrame` is for: an attribute set during the
 * same frame as the initial variable write would let that write animate.
 */
export function markThemeReady(root: HTMLElement = document.documentElement): void {
  requestAnimationFrame(() => {
    root.dataset['themeReady'] = 'true'
  })
}
