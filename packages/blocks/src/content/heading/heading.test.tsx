import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { expectNoViolations, renderBlock } from '../../test/render-block'

import { Heading } from './heading'
import { headingDefinition } from './heading.definition'
import { HEADING_MAX_LENGTH, headingSchema } from './heading.schema'

const definition = headingDefinition

describe('Heading', () => {
  it('renders the level it is given, not the size', () => {
    renderBlock(definition, Heading, { text: 'Pricing', level: 3, size: '3xl' })

    const heading = screen.getByRole('heading', { level: 3 })

    expect(heading).toHaveTextContent('Pricing')
    expect(heading.className).toContain('text-5xl')
  })

  it('walks the whole level range', () => {
    for (const level of [1, 2, 3, 4, 5, 6]) {
      const { unmount } = renderBlock(definition, Heading, { level, text: `H${level}` })

      expect(screen.getByRole('heading', { level })).toBeInTheDocument()
      unmount()
    }
  })

  it('paints gradient text with a clipped background rather than a colour', () => {
    renderBlock(definition, Heading, { gradient: true })

    const className = screen.getByRole('heading').className

    expect(className).toContain('bg-clip-text')
    expect(className).toContain('text-transparent')
  })

  it('balances its last line unless told not to', () => {
    renderBlock(definition, Heading, { balance: false })

    expect(screen.getByRole('heading').className).not.toContain('text-balance')
  })

  it('refuses text past the length its control allows', () => {
    expect(() => headingSchema.parse({ text: 'x'.repeat(HEADING_MAX_LENGTH + 1) })).toThrow()
  })

  it('validates its own defaults', () => {
    expect(() => headingSchema.parse(definition.defaults)).not.toThrow()
  })

  it('has no axe violations', async () => {
    const { container } = renderBlock(definition, Heading)

    await expectNoViolations(container)
  })
})
