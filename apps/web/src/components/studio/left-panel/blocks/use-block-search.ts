'use client'

import { blockRegistry } from '@motion-studio/blocks/registry'
import { BLOCK_CATEGORIES, type BlockCategory, type BlockDefinition } from '@motion-studio/schema'
import { useDeferredValue, useMemo, useSyncExternalStore } from 'react'

import { type FuzzyTarget, fuzzyScore } from '../../command-palette/fuzzy-match'

/** Reads in a profile next to the command palette's own entries — PERFORMANCE.md § In development. */
export const SEARCH_MEASURE = 'block-palette-search'

const CATALOGUE = blockRegistry.list()

/**
 * Prompt 37 § Search: name, tags, description and category, scored by the palette's own matcher
 * rather than a second one. The keyword list is built once — the registry is assembled from static
 * imports and cannot change while the app runs, so rebuilding it per keystroke would be work with a
 * constant answer.
 */
const TARGETS: ReadonlyMap<string, FuzzyTarget> = new Map(
  CATALOGUE.map((definition) => [
    definition.id,
    {
      label: definition.name,
      keywords: [
        ...definition.tags,
        definition.description,
        BLOCK_CATEGORIES[definition.category],
        definition.category,
      ],
    },
  ]),
)

export interface BlockSearchState {
  readonly blocks: readonly BlockDefinition[]
  /** The query the results describe. Deferred, so a count never contradicts the grid beside it. */
  readonly query: string
  /** Milliseconds the last filter took. The 16 ms budget of PRODUCT.md § 2 is asserted on it. */
  readonly durationMs: number
}

/**
 * Filter then score. Category chips are a hard filter — a user who selected "Layout" is not asking
 * for the best match in the catalogue — and the query orders what is left.
 */
export function searchBlocks(
  query: string,
  categories: ReadonlySet<BlockCategory>,
): BlockSearchState {
  const start = performance.now()
  const pool =
    categories.size === 0
      ? CATALOGUE
      : CATALOGUE.filter((definition) => categories.has(definition.category))
  const trimmed = query.trim()
  const blocks = trimmed === '' ? pool : rank(pool, trimmed)
  const end = performance.now()

  // Cleared first: a measure per keystroke would otherwise fill the buffer with the same entry.
  performance.clearMeasures(SEARCH_MEASURE)
  performance.measure(SEARCH_MEASURE, { start, end })

  return { blocks, query: trimmed, durationMs: end - start }
}

/** `Array.prototype.sort` is stable, so blocks that score the same stay in catalogue order. */
function rank(pool: readonly BlockDefinition[], query: string): readonly BlockDefinition[] {
  const scored: { definition: BlockDefinition; score: number }[] = []

  for (const definition of pool) {
    const score = fuzzyScore(TARGETS.get(definition.id) ?? { label: definition.name }, query)

    if (score !== null) {
      scored.push({ definition, score })
    }
  }

  return scored.sort((a, b) => b.score - a.score).map((entry) => entry.definition)
}

/**
 * `useDeferredValue` on the query — the input renders on the keystroke and the grid catches up in a
 * lower-priority render. Filtering 35 blocks does not need it; a catalogue of 70 with a thumbnail per
 * card does, and this is the surface PRODUCT.md § 2 gives a 16 ms budget to.
 */
export function useBlockSearch(query: string): BlockSearchState {
  const deferred = useDeferredValue(query)
  const categories = useSelectedCategories()

  return useMemo(() => searchBlocks(deferred, categories), [categories, deferred])
}

/** How many of the whole catalogue sit in each category — the number on a chip. */
export function categoryCounts(): ReadonlyMap<BlockCategory, number> {
  const counts = new Map<BlockCategory, number>()

  for (const definition of CATALOGUE) {
    counts.set(definition.category, (counts.get(definition.category) ?? 0) + 1)
  }

  return counts
}

/*
 * Selected chips are session state, held in this module — the same treatment the editing-scope hint
 * gets in ADR-165. A filter is not part of the document (it changes nothing that exports) and it is
 * not a preference either: a filter still on tomorrow reads as an empty catalogue.
 */
const listeners = new Set<() => void>()
let selected: ReadonlySet<BlockCategory> = new Set()

const notify = (): void => {
  for (const listener of listeners) {
    listener()
  }
}

export function toggleCategory(category: BlockCategory): void {
  const next = new Set(selected)

  if (!next.delete(category)) {
    next.add(category)
  }

  selected = next
  notify()
}

export function clearCategories(): void {
  if (selected.size === 0) {
    return
  }

  selected = new Set()
  notify()
}

const subscribe = (listener: () => void): (() => void) => {
  listeners.add(listener)

  return () => {
    listeners.delete(listener)
  }
}

const EMPTY: ReadonlySet<BlockCategory> = new Set()

/** The server render has no session, so it filters nothing — the same answer as a fresh tab. */
export const useSelectedCategories = (): ReadonlySet<BlockCategory> =>
  useSyncExternalStore(
    subscribe,
    () => selected,
    () => EMPTY,
  )
