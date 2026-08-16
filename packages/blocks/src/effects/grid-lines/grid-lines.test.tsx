import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { expectNoViolations, renderBlock } from '../../test/render-block'

import { GridLines } from './grid-lines'
import { gridLinesDefinition } from './grid-lines.definition'
import { GRID_AXES } from './grid-lines.schema'

const definition = gridLinesDefinition

describe('GridLines', () => {
  it('paints both axes from one layer by default', () => {
    const { container } = renderBlock(definition, GridLines)
    const layer = container.querySelector('.ms-fx-lines')

    expect(layer).not.toBeNull()
    expect(layer?.className).not.toContain('ms-fx-lines-h')
    expect(layer?.className).not.toContain('ms-fx-lines-v')
  })

  it('has a class for every axis', () => {
    for (const axis of GRID_AXES) {
      const { container, unmount } = renderBlock(definition, GridLines, { axis })
      const className = container.querySelector('.ms-fx-lines')?.className ?? ''

      expect(className.includes(`ms-fx-lines-${axis[0]}`), axis).toBe(axis !== 'both')
      unmount()
    }
  })

  it('carries spacing and line width as variables', () => {
    renderBlock(definition, GridLines, { spacing: 64, lineWidth: 2 })

    const layer = screen.getByTestId('grid-lines')

    expect(layer.style.getPropertyValue('--ms-fx-size')).toBe('64px')
    expect(layer.style.getPropertyValue('--ms-fx-line')).toBe('2px')
  })

  it('has no axe violations', async () => {
    await expectNoViolations(renderBlock(definition, GridLines).container)
  })
})
