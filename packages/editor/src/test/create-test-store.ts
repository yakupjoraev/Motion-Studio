import { type NodeId, fakeRegistry, nodeId } from '@motion-studio/schema'
import { counterIds } from '@motion-studio/utils'

import { createEditorStore } from '../store/create-store'
import type { EditorStore, EditorStoreOptions } from '../store/store.types'

export type TestStoreOptions = EditorStoreOptions

/** Frozen clock — TESTING.md § Determinism. A snapshot must not change because a second elapsed. */
export const TEST_NOW = 1_700_000_000_000

/**
 * The store every downstream test builds on. Deterministic by construction: ids come from a counter,
 * the clock is frozen, and coalescing is off unless a test is about coalescing — an entry per command
 * is what makes "undo everything restores the original" a statement about commands.
 *
 * Each call gets its own counter, so one test cannot shift another's ids.
 */
export function createTestStore(overrides: Partial<TestStoreOptions> = {}): EditorStore {
  const nextId = counterIds()

  return createEditorStore({
    registry: fakeRegistry(),
    generateId: (): NodeId => nodeId(nextId()),
    now: () => TEST_NOW,
    coalesceWindow: 0,
    ...overrides,
  })
}
