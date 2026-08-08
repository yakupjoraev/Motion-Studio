import { type BreakpointId, type NodeId, resolveResponsiveProps } from '@motion-studio/schema'
import { humanize } from '@motion-studio/utils'
import { current } from 'immer'

import type { Command } from './command.types'
import { requireNode, requireOverrideKey, requireProps } from './guards'

export interface SetResponsivePropPayload {
  readonly nodeId: NodeId
  readonly breakpoint: BreakpointId
  /** A top-level prop key. Nested paths are rejected — ADR-058. */
  readonly path: string
  readonly value: unknown
}

/**
 * The override write — RESPONSIVE_ENGINE.md § Editing semantics: at any breakpoint but `base`, an
 * edit lands in `responsive[bp]` and applies from that width up. What is validated is the
 * **resolved** props at that breakpoint, because that is what the block will be rendered with.
 */
export function setResponsiveProp(
  payload: SetResponsivePropPayload,
): Command<SetResponsivePropPayload> {
  return {
    type: 'setResponsiveProp',
    label: `Set ${humanize(payload.path)} at ${payload.breakpoint}`,
    payload,
    coalesceKey: `set-rprop:${payload.nodeId}:${payload.breakpoint}:${payload.path}`,
    apply(draft, context) {
      requireOverrideKey(payload.breakpoint, payload.path)

      const node = requireNode(draft, payload.nodeId)
      const override = node.responsive[payload.breakpoint] ?? {}

      override[payload.path] = payload.value
      node.responsive[payload.breakpoint] = override

      requireProps(
        context.registry.require(node.blockId),
        resolveResponsiveProps(current(node), payload.breakpoint),
      )
    },
  }
}
