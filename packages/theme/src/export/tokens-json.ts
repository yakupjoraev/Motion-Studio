import { overrideNotes, warningNotes } from './theme-export'

import type { ThemeExport } from './theme-export'

/**
 * The `ThemeConfig` plus the resolved values — `THEME_ENGINE.md` § Theme in export, the JSON target.
 * The config is emitted verbatim so that re-importing reproduces the theme exactly; the resolved
 * blocks are there so a consumer that does not carry this engine can still paint the same colours.
 *
 * The declined repairs travel as a field rather than as a comment, because JSON has no comments and
 * dropping them would be the silent half `THEME_ENGINE.md` § Contrast repair rules out.
 */
export function toTokensJson(theme: ThemeExport): string {
  return `${JSON.stringify(
    {
      config: theme.config,
      resolved: {
        light: { mode: theme.light.mode, variables: theme.light.variables },
        dark: { mode: theme.dark.mode, variables: theme.dark.variables },
      },
      contrastOverrides: overrideNotes(theme),
      contrastWarnings: warningNotes(theme),
    },
    null,
    2,
  )}\n`
}
