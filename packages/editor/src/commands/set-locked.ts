import type { NodeId } from '@motion-studio/schema'

import type { Command } from './command.types'
import { requireNode } from './guards'

export interface SetLockedPayload {
  readonly ids: readonly NodeId[]
  readonly locked: boolean
}

/** A locked node cannot be selected on the canvas, and nothing can be inserted into it. */
export function setLocked(payload: SetLockedPayload): Command<SetLockedPayload> {
  return {
    type: 'setLocked',
    label: payload.locked ? 'Lock' : 'Unlock',
    payload,
    apply(draft) {
      for (const id of payload.ids) {
        requireNode(draft, id).locked = payload.locked
      }
    },
  }
}
