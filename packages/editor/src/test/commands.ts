import type { NodeId } from '@motion-studio/schema'

import type { Command } from '../commands/command.types'

/**
 * Commands written by a test are the real thing, not a mock: a command *is* data plus a mutation, so
 * a two-line one here exercises the same pipeline the catalogue will — TESTING.md § Unit tests, "no
 * mocking of our own modules". The catalogue itself arrives with prompt 14.
 */
export const renameRoot = (name: string): Command<{ name: string }> => ({
  type: 'test/renameRoot',
  label: `Rename to ${name}`,
  payload: { name },
  coalesceKey: 'test/renameRoot',
  apply(draft) {
    const root = draft.nodes[draft.rootId]

    if (root !== undefined) {
      root.name = name
    }
  },
})

/**
 * Deletes a node and unlinks it from its parent — enough to reproduce what the selection sees after a
 * real removal, which is a selection field pointing at a node that is no longer there. The catalogue's
 * `removeNodes`, with its subtree collection and asset release, is prompt 14.
 */
export const removeNode = (id: NodeId): Command<{ id: NodeId }> => ({
  type: 'test/removeNode',
  label: 'Remove',
  payload: { id },
  apply(draft) {
    const parentId = draft.nodes[id]?.parentId
    const parent = parentId === undefined || parentId === null ? undefined : draft.nodes[parentId]

    if (parent !== undefined) {
      parent.children = parent.children.filter((child) => child !== id)
    }

    delete draft.nodes[id]
  },
})

/** Writes nothing at all: the shape a no-op command takes when it decides there is nothing to do. */
export const noop = (): Command<null> => ({
  type: 'test/noop',
  label: 'Do nothing',
  payload: null,
  apply() {},
})

export const failing = (message: string): Command<null> => ({
  type: 'test/failing',
  label: 'Fail',
  payload: null,
  apply() {
    throw new Error(message)
  },
})
