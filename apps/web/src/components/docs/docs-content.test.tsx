import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { describe, expect, it } from 'vitest'

import { findDoc, readDocs } from '../../lib/docs/read-docs'

import { isDependencyGraphFence } from './architecture-diagram'
import { DocsContent } from './docs-content'

const HANDLED_BLOCKS = new Set([
  'blockquote',
  'code',
  'heading',
  'hr',
  'html',
  'list',
  'paragraph',
  'space',
  'table',
])

const renderDoc = (slug: string) => {
  const entry = findDoc(slug)

  if (entry === undefined) {
    throw new Error(`no document at ${slug}`)
  }

  return render(<DocsContent headings={entry.headings} tokens={entry.tokens} />)
}

describe('the corpus', () => {
  it('contains no block construct the renderer does not handle', () => {
    const unhandled = new Set<string>()

    for (const entry of readDocs()) {
      for (const token of entry.tokens) {
        if (!HANDLED_BLOCKS.has(token.type)) {
          unhandled.add(`${entry.fileName}: ${token.type}`)
        }
      }
    }

    expect([...unhandled]).toEqual([])
  })

  it('has exactly one fence that becomes the architecture diagram', () => {
    const matches = readDocs().flatMap((entry) =>
      entry.tokens
        .filter((token) => token.type === 'code')
        .filter((token) => isDependencyGraphFence(token.raw))
        .map(() => entry.fileName),
    )

    expect(matches).toEqual(['ARCHITECTURE.md'])
  })

  it('uses only html comments, which render as nothing', () => {
    const html = readDocs().flatMap((entry) =>
      entry.tokens.filter((token) => token.type === 'html').map((token) => token.raw),
    )

    expect(html.every((raw) => raw.trim().startsWith('<!--'))).toBe(true)
  })
})

describe('DocsContent', () => {
  it('renders a heading with an anchor a keyboard can reach and a screen reader can name', () => {
    renderDoc('accessibility')

    const anchor = screen.getByRole('link', { name: 'Link to Reduced motion' })

    expect(anchor).toHaveAttribute('href', '#reduced-motion')
    expect(screen.getByRole('heading', { name: /Reduced motion/ })).toHaveAttribute(
      'id',
      'reduced-motion',
    )
  })

  it('gives every table header a scope', () => {
    renderDoc('accessibility')

    for (const header of screen.getAllByRole('columnheader')) {
      expect(header).toHaveAttribute('scope', 'col')
    }
  })

  /**
   * The prose only: a `|` or a `**` inside a code span or a fence is content — `.next/**` is a glob
   * and `A | B` is a union type. What would be a defect is markdown syntax surviving in the text
   * around them, so the samples come out before the match.
   */
  const proseOf = (container: HTMLElement): string => {
    const clone = container.cloneNode(true) as HTMLElement

    for (const sample of clone.querySelectorAll('pre, code')) {
      sample.remove()
    }

    return clone.textContent ?? ''
  }

  it.each(['tech-stack', 'devops', 'accessibility', 'engineering-contract'])(
    'leaves no markdown syntax in the prose of %s',
    (slug) => {
      const prose = proseOf(renderDoc(slug).container)

      expect(prose).not.toMatch(/\|/)
      expect(prose).not.toMatch(/\*\*/)
      expect(prose).not.toMatch(/```/)
      expect(prose).not.toMatch(/\]\(/)
      expect(prose).not.toMatch(/^\s*[-*]\s/m)
    },
  )

  it('renders a code fence as a labelled, focusable region with a copy button', () => {
    renderDoc('devops')

    const regions = screen.getAllByRole('region')

    expect(regions.length).toBeGreaterThan(0)
    expect(regions[0]).toHaveAttribute('tabindex', '0')
    expect(screen.getAllByRole('button', { name: 'Copy' }).length).toBe(
      screen.getAllByTestId('docs-code').length,
    )
  })

  it('names every scrollable region on a page uniquely, which axe requires of landmarks', () => {
    renderDoc('architecture')

    const names = screen.getAllByRole('region').map((region) => region.getAttribute('aria-label'))

    expect(new Set(names).size).toBe(names.length)
  })

  it('replaces the dependency graph with the diagram and its text alternative', () => {
    const { container } = renderDoc('architecture')

    expect(screen.getByRole('heading', { name: 'The dependency graph as a list' })).toBeVisible()
    expect(container.querySelector('svg')).not.toBeNull()
    expect(container.textContent).toContain('apps/web depends on blocks, codegen, dnd')
  })

  it('paints the diagram only through token variables, so both colour modes are the theme own', () => {
    const { container } = renderDoc('architecture')
    const svg = container.querySelector('svg')?.outerHTML ?? ''

    expect(svg).not.toBe('')
    expect(svg).not.toMatch(/#[0-9a-f]{3,8}/i)
    expect(svg).not.toMatch(/rgba?\(|oklch\(|hsl\(/)
    expect(svg.match(/var\(--ms-color-[a-z0-9-]+\)/g)?.length ?? 0).toBeGreaterThan(10)
  })

  it('leaves no markdown markers in the table of contents or an anchor name', () => {
    const entry = findDoc('architecture')
    const withCode = (entry?.headings ?? []).find((heading) => heading.text.includes('`'))

    expect(withCode).toBeDefined()
    renderDoc('architecture')

    expect(
      screen.getByRole('link', { name: 'Link to Rendering strategy in apps/web' }),
    ).toBeVisible()
  })

  it('renders a blockquote as a note, not as a quotation', () => {
    renderDoc('engineering-contract')

    expect(screen.getByRole('complementary', { name: 'Note' })).toBeVisible()
  })

  it('keeps the checklists readable and inert', () => {
    renderDoc('accessibility')

    for (const box of screen.getAllByRole('checkbox')) {
      expect(box).toBeDisabled()
    }
  })

  it('has no axe violations on a document with tables, fences, lists and a diagram', async () => {
    const { container } = renderDoc('architecture')

    expect(await axe(container)).toHaveNoViolations()
  })
})
