import { defineMarkup, el, literal, txt } from '@motion-studio/schema'

import { headingStyles } from './heading.styles'
import type { HeadingProps } from './heading.types'

export const headingMarkup = defineMarkup<HeadingProps>(
  ({ props: { text, level, size, weight, align, balance, gradient, tracking, anchor } }) =>
    el(`h${level}`, {
      classNames: [headingStyles({ size, weight, align, balance, gradient, tracking })],
      ...(anchor === '' ? {} : { attributes: { id: literal(anchor) } }),
      children: [txt(text)],
    }),
)
