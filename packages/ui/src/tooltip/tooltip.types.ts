import type { ReactNode } from 'react'

export interface TooltipProps {
  /**
   * The hint, and the trigger's accessible name — ADR-035. If the trigger already shows text, pass that
   * same text: WCAG 2.5.3 wants the name to contain the visible label.
   */
  readonly label: string
  /** A shortcut in the registry's notation, rendered with `Kbd`. Visual only — see ADR-035. */
  readonly shortcut?: string
  /** One element: Radix merges the trigger's props onto it. */
  readonly children: ReactNode
  readonly side?: 'top' | 'right' | 'bottom' | 'left'
  readonly align?: 'start' | 'center' | 'end'
  readonly open?: boolean
  readonly defaultOpen?: boolean
  readonly onOpenChange?: (open: boolean) => void
  readonly className?: string
}

export interface TooltipProviderProps {
  readonly children: ReactNode
  /** § Timing: tooltips appear 500 ms after the pointer arrives. */
  readonly delayDuration?: number
  /** How long the group stays "warm", so moving along a toolbar does not re-wait the full delay. */
  readonly skipDelayDuration?: number
}
