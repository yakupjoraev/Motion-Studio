import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { expectNoViolations, renderBlock } from '../../test/render-block'

import { Badge } from './badge'
import { badgeDefinition } from './badge.definition'
import { badgeSchema } from './badge.schema'

const definition = badgeDefinition

describe('Badge', () => {
  it('renders its label', () => {
    renderBlock(definition, Badge, { label: 'Beta' })

    expect(screen.getByText('Beta')).toBeInTheDocument()
  })

  it('never conveys a status by colour or shape alone', () => {
    renderBlock(definition, Badge, { label: 'Live', variant: 'success', dot: true })

    expect(screen.getByTestId('badge-dot')).toHaveAttribute('aria-hidden', 'true')
    expect(screen.getByText('Live')).toBeInTheDocument()
  })

  it('renders an icon the registry knows', () => {
    const { container } = renderBlock(definition, Badge, { icon: 'check' })

    expect(container.querySelector('svg')).not.toBeNull()
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
  })

  it('renders nothing rather than throwing on a name the registry does not know', () => {
    const { container } = renderBlock(definition, Badge, { icon: '../../etc/passwd' })

    expect(container.querySelector('svg')).toBeNull()
    expect(screen.getByText(definition.defaults.label)).toBeInTheDocument()
  })

  it('paints every variant from one token family', () => {
    for (const variant of ['neutral', 'accent', 'success', 'warning', 'danger', 'info'] as const) {
      const { unmount } = renderBlock(definition, Badge, { variant, label: variant })

      expect(screen.getByText(variant).className, variant).toContain('rounded-full')
      unmount()
    }
  })

  it('validates its own defaults', () => {
    expect(() => badgeSchema.parse(definition.defaults)).not.toThrow()
  })

  it('has no axe violations', async () => {
    const { container } = renderBlock(definition, Badge, { icon: 'check', dot: true })

    await expectNoViolations(container)
  })
})
