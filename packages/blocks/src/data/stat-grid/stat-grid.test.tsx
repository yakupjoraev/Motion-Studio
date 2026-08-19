import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { expectNoViolations, renderBlock } from '../../test/render-block'
import { requireAt } from '../../test/require-at'

import { StatGrid } from './stat-grid'
import { statGridDefinition } from './stat-grid.definition'
import { statGridSchema } from './stat-grid.schema'
import { columnsClass } from './stat-grid.styles'

const defaults = statGridDefinition.defaults

const render = (overrides: Partial<typeof defaults> = {}) =>
  renderBlock(statGridDefinition, StatGrid, overrides)

describe('StatGrid', () => {
  it('validates its own defaults', () => {
    expect(() => statGridSchema.parse(defaults)).not.toThrow()
  })

  it('has no axe violations at its defaults', async () => {
    const { container } = render()

    await expectNoViolations(container)
  })

  it('renders the figures as one list', () => {
    render()

    expect(screen.getByRole('list')).toBeInTheDocument()
    expect(screen.getAllByRole('listitem')).toHaveLength(defaults.items.length)
  })

  it('shows every figure and every label', () => {
    render()

    for (const item of defaults.items) {
      expect(screen.getByText(item.value)).toBeInTheDocument()

      if (item.label !== '') {
        expect(screen.getByText(item.label)).toBeInTheDocument()
      }
    }
  })

  it('drops the change row where the author left it empty', () => {
    render()

    const withChange = defaults.items.filter((item) => item.delta !== '')

    expect(withChange.length).toBeLessThan(defaults.items.length)
    expect(screen.getAllByTestId('stat-delta')).toHaveLength(withChange.length)
  })

  it('gives a falling figure that is good the positive tone, not the negative one', () => {
    render({
      items: [
        {
          value: '1.8s',
          label: 'Export',
          delta: '−32%',
          deltaDirection: 'down-is-good',
          deltaRose: false,
        },
      ],
    })

    const delta = screen.getByTestId('stat-delta')

    expect(delta.className).toContain('text-success')
    // The arrow is the second signal, so the direction survives greyscale.
    expect(delta).toHaveTextContent('↓')
  })

  it('makes each cell the subject of a container query', () => {
    render()

    expect(requireAt(screen.getAllByTestId('stat-cell'), 0).className).toContain('@container')
  })

  it('divides the grid with a gap over the plate rather than with a rule per cell', () => {
    render()

    const list = screen.getByRole('list')

    expect(list.className).toContain('gap-px')
    expect(list.className).not.toContain('divide-x')
  })

  it('drops the plate when the dividers are off', () => {
    render({ dividers: false })

    expect(screen.getByRole('list').className).toContain('bg-transparent')
  })

  it('adds no tab stop to the page', () => {
    const { container } = render()

    expect(container.querySelectorAll('a, button, input, [tabindex]')).toHaveLength(0)
  })
})

describe('columnsClass', () => {
  it('steps every count down to one column at 360 px', () => {
    for (const columns of [2, 3, 4]) {
      expect(columnsClass(columns)).toContain('grid-cols-1')
    }
  })

  it('answers the counts the schema allows and clamps below them', () => {
    expect(columnsClass(2)).toBe(columnsClass(1))
    expect(columnsClass(3)).toContain('lg:grid-cols-3')
    expect(columnsClass(4)).toContain('lg:grid-cols-4')
  })
})
