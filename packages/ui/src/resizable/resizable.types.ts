import type { ReactNode } from 'react'

/** Which edge the handle sits on, which is also the sign of the drag: dragging right widens a left panel. */
export type ResizableSide = 'left' | 'right'

export interface ResizableProps {
  readonly children: ReactNode
  /**
   * The committed width. Not the width during a drag — that never reaches React. Contract § 5: "high-
   * frequency values never live in React state… React re-renders on commit only."
   */
  readonly width: number
  readonly min: number
  readonly max: number
  /** How far one arrow press moves it. Prompt 08 fixes this at 8 px. */
  readonly step?: number
  readonly side?: ResizableSide
  /** Called once per commit — the end of a drag, or one arrow press. Persistence is the app's. */
  readonly onWidthChange: (width: number) => void
  /** Names the handle. A `role="separator"` with no name announces as "separator" and a number. */
  readonly 'aria-label': string
  readonly className?: string
  readonly handleClassName?: string
}
