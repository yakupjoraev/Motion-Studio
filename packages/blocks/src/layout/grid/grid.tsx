import { gridClassName } from './grid.styles'
import type { GridProps } from './grid.types'

/**
 * Two modes, one element. Explicit columns step down at the breakpoints so the grid is usable at
 * 360 px without an override; auto-fit does it by itself, which is why it is the mode most users
 * want.
 */
export function Grid({ children, ...props }: GridProps) {
  return (
    // A scrolling region needs a keyboard route into it — WCAG 2.1.1.
    <div className={gridClassName(props)} tabIndex={props.narrow === 'slider' ? 0 : undefined}>
      {children}
    </div>
  )
}
