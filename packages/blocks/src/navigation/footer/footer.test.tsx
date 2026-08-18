import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { expectNoViolations, renderBlock } from '../../test/render-block'
import { requireAt } from '../../test/require-at'
import { socialAccessibleName } from '../navigation.schema'

import { Footer } from './footer'
import { footerDefinition as definition } from './footer.definition'

const defaults = definition.defaults

describe('Footer', () => {
  it('is one labelled contentinfo landmark', () => {
    renderBlock(definition, Footer)

    const landmarks = screen.getAllByRole('contentinfo')

    expect(landmarks).toHaveLength(1)
    expect(landmarks[0]).toHaveAccessibleName(defaults.ariaLabel)
  })

  it('makes every link column its own labelled navigation landmark', () => {
    renderBlock(definition, Footer)

    const navigations = screen.getAllByRole('navigation')

    expect(navigations).toHaveLength(defaults.columns.length)

    for (const [index, navigation] of navigations.entries()) {
      expect(navigation).toHaveAccessibleName(requireAt(defaults.columns, index).title)
    }
  })

  it('renders a column with no links as a heading rather than as an empty landmark', () => {
    renderBlock(definition, Footer, {
      columns: [{ title: 'Product', links: [] }],
    })

    expect(screen.queryAllByRole('navigation')).toHaveLength(0)
    expect(screen.getByRole('heading', { name: 'Product' })).toBeInTheDocument()
  })

  it('names every social link after where it goes, not after its glyph', () => {
    renderBlock(definition, Footer)

    const links = screen.getAllByTestId('footer-social')

    expect(links).toHaveLength(defaults.socials.length)

    for (const [index, link] of links.entries()) {
      const social = requireAt(defaults.socials, index)
      const expected = socialAccessibleName(defaults.brandLabel, social.network)

      expect(link).toHaveAccessibleName(expected)
      expect(expected).not.toBe(social.network)
      expect(expected).toContain(defaults.brandLabel)
    }
  })

  it('keeps the glyph out of the accessible name', () => {
    renderBlock(definition, Footer)

    for (const link of screen.getAllByTestId('footer-social')) {
      expect(link.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
    }
  })

  it('drops the social row entirely when there is nothing in it', () => {
    renderBlock(definition, Footer, { socials: [] })

    expect(screen.queryByTestId('footer-socials')).toBeNull()
  })

  it('renders the legal row and the copyright', () => {
    renderBlock(definition, Footer)

    expect(screen.getByText(defaults.copyright)).toBeInTheDocument()
    expect(screen.getByTestId('footer-legal').querySelectorAll('a')).toHaveLength(
      defaults.legal.length,
    )
  })

  it('fills the signup slot from the slot prop', () => {
    renderBlock(definition, Footer, {
      newsletter: <form data-testid="placed-form" />,
    })

    expect(screen.getByTestId('footer-newsletter')).toBeInTheDocument()
    expect(screen.getByTestId('placed-form')).toBeInTheDocument()
  })

  it('draws no signup frame when the slot is empty', () => {
    renderBlock(definition, Footer)

    expect(screen.queryByTestId('footer-newsletter')).toBeNull()
  })

  it('hides the slot when the switch is off, even with a block in it', () => {
    renderBlock(definition, Footer, {
      showNewsletter: false,
      newsletter: <form data-testid="placed-form" />,
    })

    expect(screen.queryByTestId('footer-newsletter')).toBeNull()
  })

  it('accepts the block that already owns a signup form', () => {
    expect(requireAt(definition.slots, 0).accepts).toEqual(['newsletter-form'])
  })

  it('puts the column headings at the level the document asked for', () => {
    renderBlock(definition, Footer, { headingLevel: 3 })

    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(defaults.columns.length)
  })

  it('has no axe violations', async () => {
    const { container } = renderBlock(definition, Footer)

    await expectNoViolations(container)
  })
})
