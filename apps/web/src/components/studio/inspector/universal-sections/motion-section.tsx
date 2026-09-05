'use client'

import { composeMotion, presetRegistry } from '@motion-studio/motion'
import type { MotionChannel, NodeId } from '@motion-studio/schema'
import { useMemo } from 'react'

import { useStudio } from '../../../../lib/i18n/studio-surface'
import { useStudioStore } from '../../../../store/editor-store'
import { ConflictChips } from '../../motion/conflict-chips'
import { MotionChannelRow } from '../../motion/motion-channel-row'
import { ControlGroup } from '../control-group'

export interface MotionSectionProps {
  readonly nodeIds: readonly NodeId[]
}

/**
 * PRODUCT.md § 4, Motion. The picker itself is the Motion tab — a catalogue of fifty-one presets does
 * not fit in a 320 px column — and this section is what a node *has*: one row per assigned channel,
 * that channel's own params rendered through the generated control system, and the conflicts
 * composition reports.
 */
export function MotionSection({ nodeIds }: MotionSectionProps) {
  const { panels } = useStudio()
  const [nodeId] = nodeIds
  const specs = useStudioStore((state) =>
    nodeId === undefined ? undefined : state.document.nodes[nodeId]?.motion,
  )

  const channels = useMemo(
    () => Object.keys(specs ?? {}).sort() as readonly MotionChannel[],
    [specs],
  )

  const conflicts = useMemo(
    () =>
      specs === undefined
        ? []
        : composeMotion(specs, { reduced: false, scale: 1, presets: presetRegistry }).conflicts,
    [specs],
  )

  if (nodeIds.length !== 1 || nodeId === undefined) {
    return (
      <ControlGroup id="motion" label={panels.sectionMotion}>
        <p className="text-2xs text-foreground-subtle">{panels.motionSelectOne}</p>
      </ControlGroup>
    )
  }

  return (
    <ControlGroup id="motion" label={panels.sectionMotion}>
      {channels.length === 0 ? (
        <p className="text-pretty text-2xs text-foreground-subtle" data-testid="motion-summary">
          {panels.motionNone}
        </p>
      ) : (
        <div className="flex flex-col gap-3" data-testid="motion-channels">
          {channels.map((channel) => (
            <MotionChannelRow channel={channel} key={channel} nodeId={nodeId} />
          ))}
        </div>
      )}

      <ConflictChips conflicts={conflicts} nodeId={nodeId} />
    </ControlGroup>
  )
}
