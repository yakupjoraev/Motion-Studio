'use client'

import { SearchIcon } from '@motion-studio/icons'
import { Button, EmptyState, Input } from '@motion-studio/ui'
import { useCallback, useState } from 'react'

import { BLOCK_GRID_ID, BlockGrid } from './block-grid'
import { CategoryFilter } from './category-filter'
import { clearCategories, useBlockSearch, useSelectedCategories } from './use-block-search'
import { useInsertBlock } from './use-insert-block'

/**
 * PRODUCT.md § 2, Blocks — the tab users touch first: every registry entry, searchable, filterable by
 * category, and operable from the keyboard alone. Insertion goes through the shared target resolver
 * (`use-insert-block.ts`), so a card and a paste land a block in the same place.
 */
export function BlocksTab() {
  const [query, setQuery] = useState('')
  const { blocks, query: applied } = useBlockSearch(query)
  const categories = useSelectedCategories()
  const insert = useInsertBlock()

  const filtering = applied !== '' || categories.size > 0

  const reset = useCallback(() => {
    setQuery('')
    clearCategories()
  }, [])

  return (
    <div className="flex h-full flex-col" data-testid="blocks-tab">
      <div className="flex flex-col gap-2 border-border border-b p-2">
        <Input
          aria-controls={BLOCK_GRID_ID}
          aria-label="Search blocks"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search blocks"
          prefix={<SearchIcon size={12} />}
          role="searchbox"
          type="search"
          value={query}
        />
        <CategoryFilter />
        {/* ACCESSIBILITY.md § Block palette: "8 blocks match", announced rather than only shown. */}
        <output
          aria-live="polite"
          className="px-1 text-[11px] text-foreground-muted"
          data-testid="block-count"
        >
          {filtering ? `${blocks.length} ${blocks.length === 1 ? 'block' : 'blocks'} match` : ''}
        </output>
      </div>

      <div className="min-h-0 flex-1">
        {blocks.length === 0 ? (
          <EmptyState
            action={
              <Button onClick={reset} size="sm" variant="secondary">
                Clear search
              </Button>
            }
            className="h-full"
            message={
              applied === '' ? 'No blocks in these categories.' : `No blocks match “${applied}”.`
            }
          />
        ) : (
          <BlockGrid blocks={blocks} onInsert={insert} />
        )}
      </div>
    </div>
  )
}
