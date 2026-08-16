import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { expectNoViolations, renderBlock } from '../../test/render-block'

import { particleField } from './particle-field'
import { Particles } from './particles'
import { particlesDefinition } from './particles.definition'

const definition = particlesDefinition

describe('Particles', () => {
  it('renders one element per particle', () => {
    renderBlock(definition, Particles, { count: 12 })

    expect(screen.getAllByTestId('particle')).toHaveLength(12)
  })

  it('places the same field for the same seed, and a different one for another', () => {
    const first = particleField(10, 2, 7)
    const again = particleField(10, 2, 7)
    const other = particleField(10, 2, 8)

    expect(first).toEqual(again)
    expect(first).not.toEqual(other)
  })

  it('rounds every generated value, so an export diffs cleanly', () => {
    for (const particle of particleField(20, 2, 3)) {
      expect(particle.left).toBe(Math.round(particle.left * 100) / 100)
      expect(particle.cycle).toBe(Math.round(particle.cycle * 100) / 100)
    }
  })

  it('scales the periods by speed rather than restarting them', () => {
    renderBlock(definition, Particles, { count: 6, speed: 2 })

    const durations = screen
      .getAllByTestId('particle')
      .map((particle) => Number.parseFloat(particle.style.animationDuration))

    for (const duration of durations) {
      expect(duration).toBeGreaterThan(0)
      expect(duration).toBeLessThan(10)
    }
  })

  it('is declared heavy, which is what makes it lazy in the render registry', () => {
    expect(definition.capabilities.costClass).toBe('heavy')
  })

  it('has no axe violations', async () => {
    await expectNoViolations(renderBlock(definition, Particles, { count: 6 }).container)
  })
})
