import { type MotionDocument, type NodeId, nodeId, nodeIds } from '@motion-studio/schema'
import fc from 'fast-check'
import { describe, expect, it } from 'vitest'

import { type CommandPlan, arbitraryPlan } from '../test/arbitrary'
import { type Harness, harness } from '../test/harness'

const GHOST = nodeId('node_ghost')

const live = (harnessed: Harness): readonly NodeId[] => [...nodeIds(harnessed.document()), GHOST]

/**
 * **Coalescing stays off.** `harness` defaults `coalesceWindow` to `0`, and that is what makes "N
 * commands, N entries" true — the invariant these two tests are written against. Turning it on does
 * not fix a failure here; it changes the statement, because a drag is deliberately one entry.
 */
function apply(plans: readonly CommandPlan[]): Harness {
  const harnessed = harness()

  for (const plan of plans) {
    try {
      harnessed.store.getState().dispatch(plan(live(harnessed)))
    } catch {
      // A rejected command writes no entry, so it is simply not part of the round trip.
    }
  }

  return harnessed
}

const undoAll = (harnessed: Harness): void => {
  while (harnessed.store.getState().canUndo) {
    harnessed.store.getState().undo()
  }
}

const redoAll = (harnessed: Harness): void => {
  while (harnessed.store.getState().canRedo) {
    harnessed.store.getState().redo()
  }
}

describe('history round trips', () => {
  it('undoing every command restores the original document', () => {
    fc.assert(
      fc.property(fc.array(arbitraryPlan(), { minLength: 1, maxLength: 40 }), (plans) => {
        const harnessed = harness()
        const before: MotionDocument = structuredClone(harnessed.document())

        for (const plan of plans) {
          try {
            harnessed.store.getState().dispatch(plan(live(harnessed)))
          } catch {
            // As above.
          }
        }

        undoAll(harnessed)

        expect(harnessed.document()).toEqual(before)
      }),
      { numRuns: 150 },
    )
  })

  it('redoing everything again restores the post-command document', () => {
    fc.assert(
      fc.property(fc.array(arbitraryPlan(), { minLength: 1, maxLength: 40 }), (plans) => {
        const harnessed = apply(plans)
        const after: MotionDocument = structuredClone(harnessed.document())

        undoAll(harnessed)
        redoAll(harnessed)

        expect(harnessed.document()).toEqual(after)
      }),
      { numRuns: 150 },
    )
  })

  it('undoes and redoes enough commands to be worth running', () => {
    let entries = 0

    fc.assert(
      fc.property(fc.array(arbitraryPlan(), { minLength: 20, maxLength: 40 }), (plans) => {
        entries += apply(plans).store.getState().history.past.length
      }),
      { numRuns: 50 },
    )

    expect(entries).toBeGreaterThan(200)
  })
})
