import { act, fireEvent, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ANNOUNCER_CONTAINER_ID } from './announcer-container'
import type { DropTargetResolver } from './dnd.types'
import { HERO, ROOT, acceptAt, rejectWith, renderDnd, zone } from './test/harness'
import { stubPointerEvents } from './test/pointer'

/** dnd-kit's live region, which is the string a screen reader reads. */
const announced = (): string => document.querySelector('[role="status"]')?.textContent?.trim() ?? ''

const grab = (testId: string): void => {
  fireEvent.pointerDown(screen.getByTestId(testId), {
    clientX: 100,
    clientY: 100,
    button: 0,
    isPrimary: true,
  })
  // The move that crosses the activation distance is the one that starts the drag; dnd-kit reports it
  // from the pointer-down position, so the cursor is only known from the move after it.
  fireEvent.pointerMove(document, { clientX: 140, clientY: 120 })
}

const moveTo = (x: number, y: number): void => {
  fireEvent.pointerMove(document, { clientX: x, clientY: y })
}

const flush = async (): Promise<void> => {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0))
  })
}

describe('DndProvider', () => {
  beforeEach(() => {
    stubPointerEvents()
  })

  it('reports an accepted drop once, with the resolved target and the payload', () => {
    const { onDrop } = renderDnd()

    grab('palette-card')
    fireEvent.pointerUp(document)

    expect(onDrop).toHaveBeenCalledTimes(1)
    expect(onDrop.mock.calls[0]?.[0]).toMatchObject({ parentId: ROOT, slot: 'children', index: 1 })
    expect(onDrop.mock.calls[0]?.[1]).toMatchObject({ kind: 'palette-block' })
  })

  it('hands the resolver the cursor, in screen coordinates', () => {
    const resolveTarget = vi.fn<DropTargetResolver>(acceptAt(0))

    renderDnd({ resolveTarget })
    grab('palette-card')
    moveTo(220, 260)
    fireEvent.pointerUp(document)

    expect(resolveTarget).toHaveBeenLastCalledWith(
      expect.objectContaining({ point: { x: 220, y: 260 } }),
    )
  })

  it('does not report a drop the resolver rejected', () => {
    const { onDrop } = renderDnd({ resolveTarget: rejectWith('Cannot drop into itself') })

    grab('canvas-node')
    fireEvent.pointerUp(document)

    expect(onDrop).not.toHaveBeenCalled()
  })

  it('announces the reason a target refused, before the release', async () => {
    renderDnd({ resolveTarget: rejectWith('Section only accepts layout blocks') })

    grab('palette-card')

    await waitFor(() => {
      expect(announced()).toContain('Section only accepts layout blocks.')
    })
  })

  it('announces the pick-up and the position it is over', async () => {
    renderDnd()

    grab('palette-card')

    await waitFor(() => {
      expect(announced()).toBe('Aurora hero, marketing block over Section, position 2 of 2.')
    })
  })

  it('reports nothing when the drag is cancelled with the escape key', async () => {
    const { onDrop } = renderDnd()

    grab('palette-card')
    fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' })

    expect(onDrop).not.toHaveBeenCalled()
    expect(announced()).toBe(
      'Cancelled. Aurora hero, marketing block returned to its original position.',
    )
    await waitFor(() => {
      expect(screen.queryByTestId('block-card-preview')).toBeNull()
    })
  })

  it('reports nothing when the window loses focus mid-drag', async () => {
    const { onDrop } = renderDnd()

    grab('palette-card')
    fireEvent.blur(window)

    expect(onDrop).not.toHaveBeenCalled()
    await waitFor(() => {
      expect(screen.queryByTestId('block-card-preview')).toBeNull()
    })
  })

  it('shows an outline ghost for a canvas node and a card for a palette block', () => {
    renderDnd({ nodeIds: [HERO], labels: ['Aurora hero'] })

    grab('canvas-node')

    expect(screen.getByTestId('node-ghost')).toBeInTheDocument()
    expect(screen.queryByTestId('block-card-preview')).toBeNull()
  })

  it('counts the whole selection on the ghost', () => {
    renderDnd({
      nodeIds: [HERO, ROOT],
      labels: ['Aurora hero', 'Section'],
      zones: [zone({ childIds: [] })],
    })

    grab('canvas-node')

    expect(screen.getByTestId('layer-count')).toHaveTextContent('2 layers')
  })

  it('counts a move within the same list without inventing a slot', async () => {
    renderDnd({ nodeIds: [HERO], labels: ['Aurora hero'], zones: [zone({ childIds: [HERO] })] })

    grab('canvas-node')

    await waitFor(() => {
      expect(announced()).toBe('Aurora hero over Section, position 2 of 1.')
    })
  })

  it('keeps the announcer out of the studio tree, where a dialog would hide it', () => {
    const { container } = renderDnd()
    const announcer = document.getElementById(ANNOUNCER_CONTAINER_ID)

    expect(announcer?.parentElement).toBe(document.body)
    expect(container.contains(announcer ?? null)).toBe(false)
  })

  it('drags with the keyboard from pick-up to drop', async () => {
    const { onDrop } = renderDnd()
    const card = screen.getByTestId('palette-card')

    card.focus()
    fireEvent.keyDown(card, { key: ' ', code: 'Space' })
    await flush()

    expect(screen.getByTestId('block-card-preview')).toBeInTheDocument()

    fireEvent.keyDown(document, { key: 'ArrowDown', code: 'ArrowDown' })
    fireEvent.keyDown(document, { key: ' ', code: 'Space' })
    await flush()

    expect(onDrop).toHaveBeenCalledTimes(1)
  })
})
