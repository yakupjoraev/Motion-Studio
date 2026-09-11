import { describe, expect, it } from 'vitest'

import {
  UIVERSE_CATEGORIES,
  categoryOf,
  isUiverseCategory,
  rankCategory,
  readAll,
  readCategory,
  readIndex,
} from './index'

/**
 * The catalogue is imported data, so these assert that the committed files say what the index claims
 * and that every record is usable — a silent truncation during an import is the failure that would
 * otherwise reach a page as "this category has fewer elements today".
 */
describe('the imported catalogue', () => {
  const index = readIndex()

  it('covers every declared category, and nothing else', () => {
    expect(index.categories.map((summary) => summary.category).sort()).toEqual(
      [...UIVERSE_CATEGORIES].sort(),
    )
  })

  it('holds the number of elements the index counts', () => {
    for (const summary of index.categories) {
      expect(readCategory(summary.category)).toHaveLength(summary.elements)
    }

    expect(readAll()).toHaveLength(index.total)
  })

  it('gives every element an id, an author and markup', () => {
    const broken = readAll().filter(
      (element) => element.id === '' || element.author === '' || element.html === '',
    )

    expect(broken.map((element) => element.id)).toEqual([])
  })

  it('keeps ids unique across categories', () => {
    const all = readAll()

    expect(new Set(all.map((element) => element.id)).size).toBe(all.length)
  })

  it('says which elements are Tailwind by whether they carry CSS', () => {
    const disagreeing = readAll().filter(
      (element) => (element.css === '') !== (element.styling === 'tailwind'),
    )

    expect(disagreeing.map((element) => element.id)).toEqual([])
  })

  it('names the licence and the source it was taken from', () => {
    expect(index.licence).toBe('MIT')
    expect(index.source).toBe('https://github.com/uiverse-io/galaxy')
  })
})

describe('ranking a category', () => {
  it('puts the most viewed first and the uncounted last', () => {
    const elements = readCategory('tooltips')
    const [first, second] = elements

    if (first === undefined || second === undefined) {
      throw new Error('the tooltips category is empty')
    }

    const ranked = rankCategory('tooltips', {
      collected: '2026-09-11',
      views: { [second.id]: 10, [first.id]: 900 },
    })

    expect(ranked[0]?.element.id).toBe(first.id)
    expect(ranked[0]?.views).toBe(900)
    expect(ranked[1]?.element.id).toBe(second.id)
    expect(ranked.at(-1)?.views).toBeNull()
  })

  it('falls back to a stable alphabetical order with no counts at all', () => {
    const ranked = rankCategory('notifications', null)

    // `localeCompare` and not `sort()`: the ranking orders names the way a reader reads them, so
    // `Yaya12085` sits beside `yaroslavas2001` rather than ahead of every lowercase author.
    expect(ranked.map((entry) => entry.element.id)).toEqual(
      readCategory('notifications')
        .map((element) => element.id)
        .sort((a, b) => a.localeCompare(b)),
    )
    expect(ranked.every((entry) => entry.views === null)).toBe(true)
  })
})

describe('reading a category from an id', () => {
  it('accepts a catalogue id and refuses anything else', () => {
    expect(categoryOf('buttons/someone_quick-otter-1')).toBe('buttons')
    expect(categoryOf('widgets/someone_quick-otter-1')).toBeNull()
    expect(isUiverseCategory('loaders')).toBe(true)
    expect(isUiverseCategory('Loaders')).toBe(false)
  })
})
