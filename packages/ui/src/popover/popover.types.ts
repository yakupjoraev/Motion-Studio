import type { ReactNode } from 'react'

export interface PopoverProps {
  /** The element that opens it. Rendered as-is — Radix merges the trigger's props onto it. */
  readonly trigger: ReactNode
  /** The panel's contents. */
  readonly children: ReactNode
  /**
   * Names the panel. Radix gives the content `role="dialog"`, and an unnamed dialog is an axe violation as
   * well as an announcement that says only "dialog". Required so it cannot be left out quietly.
   */
  readonly label: string
  readonly side?: 'top' | 'right' | 'bottom' | 'left'
  readonly align?: 'start' | 'center' | 'end'
  readonly open?: boolean
  readonly defaultOpen?: boolean
  readonly onOpenChange?: (open: boolean) => void
  readonly className?: string
}
