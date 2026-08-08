import type { NodeId } from '@motion-studio/schema'
import { humanize, setPath } from '@motion-studio/utils'
import { current } from 'immer'

import type { Command } from './command.types'
import { requireNode, requireProps } from './guards'

export interface SetPropPayload {
  readonly nodeId: NodeId
  /** Dot path into the block's props: `title`, `padding.top`, `items[2].label`. */
  readonly path: string
  readonly value: unknown
}

/**
 * The base-breakpoint write — RESPONSIVE_ENGINE.md § Editing semantics. Validation is invariant 7 on
 * the write path: the value that would corrupt the node never lands in it, because Immer throws the
 * draft away when the recipe throws.
 */
export function setProp(payload: SetPropPayload): Command<SetPropPayload> {
  return {
    type: 'setProp',
    label: `Set ${humanize(payload.path)}`,
    payload,
    coalesceKey: `set-prop:${payload.nodeId}:${payload.path}`,
    apply(draft, context) {
      const node = requireNode(draft, payload.nodeId)

      setPath(node.props, payload.path, payload.value)
      requireProps(context.registry.require(node.blockId), current(node.props))
    },
  }
}
