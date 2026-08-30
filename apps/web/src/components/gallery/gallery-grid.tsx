import { blockRegistry } from '@motion-studio/blocks/registry'
import { BLOCK_CATEGORIES, type BlockCategory } from '@motion-studio/schema'

import { GalleryCard } from './gallery-card'

const CATEGORIES = Object.keys(BLOCK_CATEGORIES) as readonly BlockCategory[]

/**
 * The catalogue, in the order COMPONENT_LIBRARY.md § Catalogue lists it — the same order the studio's
 * palette shows, because a developer who learns one has learned the other.
 *
 * Every card is server-rendered. `data-block-section` is the handle the search box hides a heading
 * by when nothing under it matched.
 */
export function GalleryGrid() {
  return (
    <div className="flex flex-col gap-14">
      {CATEGORIES.map((category) => {
        const blocks = blockRegistry.byCategory(category)

        if (blocks.length === 0) {
          return null
        }

        return (
          <section
            aria-labelledby={`category-${category}`}
            data-block-section={category}
            key={category}
          >
            <h2
              className="border-border-subtle border-b pb-3 font-mono text-2xs text-foreground-muted uppercase tracking-[0.18em]"
              id={`category-${category}`}
            >
              {BLOCK_CATEGORIES[category]}
              <span className="ml-2 tabular-nums">{blocks.length}</span>
            </h2>

            <div className="grid gap-4 pt-6 sm:grid-cols-2 lg:grid-cols-3">
              {blocks.map((definition) => (
                <GalleryCard definition={definition} key={definition.id} />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
