import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { expectNoViolations, renderBlock } from '../../test/render-block'

import { CtaBanner } from './cta-banner'
import { ctaBannerDefinition as definition } from './cta-banner.definition'
import { bandIsAccent } from './cta-banner.schema'

describe('bandIsAccent', () => {
  it('is true for the two surfaces painted from the accent ramp', () => {
    expect(bandIsAccent('gradient')).toBe(true)
    expect(bandIsAccent('accent')).toBe(true)
    expect(bandIsAccent('glass')).toBe(false)
    expect(bandIsAccent('surface')).toBe(false)
  })
})

describe('CtaBanner', () => {
  it('renders the headline at the level the document asked for', () => {
    renderBlock(definition, CtaBanner, { headingLevel: 3 })

    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent(definition.defaults.heading)
  })

  it('inverts the buttons on an accent band', () => {
    renderBlock(definition, CtaBanner, { surface: 'gradient' })

    expect(screen.getAllByTestId('action-button')[0]?.className).toContain('bg-surface-0')
  })

  it('leaves the buttons alone on a quiet band', () => {
    renderBlock(definition, CtaBanner, { surface: 'surface' })

    expect(screen.getAllByTestId('action-button')[0]?.className).toContain('bg-accent')
  })

  it('renders a button rather than a link when there is nowhere to go', () => {
    renderBlock(definition, CtaBanner, {
      actions: [{ label: 'Open the dialog', href: '', variant: 'primary' }],
    })

    expect(screen.getByTestId('action-button').tagName).toBe('BUTTON')
  })

  it('paints the panel from the surface prop', () => {
    renderBlock(definition, CtaBanner, { surface: 'glass' })

    expect(screen.getByTestId('cta-panel').className).toContain('ms-glass')
  })

  it('rounds the panel and not the band', () => {
    renderBlock(definition, CtaBanner)

    expect(screen.getByTestId('cta-panel').className).toContain('rounded-2xl')
    expect(screen.getByTestId('cta-banner').className).not.toContain('rounded')
  })

  it('drops each line it has nothing to say on', () => {
    renderBlock(definition, CtaBanner, { eyebrow: '', description: '', actions: [] })

    expect(screen.queryByTestId('action-button')).toBeNull()
    expect(screen.getByRole('heading')).toBeInTheDocument()
  })

  it('has no axe violations', async () => {
    const { container } = renderBlock(definition, CtaBanner)

    await expectNoViolations(container)
  })
})
