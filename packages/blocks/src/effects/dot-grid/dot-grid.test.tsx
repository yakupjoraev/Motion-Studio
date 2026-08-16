import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { expectNoViolations, renderBlock } from '../../test/render-block'

import { DotGrid } from './dot-grid'
import { dotGridDefinition } from './dot-grid.definition'

const definition = dotGridDefinition

describe('DotGrid', () => {
  it('paints one tiled layer rather than an element per dot', () => {
    const { container } = renderBlock(definition, DotGrid)

    expect(container.querySelectorAll('.ms-fx-dots')).toHaveLength(1)
    expect(container.querySelectorAll('span')).toHaveLength(1)
  })

  it('carries spacing and dot size as variables the tile reads', () => {
    renderBlock(definition, DotGrid, { spacing: 40, dotSize: 2 })

    const layer = screen.getByTestId('dot-grid')

    expect(layer.style.getPropertyValue('--ms-fx-size')).toBe('40px')
    expect(layer.style.getPropertyValue('--ms-fx-dot')).toBe('2px')
  })

  it('adds the mask only when the fade is on', () => {
    const { container: faded } = renderBlock(definition, DotGrid, { fade: true })
    expect(faded.querySelector('.ms-fx-dots')?.className).toContain('ms-fx-fade')

    const { container: plain } = renderBlock(definition, DotGrid, { fade: false })
    expect(plain.querySelector('.ms-fx-dots')?.className).not.toContain('ms-fx-fade')
  })

  it('tints from a token, so it follows the theme', () => {
    renderBlock(definition, DotGrid, { tint: 'accent' })

    expect(screen.getByTestId('dot-grid').style.getPropertyValue('--ms-fx-tint')).toBe(
      'var(--ms-color-accent)',
    )
  })

  it('has no axe violations', async () => {
    await expectNoViolations(renderBlock(definition, DotGrid).container)
  })
})
