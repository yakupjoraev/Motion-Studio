import { nodeId } from '@motion-studio/schema'
import { describe, expect, it } from 'vitest'

import type { IncomingEntry } from './history.types'
import { accumulate, closeTransaction, openTransaction } from './transaction'

const incoming = (value: number): IncomingEntry => ({
  label: `Step ${value}`,
  patches: [{ op: 'replace', path: ['a'], value }],
  inversePatches: [{ op: 'replace', path: ['a'], value: value - 1 }],
  selectionBefore: [],
  coalesceKey: `k${value}`,
})

describe('openTransaction', () => {
  it('records the label and the selection it started from', () => {
    const open = openTransaction(null, 'Paste 5 blocks', [nodeId('node_a')], 'tx_1')

    expect(open).toEqual({
      token: 'tx_1',
      label: 'Paste 5 blocks',
      depth: 1,
      patches: [],
      inversePatches: [],
      selectionBefore: [nodeId('node_a')],
    })
  })

  it('joins the transaction already open rather than starting a second', () => {
    const outer = openTransaction(null, 'Outer', [], 'tx_1')
    const inner = openTransaction(outer, 'Inner', [nodeId('node_b')], 'tx_2')

    expect(inner).toMatchObject({ token: 'tx_1', label: 'Outer', depth: 2, selectionBefore: [] })
  })
})

describe('accumulate', () => {
  it('appends forward patches and prepends inverse ones, which is the undo order', () => {
    const open = accumulate(
      accumulate(openTransaction(null, 'Two', [], 'tx_1'), incoming(1)),
      incoming(2),
    )

    expect(open.patches.map((patch) => patch.value)).toEqual([1, 2])
    expect(open.inversePatches.map((patch) => patch.value)).toEqual([1, 0])
  })
})

describe('closeTransaction', () => {
  it('writes one entry for everything the transaction collected', () => {
    const open = accumulate(
      accumulate(openTransaction(null, 'Two', [], 'tx_1'), incoming(1)),
      incoming(2),
    )
    const outcome = closeTransaction(open)

    expect(outcome.transaction).toBeNull()
    expect(outcome.entry).toEqual({
      label: 'Two',
      patches: open.patches,
      inversePatches: open.inversePatches,
      selectionBefore: [],
      coalesceKey: null,
    })
  })

  it('counts an inner close back down without writing', () => {
    const nested = openTransaction(openTransaction(null, 'Outer', [], 'tx_1'), 'Inner', [], 'tx_2')
    const outcome = closeTransaction(accumulate(nested, incoming(1)))

    expect(outcome.entry).toBeNull()
    expect(outcome.transaction?.depth).toBe(1)
  })

  it('writes nothing for a transaction that changed nothing', () => {
    expect(closeTransaction(openTransaction(null, 'Empty', [], 'tx_1'))).toEqual({
      transaction: null,
      entry: null,
    })
  })
})
