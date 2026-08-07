import type { HTMLAttributes, ReactNode } from 'react'

/** The status colours `DESIGN_SYSTEM.md` § Semantic tokens ships, plus the neutral default. */
export type BadgeTone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'info'

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  readonly tone?: BadgeTone
  readonly children: ReactNode
}
