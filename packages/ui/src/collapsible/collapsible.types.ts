import type { ReactNode } from 'react'

export interface CollapsibleProps {
  /** The row that toggles it. Rendered inside a button, so it must not contain one. */
  readonly trigger: ReactNode
  readonly children: ReactNode
  /**
   * Controlled by the caller. `ui` does not touch `localStorage` — persistence is the app's concern, and a
   * component that writes to storage cannot be rendered twice on one page without them fighting.
   */
  readonly open?: boolean
  readonly defaultOpen?: boolean
  readonly onOpenChange?: (open: boolean) => void
  readonly disabled?: boolean
  readonly className?: string
  readonly triggerClassName?: string
  readonly contentClassName?: string
}
