import type { HTMLAttributes, ReactNode } from 'react'

/** `dir` is dropped: Radix's `Direction` union is not assignable from `string | undefined`. */
export interface ScrollAreaProps extends Omit<HTMLAttributes<HTMLDivElement>, 'dir'> {
  readonly children: ReactNode
  /** Both by default. */
  readonly orientation?: 'vertical' | 'horizontal' | 'both'
  /** The layers tree wants `always`: a list whose length is invisible until you touch it cannot be judged. */
  readonly scrollbars?: 'hover' | 'always'
  /** Applied to the scrolling element; the frame is what the caller sizes. */
  readonly viewportClassName?: string
}
