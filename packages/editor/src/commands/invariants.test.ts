import {
  type NodeId,
  documentSchema,
  nodeId,
  nodeIds,
  validateDocument,
} from '@motion-studio/schema'
import fc from 'fast-check'
import { describe, expect, it } from 'vitest'

import { type CommandPlan, arbitraryPlan } from '../test/arbitrary'
import { type Harness, harness } from '../test/harness'

/** One id that never exists, so the guard paths stay part of every sequence. */
const GHOST = nodeId('node_ghost')

const live = (harnessed: Harness): readonly NodeId[] => [...nodeIds(harnessed.document()), GHOST]

function run(plans: readonly CommandPlan[]): Harness {
  const harnessed = harness()

  for (const plan of plans) {
    try {
      harnessed.store.getState().dispatch(plan(live(harnessed)))
    } catch {
      // A rejected command is an acceptable outcome — a corrupted document is not.
    }
  }

  return harnessed
}

describe('the command catalogue', () => {
  it('holds the document invariants after any sequence of commands', () => {
    fc.assert(
      fc.property(fc.array(arbitraryPlan(), { maxLength: 60 }), (plans) => {
        expect(validateDocument(run(plans).document())).toEqual({ ok: true, value: undefined })
      }),
      { numRuns: 200 },
    )
  })

  it('leaves a document the file format still accepts', () => {
    fc.assert(
      fc.property(fc.array(arbitraryPlan(), { maxLength: 40 }), (plans) => {
        expect(documentSchema.safeParse(run(plans).document()).success).toBe(true)
      }),
      { numRuns: 100 },
    )
  })

  it('applies enough of what it generates to be worth running', () => {
    let applied = 0

    fc.assert(
      fc.property(fc.array(arbitraryPlan(), { minLength: 20, maxLength: 60 }), (plans) => {
        applied += run(plans).store.getState().version
      }),
      { numRuns: 50 },
    )

    // Guards against a silent regression to the shape where every generated command is rejected and
    // the two properties above pass over an untouched document.
    expect(applied).toBeGreaterThan(200)
  })
})
