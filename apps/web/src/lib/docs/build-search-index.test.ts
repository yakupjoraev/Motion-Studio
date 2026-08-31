import { describe, expect, it } from 'vitest'

import { fuzzyScore } from '../../components/studio/command-palette/fuzzy-match'

import { buildSearchIndex, sectionSlug, serializeSearchIndex } from './build-search-index'
import { readDocs } from './read-docs'

const index = buildSearchIndex()
const payload = serializeSearchIndex(index)

describe('buildSearchIndex', () => {
  it('holds every document once', () => {
    expect(index.docs.map((doc) => doc.file)).toEqual(readDocs().map((entry) => entry.fileName))
  })

  it('stores an explicit anchor only where the heading text does not produce it', () => {
    for (const section of index.sections) {
      const derived = sectionSlug({ doc: section.doc, text: section.text })

      expect(section.slug === undefined).toBe(derived === sectionSlug(section))
    }
  })

  it('holds every h2 section and nothing deeper', () => {
    const expected = readDocs().flatMap((entry) =>
      entry.headings.filter((heading) => heading.depth === 2),
    )

    expect(index.sections).toHaveLength(expected.length)
    expect(index.sections.every((section) => section.doc < index.docs.length)).toBe(true)
  })

  it('stays under the 60 kB budget prompt 53 sets', () => {
    expect(Buffer.byteLength(payload, 'utf8')).toBeLessThan(60 * 1024)
  })

  it('carries a first paragraph as the snippet, with no markdown markers left in it', () => {
    const contract = index.docs.find((doc) => doc.file === 'ENGINEERING_CONTRACT.md')

    expect(contract?.snippet).not.toBe('')
    expect(contract?.snippet).not.toMatch(/[*`]/)
    expect(contract?.summary).toBe(
      'Start here. The rules every change obeys. Overrides every other document',
    )
  })
})

describe('searching the index', () => {
  const rank = (query: string): readonly string[] =>
    index.sections
      .map((section) => ({ section, score: fuzzyScore({ label: section.text }, query) }))
      .filter(
        (entry): entry is { section: (typeof index.sections)[number]; score: number } =>
          entry.score !== null,
      )
      .sort((a, b) => b.score - a.score)
      .map((entry) => `${index.docs[entry.section.doc]?.file}#${sectionSlug(entry.section)}`)

  it('puts the exact section first for a full-word query', () => {
    expect(rank('Reduced motion')[0]).toBe('ACCESSIBILITY.md#reduced-motion')
  })

  it('finds a section by its initials, the way the palette does', () => {
    expect(rank('drop pos res')[0]).toBe('DRAG_AND_DROP.md#drop-position-resolution')
  })

  it('returns nothing for a query no section contains', () => {
    expect(rank('zzzqqq')).toEqual([])
  })
})
