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
  /**
   * § Section headers: "the `⟳` reset appears only when a property in the section differs from the block
   * default". Whether it differs is the app's question, so the app supplies the control.
   */
  readonly action?: ReactNode
  /**
   * Collapse state is the caller's — § Section headers wants it persisted per section, and `ui` does not
   * touch `localStorage`. The key it is persisted under is an application concern.
   */
  readonly open?: boolean
  readonly defaultOpen?: boolean
  readonly onOpenChange?: (open: boolean) => void
  readonly className?: string
}
