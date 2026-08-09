import { containerStyles } from './container.styles'
import type { ContainerProps } from './container.types'

/**
 * A flex box with the layout props exposed. It renders a `div` and not a landmark: a page is allowed
 * one `main` and a handful of sections, and a container is neither.
 */
export function Container({
  mode,
  columns,
  direction,
  gap,
  padding,
  align,
  justify,
  wrap,
  maxWidth,
  divide,
  hidden,
  children,
}: ContainerProps) {
  // Grid mode has no direction and no wrap: the column count is what decides the flow, and passing
  // both would emit two class families that contradict each other.
  const className =
    mode === 'grid'
      ? containerStyles({
          mode,
          columns: columns as 1 | 2 | 3 | 4,
          gap,
          padding,
          align,
          justify,
          maxWidth,
          divide,
          hidden,
        })
      : containerStyles({
          mode,
          direction,
          gap,
          padding,
          align,
          justify,
          wrap,
          maxWidth,
          divide,
          hidden,
        })

  return <div className={className}>{children}</div>
}
