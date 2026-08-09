import { gridStyles } from './grid.styles'
import type { GridProps } from './grid.types'

/**
 * Two modes, one element. Explicit columns step down at the breakpoints so the grid is usable at
 * 360 px without an override; auto-fit does it by itself, which is why it is the mode most users
 * want.
 */
export function Grid({
  mode,
  columns,
  minItemWidth,
  gapX,
  gapY,
  dense,
  hidden,
  children,
}: GridProps) {
  const track =
    mode === 'auto-fit'
      ? gridStyles({ minItemWidth, gapX, gapY, dense, hidden })
      : gridStyles({ columns: columns as 1 | 2 | 3 | 4 | 5 | 6, gapX, gapY, dense, hidden })

  return <div className={track}>{children}</div>
}
