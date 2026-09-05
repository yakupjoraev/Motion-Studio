import type { BlockCategory } from '@motion-studio/schema'

import type { RegistryCopy } from './registry-copy.types'

export type { BlockCopy, RegistryCopy } from './registry-copy.types'

/**
 * Reading a translated string out of a table the caller already has — and **nothing else**.
 *
 * Split from `index.ts` on a measurement: the studio's first-load chunk is measured against a
 * 250 KiB budget with 0.34 kB of headroom (ADR-349), and a client component importing these four
 * functions from a module that also names `ruRegistryCopy` puts that table on the path to the
 * bundle. Here there is no path.
 *
 * Every one falls back to the definition's own string, so a gap shows English, not a key.
 */
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
