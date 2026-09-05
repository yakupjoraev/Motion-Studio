'use client'

import type { RegistryCopy } from '@motion-studio/blocks/i18n/translate'
import type { PresetCopy } from '@motion-studio/motion/i18n/translate'

import { createDictionaryContext } from './create-dictionary-context'
import type { Dictionary } from './dictionary'

/**
 * The studio's own two contexts, in their own module.
 *
 * Measured, not tidied: with every surface in one file, the studio's first-load chunk carried the
 * four contexts it never reads. The budget is 250 KiB and it had 0.34 kB of headroom before this
 * prompt (ADR-349), so a few hundred bytes of unused providers is the difference between meeting it
 * and missing it.
 */
const studioContext = createDictionaryContext<Dictionary['studio']>('studio')

/**
 * The two catalogues' own strings — block names, control labels, preset names — handed down from
 * the server rather than imported by the client, so an English session downloads none of them and a
 * Russian one pays for them as data in the payload instead of as JavaScript (ADR-360).
 *
 * Both are undefined in English: the definitions are already English.
 */
const registryContext = createDictionaryContext<{
  copy: RegistryCopy | undefined
  presets: PresetCopy | undefined
}>('registry')

export const StudioDictionary = studioContext.Provider
export const useStudio = studioContext.use

export const RegistryDictionary = registryContext.Provider
export const useRegistryCopy = (): RegistryCopy | undefined => registryContext.use().copy
export const usePresetCopy = (): PresetCopy | undefined => registryContext.use().presets
