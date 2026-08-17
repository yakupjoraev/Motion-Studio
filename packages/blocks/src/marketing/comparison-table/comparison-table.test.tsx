import { screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { expectNoViolations, renderBlock } from '../../test/render-block'
import { requireAt } from '../../test/require-at'

import { ComparisonTable } from './comparison-table'
import { comparisonTableDefinition as definition } from './comparison-table.definition'
import { cellKind } from './comparison-table.schema'

describe('cellKind', () => {
  it('reads the two reserved words as marks', () => {
    expect(cellKind('yes')).toBe('yes')
    expect(cellKind('no')).toBe('no')
  })

  it('reads anything else as text, and nothing as empty', () => {
    expect(cellKind('51')).toBe('text')
    expect(cellKind('Hand-built')).toBe('text')
    expect(cellKind('')).toBe('empty')
    expect(cellKind('   ')).toBe('empty')
    expect(cellKind(undefined)).toBe('empty')
  })
})

describe('ComparisonTable', () => {
  it('is a table with headers on both axes', () => {
    renderBlock(definition, ComparisonTable)

    expect(screen.getByTestId('comparison-grid').tagName).toBe('TABLE')
    expect(screen.getAllByTestId('comparison-head')).toHaveLength(
      definition.defaults.columns.length,
    )
    expect(screen.getAllByTestId('comparison-row-head')).toHaveLength(
      definition.defaults.rows.length,
    )
  })

  it('sticks the header row, the first column and the corner, in that order of precedence', () => {
    renderBlock(definition, ComparisonTable)

    const corner = screen.getByTestId('comparison-corner')
    const head = requireAt(screen.getAllByTestId('comparison-head'), 0)
    const rowHead = requireAt(screen.getAllByTestId('comparison-row-head'), 0)

    expect(corner.className).toContain('sticky')
    expect(corner.className).toContain('top-0')
    expect(corner.className).toContain('left-0')
    expect(corner.className).toContain('z-30')

    expect(head.className).toContain('sticky')
    expect(head.className).toContain('z-20')

    expect(rowHead.className).toContain('sticky')
    expect(rowHead.className).toContain('z-10')
  })

  it('separates its borders, which is what lets a stuck cell keep its edges', () => {
    renderBlock(definition, ComparisonTable)

    expect(screen.getByTestId('comparison-grid').className).toContain('border-separate')
  })

  it('scrolls inside a labelled region the keyboard can reach', async () => {
    const user = userEvent.setup()

    renderBlock(definition, ComparisonTable)

    const region = screen.getByRole('region', { name: definition.defaults.regionLabel })

    expect(region.className).toContain('overflow-x-auto')
    expect(region).toHaveAttribute('tabindex', '0')

    await user.tab()

    expect(document.activeElement).toBe(region)
  })

  it('answers yes and no with a glyph and a word', () => {
    renderBlock(definition, ComparisonTable, {
      columns: [{ label: 'Ours', highlighted: true }],
      rows: [
        { label: 'Exports components', values: ['yes'] },
        { label: 'Owns your markup', values: ['no'] },
      ],
    })

    expect(screen.getByText('Yes')).toBeInTheDocument()
    expect(screen.getByText('No')).toBeInTheDocument()
  })

  it('shows a value that is neither as text', () => {
    renderBlock(definition, ComparisonTable, {
      columns: [{ label: 'Ours', highlighted: false }],
      rows: [{ label: 'Presets', values: ['51'] }],
    })

    expect(screen.getByText('51')).toBeInTheDocument()
  })

  it('marks a cell the row said nothing about as not applicable', () => {
    renderBlock(definition, ComparisonTable, {
      columns: [
        { label: 'Ours', highlighted: false },
        { label: 'Theirs', highlighted: false },
      ],
      rows: [{ label: 'Presets', values: ['51'] }],
    })

    expect(screen.getByLabelText('Not applicable')).toBeInTheDocument()
  })

  it('tints the highlighted column without relying on the tint alone', () => {
    renderBlock(definition, ComparisonTable)

    const head = requireAt(screen.getAllByTestId('comparison-head'), 0)

    expect(head).toHaveAttribute('data-highlighted', 'true')
    expect(head.className).toContain('text-accent')
    expect(head.className).toContain('font-semibold')
  })

  it('has no axe violations', async () => {
    const { container } = renderBlock(definition, ComparisonTable)

    await expectNoViolations(container)
  })
})
