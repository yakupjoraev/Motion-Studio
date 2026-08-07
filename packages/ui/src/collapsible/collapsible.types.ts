import type { ReactNode } from 'react'

export interface CollapsibleProps {
  /** The section's name. Rendered inside the trigger button, so it must not contain one. */
  readonly trigger: ReactNode
  /** Beside the trigger, not inside it: § Section headers puts the `⟳` reset here. */
  readonly action?: ReactNode
  readonly children: ReactNode
  /** The caller's. `ui` does not touch `localStorage`. */
  readonly open?: boolean
  readonly defaultOpen?: boolean
  readonly onOpenChange?: (open: boolean) => void
  readonly disabled?: boolean
  readonly className?: string
  readonly triggerClassName?: string
  readonly contentClassName?: string
}
