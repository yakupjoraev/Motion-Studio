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
  /** § Multi-selection uses `Mixed` when the selection disagrees. */
  readonly placeholder?: string
  readonly disabled?: boolean
  readonly invalid?: boolean
  /** Required when no visible `Label` is wired to it. */
  readonly 'aria-label'?: string
  readonly 'aria-labelledby'?: string
  readonly id?: string
  readonly name?: string
  readonly className?: string
  /** A swatch, a unit, an icon. */
  readonly prefix?: ReactNode
}
