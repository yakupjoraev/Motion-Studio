import type { BlockId, MotionDocument, NodeId } from '@motion-studio/schema'
import { humanize } from '@motion-studio/utils'
import type { Draft } from 'immer'

import type { Command, CommandContext } from './command.types'
import { COMMAND_CODES, commandError } from './guards'
import { insertOneNode } from './insert-node'

export interface InsertBlockPayload {
  readonly blockId: BlockId
  readonly parentId: NodeId
  readonly index: number
  readonly slot: string
  readonly id?: NodeId | undefined
}

interface Placement {
  readonly blockId: BlockId
  readonly parentId: NodeId
  readonly index: number
  readonly slot: string
  readonly id?: NodeId | undefined
}

/** Depth-first, so a slot's default children are themselves materialised — ADR-062. */
function materialize(
  draft: Draft<MotionDocument>,
  context: CommandContext,
  placement: Placement,
  path: readonly BlockId[],
): void {
  const id = insertOneNode(draft, context, placement)

  for (const slot of context.registry.require(placement.blockId).slots) {
    const defaults = slot.defaultChildren ?? []

    for (const [index, childBlockId] of defaults.entries()) {
      if (path.includes(childBlockId)) {
        throw commandError(
          COMMAND_CODES.recursiveDefaultChildren,
          `Block ${childBlockId} is its own default child via ${[...path, childBlockId].join(' → ')}`,
        )
      }

      materialize(draft, context, { blockId: childBlockId, parentId: id, index, slot: slot.name }, [
        ...path,
        childBlockId,
      ])
    }
  }
}

/** What the palette drops: the block and the default subtree its slots declare — ADR-062. */
export function insertBlock(payload: InsertBlockPayload): Command<InsertBlockPayload> {
  return {
    type: 'insertBlock',
    label: `Add ${humanize(payload.blockId)}`,
    payload,
    apply(draft, context) {
      materialize(draft, context, payload, [payload.blockId])
    },
  }
}
