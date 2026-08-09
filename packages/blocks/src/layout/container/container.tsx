import { containerStyles } from './container.styles'
import type { ContainerProps } from './container.types'

/**
 * A flex box with the layout props exposed. It renders a `div` and not a landmark: a page is allowed
 * one `main` and a handful of sections, and a container is neither.
 */
export function Container({
  direction,
  gap,
  padding,
  align,
  justify,
  wrap,
  maxWidth,
  children,
}: ContainerProps) {
  return (
    <div className={containerStyles({ direction, gap, padding, align, justify, wrap, maxWidth })}>
      {children}
    </div>
  )
}
