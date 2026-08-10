'use client'

import { GhostChip } from './ghost-chip'
import { GhostStack } from './ghost-stack'

export interface NodeGhostProps {
  /** One label per dragged node, in selection order. */
  readonly labels: readonly string[]
  readonly count: number
}

/**
 * DRAG_AND_DROP.md § Drag preview: an outline with the node's name, not a live copy. Re-rendering an
 * aurora hero at cursor rate is a frame-rate disaster, and a translucent labelled box says more about
 * what is being moved than a shrunken screenshot of it does.
 */
export function NodeGhost({ labels, count }: NodeGhostProps) {
  const [first] = labels
  const many = count > 1

  return (
    <div
      className="relative flex size-full items-start gap-1 rounded-xs bg-accent/10 p-1 ring-[1.5px] ring-accent"
      data-testid="node-ghost"
    >
      {many ? <GhostStack /> : null}
      <GhostChip testId="layer-count">{many ? `${count} layers` : (first ?? 'Layer')}</GhostChip>
    </div>
  )
}
