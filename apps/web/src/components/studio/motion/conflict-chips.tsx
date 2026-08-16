'use client'

import { commands } from '@motion-studio/editor'
import type { MotionConflict } from '@motion-studio/motion'
import type { NodeId } from '@motion-studio/schema'
import { Button } from '@motion-studio/ui'

import { useStudioStore } from '../../../store/editor-store'

/**
 * ANIMATION_SYSTEM.md § Composition reports a conflict when two channels want the same property; the
 * chip shows the reason it wrote and offers the one resolution that is unambiguous — remove the
 * channel that already lost. Silently dropping the loser is what the composer does on screen, and a
 * user who cannot see that happen concludes the preset is broken.
 */
export function ConflictChips({
  conflicts,
  nodeId,
}: {
  readonly conflicts: readonly MotionConflict[]
  readonly nodeId: NodeId
}) {
  if (conflicts.length === 0) {
    return null
  }

  return (
    <ul className="flex flex-col gap-1 pt-2" data-testid="motion-conflicts">
      {conflicts.map((conflict) => (
        <li
          className="flex items-start justify-between gap-2 rounded-xs border border-warning/40 bg-warning-muted/30 p-2"
          key={`${conflict.winner}-${conflict.loser}`}
        >
          <span className="text-pretty text-2xs text-foreground">{conflict.reason}</span>
          <Button
            className="shrink-0"
            onClick={() =>
              useStudioStore
                .getState()
                .dispatch(commands.clearMotion({ nodeId, channel: conflict.loser }))
            }
            size="sm"
            variant="ghost"
          >
            Resolve
          </Button>
        </li>
      ))}
    </ul>
  )
}
