import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { expectNoViolations, renderBlock } from '../../test/render-block'

import { Text } from './text'
import { textDefinition } from './text.definition'
import { MEASURE_CH, textSchema } from './text.schema'
import { textStyles } from './text.styles'

const definition = textDefinition

describe('Text', () => {
  it('renders a paragraph of its text', () => {
    renderBlock(definition, Text, { text: 'One idea per paragraph.' })

    expect(screen.getByText('One idea per paragraph.').tagName).toBe('P')
  })

  /** The rule prompt 26 names: 60–75 characters, and the default has to be inside it. */
  it('defaults to a measure inside the readable range', () => {
    const characters = MEASURE_CH[definition.defaults.measure]

    expect(characters).not.toBeNull()
    expect(characters).toBeGreaterThanOrEqual(60)
    expect(characters).toBeLessThanOrEqual(75)
  })

  it('spends the class its own measure table names', () => {
    for (const [measure, characters] of Object.entries(MEASURE_CH)) {
      const className = textStyles({ measure: measure as keyof typeof MEASURE_CH })

      expect(className, measure).toContain(
        characters === null ? 'max-w-none' : `max-w-[${characters}ch]`,
      )
    }
  })

  it('runs full width only when asked to', () => {
    renderBlock(definition, Text, { measure: 'full', text: 'Wide' })

    expect(screen.getByText('Wide').className).toContain('max-w-none')
  })

  it('collapses columns below the medium breakpoint', () => {
    renderBlock(definition, Text, { columns: 3, text: 'Three' })

    const className = screen.getByText('Three').className

    expect(className).toContain('columns-1')
    expect(className).toContain('@min-[1024px]/frame:columns-3')
  })

  it('styles the drop cap without taking the letter out of the sentence', () => {
    renderBlock(definition, Text, { dropCap: true, text: 'Alpha beta.' })

    const paragraph = screen.getByText('Alpha beta.')

    expect(paragraph.className).toContain('first-letter:float-left')
    expect(paragraph.textContent).toBe('Alpha beta.')
    expect(paragraph.children).toHaveLength(0)
  })

  it('refuses text past the length its control allows', () => {
    expect(() => textSchema.parse({ text: 'x'.repeat(5_001) })).toThrow()
  })

  it('validates its own defaults', () => {
    expect(() => textSchema.parse(definition.defaults)).not.toThrow()
  })

  it('has no axe violations', async () => {
    const { container } = renderBlock(definition, Text)

    await expectNoViolations(container)
  })
})
