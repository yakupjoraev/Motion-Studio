import { doc, tree, treeId } from '@motion-studio/schema'
import { describe, expect, it } from 'vitest'

import { setProp } from '../commands/set-prop'
import { harness } from '../test/harness'

import { HISTORY_LIMIT } from './record-history'

/**
 * EDITOR_ENGINE.md § Limits claims a full history is cheap because entries are patches rather than
 * snapshots. Measured on a 60-node document (13 kB serialised): 200 entries are **54 kB**, 277 bytes
 * each. The ceiling below is four times that — it does not police a few extra bytes, it catches the
 * change that starts storing documents, which would put a full history at 2.6 MB.
 */
const CEILING_BYTES = 200 * 1024

describe('history memory', () => {
  it('keeps a full history in kilobytes for a 60-node document', () => {
    const names = Array.from({ length: 59 }, (_, index) => `n${index}`)
    const document = doc(tree({ root: names }))
    const harnessed = harness({ document })

    for (let step = 0; step < HISTORY_LIMIT; step += 1) {
      const target = names[step % names.length] ?? 'n0'

      harnessed.store
        .getState()
        .dispatch(setProp({ nodeId: treeId(target), path: `p${step}`, value: step }))
    }

    const past = harnessed.store.getState().history.past

    expect(past).toHaveLength(HISTORY_LIMIT)
    expect(JSON.stringify(past).length).toBeLessThan(CEILING_BYTES)
  })
})
