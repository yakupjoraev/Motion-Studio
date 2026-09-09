'use client'

import { useEffect, useState } from 'react'

import { useLanding } from '../../../lib/i18n/surfaces'

/** How long one capability holds the line. Long enough to read, short enough to wait through three. */
const DWELL = 2600

const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * What the frame beside it can do, one line at a time, on a loop.
 *
 * The frame is a real page with a real block being dropped into it, which is the product's own
 * argument — and a visitor who does not touch it never learns that the same three things are what the
 * headline promises. This says them, in the headline's own order, marked with the accent rule the page
 * uses for "this one".
 *
 * All three lines are in the document at once and none of them fades: the inactive ones are muted by
 * colour, not by opacity, for the reason ADR-386's sibling records — axe reads the painted colour, and
 * text at 40 % over vellum is a contrast failure on every frame but the last. Under reduced motion the
 * line does not advance and all three are simply legible.
 */
export function HeroReel() {
  const { hero } = useLanding()
  const lines = [hero.reelDrag, hero.reelTune, hero.reelExport]
  const [active, setActive] = useState(0)

  useEffect(() => {
    if (prefersReducedMotion()) {
      return
    }

    const timer = window.setInterval(() => {
      setActive((index) => (index + 1) % lines.length)
    }, DWELL)

    return () => {
      window.clearInterval(timer)
    }
  }, [lines.length])

  return (
    <ol className="mt-4 flex flex-col gap-1.5">
      {lines.map((line, index) => {
        const on = index === active

        return (
          <li
            className={`flex items-center gap-2.5 font-mono text-[11px] uppercase tracking-[0.16em] transition-colors duration-[--ms-duration-fast] ${
              on ? 'text-[var(--ms-l-ink)]' : 'text-[var(--ms-l-ink-soft)]'
            }`}
            key={line}
          >
            <span
              aria-hidden="true"
              className={`block h-px transition-[width,background-color] duration-[--ms-duration-normal] ${
                on ? 'w-8 bg-[var(--ms-l-accent)]' : 'w-3 bg-[var(--ms-l-line-strong)]'
              }`}
            />
            {line}
          </li>
        )
      })}
    </ol>
  )
}
