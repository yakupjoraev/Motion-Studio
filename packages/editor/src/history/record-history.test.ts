import { describe, expect, it } from 'vitest'

import type { HistoryEntry, HistoryState, IncomingEntry } from './history.types'
import { HISTORY_LIMIT, recordEntry } from './record-history'

const incoming = (overrides: Partial<IncomingEntry> = {}): IncomingEntry => ({
  label: 'Set opacity',
  patches: [{ op: 'replace', path: ['a'], value: 1 }],
  inversePatches: [{ op: 'replace', path: ['a'], value: 0 }],
  selectionBefore: [],
  coalesceKey: null,
  ...overrides,
})

const empty: HistoryState = { past: [], future: [] }

const fill = (count: number): HistoryState => {
  let history = empty

  for (let index = 0; index < count; index += 1) {
    history = recordEntry(history, incoming({ label: `Step ${index}` }), {
      now: index,
      coalesceWindow: 0,
      id: `hist_${index}`,
    })
  }

  return history
}

describe('recordEntry', () => {
  it('appends an entry with the id and the timestamp the caller supplies', () => {
    const history = recordEntry(empty, incoming(), { now: 42, coalesceWindow: 0, id: 'hist_1' })

    expect(history.past).toEqual([{ ...incoming(), id: 'hist_1', timestamp: 42 }])
  })

  it('merges into the entry on top when the keys match inside the window', () => {
    const first = recordEntry(empty, incoming({ coalesceKey: 'k' }), {
      now: 0,
      coalesceWindow: 400,
      id: 'hist_1',
    })
    const second = recordEntry(
      first,
      incoming({ coalesceKey: 'k', patches: [{ op: 'replace', path: ['a'], value: 2 }] }),
      { now: 100, coalesceWindow: 400, id: 'hist_2' },
    )

    expect(second.past).toHaveLength(1)
    expect(second.past[0]?.id).toBe('hist_1')
    expect(second.past[0]?.patches).toEqual([{ op: 'replace', path: ['a'], value: 2 }])
  })

  it('clears the redo stack, because the future it held no longer applies', () => {
    const withFuture: HistoryState = {
      past: [],
      future: [{ ...incoming(), id: 'hist_0', timestamp: 0 } as HistoryEntry],
    }

    expect(
      recordEntry(withFuture, incoming(), { now: 1, coalesceWindow: 0, id: 'hist_1' }).future,
    ).toEqual([])
  })

  it('caps the past and drops the oldest entry', () => {
    const history = fill(HISTORY_LIMIT + 5)

    expect(history.past).toHaveLength(HISTORY_LIMIT)
    expect(history.past[0]?.label).toBe('Step 5')
    expect(history.past.at(-1)?.label).toBe(`Step ${HISTORY_LIMIT + 4}`)
  })
})
