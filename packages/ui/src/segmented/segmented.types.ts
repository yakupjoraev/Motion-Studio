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
  readonly 'aria-label'?: string
  readonly 'aria-labelledby'?: string
  readonly className?: string
}
