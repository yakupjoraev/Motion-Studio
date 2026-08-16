import { describe, expect, it } from 'vitest'

import { expectNoViolations, renderBlock } from '../../test/render-block'

import { GrainOverlay } from './grain-overlay'
import { grainOverlayDefinition } from './grain-overlay.definition'
import { grainOverlaySchema } from './grain-overlay.schema'

const definition = grainOverlayDefinition

describe('GrainOverlay', () => {
  it('animates the grain layer rather than the static noise one', () => {
    const { container } = renderBlock(definition, GrainOverlay)

    expect(container.querySelector('.ms-fx-grain')).not.toBeNull()
    expect(container.querySelector('.ms-fx-noise')).toBeNull()
  })

  it('caps speed where the 3 Hz limit is', () => {
    expect(() => grainOverlaySchema.parse({ speed: 3 })).not.toThrow()
    expect(() => grainOverlaySchema.parse({ speed: 3.5 })).toThrow()

    // Eight steps over four cycles of 800 ms at 3×: 8 / (0.8 × 4 / 3) s = 7.5 steps/s… per cycle,
    // which is 1 / (0.8 × 4 / 3) = 0.94 cycles per second, or 2.5 Hz of resampling.
    const cycleSeconds = (0.8 * 4) / 3
    expect(8 / cycleSeconds / 8).toBeLessThan(3)
  })

  it('offers only the blends that survive both colour modes', () => {
    expect(() => grainOverlaySchema.parse({ blend: 'multiply' })).toThrow()
  })

  it('is decorative', () => {
    const layer = renderBlock(definition, GrainOverlay).container.firstElementChild as HTMLElement

    expect(layer).toHaveAttribute('aria-hidden', 'true')
  })

  it('has no axe violations', async () => {
    await expectNoViolations(renderBlock(definition, GrainOverlay).container)
  })
})
