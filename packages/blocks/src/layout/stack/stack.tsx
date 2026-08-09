import { stackStyles } from './stack.styles'
import type { StackProps } from './stack.types'

/** A line of things with a gap, and optionally a rule between them. */
export function Stack({ direction, gap, align, justify, divider, hidden, children }: StackProps) {
  return (
    <div className={stackStyles({ direction, gap, align, justify, divider, hidden })}>
      {children}
    </div>
  )
}
