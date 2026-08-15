'use client'

import { SearchIcon } from '@motion-studio/icons'
import { Input } from '@motion-studio/ui'

import { LAYERS_TREE_ID } from './layers-tree'

export interface LayersSearchProps {
  readonly value: string
  readonly onChange: (value: string) => void
  /** Rows that matched, not rows listed: the ancestors shown to reach them are not results. */
  readonly matchCount: number
  readonly searching: boolean
}

/**
 * ACCESSIBILITY.md § Block palette states the pattern this follows: a `searchbox` that names the list
 * it filters and a live count beside it, because a filter with no feedback reads as a broken list.
 */
export function LayersSearch({ value, onChange, matchCount, searching }: LayersSearchProps) {
  return (
    <div className="flex flex-col gap-1 border-border border-b p-2">
      <Input
        aria-controls={LAYERS_TREE_ID}
        aria-label="Search layers"
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search layers"
        prefix={<SearchIcon size={12} />}
        role="searchbox"
        type="search"
        value={value}
      />
      <output aria-live="polite" className="px-1 text-[11px] text-foreground-muted">
        {searching ? `${matchCount} ${matchCount === 1 ? 'layer' : 'layers'} match` : ''}
      </output>
    </div>
  )
}
