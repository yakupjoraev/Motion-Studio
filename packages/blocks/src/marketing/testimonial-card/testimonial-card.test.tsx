import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { expectNoViolations, renderBlock } from '../../test/render-block'

import { TestimonialCard } from './testimonial-card'
import { testimonialCardDefinition as definition } from './testimonial-card.definition'
import { attributionLine } from './testimonial-card.schema'

describe('attributionLine', () => {
  it('joins a role and a company', () => {
    expect(attributionLine('Staff engineer', 'Northwind')).toBe('Staff engineer, Northwind')
  })

  it('drops the separator when one half is missing', () => {
    expect(attributionLine('Staff engineer', '')).toBe('Staff engineer')
    expect(attributionLine('', 'Northwind')).toBe('Northwind')
    expect(attributionLine('', '')).toBe('')
  })
})

describe('TestimonialCard', () => {
  it('is a figure holding a blockquote and its caption', () => {
    renderBlock(definition, TestimonialCard)

    const figure = screen.getByTestId('testimonial-card')

    expect(figure.tagName).toBe('FIGURE')
    expect(figure.querySelector('blockquote')).not.toBeNull()
    expect(figure.querySelector('figcaption')).not.toBeNull()
  })

  it('keeps the attribution outside the quotation', () => {
    renderBlock(definition, TestimonialCard)

    expect(screen.getByTestId('testimonial-quote').textContent).not.toContain(
      definition.defaults.author,
    )
  })

  it('draws the initial when there is no photo', () => {
    renderBlock(definition, TestimonialCard)

    expect(screen.getByTestId('testimonial-initial')).toHaveTextContent('P')
    expect(screen.queryByTestId('testimonial-avatar')).toBeNull()
  })

  it('shows the photo without describing it twice', () => {
    renderBlock(definition, TestimonialCard, { avatar: 'https://example.test/priya.jpg' })

    expect(screen.getByTestId('testimonial-avatar')).toHaveAttribute('alt', '')
    expect(screen.queryByTestId('testimonial-initial')).toBeNull()
  })

  it('gives the company logo its own description', () => {
    renderBlock(definition, TestimonialCard, {
      logo: 'https://example.test/northwind.svg',
      logoAlt: 'Northwind',
    })

    expect(screen.getByTestId('testimonial-logo')).toHaveAttribute('alt', 'Northwind')
  })

  it('renders no attribution row at all when nobody is credited', () => {
    renderBlock(definition, TestimonialCard, { author: '', role: '', company: '' })

    expect(screen.getByTestId('testimonial-card').querySelector('figcaption')).toBeNull()
  })

  it('scopes a container query to the card', () => {
    renderBlock(definition, TestimonialCard)

    expect(screen.getByTestId('testimonial-card').className).toContain('@container')
  })

  it('has no axe violations', async () => {
    const { container } = renderBlock(definition, TestimonialCard)

    await expectNoViolations(container)
  })
})
