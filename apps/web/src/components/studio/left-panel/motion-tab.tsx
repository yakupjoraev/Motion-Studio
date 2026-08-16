'use client'

import { type MotionPreset, PRESETS } from '@motion-studio/motion'
import type { MotionChannel } from '@motion-studio/schema'
import { EmptyState, ScrollArea } from '@motion-studio/ui'
import { useCallback, useMemo } from 'react'

import { useStudioStore } from '../../../store/editor-store'
import { applyPreset, targetsFor } from '../motion/apply-preset'

import { PresetCard } from './preset-card'

/** ANIMATION_SYSTEM.md's channel order, which is the order the catalogue is grouped in. */
const CHANNELS: readonly { readonly channel: MotionChannel; readonly label: string }[] = [
  { channel: 'entrance', label: 'Entrance' },
  { channel: 'scroll', label: 'Scroll' },
  { channel: 'hover', label: 'Hover' },
  { channel: 'cursor', label: 'Cursor' },
  { channel: 'continuous', label: 'Continuous' },
  { channel: 'exit', label: 'Exit' },
]

/**
 * PRODUCT.md § 2, Motion: the catalogue grouped by channel, each card previewing on hover, clicking
 * applies to the selection as a command. A preset whose channel the selected block does not support
 * is disabled with the reason, rather than hidden — the catalogue is the same on every selection, so
 * a user learns where things are.
 */
export function MotionTab() {
  const selectionCount = useStudioStore((state) => state.selection.ids.length)
  const appliedIds = useStudioStore((state) => {
    const [first] = state.selection.ids
    const node = first === undefined ? undefined : state.document.nodes[first]

    return Object.values(node?.motion ?? {})
      .map((spec) => spec.presetId)
      .join(' ')
  })

  const applied = useMemo(() => new Set(appliedIds.split(' ')), [appliedIds])

  const onApply = useCallback((preset: MotionPreset) => {
    applyPreset(useStudioStore, preset)
  }, [])

  const reasonFor = useCallback(
    (preset: MotionPreset): string | undefined => {
      if (selectionCount === 0) {
        return 'Select a block first'
      }

      return targetsFor(useStudioStore, preset.channel).length === 0
        ? `This block does not support the ${preset.channel} channel`
        : undefined
    },
    [selectionCount],
  )

  if (PRESETS.length === 0) {
    return <EmptyState className="h-full" message="No motion presets are registered." />
  }

  return (
    <ScrollArea className="h-full">
      <div className="flex flex-col gap-4 p-2" data-testid="motion-tab">
        {CHANNELS.map(({ channel, label }) => {
          const presets = PRESETS.filter((preset) => preset.channel === channel)

          if (presets.length === 0) {
            return null
          }

          return (
            <section key={channel}>
              <h3 className="px-1 pb-2 font-medium text-[11px] text-foreground-subtle uppercase tracking-wide">
                {label}
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {presets.map((preset) => (
                  <PresetCard
                    applied={applied.has(preset.id)}
                    disabledReason={reasonFor(preset)}
                    key={preset.id}
                    onApply={onApply}
                    preset={preset}
                  />
                ))}
              </div>
            </section>
          )
        })}
      </div>
    </ScrollArea>
  )
}
