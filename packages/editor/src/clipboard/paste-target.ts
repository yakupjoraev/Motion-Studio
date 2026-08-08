import type { BlockRegistry, MotionDocument, NodeId } from '@motion-studio/schema'

import { slotAccepts, slotChildren, slotHasRoom } from '../commands/guards'
import {
  type InsertTarget,
  type InsertTargetRejection,
  resolveInsertTarget,
} from '../commands/resolve-insert-target'

import type { PasteTarget, SerializedSubtree } from './clipboard.types'

export interface PasteTargetArgs {
  readonly document: MotionDocument
  readonly registry: BlockRegistry
  readonly subtree: SerializedSubtree
  readonly selectionIds: readonly NodeId[]
  readonly isolationId: NodeId | null
  /** `Mod+Shift+V`: back where it was copied from, when that place still exists. */
  readonly inPlace: boolean
}

/**
 * The parent, slot and index the payload came from, when the parent is still in this document and
 * still takes the block. A cross-document paste-in-place lands nowhere in place, which is why this
 * returns `null` rather than a rejection — the caller falls through to the normal resolution.
 */
function originalTarget(args: PasteTargetArgs): PasteTarget | null {
  const { document, subtree } = args
  const rootId = subtree.rootIds[0]

  if (rootId === undefined) {
    return null
  }

  const root = subtree.nodes[rootId]
  const parentId = root?.parentId ?? null
  const parent = parentId === null ? undefined : document.nodes[parentId]

  if (root === undefined || parent === undefined || parent.locked) {
    return null
  }

  const definition = args.registry.get(parent.blockId)
  const slot = definition?.slots.find((candidate) => candidate.name === root.slot)
  const block = args.registry.get(root.blockId)

  if (slot === undefined || block === undefined || !slotAccepts(slot, block)) {
    return null
  }

  if (!slotHasRoom(slot, slotChildren(document, parent, slot.name).length, 1)) {
    return null
  }

  const index = subtree.origins[rootId] ?? parent.children.length

  return { parentId: parent.id, slot: slot.name, index: Math.min(index, parent.children.length) }
}

/**
 * Where a paste lands. Paste-in-place asks the payload first; everything else — and paste-in-place
 * whose original parent is gone — goes through `resolveInsertTarget`, the same function the block
 * palette inserts with.
 *
 * The first root decides the target. A payload whose roots want different slots is resolved for the
 * first and rejected per root by the command's own guards, which is where that check belongs.
 */
export function resolvePasteTarget(args: PasteTargetArgs): InsertTarget | InsertTargetRejection {
  if (args.inPlace) {
    const original = originalTarget(args)

    if (original !== null) {
      return original
    }
  }

  const rootId = args.subtree.rootIds[0]
  const root = rootId === undefined ? undefined : args.subtree.nodes[rootId]

  if (root === undefined) {
    return { rejected: 'The clipboard holds no blocks' }
  }

  return resolveInsertTarget({
    document: args.document,
    selectionIds: args.selectionIds,
    isolationId: args.isolationId,
    blockId: root.blockId,
    registry: args.registry,
  })
}
