import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { GROUP_ORDER, buildNav, neighboursOf, readingOrder } from './build-nav'
import { INDEX_FILE, docsDir, readDocs } from './read-docs'

interface ParsedGroup {
  readonly title: string
  readonly items: readonly { readonly label: string; readonly summary: string }[]
}

/**
 * The index tables are generated from the same frontmatter the nav reads, and this parses the
 * committed file back. It is the cross-check prompt 53 asks for: the generator and the nav share no
 * code, so a drift in either one shows up here.
 */
function parseIndex(): readonly ParsedGroup[] {
  const raw = readFileSync(join(docsDir(), INDEX_FILE), 'utf8').replace(/\r\n/g, '\n')
  const index = raw.slice(raw.indexOf('## Index\n'), raw.indexOf('\n## Reading paths'))
  const groups: ParsedGroup[] = []

  for (const line of index.split('\n')) {
    const heading = /^### (.+)$/.exec(line)

    if (heading !== null) {
      groups.push({ title: heading[1] ?? '', items: [] })

      continue
    }

    const row = /^\| \[([^\]]+)\]\([^)]+\) \| (.+) \|$/.exec(line)
    const group = groups.at(-1)

    if (row !== null && group !== undefined) {
      ;(group.items as { label: string; summary: string }[]).push({
        label: row[1] ?? '',
        summary: row[2] ?? '',
      })
    }
  }

  return groups
}

describe('buildNav', () => {
  it('produces the same groups, in the same order, as the index in docs/README.md', () => {
    const parsed = parseIndex()

    expect(
      buildNav().map((group) => ({
        title: group.title,
        items: group.items.map((item) => ({ label: item.label, summary: item.summary })),
      })),
    ).toEqual(parsed)
  })

  it('covers every document that has frontmatter, and only those', () => {
    const inNav = buildNav().flatMap((group) => group.items.map((item) => item.label))
    const withFrontmatter = readDocs()
      .filter((entry) => entry.frontmatter !== null)
      .map((entry) => entry.fileName)

    expect([...inNav].sort()).toEqual([...withFrontmatter].sort())
  })

  it('names the five groups the index names', () => {
    expect(buildNav().map((group) => group.title)).toEqual([...GROUP_ORDER])
  })

  it('rejects a group the index does not have', () => {
    const entries = [
      {
        ...(readDocs()[0] as ReturnType<typeof readDocs>[number]),
        frontmatter: { group: 'Miscellaneous', order: 1, summary: 'x' },
      },
    ]

    expect(() => buildNav(entries)).toThrow(/not one of the five index groups/)
  })

  it('rejects two documents claiming the same order in one group', () => {
    const first = readDocs().find((entry) => entry.frontmatter !== null)
    const entries = [
      { ...first, frontmatter: { group: 'Product', order: 1, summary: 'a' } },
      { ...first, frontmatter: { group: 'Product', order: 1, summary: 'b' } },
    ] as ReturnType<typeof readDocs>

    expect(() => buildNav(entries)).toThrow(/same order/)
  })
})

describe('readingOrder', () => {
  it('starts at the index and then follows the nav', () => {
    const order = readingOrder()

    expect(order[0]?.slug).toBe('')
    expect(order[1]?.fileName).toBe('VISION.md')
    expect(order.at(-1)?.fileName).toBe('DEVOPS.md')
    expect(order).toHaveLength(readDocs().length)
  })
})

describe('neighboursOf', () => {
  it('gives the previous and next document in reading order', () => {
    const { previous, next } = neighboursOf('product')

    expect(previous?.fileName).toBe('VISION.md')
    expect(next?.fileName).toBe('ROADMAP.md')
  })

  it('has no previous at the index and no next at the last document', () => {
    expect(neighboursOf('').previous).toBeUndefined()
    expect(neighboursOf('devops').next).toBeUndefined()
  })
})
