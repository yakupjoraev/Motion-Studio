import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { expectNoViolations, renderBlock } from '../../test/render-block'

import { BentoGrid } from './bento-grid'
import { bentoGridDefinition as definition } from './bento-grid.definition'
import { MAX_CELLS, bentoCells } from './bento-grid.schema'

describe('bentoCells', () => {
  it('draws a cell for every entry, filled or not', () => {
    expect(bentoCells([{ colSpan: 2, rowSpan: 1 }], 0)).toEqual([{ colSpan: 2, rowSpan: 1 }])
  })

  it('gives a child past the end of the list a single unit rather than dropping it', () => {
    expect(bentoCells([{ colSpan: 2, rowSpan: 1 }], 3)).toEqual([
      { colSpan: 2, rowSpan: 1 },
      { colSpan: 1, rowSpan: 1 },
      { colSpan: 1, rowSpan: 1 },
    ])
  })

  it('stops at the cell cap', () => {
    expect(bentoCells([], MAX_CELLS + 4)).toHaveLength(MAX_CELLS)
  })
})

describe('BentoGrid', () => {
  it('draws one cell per entry in the arrangement', () => {
    renderBlock(definition, BentoGrid)

    expect(screen.getAllByTestId('bento-cell')).toHaveLength(definition.defaults.cells.length)
  })

  it('places each child in the cell at its index', () => {
    renderBlock(definition, BentoGrid, {
      children: [<span key="a">First</span>, <span key="b">Second</span>],
    })

    const cells = screen.getAllByTestId('bento-cell')

    expect(cells[0]).toHaveTextContent('First')
    expect(cells[1]).toHaveTextContent('Second')
    expect(cells[2]).toHaveTextContent('')
  })

  it('turns the spans into the grid classes they mean', () => {
    renderBlock(definition, BentoGrid, {
      cells: [
        { colSpan: 2, rowSpan: 2 },
        { colSpan: 3, rowSpan: 1 },
        { colSpan: 1, rowSpan: 1 },
      ],
    })

    const cells = screen.getAllByTestId('bento-cell')

    expect(cells[0]?.className).toContain('@min-[1024px]/frame:col-span-2')
    expect(cells[0]?.className).toContain('@min-[1024px]/frame:row-span-2')
    expect(cells[1]?.className).toContain('@min-[1024px]/frame:col-span-3')
    expect(cells[2]?.className).not.toContain('col-span')
  })

  it('shares a hairline instead of a gap in gapless mode', () => {
    renderBlock(definition, BentoGrid, { gapless: true })

    const grid = screen.getAllByTestId('bento-cell')[0]?.parentElement

    expect(grid?.className).toContain('gap-px')
    expect(grid?.className).toContain('bg-border')
    expect(grid?.className).toContain('overflow-hidden')
  })

  it('takes the corners off the cells when the panel owns them', () => {
    const { unmount } = renderBlock(definition, BentoGrid, { gapless: true })

    expect(screen.getAllByTestId('bento-cell')[0]?.className).toContain('rounded-none')
    unmount()

    renderBlock(definition, BentoGrid, { gapless: false })

    expect(screen.getAllByTestId('bento-cell')[0]?.className).toContain('rounded-xl')
  })

  it('scopes a container query to each cell', () => {
    renderBlock(definition, BentoGrid)

    for (const cell of screen.getAllByTestId('bento-cell')) {
      expect(cell.className).toContain('@container')
    }
  })

  it('has no axe violations', async () => {
    const { container } = renderBlock(definition, BentoGrid, {
      children: [<span key="a">First</span>],
    })

    await expectNoViolations(container)
  })
})
