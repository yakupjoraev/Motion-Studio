import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { expectNoViolations, renderBlock } from '../../test/render-block'

import { Quote } from './quote'
import { quoteDefinition } from './quote.definition'
import { quoteSchema } from './quote.schema'

const definition = quoteDefinition

describe('Quote', () => {
  it('keeps the attribution outside the blockquote', () => {
    const { container } = renderBlock(definition, Quote, {
      quote: 'It exports what I would have written.',
      author: 'Priya Raman',
    })

    const blockquote = screen.getByTestId('quote-text')

    expect(blockquote.tagName).toBe('BLOCKQUOTE')
    expect(blockquote).toHaveTextContent('It exports what I would have written.')
    expect(blockquote).not.toHaveTextContent('Priya Raman')
    expect(container.querySelector('figcaption')).toHaveTextContent('Priya Raman')
  })

  it('draws the author’s initial when there is no avatar', () => {
    renderBlock(definition, Quote, { author: 'Priya Raman', avatar: '' })

    expect(screen.getByTestId('quote-initial')).toHaveTextContent('P')
    expect(screen.queryByTestId('quote-avatar')).toBeNull()
  })

  it('gives the avatar an empty alt, because the name is already beside it', () => {
    renderBlock(definition, Quote, { avatar: '/priya.jpg', author: 'Priya Raman' })

    expect(screen.getByTestId('quote-avatar')).toHaveAttribute('alt', '')
  })

  it('hides the decorative glyph from the accessibility tree', () => {
    renderBlock(definition, Quote, { mark: 'glyph' })

    expect(screen.getByTestId('quote-glyph')).toHaveAttribute('aria-hidden', 'true')
  })

  it('drops the rule when the mark is off', () => {
    const { container } = renderBlock(definition, Quote, { mark: 'none' })

    expect(container.querySelector('figure')?.className).not.toContain('border-l-2')
    expect(screen.queryByTestId('quote-glyph')).toBeNull()
  })

  it('renders no caption at all when nobody is credited', () => {
    const { container } = renderBlock(definition, Quote, { author: '', role: '' })

    expect(container.querySelector('figcaption')).toBeNull()
  })

  it('validates its own defaults', () => {
    expect(() => quoteSchema.parse(definition.defaults)).not.toThrow()
  })

  it('has no axe violations', async () => {
    const { container } = renderBlock(definition, Quote, { avatar: '/priya.jpg' })

    await expectNoViolations(container)
  })
})
