import type { HTMLAttributes } from 'react'

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  /** `rect` for a thumbnail, `text` for a line of copy, `circle` for an avatar or a swatch. */
  readonly shape?: 'rect' | 'text' | 'circle'
  /** The final size, so nothing shifts when the content arrives — § Loading and empty states. */
  readonly width?: number | string
  readonly height?: number | string
}
