import type { BlockCategory } from '@motion-studio/schema'

import type { RegistryCopy } from './registry-copy.types'
import { ruRegistryCopy } from './ru'

export type { BlockCopy, RegistryCopy } from './registry-copy.types'

/**
 * The registry's strings in another language, or `undefined` for the language the definitions are
 * already written in. `undefined` rather than an identity table is the point: English costs nothing
 * and cannot drift from the definitions, because it *is* the definitions.
 */
export function registryCopy(locale: string): RegistryCopy | undefined {
  return locale === 'ru' ? ruRegistryCopy : undefined
}

/**
 * The same answer, one chunk later. The studio is a client bundle with a 250 kB budget (ADR-349),
 * and an English session has no reason to download the Russian table — so it does not.
 */
export async function loadRegistryCopy(locale: string): Promise<RegistryCopy | undefined> {
  return locale === 'ru' ? (await import('./ru')).ruRegistryCopy : undefined
}

/** Each of these falls back to the definition's own string, so a gap shows the English, not a key. */
export const blockName = (copy: RegistryCopy | undefined, id: string, english: string): string =>
  copy?.blocks[id]?.name ?? english

export const blockDescription = (
  copy: RegistryCopy | undefined,
  id: string,
  english: string,
): string => copy?.blocks[id]?.description ?? english

export const controlLabel = (copy: RegistryCopy | undefined, english: string): string =>
  copy?.labels[english] ?? english

export const controlHint = (copy: RegistryCopy | undefined, english: string): string =>
  copy?.hints[english] ?? english

export const categoryName = (
  copy: RegistryCopy | undefined,
  category: BlockCategory,
  english: string,
): string => copy?.categories[category] ?? english
