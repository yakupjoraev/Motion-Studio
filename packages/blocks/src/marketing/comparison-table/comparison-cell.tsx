import { CheckIcon, MinusIcon } from '@motion-studio/icons'

import { cellKind } from './comparison-table.schema'
import {
  COMPARISON_TEXT,
  comparisonCellStyles,
  comparisonMarkStyles,
} from './comparison-table.styles'

export interface ComparisonCellProps {
  readonly value: string | undefined
  readonly highlighted: boolean
}

/** What the answer is said with. Same rule as the pricing table: the glyph is the signal, colour is not. */
const WORDS = { yes: 'Yes', no: 'No' } as const

export function ComparisonCell({ value, highlighted }: ComparisonCellProps) {
  const kind = cellKind(value)

  return (
    <td className={comparisonCellStyles({ highlighted })} data-kind={kind}>
      {kind === 'yes' || kind === 'no' ? (
        <span className="inline-flex items-center justify-center">
          <span className={comparisonMarkStyles({ kind })}>
            {kind === 'yes' ? (
              <CheckIcon aria-hidden="true" size={12} />
            ) : (
              <MinusIcon aria-hidden="true" size={12} />
            )}
          </span>
          {/* The word behind the glyph, so a cell announces "Yes" rather than nothing at all. */}
          <span className="sr-only">{WORDS[kind]}</span>
        </span>
      ) : kind === 'text' ? (
        <span className={COMPARISON_TEXT}>{value}</span>
      ) : (
        // A row that said nothing about this column. An em dash reads as "not applicable"; an empty cell
        // reads as a rendering bug.
        <span aria-label="Not applicable" className={COMPARISON_TEXT}>
          —
        </span>
      )}
    </td>
  )
}
