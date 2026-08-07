import type { HTMLAttributes, ReactNode } from 'react'

/**
 * `dir` is dropped: Radix types it as its own `Direction` union rather than as a string, and under
 * `exactOptionalPropertyTypes` the two are not assignable. Reading direction belongs to the document root.
 */
export interface ScrollAreaProps extends Omit<HTMLAttributes<HTMLDivElement>, 'dir'> {
  readonly children: ReactNode
  /** Both by default. A panel that only scrolls down says so, and the horizontal bar never appears. */
  readonly orientation?: 'vertical' | 'horizontal' | 'both'
  /**
   * `hover` keeps the bar out of the way until the pointer arrives; `always` pins it. The layers tree wants
   * `always` — a list whose length is invisible until you touch it is a list you cannot judge.
   */
  readonly scrollbars?: 'hover' | 'always'
  /** Applied to the scrolling element, not the frame — the frame is what the caller sizes. */
  readonly viewportClassName?: string
}
