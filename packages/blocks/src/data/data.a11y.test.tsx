import type { RenderResult } from '@testing-library/react'
import { screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { expectNoViolations, renderBlock } from '../test/render-block'

import { ChartPreview } from './chart-preview/chart-preview'
import { chartPreviewDefinition } from './chart-preview/chart-preview.definition'
import { definitions } from './definitions'
import { ProgressRing } from './progress-ring/progress-ring'
import { progressRingDefinition } from './progress-ring/progress-ring.definition'
import { StatGrid } from './stat-grid/stat-grid'
import { statGridDefinition } from './stat-grid/stat-grid.definition'
import { Table } from './table/table'
import { tableDefinition } from './table/table.definition'
import { Timeline } from './timeline/timeline'
import { timelineDefinition } from './timeline/timeline.definition'

/**
 * The category's own gate, for the rules that hold across all five rather than block by block.
 *
 * The cases are written out rather than derived from `components`, for the reason the interactive category's gate
 * gives: deriving them would need a cast from the render registry's `ComponentType<never>` back to each block's
 * props, and § 1 of the contract has no room for one.
 */
interface Case {
  readonly id: string
  /**
   * How many tab stops the block adds. Four of the five add **none** — a data display is something to read, and
   * the one that takes focus does so because it scrolls.
   */
  readonly tabStops: number
  readonly render: () => RenderResult
}

const CASES: readonly Case[] = [
  {
    id: 'table',
    // The scroller, then one button per sortable column.
    tabStops: 1 + tableDefinition.defaults.columns.filter((column) => column.sortable).length,
    render: () => renderBlock(tableDefinition, Table),
  },
  { id: 'stat-grid', tabStops: 0, render: () => renderBlock(statGridDefinition, StatGrid) },
  {
    id: 'progress-ring',
    tabStops: 0,
    render: () => renderBlock(progressRingDefinition, ProgressRing),
  },
  { id: 'timeline', tabStops: 0, render: () => renderBlock(timelineDefinition, Timeline) },
  {
    id: 'chart-preview',
    tabStops: 0,
    render: () => renderBlock(chartPreviewDefinition, ChartPreview),
  },
]

describe.each(CASES.map((one) => [one.id, one] as const))('%s', (id, subject) => {
  it('has no axe violations at its defaults', async () => {
    const { container } = subject.render()

    await expectNoViolations(container)
  })

  it('gives every control an accessible name', () => {
    subject.render()

    for (const control of [
      ...screen.queryAllByRole('button'),
      ...screen.queryAllByRole('link'),
      ...screen.queryAllByRole('region'),
      ...screen.queryAllByRole('img'),
      ...screen.queryAllByRole('progressbar'),
    ]) {
      expect(control, `${id}: ${control.outerHTML.slice(0, 90)}`).toHaveAccessibleName()
    }
  })

  it('reaches the end of its own tab order and lets the page continue', async () => {
    subject.render()

    for (let stop = 0; stop < subject.tabStops; stop += 1) {
      await userEvent.tab()
      expect(document.activeElement, `${id}: stop ${stop + 1}`).not.toBe(document.body)
    }

    await userEvent.tab()

    expect(document.activeElement, id).toBe(document.body)
  })

  it('draws its focus ring on whatever takes focus rather than inheriting one', () => {
    const { container } = subject.render()

    for (const element of container.querySelectorAll('[tabindex="0"], button')) {
      expect(element.className, `${id}: ${element.outerHTML.slice(0, 80)}`).toContain(
        'focus-visible:outline',
      )
    }
  })

  it('hides every decorative drawing from the accessibility tree', () => {
    const { container } = subject.render()

    // An SVG a reader cannot use is either named — `chart-preview` — or hidden. Never neither.
    for (const svg of container.querySelectorAll('svg')) {
      const named = svg.getAttribute('role') === 'img' && svg.hasAttribute('aria-label')

      expect(named || svg.getAttribute('aria-hidden') === 'true', `${id}: unnamed svg`).toBe(true)
    }
  })
})

describe('the category as a whole', () => {
  it('says something about what a screen reader gets, per block', () => {
    for (const definition of Object.values(definitions)) {
      expect(definition.category, definition.id).toBe('data')
      expect(definition.a11y.notes.length, definition.id).toBeGreaterThanOrEqual(5)
      expect(
        definition.a11y.notes.some((note) =>
          /screen reader|aria-|caption|announce|keyboard|focus/i.test(note),
        ),
        definition.id,
      ).toBe(true)
    }
  })

  it('fetches nothing: every block’s data is a prop', () => {
    for (const definition of Object.values(definitions)) {
      for (const group of definition.controls) {
        for (const control of group.controls) {
          expect(control.path, definition.id).not.toMatch(/url|endpoint|source|fetch/i)
        }
      }
    }
  })

  it('animates on the entrance channel only', () => {
    for (const definition of Object.values(definitions)) {
      expect(definition.capabilities.supportsMotion, definition.id).toEqual(['entrance'])
    }
  })
})
