import Link from 'next/link'

import type { Neighbours } from '../../lib/docs/build-nav'

const CARD_CLASS =
  'flex flex-1 flex-col gap-1 rounded-lg border border-border bg-surface-1 px-4 py-3 outline-none transition-colors hover:border-border-strong focus-visible:shadow-focus'

/**
 * Previous and next in the index's reading order, not alphabetical: the order is the one
 * `docs/README.md` puts the documents in, so following the pager reads the specification the way it
 * was meant to be read.
 */
export function DocsPager({ previous, next }: Neighbours) {
  if (previous === undefined && next === undefined) {
    return null
  }

  return (
    <nav aria-label="Previous and next document" className="mt-12 flex flex-col gap-3 sm:flex-row">
      {previous === undefined ? null : (
        <Link className={CARD_CLASS} href={previous.href} prefetch={false} rel="prev">
          <span className="font-mono text-2xs text-foreground-muted uppercase tracking-[0.14em]">
            Previous
          </span>
          <span className="font-mono text-sm">{previous.fileName}</span>
        </Link>
      )}

      {next === undefined ? null : (
        <Link
          className={`${CARD_CLASS} sm:text-right`}
          href={next.href}
          prefetch={false}
          rel="next"
        >
          <span className="font-mono text-2xs text-foreground-muted uppercase tracking-[0.14em]">
            Next
          </span>
          <span className="font-mono text-sm">{next.fileName}</span>
        </Link>
      )}
    </nav>
  )
}
