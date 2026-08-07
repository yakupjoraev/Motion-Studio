import type { ReactNode } from 'react'

/**
 * `UI_GUIDELINES.md` § Feedback rules: "no success toast for expected outcomes", so there is no `success`
 * tone. What is left is the neutral confirmation that carries an Undo, and the failure that has to be read.
 */
export type ToastTone = 'neutral' | 'danger'

export interface ToastAction {
  readonly label: string
  readonly onClick: () => void
}

export interface ToastOptions {
  /** One line. § Copy: "Deleted Hero", not "The block was successfully deleted". */
  readonly title: string
  readonly description?: string
  /** § Feedback rules: "every destructive action is undoable, and the toast says so". */
  readonly action?: ToastAction
  readonly tone?: ToastTone
  /** Overrides the provider's dismissal time for this one toast. */
  readonly duration?: number
}

export interface ToastRecord extends ToastOptions {
  readonly id: number
}

export interface ToastProviderProps {
  readonly children: ReactNode
  /** How long a toast stays before it dismisses itself. */
  readonly duration?: number
}
