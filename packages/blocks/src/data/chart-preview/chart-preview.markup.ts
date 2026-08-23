import { type MarkupChild, children, defineMarkup, el, literal, txt } from '@motion-studio/schema'

import { AXIS_TICKS, axisTicks, formatTick } from './chart-axis'
import {
  CHART_VIEWBOX,
  areaPath,
  chartBars,
  chartPoints,
  chartSummary,
  dotsPath,
  linePath,
} from './chart-geometry'
import { type ChartKind, pointLabel } from './chart-preview.schema'
import {
  CHART_AREA_OPACITY,
  CHART_AXIS_TEXT,
  CHART_CAPTION,
  CHART_GRID_LINE,
  CHART_LAYOUT,
  CHART_TICK,
  CHART_VALUE_AXIS,
  chartFrameStyles,
  chartSvgStyles,
  pointAxisStyles,
  pointLabelStyles,
} from './chart-preview.styles'
import type { ChartPreviewProps } from './chart-preview.types'

/** The marks, from the same geometry the canvas draws — one source, two consumers. */
const marksMarkup = (kind: ChartKind, series: readonly number[]): readonly MarkupChild[] => {
  if (kind === 'bar') {
    return chartBars(series).map((bar) =>
      el('rect', {
        attributes: {
          fill: literal('currentColor'),
          height: literal(bar.height),
          rx: literal('2'),
          width: literal(bar.width),
          x: literal(bar.x),
          y: literal(bar.y),
        },
      }),
    )
  }

  const points = chartPoints(series)

  return children(
    kind === 'area' &&
      el('path', {
        attributes: {
          d: literal(areaPath(points)),
          fill: literal('currentColor'),
          opacity: literal(CHART_AREA_OPACITY),
        },
      }),
    el('path', {
      attributes: {
        d: literal(linePath(points)),
        fill: literal('none'),
        stroke: literal('currentColor'),
        strokeLinecap: literal('round'),
        strokeLinejoin: literal('round'),
        strokeWidth: literal('2'),
        vectorEffect: literal('non-scaling-stroke'),
      },
    }),
    el('path', {
      attributes: {
        d: literal(dotsPath(points)),
        fill: literal('none'),
        stroke: literal('currentColor'),
        strokeLinecap: literal('round'),
        strokeWidth: literal('6'),
        vectorEffect: literal('non-scaling-stroke'),
      },
    }),
  )
}

const gridMarkup = (ticks: number): MarkupChild | false => {
  if (ticks < 2) {
    return false
  }

  const { width, height } = CHART_VIEWBOX

  return el('g', {
    children: Array.from({ length: ticks }, (_unused, index) => {
      const y = (index / (ticks - 1)) * height

      return el('line', {
        classNames: [CHART_GRID_LINE],
        attributes: {
          stroke: literal('currentColor'),
          strokeWidth: literal('1'),
          vectorEffect: literal('non-scaling-stroke'),
          x1: literal('0'),
          x2: literal(width),
          y1: literal(y),
          y2: literal(y),
        },
      })
    }),
  })
}

export const chartPreviewMarkup = defineMarkup<ChartPreviewProps>(
  ({
    props: {
      series,
      labels,
      kind,
      tone,
      height,
      seriesLabel,
      summary,
      showTable,
      showGrid,
      showPointLabels,
      plate,
      caption,
      hidden,
    },
  }) => {
    const description = summary === '' ? chartSummary(seriesLabel, series) : summary
    const ticks = axisTicks(kind, series)

    return el('figure', {
      classNames: [chartFrameStyles({ hidden, plate })],
      children: children(
        el('div', {
          classNames: [CHART_LAYOUT],
          children: children(
            showGrid &&
              ticks.length >= 2 &&
              el('div', {
                classNames: [CHART_VALUE_AXIS],
                attributes: { 'aria-hidden': literal('true') },
                children: ticks.map((tick) =>
                  el('span', {
                    classNames: [CHART_TICK, CHART_AXIS_TEXT],
                    children: [txt(formatTick(tick))],
                  }),
                ),
              }),
            el('svg', {
              classNames: [chartSvgStyles({ height, tone }), 'col-start-2'],
              attributes: {
                'aria-label': literal(description),
                preserveAspectRatio: literal('none'),
                role: literal('img'),
                viewBox: literal(`0 0 ${CHART_VIEWBOX.width} ${CHART_VIEWBOX.height}`),
              },
              children: children(showGrid && gridMarkup(AXIS_TICKS), ...marksMarkup(kind, series)),
            }),
            showPointLabels &&
              series.length > 0 &&
              el('div', {
                classNames: [pointAxisStyles({ kind })],
                attributes: { 'aria-hidden': literal('true') },
                children: series.map((_value, index) =>
                  el('span', {
                    classNames: [pointLabelStyles({ kind }), CHART_AXIS_TEXT],
                    children: [txt(pointLabel(labels, index))],
                  }),
                ),
              }),
          ),
        }),
        showTable &&
          el('div', {
            classNames: ['sr-only'],
            children: [
              el('table', {
                children: [
                  el('caption', { children: [txt(description)] }),
                  el('thead', {
                    children: [
                      el('tr', {
                        children: [
                          el('th', {
                            attributes: { scope: literal('col') },
                            children: [txt('Point')],
                          }),
                          el('th', {
                            attributes: { scope: literal('col') },
                            children: [txt(seriesLabel)],
                          }),
                        ],
                      }),
                    ],
                  }),
                  el('tbody', {
                    children: series.map((value, index) =>
                      el('tr', {
                        children: [
                          el('th', {
                            attributes: { scope: literal('row') },
                            children: [txt(pointLabel(labels, index))],
                          }),
                          el('td', { children: [txt(String(value))] }),
                        ],
                      }),
                    ),
                  }),
                ],
              }),
            ],
          }),
        caption !== '' &&
          el('figcaption', { classNames: [CHART_CAPTION], children: [txt(caption)] }),
      ),
    })
  },
)
