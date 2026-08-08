import { afterEach, describe, expect, it, vi } from 'vitest'

import { removeNodes } from '../../commands/remove-nodes'
import { setProp } from '../../commands/set-prop'
import { HISTORY_LIMIT } from '../../history/record-history'
import { TEST_NOW } from '../../test/create-test-store'
import { harness, id } from '../../test/harness'

/** A clock a test can move, which is the only way to reach the far side of the coalesce window. */
const movingClock = (): { readonly now: () => number; advance: (ms: number) => void } => {
  let value = TEST_NOW

  return {
    now: () => value,
    advance: (ms) => {
      value += ms
    },
  }
}

const opacity = (value: number) => setProp({ nodeId: id('a'), path: 'opacity', value })

describe('coalescing through the store', () => {
  it('folds a whole drag into one entry', () => {
    const harnessed = harness({ coalesceWindow: 400 })

    for (let step = 0; step < 200; step += 1) {
      harnessed.store.getState().dispatch(opacity(1 - step / 1000))
    }

    expect(harnessed.store.getState().history.past).toHaveLength(1)
  })

  it('keeps two interleaved properties apart', () => {
    const harnessed = harness({ coalesceWindow: 400 })
    const state = harnessed.store.getState()

    state.dispatch(opacity(0.9))
    state.dispatch(setProp({ nodeId: id('a'), path: 'width', value: 100 }))
    state.dispatch(opacity(0.8))

    expect(harnessed.store.getState().history.past).toHaveLength(3)
  })

  it('starts a new entry after a pause', () => {
    const clock = movingClock()
    const harnessed = harness({ coalesceWindow: 400, now: clock.now })

    harnessed.store.getState().dispatch(opacity(0.9))
    clock.advance(500)
    harnessed.store.getState().dispatch(opacity(0.8))

    expect(harnessed.store.getState().history.past).toHaveLength(2)
  })

  it('undo after a coalesced drag restores the pre-drag value', () => {
    const harnessed = harness({ coalesceWindow: 400 })

    harnessed.store.getState().dispatch(opacity(1))

    for (let value = 99; value >= 40; value -= 1) {
      harnessed.store.getState().dispatch(opacity(value / 100))
    }

    expect(harnessed.store.getState().history.past).toHaveLength(1)

    harnessed.store.getState().undo()

    // Not 0.99: the entry kept the inverse patches from before the drag, not from its last frame.
    expect(harnessed.document().nodes[id('a')]?.props['opacity']).toBeUndefined()
  })
})

describe('undo and redo through the store', () => {
  it('does nothing on an empty history', () => {
    const harnessed = harness()
    const before = harnessed.document()

    harnessed.store.getState().undo()
    harnessed.store.getState().redo()

    expect(harnessed.document()).toBe(before)
    expect(harnessed.store.getState().version).toBe(0)
  })

  it('walks back and forward again, marking the document dirty either way', () => {
    const harnessed = harness()

    harnessed.store.getState().dispatch(opacity(0.5))

    const changed = harnessed.document()

    harnessed.store.getState().undo()

    expect(harnessed.document().nodes[id('a')]?.props['opacity']).toBeUndefined()
    expect(harnessed.store.getState().canRedo).toBe(true)

    harnessed.store.getState().redo()

    expect(harnessed.document()).toEqual(changed)
    expect(harnessed.store.getState().dirty).toBe(true)
    expect(harnessed.store.getState().canRedo).toBe(false)
  })

  it('restores the selection the command was issued from, pruned', () => {
    const harnessed = harness()

    harnessed.store.getState().select([id('b')])
    harnessed.store.getState().dispatch(removeNodes({ ids: [id('b')] }))

    expect(harnessed.store.getState().selection.ids).toEqual([id('b')])

    harnessed.store.getState().undo()

    expect(harnessed.store.getState().selection.ids).toEqual([id('b')])

    harnessed.store.getState().redo()

    // The node is gone again, so the selection cannot name it — ADR-065.
    expect(harnessed.store.getState().selection.ids).toEqual([])
  })

  it('clears the redo stack when a new command arrives', () => {
    const harnessed = harness()

    harnessed.store.getState().dispatch(opacity(0.5))
    harnessed.store.getState().undo()

    expect(harnessed.store.getState().canRedo).toBe(true)

    harnessed.store.getState().dispatch(opacity(0.2))

    expect(harnessed.store.getState().history.future).toEqual([])
    expect(harnessed.store.getState().canRedo).toBe(false)
  })

  it('caps the past and drops the oldest', () => {
    const harnessed = harness()

    for (let step = 0; step < HISTORY_LIMIT + 5; step += 1) {
      harnessed.store.getState().dispatch(opacity(step))
    }

    const past = harnessed.store.getState().history.past

    expect(past).toHaveLength(HISTORY_LIMIT)
    expect(past[0]?.id).toBe('hist_6')
  })

  it('clears to an empty history', () => {
    const harnessed = harness()

    harnessed.store.getState().dispatch(opacity(0.5))
    harnessed.store.getState().clearHistory()

    expect(harnessed.store.getState().history).toEqual({ past: [], future: [] })
    expect(harnessed.store.getState().canUndo).toBe(false)
  })
})

