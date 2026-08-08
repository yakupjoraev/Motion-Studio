import type { NodeId } from '@motion-studio/schema'
import { current } from 'immer'

import type { Command } from './command.types'
import { COMMAND_CODES, commandError, requireProps, requireSharedParent } from './guards'

export type DistributeAxis = 'horizontal' | 'vertical'

export interface DistributeNodesPayload {
  readonly ids: readonly NodeId[]
  readonly axis: DistributeAxis
}

/**
 * Equal spacing along the container's own main axis — ADR-057. The cross axis is rejected rather
 * than approximated: flexbox distributes along one axis, and a command that quietly did nothing
 * would be indistinguishable from one that worked.
 */
export function distributeNodes(payload: DistributeNodesPayload): Command<DistributeNodesPayload> {
  return {
    type: 'distributeNodes',
    label: `Distribute ${payload.axis}ly`,
    payload,
    apply(draft, context) {
      const parent = requireSharedParent(draft, payload.ids)
      const mainAxis = parent.props['direction'] === 'column' ? 'vertical' : 'horizontal'

      if (payload.axis !== mainAxis) {
        throw commandError(
          COMMAND_CODES.crossAxisDistribute,
          `${parent.name} lays out ${mainAxis}ly, so it cannot distribute ${payload.axis}ly`,
        )
      }

      parent.props['justify'] = 'between'
      requireProps(context.registry.require(parent.blockId), current(parent.props))
    },
  }
}
