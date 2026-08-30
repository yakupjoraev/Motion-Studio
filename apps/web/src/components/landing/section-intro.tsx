import type { ReactNode } from 'react'

export interface SectionIntroProps {
  readonly heading: string
  readonly children: ReactNode
}

/**
 * Heading left, argument right — the two-column opening every band of this page uses.
 *
 * One column would be wrong twice over: a display size inside a 54-character measure breaks a
 * seven-word heading across three lines, and a page whose right half is empty for its whole length
 * reads as a draft. The heading gets a wide, short measure; the prose gets a narrow, tall one.
 */
export function SectionIntro({ heading, children }: SectionIntroProps) {
  return (
    <div className="grid gap-x-12 gap-y-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:items-end">
      <h2 className="max-w-[26ch] text-balance font-display text-3xl leading-[1.08] tracking-[-0.025em] sm:text-4xl">
        {heading}
      </h2>
      <p className="max-w-[52ch] text-foreground-muted text-lg leading-relaxed">{children}</p>
    </div>
  )
}
