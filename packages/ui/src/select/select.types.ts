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
  readonly placeholder?: string | undefined
  readonly disabled?: boolean
  readonly invalid?: boolean
  /** Required when no visible `Label` is wired to it. */
  readonly 'aria-label'?: string | undefined
  readonly 'aria-labelledby'?: string | undefined
  readonly id?: string | undefined
  readonly name?: string | undefined
  readonly className?: string | undefined
  /** A swatch, a unit, an icon. */
  readonly prefix?: ReactNode
}
