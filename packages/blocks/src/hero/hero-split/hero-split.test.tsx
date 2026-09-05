import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { expectNoViolations, renderBlock } from '../../test/render-block'

import { HeroSplit } from './hero-split'
import { heroSplitDefinition } from './hero-split.definition'
import { heroSplitSchema } from './hero-split.schema'

const definition = heroSplitDefinition

describe('HeroSplit', () => {
  it('renders exactly one h1', () => {
    renderBlock(definition, HeroSplit)

    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
  })

  it('renders the media slot by name', () => {
    renderBlock(definition, HeroSplit, { media: <img alt="The studio" src="/studio.png" /> })

    expect(screen.getByRole('img', { name: 'The studio' })).toBeInTheDocument()
  })

  it('renders the same slot positionally, which is how the canvas hands it over', () => {
    renderBlock(definition, HeroSplit, { children: <img alt="Positional" src="/p.png" /> })

    expect(screen.getByRole('img', { name: 'Positional' })).toBeInTheDocument()
  })

  it('keeps the text ahead of the media in the DOM whichever side it is painted on', () => {
    const { container } = renderBlock(definition, HeroSplit, { reverse: true })

    const heading = screen.getByRole('heading', { level: 1 })
    const mediaPlate = screen.getByTestId('hero-media')

    expect(
      heading.compareDocumentPosition(mediaPlate) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
    // ADR-356: the order swap is a container query against the band, not a viewport one.
    expect(container.querySelector('[class*="@min-[1024px]/frame:order-1"]')).not.toBeNull()
  })

  it('reserves the media box so a late child shifts nothing', () => {
    renderBlock(definition, HeroSplit)

    expect(screen.getByTestId('hero-media').className).toContain('aspect-video')
  })

  it('validates its own defaults', () => {
    expect(() => heroSplitSchema.parse(definition.defaults)).not.toThrow()
  })

  it('has no axe violations', async () => {
    const { container } = renderBlock(definition, HeroSplit, {
      media: <img alt="The studio" src="/studio.png" />,
    })

    await expectNoViolations(container)
  })
})
