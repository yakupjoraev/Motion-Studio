'use client'

import type { BlockCategory } from '@motion-studio/schema'
import { useDeferredValue, useMemo, useState } from 'react'

import { fuzzyScore } from '../studio/command-palette/fuzzy-match'

import { CategoryChips } from './category-chips'
import type { GalleryEntry } from './gallery-index'
import { HideRule } from './hide-rule'

export interface GallerySearchProps {
  readonly index: readonly GalleryEntry[]
  readonly counts: Readonly<Record<string, number>>
}

/**
 * The catalogue's filter, over a grid it does not own.
 *
 * The cards are Server Components — `prompts/52` § Performance asks for that, and it is what keeps
 * 72 cards off the client's heap. So this island filters them the only way a client component can
 * filter server-rendered siblings: it decides which ids survive and emits one stylesheet that hides
 * the rest. No card re-renders, because no card is React's to re-render.
 *
 * The matcher is the command palette's, not a second one. A catalogue that ranked "aur" differently
 * in the gallery than in the palette would be two products wearing one name.
 */
export function GallerySearch({ index, counts }: GallerySearchProps) {
  const [query, setQuery] = useState('')
  const [categories, setCategories] = useState<ReadonlySet<BlockCategory>>(new Set())
  const deferred = useDeferredValue(query)

  const visible = useMemo(
    () => matching(index, deferred, categories),
    [categories, deferred, index],
  )
  const filtered = visible.size < index.length

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex-1" htmlFor="gallery-search">
          <span className="sr-only">Search the catalogue</span>
          <input
            autoComplete="off"
            className="h-10 w-full rounded-md border border-border bg-surface-1 px-3 text-sm outline-none placeholder:text-foreground-muted focus-visible:shadow-focus"
            id="gallery-search"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search 72 blocks by name, tag or description"
            type="search"
            value={query}
          />
        </label>

        <p
          aria-live="polite"
          className="font-mono text-2xs text-foreground-muted uppercase tracking-[0.14em]"
        >
          {filtered ? `${visible.size} of ${index.length} blocks` : `${index.length} blocks`}
        </p>
      </div>

      <CategoryChips counts={counts} onChange={setCategories} selected={categories} />

      <HideRule ids={visible} sections={sectionsWith(index, visible)} total={index.length} />
    </div>
  )
}

/** Category chips are a hard filter; the query orders what is left — the palette's rule, kept. */
function matching(
  index: readonly GalleryEntry[],
  query: string,
  categories: ReadonlySet<BlockCategory>,
): ReadonlySet<string> {
  const pool =
    categories.size === 0 ? index : index.filter((entry) => categories.has(entry.category))
  const trimmed = query.trim()

  if (trimmed === '') {
    return new Set(pool.map((entry) => entry.id))
  }

  return new Set(
    pool
      .filter(
        (entry) => fuzzyScore({ label: entry.name, keywords: [entry.keywords] }, trimmed) !== null,
      )
      .map((entry) => entry.id),
  )
}

/** A category heading with nothing under it is a heading about an empty room. */
function sectionsWith(
  index: readonly GalleryEntry[],
  visible: ReadonlySet<string>,
): ReadonlySet<string> {
  const sections = new Set<string>()

  for (const entry of index) {
    if (visible.has(entry.id)) {
      sections.add(entry.category)
    }
  }

  return sections
}
