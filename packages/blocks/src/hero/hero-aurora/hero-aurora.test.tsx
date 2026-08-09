import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { expectNoViolations, renderBlock } from '../../test/render-block'

import { HeroAurora } from './hero-aurora'
import { heroAuroraDefinition } from './hero-aurora.definition'
import { heroAuroraSchema } from './hero-aurora.schema'

const definition = heroAuroraDefinition

describe('HeroAurora', () => {
  it('renders exactly one h1', () => {
    renderBlock(definition, HeroAurora)

    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
  })

  it('keeps the backdrop out of the accessibility tree and after the text in DOM order', () => {
    renderBlock(definition, HeroAurora)

    const backdrop = screen.getByTestId('hero-aurora-backdrop')
    const heading = screen.getByRole('heading', { level: 1 })

    expect(backdrop).toHaveAttribute('aria-hidden', 'true')
    expect(backdrop).not.toHaveTextContent(/\S/)
    expect(
      heading.compareDocumentPosition(backdrop) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
  })

  it('paints three fields, each on its own period', () => {
    renderBlock(definition, HeroAurora)

    const fields = screen.getAllByTestId('aurora-field')

    expect(fields).toHaveLength(3)
    expect(fields.map((field) => field.className)).toEqual([
      expect.stringContaining('ms-aurora-layer-a'),
      expect.stringContaining('ms-aurora-layer-b'),
      expect.stringContaining('ms-aurora-layer-c'),
    ])
  })

  /**
   * The reduced-motion variant. Emulating the media query in jsdom would prove nothing — jsdom
   * applies no stylesheet — so what is asserted is the thing the block controls: with the drift off
   * the animation classes are gone and the static composition, which is the same one the media query
   * produces, is what renders.
   */
  it('renders the static composition when the drift is off', () => {
    renderBlock(definition, HeroAurora, { drift: false })

    const fields = screen.getAllByTestId('aurora-field')

    expect(fields).toHaveLength(3)

    for (const field of fields) {
      expect(field.className).not.toContain('ms-aurora-layer')
      expect(field.className).toContain('ms-aurora-field-')
    }
  })

  it('takes its palette from tokens rather than from colours', () => {
    renderBlock(definition, HeroAurora, { palette: 'ember' })

    expect(screen.getAllByTestId('aurora-field')[0]?.parentElement?.className).toContain(
      'ms-aurora-palette-ember',
    )
  })

  it('drops the noise overlay rather than rendering it at zero', () => {
    renderBlock(definition, HeroAurora, { noise: 'none' })

    expect(screen.getByTestId('aurora-noise').className).toContain('hidden')
  })

  it('validates its own defaults', () => {
    expect(() => heroAuroraSchema.parse(definition.defaults)).not.toThrow()
  })

  it('has no axe violations', async () => {
    const { container } = renderBlock(definition, HeroAurora)

    await expectNoViolations(container)
  })
})
