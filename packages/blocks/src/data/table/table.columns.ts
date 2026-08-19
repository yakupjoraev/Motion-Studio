import type { ColumnDef } from '@tanstack/react-table'

import { type TableColumn, type TableRow, columnId } from './table.schema'

/**
 * The block's columns as TanStack column definitions.
 *
 * A pure function of the props, outside the component, because it is the one piece of the table with a
 * branch worth testing on its own: an accessor reading a cell the row does not have has to yield an empty
 * string rather than `undefined`, or the comparator sorts missing values into a position of their own.
 */
export function tableColumnDefs(columns: readonly TableColumn[]): ColumnDef<TableRow, string>[] {
  return columns.map((column, index) => ({
    id: columnId(index),
    header: column.label,
    accessorFn: (row: TableRow) => row.cells[index] ?? '',
    enableSorting: column.sortable,
    // `alphanumeric` rather than `text`: it splits digits out of the string, so `9` sorts before `10`.
    sortingFn: 'alphanumeric',
  }))
}

/**
 * What `aria-sort` says. `none` on a sortable column that is not the sorted one, and **absent** on a column
 * that cannot be sorted at all — WAI's own pattern for a sortable table.
 *
 * The state lives here and only here. The header button's accessible name stays the column label, because a
 * name that carried the direction too would announce the column twice — once as the name, once as the sort
 * — and the two would be read in whichever order the screen reader happens to use.
 */
export const ariaSort = (
  sortable: boolean,
  direction: false | 'asc' | 'desc',
): 'ascending' | 'descending' | 'none' | undefined => {
  if (!sortable) {
    return undefined
  }

  if (direction === 'asc') {
    return 'ascending'
  }

  return direction === 'desc' ? 'descending' : 'none'
}
