import { type ThemeConfig, themeConfigSchema } from '@motion-studio/theme'
import { MotionStudioError } from '@motion-studio/utils'

import type { Command } from './command.types'

export const INVALID_THEME = 'INVALID_THEME'

export interface SetThemePayload {
  readonly theme: ThemeConfig
}

/**
 * Replaces the document's theme with a config the ten shipped presets do not contain — a preset the
 * user saved, or one that arrived with an imported file. ADR-173: `applyThemePreset` stays a total
 * lookup over `PresetId`, and this is the command for everything else.
 *
 * Parsed rather than trusted, because the config comes from `localStorage` or a file: a stored theme
 * written by an older build has no `palette.repairContrast`, and the schema's default is what supplies
 * it. Not coalesced — applying two themes in a row is two things to step back through.
 */
export function setTheme(payload: SetThemePayload): Command<SetThemePayload> {
  return {
    type: 'setTheme',
    label: `Apply ${payload.theme.name} theme`,
    payload,
    apply(draft) {
      const parsed = themeConfigSchema.safeParse(payload.theme)

      if (!parsed.success) {
        throw new MotionStudioError(
          `Not a valid theme: ${payload.theme.name}`,
          INVALID_THEME,
          parsed.error,
        )
      }

      draft.theme = parsed.data
    },
  }
}
