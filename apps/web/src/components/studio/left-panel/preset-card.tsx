'use client'

import type { MotionPreset } from '@motion-studio/motion'
import { memo, useState } from 'react'

import { PresetPreview } from '../motion/preset-preview'

export interface PresetCardProps {
  readonly preset: MotionPreset
  readonly applied: boolean
  readonly disabledReason: string | undefined
  readonly onApply: (preset: MotionPreset) => void
}

/**
 * One preset in the catalogue. `memo` because the tab renders fifty-one of them and applying one
 * changes the store: without it, every card would re-render on every edit in the document.
 *
 * Hovering plays the preset itself. The play counter is local state and the only state this card
 * has — a hover that wrote to the store would put an animation preview in the undo history.
 */
export const PresetCard = memo(function PresetCard({
  preset,
  applied,
  disabledReason,
  onApply,
}: PresetCardProps) {
  const [plays, setPlays] = useState(0)

  return (
    <button
      /*
       * The accessible name is stated rather than computed. A css preset's preview injects its
       * `@keyframes` as a `<style>` element inside this button, and a computed name would read the
       * whole stylesheet aloud — measured in the browser, not guessed.
       */
      aria-label={preset.name}
      aria-pressed={applied}
      className="flex w-full flex-col gap-2 rounded-sm border border-border bg-surface-1 p-2 text-left transition-colors hover:border-border-strong disabled:opacity-50 data-[applied=true]:border-accent"
      data-applied={applied}
      data-testid="preset-card"
      disabled={disabledReason !== undefined}
      onClick={() => onApply(preset)}
      onFocus={() => setPlays((count) => count + 1)}
      onPointerEnter={() => setPlays((count) => count + 1)}
      title={disabledReason}
      type="button"
    >
      <PresetPreview playKey={plays} preset={preset} />
      <span className="flex items-baseline justify-between gap-2">
        <span className="truncate text-foreground text-xs">{preset.name}</span>
        {preset.capabilities.gpuHeavy === true ? (
          <span className="text-[10px] text-warning uppercase tracking-wide">gpu</span>
        ) : null}
      </span>
    </button>
  )
})
