import type { BreakpointId, NodeId } from '@motion-studio/schema'
import { humanize } from '@motion-studio/utils'

import type { Command } from './command.types'
import { requireNode, requireOverrideKey } from './guards'

export interface ClearResponsivePropPayload {
  readonly nodeId: NodeId
  readonly breakpoint: BreakpointId
  readonly path: string
}

/**
 * **Deletes the key.** Writing the base value back instead leaves an override that resolves to the
 * same number and emits a duplicate Tailwind class on export — RESPONSIVE_ENGINE.md § Codegen. The
 * emptied breakpoint record goes too, so a document with nothing overridden serialises as `{}`.
 */
export function clearResponsiveProp(
  payload: ClearResponsivePropPayload,
): Command<ClearResponsivePropPayload> {
  return {
    type: 'clearResponsiveProp',
    label: `Reset ${humanize(payload.path)} at ${payload.breakpoint}`,
    payload,
    apply(draft) {
      requireOverrideKey(payload.breakpoint, payload.path)

      const node = requireNode(draft, payload.nodeId)
      const override = node.responsive[payload.breakpoint]

      if (override === undefined) {
        return
      }

      delete override[payload.path]

      if (Object.keys(override).length === 0) {
        delete node.responsive[payload.breakpoint]
      }
    },
  }
}
