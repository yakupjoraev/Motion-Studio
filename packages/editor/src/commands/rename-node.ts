import { MAX_NAME_LENGTH, type NodeId } from '@motion-studio/schema'

import type { Command } from './command.types'
import { COMMAND_CODES, commandError, requireNode } from './guards'

export interface RenameNodePayload {
  readonly nodeId: NodeId
  readonly name: string
}

/**
 * The layers-tree rename. The bounds are `nodeSchema`'s own: a blank name would make the row
 * unreadable and an over-long one would fail on reload, which is the wrong place to find out.
 */
export function renameNode(payload: RenameNodePayload): Command<RenameNodePayload> {
  return {
    type: 'renameNode',
    label: `Rename to ${payload.name}`,
    payload,
    coalesceKey: `rename:${payload.nodeId}`,
    apply(draft) {
      const name = payload.name.trim()

      if (name.length === 0 || name.length > MAX_NAME_LENGTH) {
        throw commandError(
          COMMAND_CODES.invalidName,
          `A name is between 1 and ${MAX_NAME_LENGTH} characters`,
        )
      }

      requireNode(draft, payload.nodeId).name = name
    },
  }
}
