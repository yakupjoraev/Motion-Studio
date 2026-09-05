import type { MotionChannel } from '@motion-studio/schema'

import type { PresetCopy } from './preset-copy.types'

export type { PresetCopy } from './preset-copy.types'

/**
 * Reading a translated string out of a table the caller already has — and **nothing else**, for the
 * reason `blocks/src/i18n/translate.ts` gives: a client component that imports from a module which
 * also names `ruPresetCopy` puts the whole table on the path to the studio's first-load chunk.
 *
 * Every one falls back to the catalogue's own string, so a gap shows English, not a key.
 */
export const presetName = (copy: PresetCopy | undefined, id: string, english: string): string =>
  copy?.presets[id] ?? english

export const presetControlLabel = (copy: PresetCopy | undefined, english: string): string =>
  copy?.labels[english] ?? english

export const channelName = (
  copy: PresetCopy | undefined,
  channel: MotionChannel,
  english: string,
): string => copy?.channels[channel] ?? english
