import type { HTMLAttributes, ReactNode } from 'react'

/** Which edge of the canvas the panel sits on, and therefore which side carries its hairline. */
export type PanelSide = 'left' | 'right'

export interface PanelProps extends HTMLAttributes<HTMLDivElement> {
  readonly side?: PanelSide
  readonly children: ReactNode
}

export interface PanelHeaderProps extends HTMLAttributes<HTMLDivElement> {
  readonly title: string
  /** Rendered at the end of the row — a close button, an overflow menu. */
  readonly action?: ReactNode
}

export interface PanelSectionProps {
  readonly title: string
  readonly children: ReactNode
  /** The `⟳` reset. Whether the section differs from the default is the app's question. */
  readonly action?: ReactNode
  /** The caller's: § Section headers wants it persisted, and the key is an application concern. */
  readonly open?: boolean
  readonly defaultOpen?: boolean
  readonly onOpenChange?: (open: boolean) => void
  readonly className?: string | undefined
}
