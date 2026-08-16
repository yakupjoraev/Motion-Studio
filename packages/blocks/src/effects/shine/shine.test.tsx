import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { expectNoViolations, renderBlock } from '../../test/render-block'

import { Shine } from './shine'
import { shineDefinition } from './shine.definition'

const definition = shineDefinition

describe('Shine', () => {
  it('paints one band, sized as a share of the surface', () => {
    renderBlock(definition, Shine, { width: 60 })

    const band = screen.getByTestId('shine-band')

    expect(band.style.width).toBe('60%')
    expect(band.className).toContain('ms-fx-shine')
  })

  it('carries the tilt in a variable the keyframes read', () => {
    renderBlock(definition, Shine, { angle: -30 })

    expect(screen.getByTestId('shine').style.getPropertyValue('--ms-fx-angle')).toBe('-30deg')
  })

  it('is quiet by default: a sheen, not a spotlight', () => {
    expect(definition.defaults.intensity).toBeLessThanOrEqual(0.3)
  })

  it('has no axe violations', async () => {
    await expectNoViolations(renderBlock(definition, Shine).container)
  })
})
