import type { ReactNode } from 'react'

/** Which edge the handle sits on, which is also the sign of the drag: dragging right widens a left panel. */
export type ResizableSide = 'left' | 'right'

export interface ResizableProps {
  readonly children: ReactNode
  /** The committed width. The width during a drag never reaches React — contract § 5. */
  readonly width: number
  readonly min: number
  readonly max: number
  /** How far one arrow press moves it. */
  readonly step?: number
  readonly side?: ResizableSide
  /** Once per commit: the end of a drag, or one arrow press. Persistence is the app's. */
  readonly onWidthChange: (width: number) => void
  /** An unnamed `role="separator"` announces as "separator" and a number. */
  readonly 'aria-label': string
  readonly className?: string
  readonly handleClassName?: string
}
