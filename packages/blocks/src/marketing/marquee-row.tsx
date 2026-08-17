import {
  MARQUEE_CLASS,
  MARQUEE_PAUSABLE_CLASS,
  type MarqueeDirection,
  marqueeCssVars,
} from '@motion-studio/motion'
import { cn } from '@motion-studio/utils'
import type { CSSProperties, ReactNode } from 'react'

export interface MarqueeRowProps {
  readonly direction: MarqueeDirection
  readonly duration: number
  readonly pauseOnHover: boolean
  readonly gapClass?: string
  readonly children: ReactNode
}

/**
 * One infinitely scrolling row, built from the `marquee` preset's own class and custom properties
 * (ADR-186). The keyframes live in `MARQUEE_CSS`, emitted once per block by `MarqueeStyles`.
 *
 * **Seamless** is arithmetic, not tuning: the track holds the content **twice** and travels exactly
 * −50 %, so at the end of a cycle the second copy sits where the first began and the jump back to 0 is
 * invisible. Any other offset shows a gap or a stutter.
 *
 * **Content narrower than the container** is the case that breaks most implementations, and it is handled
 * without measuring: each copy is `min-w-full`, so a copy is never narrower than the row and −50 % always
 * travels exactly one copy. A block may not read layout (COMPONENT_LIBRARY.md § Rules 1), which rules out
 * the measured version.
 *
 * Under reduced motion `blocks.css` turns the track into a wrapping, centred grid — a `width: max-content`
 * row with its animation switched off would overflow with half its content unreachable.
 */
export function MarqueeRow({
  direction,
  duration,
  pauseOnHover,
  gapClass = 'gap-6',
  children,
}: MarqueeRowProps) {
  const className = cn(
    MARQUEE_CLASS,
    pauseOnHover && MARQUEE_PAUSABLE_CLASS,
    gapClass,
    'items-stretch',
  )

  const copy = (
    <div className={cn('flex min-w-full shrink-0 items-stretch', gapClass)}>{children}</div>
  )

  return (
    <div
      className={className}
      data-direction={direction}
      data-testid="marquee-track"
      style={marqueeCssVars({ duration, direction }) as CSSProperties}
    >
      {copy}
      {/* The second copy is decorative by definition: it is the first one again, and a screen reader
          reading every testimonial twice is the defect that hides behind a seamless loop. */}
      <div aria-hidden="true" className="contents">
        {copy}
      </div>
    </div>
  )
}
