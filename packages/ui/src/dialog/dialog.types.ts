import type { ReactNode } from 'react'

/** ADR-036: the inspector's default width, two of them, and the widest that fits a 1024 px viewport. */
export type DialogSize = 'sm' | 'md' | 'lg'

export interface DialogProps {
  /** The element that opens it. Omitted when the caller drives `open` itself. */
  readonly trigger?: ReactNode
  /**
   * The heading, and the dialog's accessible name. Required: `ACCESSIBILITY.md` § Dialogs asks for
   * `aria-labelledby` on every one of them.
   */
  readonly title: string
  /**
   * One sentence under the heading, and the dialog's accessible description — the other half of what
   * § Dialogs requires. `UI_GUIDELINES.md` § Copy: say what will happen, not that you are sure.
   */
  readonly description: string
  readonly children?: ReactNode
  /** The action row. Rendered at the end, right-aligned. */
  readonly footer?: ReactNode
  readonly size?: DialogSize
  readonly open?: boolean
  readonly defaultOpen?: boolean
  readonly onOpenChange?: (open: boolean) => void
  readonly className?: string
}
