import { defineMarkup, el, txt } from '@motion-studio/schema'

import { textStyles } from './text.styles'
import type { TextProps } from './text.types'

export const textMarkup = defineMarkup<TextProps>(
  ({ props: { text, size, tone, measure, align, columns, dropCap, balance, hidden } }) =>
    el('p', {
      classNames: [
        textStyles({
          size,
          tone,
          measure,
          align,
          columns: columns as 1 | 2 | 3,
          dropCap,
          balance,
          hidden,
        }),
      ],
      children: [txt(text)],
    }),
)
