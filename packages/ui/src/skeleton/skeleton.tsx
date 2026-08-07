import { cn } from '@motion-studio/utils'
import { forwardRef } from 'react'

import { skeletonStyles } from './skeleton.styles'

import type { SkeletonProps } from './skeleton.types'

const size = (value: number | string | undefined): string | undefined =>
  typeof value === 'number' ? `${value}px` : value

export const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(function Skeleton(
  { shape, width, height, className, style, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      // The placeholder is not content: announcing "blank" for every one of them is worse than silence.
      aria-hidden
      data-ms-skeleton=""
      style={{ ...style, width: size(width), height: size(height) }}
      className={cn(skeletonStyles({ shape }), className)}
      {...rest}
    />
  )
})
