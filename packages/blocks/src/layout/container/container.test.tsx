import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { expectNoViolations, renderBlock } from '../../test/render-block'

import { Container } from './container'
import { containerDefinition } from './container.definition'
import { containerSchema } from './container.schema'

const definition = containerDefinition

describe('Container', () => {
  it('renders its children in a flex box', () => {
    const { container } = renderBlock(definition, Container, { children: <span>Child</span> })

    expect(screen.getByText('Child')).toBeInTheDocument()
    expect(container.firstElementChild?.tagName).toBe('DIV')
    expect(container.firstElementChild?.className).toContain('flex')
  })

  it('lays out along the direction it is given', () => {
    const { container } = renderBlock(definition, Container, { direction: 'row', wrap: true })
    const className = container.firstElementChild?.className ?? ''

    expect(className).toContain('flex-row')
    expect(className).toContain('flex-wrap')
  })

  it('maps the space scale to gap and padding classes', () => {
    const { container } = renderBlock(definition, Container, { gap: 'xl', padding: 'sm' })
    const className = container.firstElementChild?.className ?? ''

    expect(className).toContain('gap-12')
    expect(className).toContain('p-4')
  })

  it('is the block an empty document starts with, so it renders with no props at all', () => {
    const parsed = containerSchema.parse({})

    expect(parsed).toEqual(definition.defaults)
  })

  it('has no axe violations', async () => {
    const { container } = renderBlock(definition, Container, { children: <p>Body</p> })

    await expectNoViolations(container)
  })
})
