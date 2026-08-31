import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { neighboursOf } from '../../lib/docs/build-nav'
import { readDocs } from '../../lib/docs/read-docs'

import { DocsBreadcrumbs } from './docs-breadcrumbs'
import { DocsPager } from './docs-pager'
import { DocsSidebar } from './docs-sidebar'
import { DocsToc } from './docs-toc'

describe('DocsSidebar', () => {
  it('lists every document and marks the current one, with no JavaScript needed to do it', () => {
    render(<DocsSidebar current="canvas" />)

    const nav = screen.getByRole('navigation', { name: 'Documentation' })
    const links = screen.getAllByRole('link')

    expect(nav).toBeVisible()
    expect(links).toHaveLength(readDocs().length)
    expect(screen.getByRole('link', { name: 'CANVAS.md' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'EDITOR_ENGINE.md' })).not.toHaveAttribute(
      'aria-current',
    )
  })

  it('marks the index as current on the index page', () => {
    render(<DocsSidebar current="" />)

    expect(screen.getByRole('link', { name: 'Index' })).toHaveAttribute('aria-current', 'page')
  })

  it('groups the documents under the five index groups, each one a disclosure', () => {
    render(<DocsSidebar current="canvas" />)

    for (const title of ['Product', 'Engineering foundations', 'Design', 'Subsystems', 'Quality']) {
      expect(screen.getByText(title)).toBeVisible()
    }

    expect(screen.getAllByRole('group')).toHaveLength(5)
  })
})

describe('DocsToc', () => {
  it('lists the h2 and h3 headings and nothing deeper', () => {
    const entry = readDocs().find((doc) => doc.slug === 'canvas')

    render(<DocsToc headings={entry?.headings ?? []} />)

    const expected = (entry?.headings ?? []).filter(
      (heading) => heading.depth === 2 || heading.depth === 3,
    )

    expect(screen.getAllByRole('link')).toHaveLength(expected.length)
    expect(screen.getByRole('navigation', { name: 'On this page' })).toBeVisible()
  })

  it('renders nothing for a document with no sections', () => {
    const { container } = render(<DocsToc headings={[{ depth: 1, text: 'X', slug: 'x' }]} />)

    expect(container).toBeEmptyDOMElement()
  })
})

describe('DocsPager', () => {
  it('names the neighbours in the index reading order', () => {
    render(<DocsPager {...neighboursOf('product')} />)

    expect(screen.getByRole('link', { name: /Previous VISION\.md/ })).toBeVisible()
    expect(screen.getByRole('link', { name: /Next ROADMAP\.md/ })).toBeVisible()
  })

  it('renders one card at the end of the order', () => {
    render(<DocsPager {...neighboursOf('devops')} />)

    expect(screen.getAllByRole('link')).toHaveLength(1)
  })
})

describe('DocsBreadcrumbs', () => {
  it('links back to the index and names the document as the current page', () => {
    render(<DocsBreadcrumbs fileName="CANVAS.md" group="Subsystems" />)

    expect(screen.getByRole('link', { name: 'Docs' })).toHaveAttribute('href', '/docs')
    expect(screen.getByText('CANVAS.md')).toHaveAttribute('aria-current', 'page')
  })
})
