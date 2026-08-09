import { commands } from '@motion-studio/editor'
import { type NodeId, blockId, createEmptyDocument, nodeId } from '@motion-studio/schema'
import { act, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import { useStudioStore } from '../../../store/editor-store'

import { StatusBar } from './status-bar'

let counter = 0

const nextId = (): NodeId => {
  counter += 1

  return nodeId(`node_s${counter}`)
}

const state = () => useStudioStore.getState()

beforeEach(() => {
  act(() => {
    state().replaceDocument(createEmptyDocument({ ids: () => nextId() }))
    state().clearSelection()
    state().setBreakpoint('base')

    if (state().viewport.motionPaused) {
      state().toggleMotionPaused()
    }
  })
})

describe('StatusBar', () => {
  it('counts the nodes in the document', () => {
    render(<StatusBar />)

    expect(screen.getByTestId('status-nodes')).toHaveTextContent('1 node')

    act(() => {
      state().dispatch(
        commands.insertBlock({
          blockId: blockId('heading'),
          parentId: state().document.rootId,
          index: 0,
          slot: 'children',
          id: nextId(),
        }),
      )
    })

    expect(screen.getByTestId('status-nodes')).toHaveTextContent('2 nodes')
  })

  it('names one selected block and counts several', () => {
    const first = nextId()
    const second = nextId()

    act(() => {
      for (const id of [first, second]) {
        state().dispatch(
          commands.insertBlock({
            blockId: blockId('heading'),
            parentId: state().document.rootId,
            index: 0,
            slot: 'children',
            id,
          }),
        )
      }
    })

    render(<StatusBar />)

    expect(screen.getByTestId('status-selection')).toHaveTextContent('No selection')

    act(() => state().select([first]))

    expect(screen.getByTestId('status-selection')).toHaveTextContent('Heading selected')

    // Two siblings, not a node and its parent: selection normalization drops the descendant.
    act(() => state().select([first, second]))

    expect(screen.getByTestId('status-selection')).toHaveTextContent('2 selected')
  })

  it('reports the breakpoint being previewed', () => {
    render(<StatusBar />)

    expect(screen.getByTestId('status-breakpoint')).toHaveTextContent('Base')

    act(() => state().setBreakpoint('lg'))

    expect(screen.getByTestId('status-breakpoint')).toHaveTextContent('Large')
  })

  it('shows motion as paused only while it is — ADR-100', () => {
    render(<StatusBar />)

    expect(screen.queryByTestId('status-motion')).not.toBeInTheDocument()

    act(() => state().toggleMotionPaused())

    expect(screen.getByTestId('status-motion')).toHaveTextContent('Motion paused')

    act(() => state().toggleMotionPaused())

    expect(screen.queryByTestId('status-motion')).not.toBeInTheDocument()
  })

  it('says whether the document has unsaved changes', () => {
    render(<StatusBar />)

    expect(screen.getByTestId('status-saved')).toHaveTextContent('Saved')

    act(() => {
      state().dispatch(
        commands.insertBlock({
          blockId: blockId('section'),
          parentId: state().document.rootId,
          index: 0,
          slot: 'children',
          id: nextId(),
        }),
      )
    })

    expect(screen.getByTestId('status-saved')).toHaveTextContent('Unsaved changes')
  })
})
