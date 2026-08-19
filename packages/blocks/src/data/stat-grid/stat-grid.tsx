import { dataBlockStyles } from '../data.styles'

import { StatCell } from './stat-cell'
import { columnsClass, statGridStyles } from './stat-grid.styles'
import type { StatGridProps } from './stat-grid.types'

/**
 * A row of figures, divided.
 *
 * A `<ul>` because it is one — peers with no order between them — and that is what lets a screen reader say
 * "list, 4 items" before the first figure instead of reading four unrelated numbers.
 *
 * Each cell is the subject of a container query (`capabilities.containerQuery`, ADR-184): the same cell is
 * wide in a two-column grid and narrow in a four-column one at one viewport width, so where the change sits
 * relative to the figure is a fact about the cell rather than about the page.
 */
export function StatGrid({ items, columns, dividers, size, align, hidden }: StatGridProps) {
  return (
    <div className={dataBlockStyles({ hidden })} data-testid="stat-grid">
      <ul className={`${statGridStyles({ dividers })} ${columnsClass(columns)}`}>
        {items.map((item, index) => (
          <StatCell
            align={align}
            dividers={dividers}
            item={item}
            key={`${item.value}-${index}`}
            size={size}
          />
        ))}
      </ul>
    </div>
  )
}
