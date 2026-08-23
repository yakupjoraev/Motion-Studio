import { children, defineMarkup, el, literal, txt } from '@motion-studio/schema'

import {
  RING_ARC,
  RING_CAPTION,
  RING_STROKE,
  RING_TRACK,
  RING_UNIT,
  ringFrameStyles,
  ringReadoutStyles,
  ringSvgStyles,
} from './progress-ring.styles'
import type { ProgressRingProps } from './progress-ring.types'
import {
  RING_CENTRE,
  RING_CIRCUMFERENCE,
  RING_RADIUS,
  RING_VIEWBOX,
  ringGeometry,
  ringValueText,
} from './ring-geometry'

export const progressRingMarkup = defineMarkup<ProgressRingProps>(
  ({
    props: {
      value,
      min,
      max,
      label,
      valueText,
      showValue,
      valueUnit,
      caption,
      size,
      weight,
      hidden,
    },
  }) => {
    const { percent, offset } = ringGeometry(value, min, max)
    const stroke = RING_STROKE[weight]

    return el('div', {
      classNames: [ringFrameStyles({ hidden })],
      children: children(
        el('div', {
          classNames: ['relative'],
          attributes: {
            'aria-label': literal(label),
            'aria-valuemax': literal(max),
            'aria-valuemin': literal(min),
            'aria-valuenow': literal(value),
            'aria-valuetext': literal(valueText === '' ? ringValueText(percent) : valueText),
            role: literal('progressbar'),
          },
          children: children(
            el('svg', {
              classNames: [ringSvgStyles({ size })],
              attributes: {
                'aria-hidden': literal('true'),
                fill: literal('none'),
                viewBox: literal(`0 0 ${RING_VIEWBOX} ${RING_VIEWBOX}`),
              },
              children: [
                el('circle', {
                  classNames: [RING_TRACK],
                  attributes: {
                    cx: literal(RING_CENTRE),
                    cy: literal(RING_CENTRE),
                    r: literal(RING_RADIUS),
                    stroke: literal('currentColor'),
                    strokeWidth: literal(stroke),
                  },
                }),
                el('circle', {
                  classNames: [RING_ARC],
                  attributes: {
                    cx: literal(RING_CENTRE),
                    cy: literal(RING_CENTRE),
                    r: literal(RING_RADIUS),
                    stroke: literal('currentColor'),
                    strokeLinecap: literal('round'),
                    strokeWidth: literal(stroke),
                  },
                  cssVars: {
                    '--ms-ring-length': String(RING_CIRCUMFERENCE),
                    '--ms-ring-offset': String(offset),
                  },
                }),
              ],
            }),
            showValue &&
              el('p', {
                classNames: [ringReadoutStyles({ size })],
                attributes: { 'aria-hidden': literal('true') },
                children: [
                  el('span', {
                    children: children(
                      txt(String(value)),
                      valueUnit !== '' &&
                        el('span', { classNames: [RING_UNIT], children: [txt(valueUnit)] }),
                    ),
                  }),
                ],
              }),
          ),
        }),
        caption !== '' && el('p', { classNames: [RING_CAPTION], children: [txt(caption)] }),
      ),
    })
  },
)
