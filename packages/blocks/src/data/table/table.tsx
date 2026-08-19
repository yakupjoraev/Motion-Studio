'use client'

import { getCoreRowModel, getSortedRowModel, useReactTable } from '@tanstack/react-table'
import { useMemo } from 'react'

import { DATA_SCROLLER, dataBlockStyles } from '../data.styles'

import { TableBodyRow } from './table-body-row'
import { TableEmptyRow } from './table-empty-row'
import { TableHeaderCell } from './table-header-cell'
import { tableColumnDefs } from './table.columns'
import { captionText } from './table.schema'
import { TABLE_ELEMENT, captionStyles } from './table.styles'
import type { TableProps } from './table.types'

/**
 * A real `<table>`: `<caption>`, `<thead>`, `<th scope="col">`, `<tbody>`.
 *
 * TanStack Table is headless, so it owns the sorting model and nothing else — every element below is ours,
 * which is the only way the markup can be the semantic table a screen reader needs. A generic grid of divs
 * with `role="table"` would look identical and be a different thing.
 *
 * The caption is always present and falls back to the region label, because a table with no accessible name
 * is a dead end: a reader who lands in it by keyboard is told "table" and nothing else.
 *
 * The scroller is a labelled `role="region"` with `tabindex="0"` for the reason `comparison-table` states —
 * a box that scrolls but cannot take focus cannot be scrolled without a pointer.
 */
export function Table({
  caption,
  showCaption,
  columns,
  rows,
  density,
  zebra,
  stickyHeader,
  emptyMessage,
  regionLabel,
  hidden,
}: TableProps) {
  const columnDefs = useMemo(() => tableColumnDefs(columns), [columns])
  const data = useMemo(() => [...rows], [rows])

  const table = useReactTable({
    columns: columnDefs,
    data,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  const headerGroup = table.getHeaderGroups()[0]
  const modelRows = table.getRowModel().rows

  return (
    <div className={dataBlockStyles({ hidden })} data-testid="table">
      {/*
       * `tabIndex` on the region is deliberate and is not a keyboard trap: WAI's guidance for a scrollable
       * region is exactly this. The element gains no other interactive behaviour and draws its own ring.
       */}
      <section
        aria-label={regionLabel}
        className={DATA_SCROLLER}
        data-testid="table-scroller"
        // biome-ignore lint/a11y/noNoninteractiveTabindex: a scrollable region has to be focusable, or it cannot be scrolled without a pointer
        tabIndex={0}
      >
        <table className={TABLE_ELEMENT} data-testid="table-grid">
          <caption className={captionStyles({ visible: showCaption })} data-testid="table-caption">
            {captionText(caption, regionLabel)}
          </caption>

          <thead>
            <tr>
              {(headerGroup?.headers ?? []).map((header, index) => {
                const column = columns[index]

                return column === undefined ? null : (
                  <TableHeaderCell
                    column={column}
                    density={density}
                    header={header}
                    key={header.id}
                    sticky={stickyHeader}
                  />
                )
              })}
            </tr>
          </thead>

          <tbody>
            {modelRows.length === 0 ? (
              <TableEmptyRow columns={columns.length} message={emptyMessage} />
            ) : (
              modelRows.map((row) => (
                <TableBodyRow
                  columns={columns}
                  density={density}
                  key={row.id}
                  row={row}
                  zebra={zebra}
                />
              ))
            )}
          </tbody>
        </table>
      </section>
    </div>
  )
}
