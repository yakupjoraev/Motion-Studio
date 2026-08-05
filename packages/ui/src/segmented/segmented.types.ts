import type { ReactNode } from 'react'

export interface SegmentedOption {
  readonly value: string
  /** The visible content. An icon alone is allowed, and then `label` carries the accessible name. */
  readonly content: ReactNode
  /** The accessible name. Required when `content` is an icon, because an icon is not a name. */
  readonly label: string
  readonly disabled?: boolean
}

export interface SegmentedProps {
  readonly value?: string
  readonly defaultValue?: string
  readonly onValueChange?: (value: string) => void
  readonly options: readonly SegmentedOption[]
  readonly disabled?: boolean
  /** The group's own accessible name — `ACCESSIBILITY.md` § Inspector requires one per radiogroup. */
  readonly 'aria-label'?: string
  readonly 'aria-labelledby'?: string
  readonly className?: string
}
