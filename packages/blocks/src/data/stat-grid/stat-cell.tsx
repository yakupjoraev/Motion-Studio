import { StatDelta } from '../../content/stat/stat-delta'
import { type StatSize, deltaTone } from '../../content/stat/stat.schema'
import { statValueStyles } from '../../content/stat/stat.styles'
import type { Alignment } from '../../scales'

import type { StatItem } from './stat-grid.schema'
import { STAT_CELL_HEAD, STAT_CELL_LABEL, statCellStyles } from './stat-grid.styles'

export interface StatCellProps {
  readonly item: StatItem
  readonly size: StatSize
  readonly align: Alignment
  readonly dividers: boolean
}

/**
 * One cell: the figure, its change, and what it means.
 *
 * The figure's type scale and the change's arrow-and-tone come from `content/stat` rather than from a second
 * implementation — one statistic and a grid of them are the same typography, and the arrow is the signal that
 * has to survive greyscale.
 *
 * No sparkline: `content/stat` draws one because a lone figure has no neighbours to compare against, and a
 * grid's neighbours are the comparison.
 */
export function StatCell({ item, size, align, dividers }: StatCellProps) {
  return (
    <li className={statCellStyles({ align, dividers })} data-testid="stat-cell">
      <div className={STAT_CELL_HEAD}>
        <p className={statValueStyles({ size })} data-testid="stat-cell-value">
          {item.value}
        </p>

        <StatDelta
          label={item.delta}
          rose={item.deltaRose}
          tone={deltaTone(item.deltaDirection, item.deltaRose)}
        />
      </div>

      {item.label !== '' && <p className={STAT_CELL_LABEL}>{item.label}</p>}
    </li>
  )
}
