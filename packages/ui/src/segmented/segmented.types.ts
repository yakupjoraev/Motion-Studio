import type { ReactNode } from 'react'

export interface SegmentedOption {
  readonly value: string
  /** An icon alone is allowed; `label` then carries the accessible name. */
  readonly content: ReactNode
  /** The accessible name. An icon is not a name. */
  readonly label: string
  readonly disabled?: boolean
}

export interface SegmentedProps {
  readonly value?: string
  readonly defaultValue?: string
  readonly onValueChange?: (value: string) => void
  readonly options: readonly SegmentedOption[]
  readonly disabled?: boolean
  /** § Inspector requires one per radiogroup. */
  readonly 'aria-label'?: string | undefined
  readonly 'aria-labelledby'?: string | undefined
  /** Lets a `ControlRow` label reach the group, which `htmlFor` cannot do for a non-labelable element. */
  readonly id?: string | undefined
  readonly className?: string | undefined
}
