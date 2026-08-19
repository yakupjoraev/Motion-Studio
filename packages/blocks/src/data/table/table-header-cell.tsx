import { ChevronDownIcon, ChevronUpIcon } from '@motion-studio/icons'
import type { Header } from '@tanstack/react-table'

import type { Density } from '../data.schema'

import { ariaSort } from './table.columns'
import type { TableColumn, TableRow } from './table.schema'
import { headerCellStyles, sortButtonStyles, sortGlyphStyles } from './table.styles'

export interface TableHeaderCellProps {
  readonly header: Header<TableRow, unknown>
  readonly column: TableColumn
  readonly density: Density
  readonly sticky: boolean
}

/**
 * One `<th scope="col">`.
 *
 * A sortable column's control **is** the header — a button filling the cell — so there is one thing to find
 * and one thing to press. `aria-sort` on the cell carries the state; the chevron is `aria-hidden`, because a
 * glyph and an attribute saying the same thing twice is what makes a table announce every heading in duplicate.
 *
 * A column that is not sortable has no button and no `aria-sort` at all, which is how a reader tells the two
 * kinds of heading apart.
 */
export function TableHeaderCell({ header, column, density, sticky }: TableHeaderCellProps) {
  const direction = header.column.getIsSorted()
  const className = headerCellStyles({ align: column.align, density, sticky })

  if (!column.sortable) {
    return (
      <th className={className} data-testid="table-header" scope="col">
        {column.label}
      </th>
    )
  }

  const Glyph = direction === 'desc' ? ChevronDownIcon : ChevronUpIcon

  return (
    <th
      aria-sort={ariaSort(true, direction)}
      className={className}
      data-testid="table-header"
      scope="col"
    >
      <button
        className={sortButtonStyles({ align: column.align })}
        onClick={header.column.getToggleSortingHandler()}
        type="button"
      >
        {column.label}
        <Glyph
          aria-hidden="true"
          className={sortGlyphStyles({ state: direction === false ? 'none' : 'sorted' })}
          size={14}
        />
      </button>
    </th>
  )
}
