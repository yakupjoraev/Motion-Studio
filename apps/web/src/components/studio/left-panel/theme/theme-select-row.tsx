'use client'

import { ControlRow, SelectField, type SelectOption } from '@motion-studio/ui'

export interface ThemeSelectRowProps {
  readonly label: string
  readonly value: string
  readonly options: readonly SelectOption[]
  readonly onSelect: (value: string) => void
}

/** A theme control with more choices than a segmented group can hold: the neutral family, the pairing. */
export function ThemeSelectRow({ label, value, options, onSelect }: ThemeSelectRowProps) {
  return (
    <ControlRow label={label}>
      {(slot) => (
        <SelectField
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
