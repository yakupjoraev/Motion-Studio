import { describe, expect, it } from 'vitest'

import { plainText, splitFrontmatter } from './frontmatter'

describe('splitFrontmatter', () => {
  it('reads the three keys and drops the block from the body', () => {
    const { frontmatter, body } = splitFrontmatter(
      '---\ngroup: Subsystems\norder: 4\nsummary: Registry contract\n---\n\n# COMPONENT_LIBRARY\n',
      'COMPONENT_LIBRARY.md',
    )

    expect(frontmatter).toEqual({ group: 'Subsystems', order: 4, summary: 'Registry contract' })
    expect(body).toBe('# COMPONENT_LIBRARY\n')
  })

  it('unquotes a summary that had to be quoted because it starts with emphasis', () => {
    const { frontmatter } = splitFrontmatter(
      '---\ngroup: Quality\norder: 1\nsummary: "**Start here.** The rules"\n---\n\n# X\n',
      'X.md',
    )

    expect(frontmatter?.summary).toBe('**Start here.** The rules')
  })

  it('returns no frontmatter for a document that has none', () => {
    const { frontmatter, body } = splitFrontmatter('# README\n\nText.\n', 'README.md')

    expect(frontmatter).toBeNull()
    expect(body).toBe('# README\n\nText.\n')
  })

  it.each([
    ['---\ngroup: Quality\norder: 1\n---\n\n# X\n', /missing "summary"/],
    ['---\ngroup: Quality\norder: nope\nsummary: S\n---\n\n# X\n', /positive integer/],
    [
      '---\ngroup: Quality\norder: 1\nsummary: S\nnote: hm\n---\n\n# X\n',
      /unknown frontmatter key/,
    ],
    ['---\ngroup: Quality\n', /not closed/],
  ])('throws on malformed frontmatter: %#', (raw, message) => {
    expect(() => splitFrontmatter(raw, 'X.md')).toThrow(message)
  })
})

describe('plainText', () => {
  it('drops the emphasis and code markers a title attribute would show literally', () => {
    expect(plainText('**Start here.** The `.motion` rules')).toBe('Start here. The .motion rules')
  })
})
