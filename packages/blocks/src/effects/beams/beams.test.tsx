import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { expectNoViolations, renderBlock } from '../../test/render-block'

import { Beams } from './beams'
import { beamsDefinition } from './beams.definition'
import { beamStyle } from './beams.styles'

const definition = beamsDefinition

describe('Beams', () => {
  it('renders exactly as many beams as it was asked for', () => {
    renderBlock(definition, Beams, { count: 5 })

    expect(screen.getAllByTestId('beam')).toHaveLength(5)
  })

  it('spreads them evenly and staggers their delays', () => {
    renderBlock(definition, Beams, { count: 3 })

    const beams = screen.getAllByTestId('beam')

    expect(beams.map((beam) => beam.style.left)).toEqual(['25%', '50%', '75%'])
    expect(beams[0]?.style.animationDelay).toContain('0.000')
    expect(beams[1]?.style.animationDelay).toContain('0.370')
  })

  it('places the same beams for the same props, every time', () => {
    expect(beamStyle(2, 4, 0.37)).toEqual(beamStyle(2, 4, 0.37))
  })

  it('tilts the container rather than every gradient', () => {
    const { container } = renderBlock(definition, Beams, { angle: -30 })

    expect(container.querySelectorAll('.ms-fx-beams')).toHaveLength(1)
    expect(screen.getByTestId('beams').style.getPropertyValue('--ms-fx-angle')).toBe('-30deg')
  })

  it('has no axe violations', async () => {
    await expectNoViolations(renderBlock(definition, Beams).container)
  })
})
