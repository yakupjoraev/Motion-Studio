import { nodeId } from '@motion-studio/schema'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useStudioStore } from '../../../store/editor-store'

import { NodeErrorBoundary } from './node-error-boundary'

/**
 * The real store with three of its methods watched, rather than a mocked module: what the card's
 * actions have to be is *commands on the store*, and a stubbed store would assert that against
 * itself. The originals are put back after each test.
 */
const dispatch = vi.fn()
const dispatchBatch = vi.fn()
const select = vi.fn()
const original = {
  dispatch: useStudioStore.getState().dispatch,
  dispatchBatch: useStudioStore.getState().dispatchBatch,
  select: useStudioStore.getState().select,
}

const id = nodeId('node_a3f2')

const Boom = (): never => {
  throw new TypeError('plans is not an array')
}

const renderNode = (child = <Boom />) => {
  render(
    <>
      <p>a sibling block</p>
      <NodeErrorBoundary
        blockId="pricing-table"
        defaults={{ plans: [], heading: 'Pricing' }}
        nodeId={id}
        nodeName="Pricing table"
      >
        {child}
      </NodeErrorBoundary>
    </>,
  )
}

let consoleError: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  vi.clearAllMocks()
  useStudioStore.setState({ dispatch, dispatchBatch, select })
  consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)
})

afterEach(() => {
  useStudioStore.setState(original)
  consoleError.mockRestore()
})

describe('the node boundary', () => {
  it('names the block, says what it said, and leaves the rest of the canvas alone', () => {
    renderNode()

    expect(screen.getByTestId('node-error')).toHaveTextContent(
      'Pricing table failed to render. plans is not an array. Reset its props or delete the block.',
    )
    expect(screen.getByText('a sibling block')).toBeInTheDocument()
  })

  it('offers the document download', () => {
    renderNode()

    expect(screen.getByRole('button', { name: 'Download document' })).toBeInTheDocument()
  })

  /** One entry, so a reset the user regrets is one press of undo — `prompts/58` § Recovery. */
  it('resets every prop to its default in a single history entry', async () => {
    renderNode()
    await userEvent.click(screen.getByRole('button', { name: 'Reset to defaults' }))

    expect(dispatchBatch).toHaveBeenCalledTimes(1)
    expect(dispatchBatch.mock.calls[0]?.[0]).toHaveLength(2)
    expect(dispatchBatch.mock.calls[0]?.[1]).toBe('Reset Pricing table')
  })

  it('deletes the node through a command, so the delete is undoable too', async () => {
    renderNode()
    await userEvent.click(screen.getByRole('button', { name: 'Delete block' }))

    expect(dispatch).toHaveBeenCalledTimes(1)
    expect(dispatch.mock.calls[0]?.[0]).toMatchObject({
      type: 'removeNodes',
      payload: { ids: [id] },
    })
  })

  it('selects the node so the inspector can be used on it', async () => {
    renderNode()
    await userEvent.click(screen.getByRole('button', { name: 'Select' }))

    expect(select).toHaveBeenCalledWith([id])
  })

  /**
   * ADR-341. The block that throws again after a reset: the canvas stops rendering it, and nothing
   * is dispatched — the node keeps its props and the document is unchanged.
   */
  it('stops rendering the block when it is placeheld, without touching the document', async () => {
    renderNode()
    await userEvent.click(screen.getByRole('button', { name: 'Replace with a placeholder' }))

    expect(screen.getByTestId('node-placeholder')).toHaveTextContent(
      'Pricing table is not being rendered.',
    )
    expect(screen.queryByTestId('node-error')).toBeNull()
    expect(dispatch).not.toHaveBeenCalled()
    expect(dispatchBatch).not.toHaveBeenCalled()
  })

  it('gives the block a clean second attempt from the placeholder', async () => {
    renderNode()
    await userEvent.click(screen.getByRole('button', { name: 'Replace with a placeholder' }))
    await userEvent.click(screen.getByRole('button', { name: 'Try the block again' }))

    // It throws on every render, so the card is the right answer to a second attempt.
    expect(screen.getByTestId('node-error')).toBeInTheDocument()
    expect(screen.queryByTestId('node-placeholder')).toBeNull()
  })

  it('renders the block again once it stops throwing', async () => {
    let broken = true

    const Flaky = () => {
      if (broken) {
        throw new TypeError('plans is not an array')
      }

      return <p>the block rendered</p>
    }

    renderNode(<Flaky />)
    broken = false
    await userEvent.click(screen.getByRole('button', { name: 'Reset to defaults' }))

    expect(screen.getByText('the block rendered')).toBeInTheDocument()
  })
})
