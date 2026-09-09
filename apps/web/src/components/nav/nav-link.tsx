'use client'

import Link, { useLinkStatus } from 'next/link'
import type { ReactNode } from 'react'

export interface NavLinkProps {
  readonly href: string
  readonly className: string
  readonly children: ReactNode
  /** Where the rule is drawn. `under` for a text link, `over` for the accent button's top edge. */
  readonly pendingEdge?: 'under' | 'over'
}

/**
 * A navigation link that answers the press.
 *
 * Nothing in this header prefetches — `/studio` is a 373 kB route and a landing page that downloads
 * it for a visitor who has not asked for it spends their bandwidth on a guess (ADR-295). The cost of
 * that decision is the gap it leaves: the click sends a request for the route's payload, and until
 * that lands the router has not committed, so `loading.tsx` has not rendered and the page the reader
 * clicked away from is still on screen, unchanged. Measured on the studio at 400 kbit/s: **1 966 ms
 * with no sign of an answer** (ROADMAP.md § M15). A press with no answer reads as a press that missed,
 * which is exactly what the owner reported about `/playground`.
 *
 * `useLinkStatus` is that missing signal, and it only exists inside a `Link`, which is why the rule is
 * a child rather than a wrapper. It is a rule drawing itself left to right — the page's own mark for
 * "this is happening", the same one the bands open with — and never a spinner.
 */
export function NavLink({ href, className, children, pendingEdge = 'under' }: NavLinkProps) {
  return (
    <Link className={`relative ${className}`} href={href} prefetch={false}>
      {children}
      <PendingRule edge={pendingEdge} />
    </Link>
  )
}

function PendingRule({ edge }: { readonly edge: 'under' | 'over' }) {
  const { pending } = useLinkStatus()

  if (!pending) {
    return null
  }

  return (
    <span
      aria-hidden="true"
      className={`absolute inset-x-0 h-0.5 bg-accent ${edge === 'under' ? '-bottom-1' : 'top-0'}`}
      // The same pulse the skeletons use: its duration is a token multiplied by
      // `--ms-reduced-motion`, so it holds still for a reader who asked for that and the rule is
      // still there to be seen.
      data-ms-skeleton
      data-testid="nav-pending"
    />
  )
}
