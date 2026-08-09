import { parseRichText } from '@motion-studio/schema'
import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { expectNoViolations, renderBlock } from '../../test/render-block'

import { RichText } from './rich-text'
import { richTextDefinition } from './rich-text.definition'
import { richTextSchema } from './rich-text.schema'

const definition = richTextDefinition

const from = (html: string) => ({ content: parseRichText(html) })

describe('RichText', () => {
  it('renders each mark as its own element', () => {
    const { container } = renderBlock(
      definition,
      RichText,
      from('<p><strong>bold</strong> <em>italic</em> <code>code</code></p>'),
    )

    expect(container.querySelector('strong')).toHaveTextContent('bold')
    expect(container.querySelector('em')).toHaveTextContent('italic')
    expect(container.querySelector('code')).toHaveTextContent('code')
  })

  it('renders lists as real list elements', () => {
    const { container } = renderBlock(
      definition,
      RichText,
      from('<ul><li>one</li><li>two</li></ul>'),
    )

    expect(container.querySelectorAll('ul li')).toHaveLength(2)

    const ordered = renderBlock(definition, RichText, from('<ol><li>first</li></ol>'))

    expect(ordered.container.querySelector('ol')).not.toBeNull()
  })

  it('renders a safe link as an anchor', () => {
    renderBlock(definition, RichText, from('<p><a href="/docs">the docs</a></p>'))

    expect(screen.getByRole('link', { name: 'the docs' })).toHaveAttribute('href', '/docs')
  })
})

/**
 * The four payloads, at the *rendering* boundary rather than the parsing one. The parser's own tests
 * prove the tree is clean; these prove the component cannot reintroduce markup while drawing it.
 */
describe('RichText — what reaches the DOM', () => {
  it('never uses innerHTML, so a script tag arrives as text or not at all', () => {
    const { container } = renderBlock(
      definition,
      RichText,
      from('<p>before<script>alert(1)</script>after</p>'),
    )

    expect(container.querySelector('script')).toBeNull()
    expect(container.textContent).toBe('beforeafter')
  })

  it('renders no iframe', () => {
    const { container } = renderBlock(
      definition,
      RichText,
      from('<p>a<iframe src="https://evil.test"></iframe>b</p>'),
    )

    expect(container.querySelector('iframe')).toBeNull()
    expect(container.innerHTML).not.toContain('evil.test')
  })

  it('carries no event handler attribute onto any element', () => {
    const { container } = renderBlock(definition, RichText, from('<p onclick="steal()">click</p>'))

    expect(container.innerHTML).not.toContain('onclick')
    expect(container.textContent).toBe('click')
  })

  it('renders a javascript: link as plain text with no anchor', () => {
    const { container } = renderBlock(
      definition,
      RichText,
      from('<p><a href="javascript:alert(1)">click</a></p>'),
    )

    expect(container.querySelector('a')).toBeNull()
    expect(container.textContent).toBe('click')
  })

  it('escapes text that looks like markup instead of parsing it', () => {
    const { container } = renderBlock(definition, RichText, {
      content: [
        {
          kind: 'paragraph',
          children: [{ kind: 'run', run: { text: '<img onerror="x">', marks: [] } }],
        },
      ],
    })

    expect(container.querySelector('img')).toBeNull()
    expect(container.textContent).toBe('<img onerror="x">')
  })
})

describe('RichText — the block', () => {
  it('validates its own defaults', () => {
    expect(() => richTextSchema.parse(definition.defaults)).not.toThrow()
  })

  it('has no axe violations', async () => {
    const { container } = renderBlock(definition, RichText)

    await expectNoViolations(container)
  })
})
