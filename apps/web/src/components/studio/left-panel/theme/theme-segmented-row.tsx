'use client'

import { ControlRow, SegmentedField, type SegmentedOption } from '@motion-studio/ui'

export interface ThemeSegmentedRowProps {
  readonly label: string
  readonly value: string
  readonly options: readonly SegmentedOption[]
  readonly onSelect: (value: string) => void
}

/**
 * One discrete theme control. A segmented group is a `role="radiogroup"` with arrow navigation —
 * `ACCESSIBILITY.md` § Focus, roving tabindex — and a discrete edit has no gesture to preview, so the
 * variable write and the command happen in the same call.
 */
export function ThemeSegmentedRow({ label, value, options, onSelect }: ThemeSegmentedRowProps) {
  return (
    <ControlRow label={label}>
      {(slot) => (
        <SegmentedField
          {...slot}
          label={label}
          onChange={onSelect}
          onCommit={onSelect}
          options={options}
          value={value}
        />
      )}
    </ControlRow>
  )
}
