import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { expectNoViolations, renderBlock } from '../../test/render-block'

import { Scanlines } from './scanlines'
import { scanlinesDefinition } from './scanlines.definition'

const definition = scanlinesDefinition

describe('Scanlines', () => {
  it('is still unless drift is asked for', () => {
    renderBlock(definition, Scanlines)
    expect(screen.getByTestId('scanline-layer').className).not.toContain('ms-fx-scanlines-drift')

    const { unmount } = renderBlock(definition, Scanlines, { drift: true })
    expect(screen.getAllByTestId('scanline-layer').at(-1)?.className).toContain(
      'ms-fx-scanlines-drift',
    )
    unmount()
  })

  it('measures the period as a length, so spacing survives any node height', () => {
    renderBlock(definition, Scanlines, { spacing: 6, lineWidth: 2 })

    const layer = screen.getByTestId('scanlines')

    expect(layer.style.getPropertyValue('--ms-fx-size')).toBe('6px')
    expect(layer.style.getPropertyValue('--ms-fx-line')).toBe('2px')
  })

  it('defaults quiet enough to sit under text', () => {
    expect(definition.defaults.intensity).toBeLessThanOrEqual(0.1)
    expect(definition.defaults.drift).toBe(false)
  })

  it('has no axe violations', async () => {
    await expectNoViolations(renderBlock(definition, Scanlines).container)
  })
})
