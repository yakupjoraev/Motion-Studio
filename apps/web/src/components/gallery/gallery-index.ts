import { blockName, categoryName, registryCopy } from '@motion-studio/blocks/i18n'
import { blockRegistry } from '@motion-studio/blocks/registry'
import { BLOCK_CATEGORIES, type BlockCategory } from '@motion-studio/schema'

import { getRequestLocale } from '../../lib/i18n/request-locale'

/**
 * What the client needs to filter the catalogue, and nothing else.
 *
 * The registry is 44.5 kB gzip of definitions with a Zod schema in each one (ADR-292), and a search
 * box that imported it would put all of that in the list page's bundle to answer "does this name
 * contain 'aur'". So the index is built on the server, flattened to strings, and handed over: five
 * fields per block instead of a schema per block.
 */
export interface GalleryEntry {
  readonly id: string
  readonly name: string
  readonly category: BlockCategory
  /** Name, tags, description and category label, joined once here rather than per keystroke there. */
  readonly keywords: string
}

export function galleryIndex(): readonly GalleryEntry[] {
  const copy = registryCopy(getRequestLocale())

  /*
   * The keywords keep the English name and tags beside the translated ones: a developer who knows
   * the block as `hero-split` should find it by typing that, in either language.
   */
  return blockRegistry.list().map((definition) => ({
    id: definition.id,
    name: blockName(copy, definition.id, definition.name),
    category: definition.category,
    keywords: [
      ...definition.tags,
      definition.name,
      definition.description,
      blockName(copy, definition.id, definition.name),
      categoryName(copy, definition.category, BLOCK_CATEGORIES[definition.category]),
      BLOCK_CATEGORIES[definition.category],
      definition.category,
    ].join(' '),
  }))
}

/** Category → its name in the current language. Nine strings for the chip row. */
export function galleryCategoryLabels(): Readonly<Record<BlockCategory, string>> {
  const copy = registryCopy(getRequestLocale())
  const named = (category: BlockCategory): string =>
    categoryName(copy, category, BLOCK_CATEGORIES[category])

  // Written out rather than built in a loop: the compiler is then what says a new category has no
  // name yet, which is the whole reason `BlockCategory` is a union and not a string.
  return {
    layout: named('layout'),
    hero: named('hero'),
    content: named('content'),
    marketing: named('marketing'),
    navigation: named('navigation'),
    interactive: named('interactive'),
    data: named('data'),
    forms: named('forms'),
    effects: named('effects'),
  }
}

/** Category → how many blocks are in it. The number on a chip, counted once on the server. */
export function galleryCounts(): Readonly<Record<string, number>> {
  const counts: Record<string, number> = {}

  for (const definition of blockRegistry.list()) {
    counts[definition.category] = (counts[definition.category] ?? 0) + 1
  }

  return counts
}
