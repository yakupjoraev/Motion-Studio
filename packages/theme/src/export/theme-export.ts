import { resolveTheme } from '../resolve/resolve-theme'

import type { ColorMode } from '@motion-studio/tokens'
import type { ContrastRepair, ThemeConfig, ThemeResolution } from '../theme.types'

/**
 * `THEME_ENGINE.md` § Theme in export. The four formats are printed from one of these, so they cannot
 * disagree with each other: a document's theme is resolved once per mode here, and every printer reads
 * the result rather than re-resolving anything of its own.
 *
 * Both modes are always present, whatever `config.colorMode` says. An exported stylesheet carries a
 * `:root` block and a dark block regardless of which one the author was looking at — a theme set to
 * `light` still has to render for a visitor whose system is dark.
 */
export interface ThemeExport {
  readonly config: ThemeConfig
  readonly light: ThemeResolution
  readonly dark: ThemeResolution
}

export function resolveForExport(config: ThemeConfig): ThemeExport {
  return {
    config,
    light: resolveTheme({ ...config, colorMode: 'light' }),
    dark: resolveTheme({ ...config, colorMode: 'dark' }),
  }
}

/** The accent the exported theme actually paints with. Named because three printers state it. */
export const exportedAccent = (theme: ThemeExport, mode: ColorMode = 'light'): string =>
  theme[mode].variables['--ms-color-accent'] ?? ''

const overrideLine = (mode: ColorMode, override: ContrastRepair): string =>
  `${mode} mode: ${override.token} on ${override.against} measures ${override.measured.toFixed(2)}:1, ` +
  `under the required ${override.required}:1. Kept at the author’s request — accent step ${override.step} ` +
  `would have measured ${override.repaired.toFixed(2)}:1.`

/**
 * What every format has to say when the author declined a contrast repair — ADR-170. A comment where
 * the format has comments, a field where it does not; the sentence itself is written once, here.
 */
export function overrideNotes(theme: ThemeExport): readonly string[] {
  return [
    ...theme.light.overrides.map((override) => overrideLine('light', override)),
    ...theme.dark.overrides.map((override) => overrideLine('dark', override)),
  ]
}

/** The unresolvable pairs, which no step of the ramp can fix. Reported beside the overrides. */
export function warningNotes(theme: ThemeExport): readonly string[] {
  return [
    ...theme.light.warnings.map((warning) => `light mode: ${warning}`),
    ...theme.dark.warnings.map((warning) => `dark mode: ${warning}`),
  ]
}
