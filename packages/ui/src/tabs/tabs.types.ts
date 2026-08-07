import type { ReactNode } from 'react'

export interface TabItem {
  readonly value: string
  /** A string, not a node: it is also the tab's accessible name. */
  readonly label: string
  /** Rendered before the label. 16 px in panels — the caller sizes it. */
  readonly icon?: ReactNode
  /** The panel this tab reveals. Omitted when the caller renders the panels itself. */
  readonly content?: ReactNode
  readonly disabled?: boolean
}

export interface TabsProps {
  readonly value?: string
  readonly defaultValue?: string
  readonly onValueChange?: (value: string) => void
  readonly items: readonly TabItem[]
  /** Names the tab list. axe fails a bare `role="tablist"`. */
  readonly 'aria-label'?: string | undefined
  readonly 'aria-labelledby'?: string | undefined
  readonly className?: string | undefined
}
