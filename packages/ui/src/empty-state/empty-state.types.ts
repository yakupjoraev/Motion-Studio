import type { HTMLAttributes, ReactNode } from 'react'

export interface EmptyStateProps extends HTMLAttributes<HTMLDivElement> {
  /** § Character: one sentence, one action, no illustrations. */
  readonly message: string
  /** One action, or none. Two is a menu, not an empty state. */
  readonly action?: ReactNode
  /** A shortcut hint beside the action — "Drag a block to start" with `Mod+K`. */
  readonly hint?: ReactNode
}
