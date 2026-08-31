'use client'

import { ControlRow, SliderField } from '@motion-studio/ui/controls'
import { useState } from 'react'

export interface ThemeSliderRowProps {
  readonly label: string
  readonly value: number
  readonly min: number
  readonly max: number
  readonly step: number
  readonly unit?: string
  /** Per frame during the drag: variables only. */
  readonly onPreview: (value: number) => void
  /** On release: the command. */
  readonly onCommit: (value: number) => void
}

/**
 * One continuous theme control. `SliderField` already speaks the transient contract the two-write
 * pattern needs — `onValueChange` per step, `onValueCommit` on release — and carries the
 * `aria-valuetext` with its unit that `ACCESSIBILITY.md` § Inspector requires.
 *
 * The draft is what makes the pattern work at all. The slider is controlled by the document's value,
 * and a theme drag deliberately does not write the document until release, so without a draft every
 * frame would hand the thumb back its starting value and the control would not move — measured in the
 * browser, where a five-second hue drag committed 0. The inspector does not need one because its
 * throttled path writes the store every 33 ms; this path writes CSS variables and nothing else.
 */
export function ThemeSliderRow({
  label,
  value,
  min,
  max,
  step,
  unit,
  onPreview,
  onCommit,
}: ThemeSliderRowProps) {
  const [draft, setDraft] = useState<number | null>(null)

  return (
    <ControlRow label={label}>
      {(slot) => (
        <SliderField
          {...slot}
          label={label}
          max={max}
          min={min}
          onChange={(next) => {
            setDraft(next)
            onPreview(next)
          }}
          onCommit={(next) => {
            setDraft(null)
            onCommit(next)
          }}
          step={step}
          unit={unit}
          value={draft ?? value}
        />
      )}
    </ControlRow>
  )
}
