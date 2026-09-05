import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { expectNoViolations, renderBlock } from '../../test/render-block'

import { Columns } from './columns'
import { columnsDefinition } from './columns.definition'
import { SPLITS } from './columns.schema'

const definition = columnsDefinition

describe('Columns', () => {
  it('renders one column per slot', () => {
    const { container } = renderBlock(definition, Columns, {
      left: <span>Left side</span>,
      right: <span>Right side</span>,
    })

    expect(screen.getByText('Left side')).toBeInTheDocument()
    expect(screen.getByText('Right side')).toBeInTheDocument()
    expect(container.firstElementChild?.children).toHaveLength(2)
  })

  it('takes two positional children when the host renders by order', () => {
    renderBlock(definition, Columns, {
      children: (
        <>
          <span>First</span>
          <span>Second</span>
        </>
      ),
    })

    expect(screen.getByText('First')).toBeInTheDocument()
    expect(screen.getByText('Second')).toBeInTheDocument()
  })

  it('declares exactly one child per named slot', () => {
    expect(definition.slots.map((slot) => [slot.name, slot.maxChildren])).toEqual([
      ['left', 1],
      ['right', 1],
    ])
  })

  it('has a track for every split', () => {
    for (const split of SPLITS) {
      const { container, unmount } = renderBlock(definition, Columns, { split })

      expect(container.firstElementChild?.className, split).toContain(
        '@min-[768px]/frame:grid-cols-',
      )
      unmount()
    }
  })

  it('stacks on a phone and flips only when asked', () => {
    const plain = renderBlock(definition, Columns)

    expect(plain.container.firstElementChild?.className).toContain('flex-col')
    expect(plain.container.firstElementChild?.className).not.toContain('flex-col-reverse')
    plain.unmount()

    const reversed = renderBlock(definition, Columns, { reverseOnMobile: true })

    expect(reversed.container.firstElementChild?.className).toContain('flex-col-reverse')
  })

  it('has no axe violations', async () => {
    const { container } = renderBlock(definition, Columns, {
      left: <p>Left</p>,
      right: <p>Right</p>,
    })

    await expectNoViolations(container)
  })
})
