import { type MarkupElement, children, defineMarkup, el, literal, txt } from '@motion-studio/schema'

import { SPARKLINE_VIEWBOX, sparklinePath } from './sparkline'
import { deltaTone } from './stat.schema'
import {
  STAT_LABEL,
  statDeltaStyles,
  statSparklineStyles,
  statStyles,
  statValueStyles,
} from './stat.styles'
import type { StatProps } from './stat.types'

type Tone = 'positive' | 'negative' | 'neutral'

/** The arrow is the second signal beside colour, so the direction survives greyscale. */
const ARROWS = { up: '↑', down: '↓' } as const

const deltaMarkup = (label: string, rose: boolean, tone: Tone): MarkupElement | null =>
  label === ''
    ? null
    : el('span', {
        classNames: [statDeltaStyles({ tone })],
        children: [
          el('span', {
            attributes: { 'aria-hidden': literal(true) },
            children: [txt(ARROWS[rose ? 'up' : 'down'])],
          }),
          txt(label),
        ],
      })

/** The same geometry the canvas draws, from the same pure function. */
const sparklineMarkup = (values: readonly number[], tone: Tone): MarkupElement | null => {
  const geometry = sparklinePath(values)

  if (geometry.line === '') {
    return null
  }

  return el('svg', {
    classNames: [statSparklineStyles({ tone })],
    attributes: {
      'aria-hidden': literal(true),
      fill: literal('none'),
      preserveAspectRatio: literal('none'),
      viewBox: literal(`0 0 ${SPARKLINE_VIEWBOX.width} ${SPARKLINE_VIEWBOX.height}`),
    },
    children: [
      el('path', {
        attributes: {
          d: literal(geometry.area),
          fill: literal('currentColor'),
          opacity: literal('0.12'),
        },
      }),
      el('path', {
        attributes: {
          d: literal(geometry.line),
          stroke: literal('currentColor'),
          strokeLinecap: literal('round'),
          strokeLinejoin: literal('round'),
          strokeWidth: literal('2'),
          vectorEffect: literal('non-scaling-stroke'),
        },
      }),
    ],
  })
}

export const statMarkup = defineMarkup<StatProps>(
  ({
    props: {
      value,
      label,
      delta,
      deltaDirection,
      deltaRose,
      series,
      showSparkline,
      size,
      align,
      hidden,
    },
  }) => {
    const tone = deltaTone(deltaDirection, deltaRose)

    return el('div', {
      classNames: [statStyles({ align, hidden })],
      children: children(
        el('p', { classNames: [statValueStyles({ size })], children: [txt(value)] }),
        label !== '' && el('p', { classNames: [STAT_LABEL], children: [txt(label)] }),
        deltaMarkup(delta, deltaRose, tone),
        showSparkline && sparklineMarkup(series, tone),
      ),
    })
  },
)
