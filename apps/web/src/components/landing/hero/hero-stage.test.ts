import { blockRegistry } from '@motion-studio/blocks'
import { describe, expect, it } from 'vitest'

import { DRAGGED_BLOCK, STAGE_PAGE } from './hero-stage'

/**
 * The hero names four blocks by id, and it names them here rather than importing the registry — the
 * registry is 44.5 kB gzip of definitions (ADR-292) and the landing's budget is 120 kB for the whole
 * page. The cost of a hardcoded list is that it can drift, so this is the test that does not let it:
 * the same trade `landing-stats.test.ts` makes for the three numbers under the hero.
 */
describe('the hero stage', () => {
  const named = [...STAGE_PAGE, DRAGGED_BLOCK]

  it.each(named)('renders $id, which the catalogue has in $category', ({ id, category }) => {
    const definition = blockRegistry.get(id)

    expect(definition, `no block is registered as “${id}”`).toBeDefined()
    expect(definition?.category).toBe(category)
  })

  it('leaves the page without a hero, because the card is the one that fills it', () => {
    const categories = STAGE_PAGE.map((block) => block.category)

    expect(categories).not.toContain('hero')
    expect(DRAGGED_BLOCK.category).toBe('hero')
  })
})
