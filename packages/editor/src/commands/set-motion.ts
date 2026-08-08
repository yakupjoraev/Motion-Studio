import { type MotionSpec, type NodeId, motionSpecSchema } from '@motion-studio/schema'

import type { Command } from './command.types'
import { COMMAND_CODES, commandError, requireNode } from './guards'

export interface SetMotionPayload {
  readonly nodeId: NodeId
  /** The channel is the spec's own `channel`, so the two cannot disagree. */
  readonly spec: MotionSpec
}

/**
 * ANIMATION_SYSTEM.md § MotionSpec. Two guards: the block must declare the channel (ADR-064), and
 * the spec must parse — a preset panel writing a trigger the schema rejects would produce a document
 * that fails on reload rather than on the edit that caused it.
 */
export function setMotion(payload: SetMotionPayload): Command<SetMotionPayload> {
  return {
    type: 'setMotion',
    label: `Set ${payload.spec.channel} motion`,
    payload,
    coalesceKey: `set-motion:${payload.nodeId}`,
    apply(draft, context) {
      const node = requireNode(draft, payload.nodeId)
      const definition = context.registry.require(node.blockId)

      if (!definition.capabilities.supportsMotion.includes(payload.spec.channel)) {
        throw commandError(
          COMMAND_CODES.unsupportedMotionChannel,
          `${definition.name} does not support the ${payload.spec.channel} channel`,
        )
      }

      const parsed = motionSpecSchema.safeParse(payload.spec)

      if (!parsed.success) {
        throw commandError(
          COMMAND_CODES.invalidMotionSpec,
          `Invalid motion spec for ${definition.name}`,
          parsed.error,
        )
      }

      node.motion[payload.spec.channel] = parsed.data
    },
  }
}
