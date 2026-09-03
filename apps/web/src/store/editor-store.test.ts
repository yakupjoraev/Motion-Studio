import { commands } from '@motion-studio/editor'
import { nodeId } from '@motion-studio/schema'
import { beforeEach, describe, expect, it } from 'vitest'

import { lastOf, resetErrorContext } from '../lib/errors/error-context'
import { useStudioStore } from './editor-store'

/** Absent from the document on purpose: a command that throws is exactly the one a report is about. */
const missing = nodeId('node_missing')

const attempt = (run: () => void): void => {
  try {
    run()
  } catch {
    // The guard's throw is the subject of the next assertion's sibling, not of this one.
  }
}

describe('the studio store', () => {
  beforeEach(() => {
    resetErrorContext()
  })

  it('records a dispatched command for the crash report', () => {
    attempt(() =>
      useStudioStore
        .getState()
        .dispatch(commands.setProp({ nodeId: missing, path: 'gap', value: 4 })),
    )

    expect(lastOf('command')?.label).toBe('setProp gap')
  })

  it('records a batch as its shape, not as its label', () => {
    const batch = ['gap', 'padding'].map((path) =>
      commands.setProp({ nodeId: missing, path, value: 0 }),
    )

    attempt(() => useStudioStore.getState().dispatchBatch(batch, 'Reset Pricing table'))

    expect(lastOf('command')?.label).toBe('batch setProp ×2')
  })

  /** Recorded before the command runs, so a command that threw still names itself. */
  it('records the command even when it throws', () => {
    expect(() =>
      useStudioStore.getState().dispatch(commands.removeNodes({ ids: [missing] })),
    ).toThrow()

    expect(lastOf('command')?.label).toBe('removeNodes')
  })
})
