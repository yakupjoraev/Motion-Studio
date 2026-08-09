import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { expectNoViolations, renderBlock } from '../../test/render-block'

import { Section } from './section'
import { sectionDefinition } from './section.definition'
import { sectionSchema } from './section.schema'

const definition = sectionDefinition

describe('Section', () => {
  it('renders a landmark with its children inside the measure', () => {
    renderBlock(definition, Section, { children: <p>Body</p> })

    const section = screen.getByText('Body').closest('section')

    expect(section).not.toBeNull()
    expect(section?.className).toContain('flex-col')
  })

  it('turns each prop into the class the scale names', () => {
    const { container } = renderBlock(definition, Section, {
      padding: 'none',
      background: 'surface-1',
      minHeight: 'screen',
    })
    const className = container.querySelector('section')?.className ?? ''

    expect(className).toContain('p-0')
    expect(className).toContain('bg-surface-1')
    expect(className).toContain('min-h-svh')
  })

  it('centres the measure when it is aligned centre', () => {
    const { container } = renderBlock(definition, Section, { align: 'center' })

    expect(container.querySelector('section > div')?.className).toContain('mx-auto')
  })

  it('validates its own defaults', () => {
    expect(() => sectionSchema.parse(definition.defaults)).not.toThrow()
  })

  it('has no axe violations', async () => {
    const { container } = renderBlock(definition, Section, {
      children: <h2>Named, so the landmark is not silent</h2>,
    })

    await expectNoViolations(container)
  })
})
