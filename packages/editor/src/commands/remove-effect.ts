import type { NodeId } from '@motion-studio/schema'

import type { Command } from './command.types'
import { COMMAND_CODES, commandError, requireNode } from './guards'

export interface RemoveEffectPayload {
  readonly nodeId: NodeId
  readonly instanceId: string
}

export function removeEffect(payload: RemoveEffectPayload): Command<RemoveEffectPayload> {
  return {
    type: 'removeEffect',
    label: 'Remove effect',
    payload,
    apply(draft) {
      const node = requireNode(draft, payload.nodeId)
      const index = node.effects.findIndex((effect) => effect.id === payload.instanceId)

      if (index === -1) {
        throw commandError(
          COMMAND_CODES.effectNotFound,
          `${node.name} carries no effect ${payload.instanceId}`,
        )
      }

      node.effects.splice(index, 1)
    },
  }
}
