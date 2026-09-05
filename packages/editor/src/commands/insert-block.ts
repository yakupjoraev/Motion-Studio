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
  /**
   * The text a block is inserted with, by block id — ADR-364, and the reason it is a payload rather
   * than a lookup: this package must not import the registry's translations (§ 2, one-way
   * dependencies), and the slots' default children need the same answer as their parent.
   *
   * Plain data, so a document ends up holding strings and nothing about a language.
   */
  readonly copy?: Readonly<Record<string, Readonly<Record<string, unknown>>>> | undefined
}

interface Placement {
  readonly blockId: BlockId
  readonly parentId: NodeId
  readonly index: number
  readonly slot: string
  readonly id?: NodeId | undefined
  readonly props?: Record<string, unknown> | undefined
}

/** Depth-first, so a slot's default children are themselves materialised — ADR-062. */
function materialize(
  draft: Draft<MotionDocument>,
  context: CommandContext,
  placement: Placement,
  path: readonly BlockId[],
  copy: InsertBlockPayload['copy'],
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

      materialize(
        draft,
        context,
        {
          blockId: childBlockId,
          parentId: id,
          index,
          slot: slot.name,
          props: copy?.[childBlockId],
        },
        [...path, childBlockId],
        copy,
      )
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
      materialize(
        draft,
        context,
        { ...payload, props: payload.copy?.[payload.blockId] },
        [payload.blockId],
        payload.copy,
      )
    },
  }
}
