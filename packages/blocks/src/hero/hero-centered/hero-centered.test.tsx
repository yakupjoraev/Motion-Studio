import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { expectNoViolations, renderBlock } from '../../test/render-block'

import { HeroCentered } from './hero-centered'
import { heroCenteredDefinition } from './hero-centered.definition'
import { heroCenteredSchema } from './hero-centered.schema'

const definition = heroCenteredDefinition

describe('HeroCentered', () => {
  it('renders exactly one h1, and it is the headline', () => {
    renderBlock(definition, HeroCentered)

    const headings = screen.getAllByRole('heading', { level: 1 })

    expect(headings).toHaveLength(1)
    expect(headings[0]).toHaveTextContent(definition.defaults.headline)
  })

  it('renders a link for a CTA with a href and a button for one without', () => {
    renderBlock(definition, HeroCentered, {
      actions: [
        { label: 'Docs', href: '/docs', variant: 'primary' },
        { label: 'Play', href: '', variant: 'ghost' },
      ],
    })

    expect(screen.getByRole('link', { name: 'Docs' })).toHaveAttribute('href', '/docs')
    expect(screen.getByRole('button', { name: 'Play' })).toHaveAttribute('type', 'button')
  })

  it('hides the eyebrow line rather than rendering an empty one', () => {
    const { container } = renderBlock(definition, HeroCentered, { eyebrow: '' })

    expect(container.querySelectorAll('p')).toHaveLength(1)
  })

  it('keeps the glow out of the accessibility tree and out of the paint order', () => {
    const { container } = renderBlock(definition, HeroCentered)

    const glow = screen.getByTestId('hero-glow')
    const heading = screen.getByRole('heading', { level: 1 })

    expect(glow).toHaveAttribute('aria-hidden', 'true')
    expect(glow).toBeEmptyDOMElement()
    expect(
      heading.compareDocumentPosition(glow) & Node.DOCUMENT_POSITION_FOLLOWING,
      'the decorative layer must come after the text in DOM order',
    ).toBeTruthy()
    expect(container).toBeTruthy()
  })

  it('drops the glow when it is switched off', () => {
    renderBlock(definition, HeroCentered, { glow: false })

    expect(screen.queryByTestId('hero-glow')).toBeNull()
  })

  it('validates its own defaults', () => {
    expect(() => heroCenteredSchema.parse(definition.defaults)).not.toThrow()
  })

  it('has no axe violations', async () => {
    const { container } = renderBlock(definition, HeroCentered)

    await expectNoViolations(container)
  })
})
