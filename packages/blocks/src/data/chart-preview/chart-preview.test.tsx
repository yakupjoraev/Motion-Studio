import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { expectNoViolations, renderBlock } from '../../test/render-block'
import { requireAt } from '../../test/require-at'

import {
  CHART_VIEWBOX,
  areaPath,
  chartBars,
  chartPoints,
  chartSummary,
  linePath,
} from './chart-geometry'
import { ChartPreview } from './chart-preview'
import { chartPreviewDefinition } from './chart-preview.definition'
import { chartPreviewSchema, pointLabel } from './chart-preview.schema'

const defaults = chartPreviewDefinition.defaults

const render = (overrides: Partial<typeof defaults> = {}) =>
  renderBlock(chartPreviewDefinition, ChartPreview, overrides)

describe('ChartPreview', () => {
  it('validates its own defaults', () => {
    expect(() => chartPreviewSchema.parse(defaults)).not.toThrow()
  })

  it('has no axe violations at any of its three kinds', async () => {
    for (const kind of ['line', 'area', 'bar'] as const) {
      const { container, unmount } = render({ kind })

      await expectNoViolations(container)
      unmount()
    }
  })

  it('is one image with a summarising name', () => {
    render()

    expect(
      screen.getByRole('img', { name: chartSummary(defaults.seriesLabel, defaults.series) }),
    ).toBeInTheDocument()
  })

  it('draws an area and its line for the area kind, and only the line for a line', () => {
    const { unmount } = render({ kind: 'area' })
    expect(screen.getByTestId('chart-area')).toBeInTheDocument()
    expect(screen.getByTestId('chart-line')).toBeInTheDocument()
    unmount()

    render({ kind: 'line' })
    expect(screen.queryByTestId('chart-area')).toBeNull()
    expect(screen.getByTestId('chart-line')).toBeInTheDocument()
  })

  it('marks every vertex on a line, as zero-length segments rather than circles', () => {
    render({ kind: 'line' })

    const dots = screen.getByTestId('chart-dots').getAttribute('d') ?? ''

    // One `M…L…` pair per point: a circle would be stretched into an ellipse by the viewBox.
    expect(dots.match(/M/g) ?? []).toHaveLength(defaults.series.length)
  })

  it('draws one rect per value for bars, and no line', () => {
    render({ kind: 'bar' })

    expect(screen.getAllByTestId('chart-bar')).toHaveLength(defaults.series.length)
    expect(screen.queryByTestId('chart-line')).toBeNull()
    expect(screen.queryByTestId('chart-dots')).toBeNull()
  })

  it('carries a hidden table whose values are the series', () => {
    render()

    const table = screen.getByTestId('chart-table')
    const values = [...table.querySelectorAll('tbody td')].map((cell) => Number(cell.textContent))

    // The utility is on the wrapper: `width: 1px` is a minimum a `display: table` box ignores — ADR-222.
    expect(screen.getByTestId('chart-table-shell').className).toContain('sr-only')
    expect(values).toEqual([...defaults.series])
  })

  it('heads every row of the hidden table with the point’s own name', () => {
    render()

    const headers = [...screen.getByTestId('chart-table').querySelectorAll('tbody th')]

    expect(headers).toHaveLength(defaults.series.length)
    for (const [index] of defaults.series.entries()) {
      expect(requireAt(headers, index)).toHaveTextContent(pointLabel(defaults.labels, index))
      expect(requireAt(headers, index)).toHaveAttribute('scope', 'row')
    }
  })

  it('captions the table with the same sentence the drawing is named by', () => {
    render({ summary: 'Exports rising through the summer' })

    expect(screen.getByTestId('chart-table').querySelector('caption')).toHaveTextContent(
      'Exports rising through the summer',
    )
    expect(
      screen.getByRole('img', { name: 'Exports rising through the summer' }),
    ).toBeInTheDocument()
  })

  it('drops the table when the author turned it off', () => {
    render({ showTable: false })

    expect(screen.queryByTestId('chart-table')).toBeNull()
  })

  it('adds no tab stop to the page', () => {
    const { container } = render()

    expect(container.querySelectorAll('a, button, input, [tabindex]')).toHaveLength(0)
  })
})

describe('chartPoints', () => {
  it('spreads the points across the full width and inverts the axis', () => {
    const points = chartPoints([0, 100])

    expect(points).toEqual([
      { x: 0, y: CHART_VIEWBOX.height },
      { x: CHART_VIEWBOX.width, y: 0 },
    ])
  })

  it('draws a flat series on the centre line rather than dividing by zero', () => {
    const ys = chartPoints([40, 40, 40]).map((point) => point.y)

    expect(ys).toEqual([48, 48, 48])
  })

  it('has nothing to draw from fewer than two points', () => {
    expect(chartPoints([5])).toEqual([])
    expect(linePath(chartPoints([5]))).toBe('')
    expect(areaPath(chartPoints([]))).toBe('')
  })

  it('closes the area along the baseline', () => {
    expect(areaPath(chartPoints([0, 100]))).toBe(
      `${linePath(chartPoints([0, 100]))} L${CHART_VIEWBOX.width} ${CHART_VIEWBOX.height} L0 ${CHART_VIEWBOX.height} Z`,
    )
  })

  it('rounds, so the same series produces the same bytes on every machine', () => {
    for (const point of chartPoints([1, 2, 3, 4, 5, 6, 7])) {
      expect(point.x).toBe(Math.round(point.x * 100) / 100)
      expect(point.y).toBe(Math.round(point.y * 100) / 100)
    }
  })
})

describe('chartBars', () => {
  it('measures from zero rather than from the series’ minimum', () => {
    const bars = chartBars([50, 100])

    // Half the height for half the maximum. Normalising to the minimum would have made the first bar empty.
    expect(requireAt(bars, 0).height).toBe(CHART_VIEWBOX.height / 2)
    expect(requireAt(bars, 1).height).toBe(CHART_VIEWBOX.height)
  })

  it('draws nothing for a negative value, since there is no axis to sit below', () => {
    expect(requireAt(chartBars([-10, 100]), 0).height).toBe(0)
  })

  it('draws nothing at all when every value is zero', () => {
    expect(chartBars([0, 0]).map((bar) => bar.height)).toEqual([0, 0])
  })

  it('leaves a gap between bars and keeps them inside the viewBox', () => {
    const bars = chartBars([10, 20, 30])
    const last = requireAt(bars, 2)

    expect(requireAt(bars, 0).width).toBeLessThan(CHART_VIEWBOX.width / 3)
    expect(last.x + last.width).toBeLessThanOrEqual(CHART_VIEWBOX.width)
  })
})

describe('chartSummary', () => {
  it('says the direction as well as the ends', () => {
    expect(chartSummary('Exports', [12, 84])).toBe('Exports rising from 12 to 84 across 2 points')
    expect(chartSummary('Defects', [84, 12])).toBe('Defects falling from 84 to 12 across 2 points')
  })

  it('calls a series that ends where it started flat', () => {
    expect(chartSummary('Exports', [40, 60, 40])).toBe('Exports, flat at 40 across 3 points')
  })

  it('says so when there is no data at all', () => {
    expect(chartSummary('Exports', [])).toBe('Exports, no data')
  })
})

describe('pointLabel', () => {
  it('falls back to the position when the author named fewer points than there are', () => {
    expect(pointLabel(['Mar'], 0)).toBe('Mar')
    expect(pointLabel(['Mar'], 1)).toBe('Point 2')
    expect(pointLabel(['  '], 0)).toBe('Point 1')
  })
})
