export interface TableCellValueProps {
  readonly value: string
}

/**
 * What a cell shows.
 *
 * A row that said nothing about this column gets an em dash: an empty cell reads as a rendering bug, and a
 * dash reads as "not applicable". The word behind it is a `sr-only` sibling rather than an `aria-label` on
 * the span, because `aria-label` on an element with no role is ignored by part of the field.
 */
export function TableCellValue({ value }: TableCellValueProps) {
  if (value.trim() !== '') {
    return value
  }

  return (
    <>
      <span aria-hidden="true">—</span>
      <span className="sr-only">Not applicable</span>
    </>
  )
}
