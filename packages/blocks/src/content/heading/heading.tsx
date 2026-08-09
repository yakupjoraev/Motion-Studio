import { createElement } from 'react'

import { headingStyles } from './heading.styles'
import type { HeadingProps } from './heading.types'

/**
 * `h1`–`h6` from `level`, through `createElement` rather than a lookup map: the tag is a value the
 * schema has already constrained to 1–6, and a map would be six entries saying the same thing.
 */
export function Heading({
  text,
  level,
  size,
  weight,
  align,
  balance,
  gradient,
  tracking,
}: HeadingProps) {
  return createElement(
    `h${level}`,
    { className: headingStyles({ size, weight, align, balance, gradient, tracking }) },
    text,
  )
}
