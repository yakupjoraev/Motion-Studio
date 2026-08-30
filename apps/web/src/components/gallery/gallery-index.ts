import { blockRegistry } from '@motion-studio/blocks/registry'
import { BLOCK_CATEGORIES, type BlockCategory } from '@motion-studio/schema'

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
  return blockRegistry.list().map((definition) => ({
    id: definition.id,
    name: definition.name,
    category: definition.category,
    keywords: [
      ...definition.tags,
      definition.description,
      BLOCK_CATEGORIES[definition.category],
      definition.category,
    ].join(' '),
  }))
}

/** Category → how many blocks are in it. The number on a chip, counted once on the server. */
export function galleryCounts(): Readonly<Record<string, number>> {
  const counts: Record<string, number> = {}

  for (const definition of blockRegistry.list()) {
    counts[definition.category] = (counts[definition.category] ?? 0) + 1
  }

  return counts
}
