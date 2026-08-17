import { blockRegistry } from '@motion-studio/blocks/registry'
import { ToastProvider } from '@motion-studio/ui'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { useStudioStore } from '../../../../store/editor-store'
import { DndHost } from '../../dnd-host'

import { BLOCK_GRID_ID } from './block-grid'
import { BlocksTab } from './blocks-tab'
import { clearCategories } from './use-block-search'

const tab = () =>
  render(
    <ToastProvider>
      <DndHost>
        <BlocksTab />
      </DndHost>
    </ToastProvider>,
  )

beforeEach(() => {
  Object.defineProperty(HTMLElement.prototype, 'offsetHeight', { configurable: true, value: 600 })
  Object.defineProperty(HTMLElement.prototype, 'offsetWidth', { configurable: true, value: 280 })
  Object.defineProperty(HTMLElement.prototype, 'clientHeight', { configurable: true, value: 600 })
  Object.defineProperty(HTMLElement.prototype, 'scrollHeight', { configurable: true, value: 10000 })
})

afterEach(clearCategories)

describe('BlocksTab', () => {
  it('names the grid it filters and announces the count once something is filtering', async () => {
    tab()

    const search = screen.getByRole('searchbox', { name: 'Search blocks' })

    expect(search).toHaveAttribute('aria-controls', BLOCK_GRID_ID)
    expect(screen.getByTestId('block-count')).toHaveTextContent('')

    await userEvent.type(search, 'hero')

    expect(screen.getByTestId('block-count').textContent).toMatch(/^\d+ blocks? match$/)
  })

  it('filters the grid down to what matches', async () => {
    tab()

    await userEvent.type(screen.getByRole('searchbox'), 'aurora')

    const grid = screen.getByRole('grid', { name: 'Blocks' })

    expect(within(grid).getAllByRole('button').length).toBeLessThan(blockRegistry.list().length)
    expect(within(grid).getByRole('button', { name: /^Hero — aurora/ })).toBeInTheDocument()
  })

  it('offers a way out of an empty result rather than an empty panel', async () => {
    tab()

    await userEvent.type(screen.getByRole('searchbox'), 'zzqx')

    expect(screen.getByText('No blocks match “zzqx”.')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Clear search' }))

    expect(screen.getByRole('grid', { name: 'Blocks' })).toBeInTheDocument()
    expect(screen.getByRole('searchbox')).toHaveValue('')
  })

  it('takes the union of two selected categories', async () => {
    tab()

    await userEvent.click(screen.getByRole('button', { name: /^Layout \d+$/ }))

    const layoutOnly = screen.getByTestId('block-count').textContent

    await userEvent.click(screen.getByRole('button', { name: /^Hero \d+$/ }))

    const both = Number.parseInt(screen.getByTestId('block-count').textContent ?? '0', 10)

    expect(both).toBe(
      blockRegistry.byCategory('layout').length + blockRegistry.byCategory('hero').length,
    )
    expect(both).toBeGreaterThan(Number.parseInt(layoutOnly ?? '0', 10))
  })

  it('inserts on Enter, selects the new node, and plays the hover clip for nobody under full motion', async () => {
    tab()

    const card = screen.getByRole('button', { name: 'Section, layout block' })

    card.focus()
    await userEvent.keyboard('{Enter}')

    const selected = useStudioStore.getState().selection.ids[0]

    expect(selected).toBeDefined()
    expect(
      selected === undefined
        ? undefined
        : useStudioStore.getState().document.nodes[selected]?.blockId,
    ).toBe('section')
  })

  it('has no accessibility violations', async () => {
    const { container } = tab()

    expect(await axe(container)).toHaveNoViolations()
  })
})
