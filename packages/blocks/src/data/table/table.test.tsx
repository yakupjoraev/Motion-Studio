import { screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { expectNoViolations, renderBlock } from '../../test/render-block'
import { requireAt } from '../../test/require-at'

import { Table } from './table'
import { ariaSort, tableColumnDefs } from './table.columns'
import { tableDefinition } from './table.definition'
import { captionText, columnId, tableSchema } from './table.schema'

const defaults = tableDefinition.defaults

const render = (overrides: Partial<typeof defaults> = {}) =>
  renderBlock(tableDefinition, Table, overrides)

const cellTexts = (columnIndex: number): string[] =>
  screen
    .getAllByTestId('table-row')
    .map((row) => requireAt([...row.querySelectorAll('td')], columnIndex).textContent ?? '')

describe('Table', () => {
  it('validates its own defaults', () => {
    expect(() => tableSchema.parse(defaults)).not.toThrow()
  })

  it('has no axe violations at its defaults', async () => {
    const { container } = render()

    await expectNoViolations(container)
  })

  it('renders a real table with a caption, column headers and a row per entry', () => {
    render()

    expect(screen.getByRole('table')).toBeInTheDocument()
    expect(screen.getAllByRole('columnheader')).toHaveLength(defaults.columns.length)
    expect(screen.getAllByTestId('table-row')).toHaveLength(defaults.rows.length)
    expect(screen.getByTestId('table-caption')).toHaveTextContent(defaults.caption)
  })

  it('names the table even when the author cleared the caption', () => {
    render({ caption: '' })

    expect(screen.getByTestId('table-caption')).toHaveTextContent(defaults.regionLabel)
  })

  it('keeps the caption in the markup while it is not shown', () => {
    render()

    expect(screen.getByTestId('table-caption').className).toContain('sr-only')
  })

  it('puts scope="col" on every header', () => {
    render()

    for (const header of screen.getAllByRole('columnheader')) {
      expect(header).toHaveAttribute('scope', 'col')
    }
  })

  it('marks sortable columns with aria-sort and leaves the others without it', () => {
    render()

    const headers = screen.getAllByRole('columnheader')

    for (const [index, column] of defaults.columns.entries()) {
      const header = requireAt(headers, index)

      if (column.sortable) {
        expect(header).toHaveAttribute('aria-sort', 'none')
      } else {
        expect(header).not.toHaveAttribute('aria-sort')
      }
    }
  })

  it('sorts a column from its own header button, then reverses, then clears', async () => {
    render()

    const unsorted = cellTexts(0)
    const trigger = screen.getByRole('button', { name: requireAt(defaults.columns, 0).label })

    await userEvent.click(trigger)
    const ascending = cellTexts(0)
    expect(ascending).toEqual([...unsorted].sort())

    await userEvent.click(trigger)
    expect(cellTexts(0)).toEqual([...ascending].reverse())

    await userEvent.click(trigger)
    expect(cellTexts(0)).toEqual(unsorted)
  })

  it('announces the direction on the cell rather than in the button name', async () => {
    render()

    const label = requireAt(defaults.columns, 0).label

    await userEvent.click(screen.getByRole('button', { name: label }))

    expect(requireAt(screen.getAllByRole('columnheader'), 0)).toHaveAttribute(
      'aria-sort',
      'ascending',
    )
    // Still named by the column alone: a name carrying the state would announce the column twice.
    expect(screen.getByRole('button', { name: label })).toBeInTheDocument()
  })

  it('gives a column with sorting turned off no button at all', () => {
    render()

    const fixed = defaults.columns.filter((column) => !column.sortable)

    expect(fixed.length).toBeGreaterThan(0)
    for (const column of fixed) {
      expect(screen.queryByRole('button', { name: column.label })).toBeNull()
    }
  })

  it('makes the scroller a labelled region a keyboard can reach', async () => {
    render()

    const region = screen.getByRole('region', { name: defaults.regionLabel })

    expect(region).toHaveAttribute('tabindex', '0')

    await userEvent.tab()
    expect(document.activeElement).toBe(region)
  })

  it('shows the empty message inside the body, spanning every column', () => {
    render({ rows: [] })

    const cell = screen.getByTestId('table-empty').querySelector('td')

    expect(screen.queryAllByTestId('table-row')).toHaveLength(0)
    expect(cell).toHaveTextContent(defaults.emptyMessage)
    expect(cell).toHaveAttribute('colspan', String(defaults.columns.length))
  })

  it('shows an em dash where a row said nothing about a column', () => {
    render({ rows: [{ cells: ['Only the first'] }] })

    const cells = [...screen.getByTestId('table-row').querySelectorAll('td')]

    expect(requireAt(cells, 1)).toHaveTextContent('—')
    expect(requireAt(cells, 1)).toHaveTextContent('Not applicable')
  })

  it('sticks the header only when asked to', () => {
    const { unmount } = render()
    expect(requireAt(screen.getAllByRole('columnheader'), 0).className).toContain('sticky')
    unmount()

    render({ stickyHeader: false })
    expect(requireAt(screen.getAllByRole('columnheader'), 0).className).not.toContain('sticky')
  })
})

describe('tableColumnDefs', () => {
  it('addresses a column by its index, so two columns may share a heading', () => {
    const defs = tableColumnDefs([
      { label: 'Same', align: 'start', sortable: true },
      { label: 'Same', align: 'start', sortable: true },
    ])

    expect(defs.map((def) => def.id)).toEqual([columnId(0), columnId(1)])
  })

  it('sorts a column of numbers as numbers rather than as text', () => {
    const defs = tableColumnDefs([{ label: 'Nodes', align: 'end', sortable: true }])

    // `alphanumeric`, not `text`: `9` has to land before `10`, which a string comparison reverses.
    expect(defs.map((def) => def.sortingFn)).toEqual(['alphanumeric'])
  })
})

describe('ariaSort', () => {
  it('is absent on a column that cannot be sorted', () => {
    expect(ariaSort(false, false)).toBeUndefined()
    expect(ariaSort(false, 'asc')).toBeUndefined()
  })

  it('says none on a sortable column that is not the sorted one', () => {
    expect(ariaSort(true, false)).toBe('none')
  })

  it('names the direction otherwise', () => {
    expect(ariaSort(true, 'asc')).toBe('ascending')
    expect(ariaSort(true, 'desc')).toBe('descending')
  })
})

describe('captionText', () => {
  it('falls back to the region label rather than to nothing', () => {
    expect(captionText('  ', 'Export runs')).toBe('Export runs')
    expect(captionText('Runs', 'Export runs')).toBe('Runs')
  })
})
