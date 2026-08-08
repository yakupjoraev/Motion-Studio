import type { Node, NodeId } from '@motion-studio/schema'
import { type Draft, current } from 'immer'

import type { Command } from './command.types'
import { requireProps, requireSharedParent } from './guards'

export const ALIGN_EDGES = ['left', 'center', 'right', 'top', 'middle', 'bottom'] as const

export type AlignEdge = (typeof ALIGN_EDGES)[number]

export interface AlignNodesPayload {
  readonly ids: readonly NodeId[]
  readonly edge: AlignEdge
}

const HORIZONTAL: readonly AlignEdge[] = ['left', 'center', 'right']

const VALUES: Readonly<Record<AlignEdge, string>> = {
  left: 'start',
  center: 'center',
  right: 'end',
  top: 'start',
  middle: 'center',
  bottom: 'end',
}

/** The axis prop an edge writes to, given the container's own direction — ADR-057. */
export function alignmentProp(container: Node | Draft<Node>, edge: AlignEdge): 'align' | 'justify' {
  const isColumn = container.props['direction'] === 'column'
  const isMainAxis = HORIZONTAL.includes(edge) !== isColumn

  return isMainAxis ? 'justify' : 'align'
}

/**
 * Flow alignment, not geometry — ADR-057. The document holds no coordinates, so aligning a selection
 * is a write on the container that lays it out, and it therefore moves every child of that container.
 * Already aligned means zero patches, which is what keeps the toolbar button out of the undo stack.
 */
export function alignNodes(payload: AlignNodesPayload): Command<AlignNodesPayload> {
  return {
    type: 'alignNodes',
    label: `Align ${payload.edge}`,
    payload,
    apply(draft, context) {
      const parent = requireSharedParent(draft, payload.ids)

      parent.props[alignmentProp(parent, payload.edge)] = VALUES[payload.edge]
      requireProps(context.registry.require(parent.blockId), current(parent.props))
    },
  }
}
