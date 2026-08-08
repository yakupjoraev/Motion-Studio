import type { NodeId } from '@motion-studio/schema'
import { move } from '@motion-studio/utils'

import type { Command } from './command.types'
import { COMMAND_CODES, clampIndex, commandError, requireNode } from './guards'

export interface ReorderEffectPayload {
  readonly nodeId: NodeId
  readonly instanceId: string
  readonly index: number
}

/** Stack order is paint order, so this is the command behind dragging a layer in the effects panel. */
export function reorderEffect(payload: ReorderEffectPayload): Command<ReorderEffectPayload> {
  return {
    type: 'reorderEffect',
    label: 'Reorder effect',
    payload,
    apply(draft) {
      const node = requireNode(draft, payload.nodeId)
      const from = node.effects.findIndex((effect) => effect.id === payload.instanceId)

      if (from === -1) {
        throw commandError(
          COMMAND_CODES.effectNotFound,
          `${node.name} carries no effect ${payload.instanceId}`,
        )
      }

      const next = move(node.effects, from, clampIndex(payload.index, node.effects.length - 1))

      // Immer records a replace for any array it is handed, so a drag that ends where it started
      // would otherwise become an undo entry.
      if (next.some((effect, at) => effect.id !== node.effects[at]?.id)) {
        node.effects = next
      }
    },
  }
}
