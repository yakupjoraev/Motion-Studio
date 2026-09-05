'use client'

import Link from 'next/link'

import { useLocale } from '../../../lib/i18n/locale-context'
import { useStudio } from '../../../lib/i18n/studio-surface'

/**
 * The way into the playground from the studio, and it is a `next/link` on purpose: the route change
 * is client-side, so the selection the playground writes back to is still there when it arrives
 * (ADR-279). A full reload would empty the store and the port with it.
 */
export function PlaygroundLink() {
  const { chrome } = useStudio()
  const { href } = useLocale()

  return (
    <Link
      href={href('/playground')}
      data-testid="playground-link"
      className="rounded-sm px-2 py-1 text-foreground-muted text-xs hover:text-foreground focus-visible:outline-2 focus-visible:outline-accent-ring focus-visible:outline-offset-2"
    >
      {chrome.playground}
    </Link>
  )
}
