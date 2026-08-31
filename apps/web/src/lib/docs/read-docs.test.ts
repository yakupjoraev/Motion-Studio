import { readdirSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { INDEX_FILE, docsDir, fileNameToSlug, findDoc, readDocs } from './read-docs'

const onDisk = readdirSync(docsDir())
  .filter((name) => name.endsWith('.md'))
  .sort()

describe('readDocs', () => {
  it('picks up every markdown file in docs/', () => {
    expect(readDocs().map((entry) => entry.fileName)).toEqual(onDisk)
  })

  it('gives every document but the index a slug, a group and an order', () => {
    for (const entry of readDocs()) {
      if (entry.fileName === INDEX_FILE) {
        expect(entry.slug).toBe('')
        expect(entry.href).toBe('/docs')

        continue
      }

      expect(entry.slug).toBe(fileNameToSlug(entry.fileName))
      expect(entry.frontmatter).not.toBeNull()
    }
  })

  it('takes the page title from the document own h1', () => {
    expect(findDoc('accessibility')?.title).toBe('ACCESSIBILITY')
    expect(findDoc('engineering-contract')?.title).toBe('Motion Studio — Engineering Contract')
  })

  it('leaves no frontmatter in the body it hands the renderer', () => {
    for (const entry of readDocs()) {
      expect(entry.body.startsWith('---')).toBe(false)
      expect(entry.tokens[0]?.type).toBe('heading')
    }
  })

  it('keeps every heading at the top level of the token stream, which the anchors rely on', () => {
    for (const entry of readDocs()) {
      const inStream = entry.tokens.filter((token) => token.type === 'heading').length

      expect(inStream).toBe(entry.headings.length)
    }
  })

  it('gives each document exactly one h1', () => {
    for (const entry of readDocs()) {
      const first = entry.headings.filter((heading) => heading.depth === 1)

      expect(first, entry.fileName).toHaveLength(1)
    }
  })

  it('produces unique anchors within a document', () => {
    for (const entry of readDocs()) {
      const slugs = entry.headings.map((heading) => heading.slug)

      expect(new Set(slugs).size, entry.fileName).toBe(slugs.length)
    }
  })

  it('resolves docs/ from the working directory', () => {
    expect(docsDir()).toBe(join(process.cwd(), '..', '..', 'docs'))
  })
})
