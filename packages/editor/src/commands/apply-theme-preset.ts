import { PRESETS, type PresetId } from '@motion-studio/theme'

import type { Command } from './command.types'

export interface ApplyThemePresetPayload {
  readonly id: PresetId
}

/**
 * Replaces the document's theme wholesale — including the colour mode, because `studio-dark` and
 * `studio-light` are two presets rather than one preset with a switch. Not coalesced: picking three
 * presets in a row is three things a user may want to step back through.
 *
 * There is no unknown-id guard because there is no unknown id: `PresetId` is `keyof typeof PRESETS`,
 * so the lookup is total and a guard would be a branch no test could reach.
 */
export function applyThemePreset(
  payload: ApplyThemePresetPayload,
): Command<ApplyThemePresetPayload> {
  return {
    type: 'applyThemePreset',
    label: `Apply ${PRESETS[payload.id].name} theme`,
    payload,
    apply(draft) {
      draft.theme = PRESETS[payload.id]
    },
  }
}
