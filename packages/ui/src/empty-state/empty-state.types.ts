import type { HTMLAttributes, ReactNode } from 'react'

export interface EmptyStateProps extends HTMLAttributes<HTMLDivElement> {
  /** One sentence. § Character: "empty states are one sentence and one action. No illustrations." */
  readonly message: string
  /** One action, or none. Two is a menu, not an empty state. */
  readonly action?: ReactNode
  /** A shortcut hint beside the action — "Drag a block to start" with `Mod+K`. */
  readonly hint?: ReactNode
}
