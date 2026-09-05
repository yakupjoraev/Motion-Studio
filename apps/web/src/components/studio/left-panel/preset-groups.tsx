'use client'

import type { MotionPreset } from '@motion-studio/motion'
import type { MotionChannel } from '@motion-studio/schema'
import type { ReactElement } from 'react'

import { PresetCard } from './preset-card'

/** ANIMATION_SYSTEM.md's channel order, which is the order the catalogue is grouped in. */
export const CHANNELS: readonly { readonly channel: MotionChannel; readonly label: string }[] = [
  { channel: 'entrance', label: 'Entrance' },
  { channel: 'scroll', label: 'Scroll' },
  { channel: 'hover', label: 'Hover' },
  { channel: 'cursor', label: 'Cursor' },
  { channel: 'continuous', label: 'Continuous' },
  { channel: 'exit', label: 'Exit' },
]

export interface PresetGroupsProps {
  readonly presets: readonly MotionPreset[]
  readonly applied: ReadonlySet<string>
  readonly onApply: (preset: MotionPreset) => void
  readonly reasonFor: (preset: MotionPreset) => string | undefined
  /** A ranked query has its own order; grouping it by channel would throw the ranking away. */
  readonly grouped: boolean
}

/**
 * The catalogue's cards, grouped by channel or in the order the search ranked them — ADR-355.
 *
 * Split out of `motion-tab` so the tab file is the surface's controls and this is its content: the
 * two change for different reasons, and the tab now has a header the grid does not care about.
 */
export function PresetGroups({
  presets,
  applied,
  onApply,
  reasonFor,
  grouped,
}: PresetGroupsProps): ReactElement {
  const card = (preset: MotionPreset) => (
    <PresetCard
      applied={applied.has(preset.id)}
      disabledReason={reasonFor(preset)}
      key={preset.id}
      onApply={onApply}
      preset={preset}
    />
  )

  if (!grouped) {
    return <div className="grid grid-cols-2 gap-2">{presets.map(card)}</div>
  }

  return (
    <div className="flex flex-col gap-4">
      {CHANNELS.map(({ channel, label }) => {
        const inChannel = presets.filter((preset) => preset.channel === channel)

        if (inChannel.length === 0) {
          return null
        }

        return (
          <section key={channel}>
            <h3 className="px-1 pb-2 font-medium text-[11px] text-foreground-subtle uppercase tracking-wide">
              {label}
            </h3>
            <div className="grid grid-cols-2 gap-2">{inChannel.map(card)}</div>
          </section>
        )
      })}
    </div>
  )
}
