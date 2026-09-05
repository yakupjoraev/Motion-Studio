import { describe, expect, it } from 'vitest'

import { expectNoViolations, renderBlock } from '../../test/render-block'

import { Grid } from './grid'
import { gridDefinition } from './grid.definition'
import { MAX_COLUMNS, MIN_ITEM_WIDTHS } from './grid.schema'

const definition = gridDefinition

const classesOf = (overrides: Record<string, unknown> = {}) => {
  const { container, unmount } = renderBlock(definition, Grid, overrides)
  const className = container.firstElementChild?.className ?? ''

  unmount()

  return className
}

describe('Grid', () => {
  it('gives explicit mode a column class that steps down on small screens', () => {
    const className = classesOf({ mode: 'explicit', columns: 3 })

    expect(className).toContain('grid-cols-1')
    expect(className).toContain('@min-[1024px]/frame:grid-cols-3')
    expect(className).not.toContain('auto-fit')
  })

  it('gives auto-fit mode the arbitrary track and no column count — ADR-116', () => {
    const className = classesOf({ mode: 'auto-fit', minItemWidth: 'lg' })

    expect(className).toContain('grid-cols-[repeat(auto-fit,minmax(20rem,1fr))]')
    expect(className).not.toContain('@min-[1024px]/frame:grid-cols-')
  })

  it('has a literal class for every step of both scales', () => {
    for (const minItemWidth of MIN_ITEM_WIDTHS) {
      expect(classesOf({ mode: 'auto-fit', minItemWidth })).toContain('minmax(')
    }

    for (let columns = 1; columns <= MAX_COLUMNS; columns += 1) {
      expect(classesOf({ mode: 'explicit', columns })).toContain('grid-cols-')
    }
  })

  it('separates the two gap axes', () => {
    const className = classesOf({ gapX: 'xl', gapY: 'none' })

    expect(className).toContain('gap-x-12')
    expect(className).toContain('gap-y-0')
  })

  it('packs densely only when asked', () => {
    expect(classesOf({ dense: true })).toContain('grid-flow-row-dense')
    expect(classesOf({ dense: false })).not.toContain('dense')
  })

  it('has no axe violations', async () => {
    const { container } = renderBlock(definition, Grid, { children: <p>Item</p> })

    await expectNoViolations(container)
  })
})
