import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { expectNoViolations, renderBlock } from '../../test/render-block'

import { AuroraBackground } from './aurora-background'
import { auroraBackgroundDefinition } from './aurora-background.definition'

const definition = auroraBackgroundDefinition

describe('AuroraBackground', () => {
  it('paints three fields on unrelated periods', () => {
    const { container } = renderBlock(definition, AuroraBackground)

    expect(container.querySelectorAll('.ms-fx-field')).toHaveLength(3)
    expect(container.querySelector('.ms-fx-field-a')).not.toBeNull()
    expect(container.querySelector('.ms-fx-field-b')).not.toBeNull()
    expect(container.querySelector('.ms-fx-field-c')).not.toBeNull()
  })

  it('carries its tuning as custom properties, not as classes', () => {
    renderBlock(definition, AuroraBackground, { intensity: 0.8, speed: 2, blur: 100 })

    const layer = screen.getByTestId('aurora-background')

    expect(layer.style.getPropertyValue('--ms-fx-intensity')).toBe('0.8')
    expect(layer.style.getPropertyValue('--ms-fx-speed')).toBe('2')
    expect(layer.style.getPropertyValue('--ms-fx-blur')).toBe('100px')
  })

  it('tints the second field from its own token', () => {
    const { container } = renderBlock(definition, AuroraBackground, {
      tint: 'accent',
      secondaryTint: 'success',
    })

    const fields = [...container.querySelectorAll<HTMLElement>('.ms-fx-field')]

    expect(fields.map((field) => field.style.background)).toEqual([
      'var(--ms-color-accent)',
      'var(--ms-color-success)',
      'var(--ms-color-accent)',
    ])
  })

  it('drops the grain layer when it is switched off', () => {
    renderBlock(definition, AuroraBackground, { grain: true })
    expect(screen.getByTestId('aurora-grain')).toBeInTheDocument()

    renderBlock(definition, AuroraBackground, { grain: false })
    expect(screen.getAllByTestId('aurora-grain')).toHaveLength(1)
  })

  it('is decorative: hidden from the tree and transparent to the pointer', () => {
    const layer = renderBlock(definition, AuroraBackground).container
      .firstElementChild as HTMLElement

    expect(layer).toHaveAttribute('aria-hidden', 'true')
    expect(layer.className).toContain('pointer-events-none')
  })

  it('has no axe violations', async () => {
    await expectNoViolations(renderBlock(definition, AuroraBackground).container)
  })

  it('validates its own defaults', () => {
    expect(() => definition.propsSchema.parse(definition.defaults)).not.toThrow()
  })
})
