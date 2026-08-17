'use client'

import {
  type ThemeConfig,
  type ThemeResolution,
  applyThemePartial,
  environmentMode,
  resolveTheme,
} from '@motion-studio/theme'

/**
 * The first half of the two-write pattern — `THEME_ENGINE.md` § Theme builder UI. A control writes the
 * variables it moved straight onto the root, so a hue drag repaints the document at 60 fps without a
 * single React render; the command that makes the edit undoable follows on release.
 *
 * Only the variables that actually changed are written. The engine resolves in 0.21 ms (ADR-174), so
 * the diff is cheaper than the writes it saves: a radius drag touches nine properties out of 141.
 */

export const resolveFor = (config: ThemeConfig): ThemeResolution =>
  resolveTheme(config, { environmentMode: environmentMode() })

const changedKeys = (from: ThemeResolution, to: ThemeResolution): readonly string[] =>
  Object.keys(to.variables).filter((name) => to.variables[name] !== from.variables[name])

/**
 * The three attributes `applyTheme` sets beside the variables. They are not variables, so the partial
 * write does not carry them, and the catalogue's glass and elevation rules select on them.
 */
function writeAttributes(root: HTMLElement, config: ThemeConfig, mode: string): void {
  root.dataset['colorMode'] = mode
  root.dataset['elevation'] = config.elevationStyle
  root.dataset['glass'] = config.surface.glassLevel
}

/** Applies the difference between two configs. Returns the resolution now on screen. */
export function writeThemeChange(
  from: ThemeConfig,
  to: ThemeConfig,
  root: HTMLElement = document.documentElement,
): ThemeResolution {
  const before = resolveFor(from)
  const after = resolveFor(to)

  applyThemePartial(changedKeys(before, after), after, { root })
  writeAttributes(root, to, after.mode)

  return after
}
