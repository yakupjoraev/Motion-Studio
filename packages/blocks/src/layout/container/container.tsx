import { containerClassName } from './container.styles'
import type { ContainerProps } from './container.types'

/**
 * A flex box with the layout props exposed. It renders a `div` and not a landmark: a page is allowed
 * one `main` and a handful of sections, and a container is neither.
 */
export function Container({ children, ...props }: ContainerProps) {
  return <div className={containerClassName(props)}>{children}</div>
}
