import { DATA_EMPTY } from '../data.styles'

import { EMPTY_CELL } from './table.styles'

export interface TableEmptyRowProps {
  readonly columns: number
  readonly message: string
}

/**
 * The empty state, inside the table body and spanning every column.
 *
 * Not a paragraph beside the table: a `<table>` whose `<tbody>` is empty is a table a screen reader
 * announces as having one row and no cells, and the sentence explaining why would sit outside the structure
 * the reader is in.
 */
export function TableEmptyRow({ columns, message }: TableEmptyRowProps) {
  return (
    <tr data-testid="table-empty">
      <td className={`${EMPTY_CELL} ${DATA_EMPTY}`} colSpan={columns}>
        {message}
      </td>
    </tr>
  )
}
