'use client'

import { useEffect, useState } from 'react'

import { plainText } from '../../lib/docs/frontmatter'
import type { DocHeading } from '../../lib/docs/headings'

export interface DocsTocProps {
  readonly headings: readonly DocHeading[]
}

/**
 * Scroll-spy over the `h2`s and `h3`s. The band is the top fifth of the viewport, and the heading
 * nearest its top wins. A band that starts *below* the top edge cannot see a heading that an anchor
 * link just scrolled to — measured: `#reduced-motion` lands at 96 px, which a `-25%` top margin
 * excludes, so nothing was ever current after following an anchor.
 *
 * When no heading is in the band the last one stays current, which is what keeps the marker on the
 * section being read rather than dropping it between headings.
 *
 * Nothing animates and nothing moves; the only change is which link carries `aria-current`.
 */
export function DocsToc({ headings }: DocsTocProps) {
  const shown = headings.filter((heading) => heading.depth === 2 || heading.depth === 3)
  const [current, setCurrent] = useState<string | null>(shown[0]?.slug ?? null)

  useEffect(() => {
    const targets = headings
      .filter((heading) => heading.depth === 2 || heading.depth === 3)
      .map((heading) => document.getElementById(heading.slug))
      .filter((element): element is HTMLElement => element !== null)

    if (targets.length === 0) {
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)

        if (visible[0] !== undefined) {
          setCurrent(visible[0].target.id)
        }
      },
      { rootMargin: '0px 0px -80% 0px' },
    )

    for (const target of targets) {
      observer.observe(target)
    }

    return () => observer.disconnect()
  }, [headings])

  if (shown.length === 0) {
    return null
  }

  return (
    <nav aria-label="On this page" className="flex flex-col gap-2">
      <p className="font-mono text-2xs text-foreground-muted uppercase tracking-[0.14em]">
        On this page
      </p>

      <ul className="flex flex-col border-border-subtle border-l">
        {shown.map((heading) => (
          <li key={heading.slug}>
            <a
              aria-current={current === heading.slug ? 'true' : undefined}
              className={`-ms-px flex min-h-7 items-center border-transparent border-l text-xs outline-none transition-colors focus-visible:shadow-focus ${
                heading.depth === 3 ? 'ps-5' : 'ps-3'
              } ${
                current === heading.slug
                  ? 'border-accent text-foreground'
                  : 'text-foreground-muted hover:text-foreground'
              }`}
              href={`#${heading.slug}`}
            >
              {plainText(heading.text)}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
