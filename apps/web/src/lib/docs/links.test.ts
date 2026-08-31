import { existsSync } from 'node:fs'
import { join, resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

import {
  headingAliases,
  markdownLinks,
  normalizeHeading,
  resolveLink,
  sectionReferences,
} from './cross-references'
import { docsDir, readDocs } from './read-docs'

const DOCS = docsDir()
const ROOT = resolve(DOCS, '..')
/** ADR-311: append-only by its own rules, so its abbreviated section names cannot be corrected. */
const APPEND_ONLY = 'DECISIONS.md'

const entries = readDocs()
const headingsByFile = new Map(entries.map((entry) => [entry.fileName, entry.headings]))

describe('every markdown link in docs/', () => {
  const links = entries.flatMap((entry) =>
    markdownLinks(entry.body).map((link) => ({ from: entry.fileName, ...link })),
  )

  it('is a link this build knows how to resolve', () => {
    const unresolved = links.filter((link) => resolveLink(link.target).kind === 'plain')

    expect(unresolved).toEqual([])
  })

  it('points at a file that exists', () => {
    const broken = links
      .filter((link) => !/^https?:\/\//.test(link.target) && !link.target.startsWith('#'))
      .filter((link) => {
        const [path = ''] = link.target.split('#')

        return !existsSync(join(DOCS, path)) && !existsSync(join(ROOT, path))
      })

    expect(broken).toEqual([])
  })

  it('points at an anchor that exists, when it names one', () => {
    const broken = links.flatMap((link) => {
      const [path = '', anchor] = link.target.split('#')

      if (anchor === undefined || anchor === '') {
        return []
      }

      const file = path === '' ? link.from : (path.split('/').pop() ?? '')
      const headings = headingsByFile.get(file)

      if (headings === undefined) {
        return []
      }

      return headings.some((heading) => heading.slug === anchor) ? [] : [{ ...link, anchor }]
    })

    expect(broken).toEqual([])
  })

  it('never says only "click here" or "learn more"', () => {
    const vague = links.filter((link) => /^(click here|learn more|here|this)$/i.test(link.text))

    expect(vague).toEqual([])
  })

  it('counts what it checked', () => {
    expect(links.length).toBeGreaterThanOrEqual(82)
  })
})

describe('every § section reference in docs/', () => {
  const references = entries.flatMap((entry) =>
    sectionReferences(entry.body).map((reference) => ({ from: entry.fileName, ...reference })),
  )

  it('names a document that exists', () => {
    const missing = references.filter(
      (reference) =>
        !existsSync(join(DOCS, reference.target)) && !existsSync(join(ROOT, reference.target)),
    )

    expect(missing).toEqual([])
  })

  it('names a section the target document has', () => {
    const missing = references
      .filter((reference) => reference.from !== APPEND_ONLY)
      .filter((reference) => {
        const headings = headingsByFile.get(reference.fileName)

        if (headings === undefined) {
          return false
        }

        const section = normalizeHeading(reference.section)

        return !headings.some((heading) =>
          headingAliases(heading.text).some(
            (alias) => alias !== '' && (section.startsWith(alias) || alias.startsWith(section)),
          ),
        )
      })

    expect(missing).toEqual([])
  })

  it('counts what it checked', () => {
    expect(references.length).toBeGreaterThanOrEqual(401)
  })
})

describe('resolveLink', () => {
  const files = new Set(['ACCESSIBILITY.md', 'README.md'])

  it.each([
    ['ACCESSIBILITY.md', { kind: 'doc', href: '/docs/accessibility' }],
    ['ACCESSIBILITY.md#focus', { kind: 'doc', href: '/docs/accessibility#focus' }],
    ['README.md', { kind: 'doc', href: '/docs' }],
    ['#focus', { kind: 'doc', href: '#focus' }],
    ['https://impeccable.style', { kind: 'external', href: 'https://impeccable.style' }],
    ['../CONTRIBUTING.md', { kind: 'plain' }],
    ['NOPE.md', { kind: 'plain' }],
  ])('%s', (target, expected) => {
    expect(resolveLink(target, files)).toEqual(expected)
  })
})
