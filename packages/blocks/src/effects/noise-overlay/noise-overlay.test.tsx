import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { expectNoViolations, renderBlock } from '../../test/render-block'

import { NoiseOverlay } from './noise-overlay'
import { noiseOverlayDefinition } from './noise-overlay.definition'
import { NOISE_BLENDS } from './noise-overlay.schema'

const definition = noiseOverlayDefinition

describe('NoiseOverlay', () => {
  it('tiles the texture token at the size asked for', () => {
    const { container } = renderBlock(definition, NoiseOverlay, { scale: 240 })
    const layer = container.querySelector<HTMLElement>('.ms-fx-noise')

    expect(layer?.style.backgroundSize).toBe('240px 240px')
  })

  it('has a class for every blend the schema allows', () => {
    for (const blend of NOISE_BLENDS) {
      const { container, unmount } = renderBlock(definition, NoiseOverlay, { blend })

      expect(container.querySelector('.ms-fx-noise')?.className, blend).toContain(
        `mix-blend-${blend}`,
      )
      unmount()
    }
  })

  it('defaults to an amount that is felt rather than seen', () => {
    renderBlock(definition, NoiseOverlay)

    expect(screen.getByTestId('noise-overlay').style.getPropertyValue('--ms-fx-intensity')).toBe(
      '0.12',
    )
  })

  it('adds no animation: this is the static one of the pair', () => {
    const { container } = renderBlock(definition, NoiseOverlay)

    expect(container.querySelector('.ms-fx-grain')).toBeNull()
  })

  it('has no axe violations', async () => {
    await expectNoViolations(renderBlock(definition, NoiseOverlay).container)
  })
})
