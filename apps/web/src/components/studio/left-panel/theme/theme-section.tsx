'use client'

import type { ReactNode } from 'react'

export interface ThemeSectionProps {
  readonly title: string
  readonly children: ReactNode
}

/**
 * One block of the theme builder — `THEME_ENGINE.md` § Theme builder UI draws four of them, separated
 * by a blank line. Not collapsible: the panel is a page of controls a designer sweeps through, and the
 * inspector's per-section memory exists because its sections change with the selection. These do not.
 */
export function ThemeSection({ title, children }: ThemeSectionProps) {
  return (
    <section className="flex flex-col gap-1">
      <h3 className="px-1 pb-1 font-medium text-[11px] text-foreground-subtle uppercase tracking-wide">
        {title}
      </h3>
      {children}
    </section>
  )
}
