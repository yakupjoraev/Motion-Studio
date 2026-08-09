import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { expectNoViolations, renderBlock } from '../../test/render-block'

import { Stat } from './stat'
import { statDefinition } from './stat.definition'
import { deltaTone, statSchema } from './stat.schema'

const definition = statDefinition

describe('deltaTone', () => {
  it('reads a fall as good when down is good', () => {
    expect(deltaTone('down-is-good', false)).toBe('positive')
    expect(deltaTone('down-is-good', true)).toBe('negative')
  })

  it('reads a rise as good when up is good', () => {
    expect(deltaTone('up-is-good', true)).toBe('positive')
    expect(deltaTone('up-is-good', false)).toBe('negative')
  })

  it('takes no view when the direction is neutral', () => {
    expect(deltaTone('neutral', true)).toBe('neutral')
    expect(deltaTone('neutral', false)).toBe('neutral')
  })
})

describe('Stat', () => {
  it('renders the value and its label', () => {
    renderBlock(definition, Stat, { value: '1.8s', label: 'Median export time' })

    expect(screen.getByTestId('stat-value')).toHaveTextContent('1.8s')
    expect(screen.getByText('Median export time')).toBeInTheDocument()
  })

  it('paints a falling error rate as an improvement', () => {
    renderBlock(definition, Stat, {
      delta: '−32%',
      deltaDirection: 'down-is-good',
      deltaRose: false,
    })

    expect(screen.getByTestId('stat-delta').className).toContain('text-success')
  })

  it('carries an arrow as well as a colour', () => {
    renderBlock(definition, Stat, { delta: '+12%', deltaRose: true })

    expect(screen.getByTestId('stat-delta').textContent).toContain('↑')
  })

  it('hides the change row when there is no change to report', () => {
    renderBlock(definition, Stat, { delta: '' })

    expect(screen.queryByTestId('stat-delta')).toBeNull()
  })

  it('keeps the sparkline out of the accessibility tree', () => {
    renderBlock(definition, Stat)

    expect(screen.getByTestId('stat-sparkline')).toHaveAttribute('aria-hidden', 'true')
  })

  it('draws no sparkline from a series too short to have a shape', () => {
    renderBlock(definition, Stat, { series: [4] })

    expect(screen.queryByTestId('stat-sparkline')).toBeNull()
  })

  it('uses tabular numerals so a row of statistics lines up', () => {
    renderBlock(definition, Stat)

    expect(screen.getByTestId('stat-value').className).toContain('tabular-nums')
  })

  it('validates its own defaults', () => {
    expect(() => statSchema.parse(definition.defaults)).not.toThrow()
  })

  it('has no axe violations', async () => {
    const { container } = renderBlock(definition, Stat)

    await expectNoViolations(container)
  })
})
