import type { MotionChannel, NodeId } from '@motion-studio/schema'

import type { Command } from './command.types'
import { requireNode } from './guards'

export interface ClearMotionPayload {
  readonly nodeId: NodeId
  readonly channel: MotionChannel
}

/**
 * No capability check, unlike `setMotion`: removing a spec a block never supported is the repair
 * path, and a guard here would make an unwanted animation unremovable — ADR-064.
 */
export function clearMotion(payload: ClearMotionPayload): Command<ClearMotionPayload> {
  return {
    type: 'clearMotion',
    label: `Remove ${payload.channel} motion`,
    payload,
    apply(draft) {
      delete requireNode(draft, payload.nodeId).motion[payload.channel]
    },
  }
}