describe('transactions', () => {
  it('writes one entry for the whole transaction and undoes it as one', () => {
    const harnessed = harness()
    const before = harnessed.document()
    const state = harnessed.store.getState()

    state.beginTransaction('Five edits')

    for (let step = 0; step < 5; step += 1) {
      state.dispatch(setProp({ nodeId: id('a'), path: `p${step}`, value: step }))
    }

    state.endTransaction()

    expect(harnessed.store.getState().history.past).toHaveLength(1)
    expect(harnessed.store.getState().history.past[0]?.label).toBe('Five edits')

    harnessed.store.getState().undo()

    expect(harnessed.document()).toEqual(before)
  })

  it('flattens a nested transaction into the outer one', () => {
    const harnessed = harness()
    const state = harnessed.store.getState()

    state.beginTransaction('Outer')
    state.dispatch(opacity(0.5))
    state.beginTransaction('Inner')
    state.dispatch(setProp({ nodeId: id('a'), path: 'width', value: 10 }))
    state.endTransaction()

    expect(harnessed.store.getState().history.past).toHaveLength(0)

    state.endTransaction()

    expect(harnessed.store.getState().history.past).toHaveLength(1)
    expect(harnessed.store.getState().history.past[0]?.label).toBe('Outer')
  })

  it('writes nothing for a transaction that changed nothing', () => {
    const harnessed = harness()

    harnessed.store.getState().beginTransaction('Nothing')
    harnessed.store.getState().endTransaction()

    expect(harnessed.store.getState().history.past).toHaveLength(0)
    expect(harnessed.store.getState().transaction).toBeNull()
  })

  it('ignores an endTransaction with nothing open', () => {
    const harnessed = harness()

    harnessed.store.getState().endTransaction()

    expect(harnessed.store.getState().transaction).toBeNull()
  })

  it('restores the selection from before the first command of the transaction', () => {
    const harnessed = harness()
    const state = harnessed.store.getState()

    state.select([id('c')])
    state.beginTransaction('Two edits')
    state.dispatch(opacity(0.5))
    state.select([id('d')])
    state.dispatch(setProp({ nodeId: id('a'), path: 'width', value: 10 }))
    state.endTransaction()
    harnessed.store.getState().undo()

    expect(harnessed.store.getState().selection.ids).toEqual([id('c')])
  })
})

describe('the dev-mode warning for a transaction left open', () => {
  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('warns when one outlives a macrotask', () => {
    vi.useFakeTimers()

    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const harnessed = harness()

    harnessed.store.getState().beginTransaction('Left open')
    vi.runAllTimers()

    expect(warn).toHaveBeenCalledWith(expect.stringContaining('Left open'))
  })

  it('stays quiet for one that closed', () => {
    vi.useFakeTimers()

    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const harnessed = harness()

    harnessed.store.getState().beginTransaction('Closed')
    harnessed.store.getState().dispatch(opacity(0.5))
    harnessed.store.getState().endTransaction()
    vi.runAllTimers()

    expect(warn).not.toHaveBeenCalled()
  })
})

describe('clipboard stub', () => {
  it('holds nothing until prompt 16 fills it', () => {
    expect(harness().store.getState().clipboard).toEqual({ nodes: null, style: null })
  })
})
