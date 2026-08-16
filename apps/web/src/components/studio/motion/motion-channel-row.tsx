'use client'

import { commands } from '@motion-studio/editor'
import { presetRegistry } from '@motion-studio/motion'
import type { MotionChannel, NodeId } from '@motion-studio/schema'
import { Button } from '@motion-studio/ui'
import { useState } from 'react'

import { useStudioStore } from '../../../store/editor-store'

import { MotionParams } from './motion-params'
import { PresetPreview } from './preset-preview'

/**
 * One assigned channel: which preset, its parameters, and the two things a user does to it — play it
 * again, or take it off. Every write is a command, so the whole row undoes.
 */
export function MotionChannelRow({
  channel,
  nodeId,
}: {
  readonly channel: MotionChannel
  readonly nodeId: NodeId
}) {
  const spec = useStudioStore((state) => state.document.nodes[nodeId]?.motion[channel])
  const [plays, setPlays] = useState(0)

  if (spec === undefined) {
    return null
  }

  const preset = presetRegistry.get(spec.presetId)

  return (
    <section className="flex flex-col gap-2" data-channel={channel} data-testid="motion-channel">
      <header className="flex items-center justify-between gap-2">
        <span className="flex min-w-0 flex-col">
          <span className="text-[10px] text-foreground-subtle uppercase tracking-wide">
            {channel}
          </span>
          <span className="truncate text-foreground text-xs">
            {preset?.name ?? `Unknown preset “${spec.presetId}”`}
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-1">
          <Button
            aria-label={`Replay ${channel}`}
            onClick={() => setPlays((count) => count + 1)}
            size="sm"
            variant="ghost"
          >
            Play
          </Button>
          <Button
            aria-label={`Remove ${channel} motion`}
            onClick={() =>
              useStudioStore.getState().dispatch(commands.clearMotion({ nodeId, channel }))
            }
            size="sm"
            variant="ghost"
          >
            Remove
          </Button>
        </span>
      </header>

      {preset === undefined ? null : (
        <>
          <PresetPreview playKey={plays} preset={preset} />
          <MotionParams nodeId={nodeId} preset={preset} spec={spec} />
        </>
      )}
    </section>
  )
}
