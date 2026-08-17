import { blockRegistry } from '@motion-studio/blocks/registry'
import type { BlockCategory } from '@motion-studio/schema'
import { afterEach, describe, expect, it } from 'vitest'

import {
  SEARCH_MEASURE,
  categoryCounts,
  clearCategories,
  searchBlocks,
  toggleCategory,
} from './use-block-search'

const NONE: ReadonlySet<BlockCategory> = new Set()

const ids = (query: string, categories: ReadonlySet<BlockCategory> = NONE): readonly string[] =>
  searchBlocks(query, categories).blocks.map((definition) => definition.id)

afterEach(clearCategories)

describe('searchBlocks', () => {
  it('returns the whole catalogue in registry order for an empty query', () => {
    expect(ids('')).toEqual(blockRegistry.list().map((definition) => definition.id))
  })

  it('puts a name match ahead of a description match', () => {
    const results = ids('section')

    expect(results[0]).toBe('section')
    // `heading` describes itself as "a section title", which is a hit — and must not outrank the block named it.
    expect(results.indexOf('heading')).toBeGreaterThan(0)
  })

  it('matches on a term per field, not on one string', () => {
    // "grid" is the block's name; "layout" is its category.
    expect(ids('grid layout')).toContain('grid')
  })

  it('matches a tag the name does not contain', () => {
    const tagged = blockRegistry.list().find((definition) => definition.tags.length > 0)

    expect(tagged).toBeDefined()
    expect(ids(tagged?.tags[0] ?? '')).toContain(tagged?.id)
  })

  it('returns nothing for a query no block matches', () => {
    expect(ids('zzqx')).toEqual([])
  })

  it('filters by category before it scores, and two categories are a union', () => {
    const layout = new Set<BlockCategory>(['layout'])
    const both = new Set<BlockCategory>(['layout', 'hero'])

    const layoutOnly = ids('', layout)
    const union = ids('', both)

    expect(layoutOnly.length).toBe(blockRegistry.byCategory('layout').length)
    expect(union.length).toBe(
      blockRegistry.byCategory('layout').length + blockRegistry.byCategory('hero').length,
    )
    expect(union).toEqual(expect.arrayContaining([...layoutOnly]))
  })

  /** PRODUCT.md § 2: "search returns in under 16 ms over the full registry". */
  it('searches the full registry in under 16 ms', () => {
    const runs = ['s', 'se', 'sec', 'hero', 'grid layout', 'stat', 'zzqx'].map(
      (query) => searchBlocks(query, NONE).durationMs,
    )

    expect(Math.max(...runs)).toBeLessThan(16)
  })

  it('leaves exactly one measure behind, so a profile is readable after typing', () => {
    searchBlocks('a', NONE)
    searchBlocks('ab', NONE)

    expect(performance.getEntriesByName(SEARCH_MEASURE)).toHaveLength(1)
  })
})

describe('category state', () => {
  it('counts every category the catalogue has entries in', () => {
    const counts = categoryCounts()

    expect(counts.get('layout')).toBe(blockRegistry.byCategory('layout').length)
    expect(counts.get('effects')).toBe(blockRegistry.byCategory('effects').length)
    expect([...counts.values()].reduce((total, count) => total + count, 0)).toBe(
      blockRegistry.list().length,
    )
  })

  it('toggles a chip on and back off', () => {
    toggleCategory('hero')
    expect(ids('', new Set(['hero'] as const)).length).toBeGreaterThan(0)

    toggleCategory('hero')
    expect(ids('')).toHaveLength(blockRegistry.list().length)
  })
})
