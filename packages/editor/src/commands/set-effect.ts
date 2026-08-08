import {
  type BlendMode,
  type EffectInstance,
  type NodeId,
  effectInstanceSchema,
} from '@motion-studio/schema'
import { current } from 'immer'

import type { Command } from './command.types'
import { COMMAND_CODES, commandError, requireNode } from './guards'

export interface SetEffectPayload {
  readonly nodeId: NodeId
  /** The instance in the stack, not the catalogue entry — ADR-059. */
  readonly instanceId: string
  readonly params?: Record<string, unknown> | undefined
  readonly layer?: EffectInstance['layer'] | undefined
  readonly blendMode?: BlendMode | undefined
  readonly opacity?: number | undefined
}

/** Tunes one layer. `params` merges key by key, so a slider sends the key it moved and nothing else. */
export function setEffect(payload: SetEffectPayload): Command<SetEffectPayload> {
  return {
    type: 'setEffect',
    label: 'Adjust effect',
    payload,
    coalesceKey: `set-effect:${payload.nodeId}:${payload.instanceId}`,
    apply(draft) {
      const node = requireNode(draft, payload.nodeId)
      const index = node.effects.findIndex((effect) => effect.id === payload.instanceId)
      const existing = node.effects[index]

      if (existing === undefined) {
        throw commandError(
          COMMAND_CODES.effectNotFound,
          `${node.name} carries no effect ${payload.instanceId}`,
        )
      }

      const parsed = effectInstanceSchema.safeParse({
        ...current(existing),
        ...(payload.layer === undefined ? {} : { layer: payload.layer }),
        ...(payload.blendMode === undefined ? {} : { blendMode: payload.blendMode }),
        ...(payload.opacity === undefined ? {} : { opacity: payload.opacity }),
        params: { ...current(existing).params, ...payload.params },
      })

      if (!parsed.success) {
        throw commandError(COMMAND_CODES.invalidEffect, 'Invalid effect settings', parsed.error)
      }

      node.effects[index] = parsed.data
    },
  }
}
