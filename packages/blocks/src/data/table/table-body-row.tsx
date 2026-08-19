import type { Row } from '@tanstack/react-table'

import type { Density } from '../data.schema'

import { TableCellValue } from './table-cell-value'
import type { TableColumn, TableRow } from './table.schema'
import { bodyCellStyles, bodyRowStyles } from './table.styles'

export interface TableBodyRowProps {
  readonly row: Row<TableRow>
  readonly columns: readonly TableColumn[]
  readonly density: Density
  readonly zebra: boolean
}

/**
 * One `<tr>`.
 *
 * The alignment comes from the column rather than from the value, so a column stays a column after a sort.
 * The cell value is read through the table model rather than off the row, because after a sort the model's
 * order is the order the reader sees and the row's own index is not.
 */
export function TableBodyRow({ row, columns, density, zebra }: TableBodyRowProps) {
  return (
    <tr className={bodyRowStyles({ zebra })} data-testid="table-row">
      {row.getVisibleCells().map((cell, index) => (
        <td
          className={bodyCellStyles({ align: columns[index]?.align ?? 'start', density })}
          data-testid="table-cell"
          key={cell.id}
        >
          <TableCellValue value={cell.getValue<string>()} />
        </td>
      ))}
    </tr>
  )
}
