import { type EffectId, type NodeId, effectInstanceSchema } from '@motion-studio/schema'
import { humanize } from '@motion-studio/utils'

import type { Command } from './command.types'
import { COMMAND_CODES, commandError, prefixedId, requireNode } from './guards'

/** `nodeSchema` caps the stack, and the cap is a paint-cost budget — PERFORMANCE.md § Effects. */
export const MAX_EFFECTS = 8

export interface AddEffectPayload {
  readonly nodeId: NodeId
  readonly effectId: EffectId
  readonly params?: Record<string, unknown> | undefined
  /** Chosen by the caller when it needs to address the new layer — ADR-061. */
  readonly id?: string | undefined
}

/** Appends a layer. The rest of the instance comes from `effectInstanceSchema`'s own defaults. */
export function addEffect(payload: AddEffectPayload): Command<AddEffectPayload> {
  return {
    type: 'addEffect',
    label: `Add ${humanize(payload.effectId)}`,
    payload,
    apply(draft, context) {
      const node = requireNode(draft, payload.nodeId)

      if (node.effects.length >= MAX_EFFECTS) {
        throw commandError(
          COMMAND_CODES.effectStackFull,
          `${node.name} already carries ${MAX_EFFECTS} effects`,
        )
      }

      const parsed = effectInstanceSchema.safeParse({
        id: payload.id ?? prefixedId(context.generateId, 'fx'),
        effectId: payload.effectId,
        params: payload.params ?? {},
      })

      if (!parsed.success) {
        throw commandError(
          COMMAND_CODES.invalidEffect,
          `Invalid effect ${payload.effectId}`,
          parsed.error,
        )
      }

      node.effects.push(parsed.data)
    },
  }
}
