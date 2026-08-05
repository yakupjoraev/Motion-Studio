import type { ReactNode } from 'react'

export interface SelectOption {
  readonly value: string
  readonly label: string
  readonly disabled?: boolean
}

export interface SelectProps {
  readonly value?: string
  readonly defaultValue?: string
  readonly onValueChange?: (value: string) => void
  readonly options: readonly SelectOption[]
  /** Shown when nothing is selected. `UI_GUIDELINES.md` § Multi-selection uses `Mixed` for a mixed value. */
  readonly placeholder?: string
  readonly disabled?: boolean
  readonly invalid?: boolean
  /** Required when no visible `Label` is wired to it — every control needs an accessible name. */
  readonly 'aria-label'?: string
  readonly 'aria-labelledby'?: string
  readonly id?: string
  readonly name?: string
  readonly className?: string
  /** Rendered inside the trigger before the value. A swatch, a unit, an icon. */
  readonly prefix?: ReactNode
}
