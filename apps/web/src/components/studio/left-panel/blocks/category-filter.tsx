'use client'

import { BLOCK_CATEGORIES, type BlockCategory } from '@motion-studio/schema'
import { FOCUS_RING } from '@motion-studio/ui'
import { cn } from '@motion-studio/utils'

import { categoryCounts, toggleCategory, useSelectedCategories } from './use-block-search'

const CHIP_CLASS =
  'rounded-full border px-2 py-0.5 text-[10px] transition-colors aria-pressed:border-accent aria-pressed:bg-accent-muted aria-pressed:text-foreground'

const COUNTS = categoryCounts()

/** COMPONENT_LIBRARY.md § Catalogue, in its own order — the nine categories the registry has. */
const ORDER: readonly BlockCategory[] = Object.keys(BLOCK_CATEGORIES) as BlockCategory[]

/**
 * PRODUCT.md § 2, Blocks: the categories, multi-select, with counts. A category the catalogue has no
 * block in is not shown — a chip reading "Forms 0" is a filter that can only empty the grid.
 *
 * `aria-pressed` toggles rather than a checkbox group: the chips filter a grid that is already
 * visible, and a `role="group"` of checkboxes would announce a form where there is none.
 */
export function CategoryFilter() {
  const selected = useSelectedCategories()

  return (
    <div className="flex flex-wrap gap-1" data-testid="category-filter">
      {ORDER.map((category) => {
        const count = COUNTS.get(category) ?? 0

        if (count === 0) {
          return null
        }

        const active = selected.has(category)

        return (
          <button
            aria-pressed={active}
            className={cn(
              CHIP_CLASS,
              FOCUS_RING,
              active ? 'text-foreground' : 'border-border text-foreground-muted',
            )}
            key={category}
            onClick={() => toggleCategory(category)}
            type="button"
          >
            {BLOCK_CATEGORIES[category]}{' '}
            <span className="text-foreground-subtle tabular-nums">{count}</span>
          </button>
        )
      })}
    </div>
  )
}
