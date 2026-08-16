import { describe, expect, it } from 'vitest'

import { fuzzyScore } from './fuzzy-match'

const rank = (labels: readonly string[], query: string): readonly string[] =>
  labels
    .map((label) => ({ label, score: fuzzyScore({ label }, query) }))
    .filter((entry): entry is { label: string; score: number } => entry.score !== null)
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.label)

/** The fixture SHORTCUTS.md § Command palette names, plus the cases it implies. */
describe('fuzzyScore ordering', () => {
  it('puts "Insert Hero" above "Insert Header" for "ins her"', () => {
    expect(rank(['Insert Header', 'Insert Hero'], 'ins her')[0]).toBe('Insert Hero')
  })

  it('prefers a word-boundary match over a mid-word one', () => {
    expect(rank(['Reset overrides', 'Set effect'], 'set')[0]).toBe('Set effect')
  })

  it('rewards consecutive runs', () => {
    const runs = fuzzyScore({ label: 'Duplicate' }, 'dup')
    const scattered = fuzzyScore({ label: 'Drop up cache' }, 'dup')

    expect(runs).not.toBeNull()
    expect(scattered).not.toBeNull()
    expect(runs ?? 0).toBeGreaterThan(scattered ?? 0)
  })

  it('prefers the shorter label at equal quality', () => {
    expect(rank(['Undo', 'Undo the last thing you did'], 'undo')[0]).toBe('Undo')
  })

  it('matches terms independently, so their order does not have to be the label’s', () => {
    expect(fuzzyScore({ label: 'Apply magnetic' }, 'app mag')).not.toBeNull()
    expect(fuzzyScore({ label: 'Apply magnetic' }, 'mag app')).not.toBeNull()
    // Each term still has to be a subsequence of something.
    expect(fuzzyScore({ label: 'Apply magnetic' }, 'app zzz')).toBeNull()
  })

  it('finds an item by keyword when the label does not contain the term', () => {
    expect(fuzzyScore({ label: 'Command palette', keywords: ['search'] }, 'search')).not.toBeNull()
    expect(fuzzyScore({ label: 'Command palette' }, 'search')).toBeNull()
  })

  it('scores a label hit above a keyword hit', () => {
    const byLabel = fuzzyScore({ label: 'Search layers' }, 'search')
    const byKeyword = fuzzyScore({ label: 'Command palette', keywords: ['search'] }, 'search')

    expect(byLabel ?? 0).toBeGreaterThan(byKeyword ?? 0)
  })

  it('returns null when a term matches nothing', () => {
    expect(fuzzyScore({ label: 'Insert Hero' }, 'zzz')).toBeNull()
  })

  it('matches everything on an empty query, so the palette opens full', () => {
    expect(fuzzyScore({ label: 'Anything' }, '   ')).toBe(0)
  })
})
