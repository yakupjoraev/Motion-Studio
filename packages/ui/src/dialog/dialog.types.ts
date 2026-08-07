import type { ReactNode } from 'react'

/** ADR-036: the inspector's default width, two of them, and the widest that fits a 1024 px viewport. */
export type DialogSize = 'sm' | 'md' | 'lg'

export interface DialogProps {
  /** The element that opens it. Omitted when the caller drives `open` itself. */
  readonly trigger?: ReactNode
  /** The heading and the accessible name. Required — ACCESSIBILITY.md § Dialogs. */
  readonly title: string
  /** One sentence, and the accessible description. § Copy: say what will happen. */
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
