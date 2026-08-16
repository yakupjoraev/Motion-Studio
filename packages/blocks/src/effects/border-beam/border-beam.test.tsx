import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { expectNoViolations, renderBlock } from '../../test/render-block'

import { BorderBeam } from './border-beam'
import { borderBeamDefinition } from './border-beam.definition'

const definition = borderBeamDefinition

describe('BorderBeam', () => {
  it('lights the border from one rotating cone, not from four edges', () => {
    const { container } = renderBlock(definition, BorderBeam)

    expect(container.querySelectorAll('.ms-fx-border-beam-ring')).toHaveLength(1)
    expect(container.querySelectorAll('span')).toHaveLength(1)
  })

  it('carries the border width and the arc as variables the mask reads', () => {
    renderBlock(definition, BorderBeam, { borderWidth: 3, arc: 120 })

    const layer = screen.getByTestId('border-beam')

    expect(layer.style.getPropertyValue('--ms-fx-line')).toBe('3px')
    expect(layer.style.getPropertyValue('--ms-fx-arc')).toBe('120deg')
  })

  it('is decorative and transparent to the pointer', () => {
    const layer = renderBlock(definition, BorderBeam).container.firstElementChild as HTMLElement

    expect(layer).toHaveAttribute('aria-hidden', 'true')
    expect(layer.className).toContain('pointer-events-none')
  })

  it('has no axe violations', async () => {
    await expectNoViolations(renderBlock(definition, BorderBeam).container)
  })
})
