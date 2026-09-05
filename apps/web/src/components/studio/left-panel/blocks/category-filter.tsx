'use client'

import { BLOCK_CATEGORIES, type BlockCategory } from '@motion-studio/schema'

import { FilterChips } from '../filter-chips'

import { categoryCounts, toggleCategory, useSelectedCategories } from './use-block-search'

const COUNTS = categoryCounts()

/** COMPONENT_LIBRARY.md § Catalogue, in its own order — the nine categories the registry has. */
const ORDER: readonly BlockCategory[] = Object.keys(BLOCK_CATEGORIES) as BlockCategory[]

const CHIPS = ORDER.map((category) => ({
  id: category,
  label: BLOCK_CATEGORIES[category],
  count: COUNTS.get(category) ?? 0,
}))

/**
 * PRODUCT.md § 2, Blocks: the categories, multi-select, with counts. A category the catalogue has no
 * block in is not shown — a chip reading "Forms 0" is a filter that can only empty the grid.
 *
 * The chips themselves are `FilterChips`, shared with the Motion tab since ADR-355: two catalogue
 * tabs with two different filters is a thing to learn twice.
 */
export function CategoryFilter() {
  return (
    <FilterChips
      chips={CHIPS}
      label="Block categories"
      onToggle={(id) => toggleCategory(id as BlockCategory)}
      selected={useSelectedCategories() as ReadonlySet<string>}
      testId="category-filter"
    />
  )
}
