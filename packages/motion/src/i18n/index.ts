import type { PresetCopy } from './preset-copy.types'
import { ruPresetCopy } from './ru'

export type { PresetCopy } from './preset-copy.types'
export { channelName, presetControlLabel, presetName } from './translate'

/**
 * The catalogue's strings in another language, or `undefined` for the language the presets are
 * already written in. `undefined` rather than an identity table for the reason `registryCopy` gives:
 * English costs nothing and cannot drift from the catalogue, because it *is* the catalogue.
 *
 * **Server side.** A client component takes the table as a prop and reads it with `./translate`.
 */
export function presetCopy(locale: string): PresetCopy | undefined {
  return locale === 'ru' ? ruPresetCopy : undefined
}
