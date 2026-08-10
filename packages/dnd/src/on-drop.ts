import { type Command, commands } from '@motion-studio/editor'

import type { DragPayload, DropTarget } from './dnd.types'

/**
 * The last step of every one of DRAG_AND_DROP.md § The four operations: a resolved target plus what
 * was dragged is exactly one command. It lives here rather than in each host, so the studio and the
 * layers tree cannot disagree about what a drop means (ADR-131).
 *
 * A rejected target has no command — the reason was shown before the release, and the release does
 * nothing.
 */
export function commandForDrop(target: DropTarget, payload: DragPayload): Command | null {
  if (target.indicator.kind === 'reject') {
    return null
  }

  const { parentId, slot, index } = target

  return payload.kind === 'palette-block'
    ? commands.insertBlock({ blockId: payload.blockId, parentId, slot, index })
    : commands.moveNodes({ ids: payload.nodeIds, parentId, slot, index })
}
