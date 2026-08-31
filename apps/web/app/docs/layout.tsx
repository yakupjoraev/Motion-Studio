import Link from 'next/link'
import type { ReactNode } from 'react'

import { DocsSearch } from '../../src/components/docs/docs-search'

/**
 * The chrome that does not depend on which document is open. The sidebar is not here: it carries
 * `aria-current`, which a layout cannot know — ADR-309 has the measurement.
 */
export default function DocsLayout({ children }: { readonly children: ReactNode }) {
  return (
    <>
      <a
        className="sr-only rounded-md bg-surface-2 px-3 py-2 focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-30 focus:shadow-focus"
        href="#main"
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-20 border-border-subtle border-b bg-surface-0/80 backdrop-blur-[--ms-blur-md]">
        <nav
          aria-label="Main"
          className="mx-auto flex h-14 w-full max-w-[88rem] items-center gap-6 px-5 sm:px-8"
        >
          <Link
            className="rounded-sm font-medium text-sm tracking-tight outline-none focus-visible:shadow-focus"
            href="/"
          >
            Motion Studio
          </Link>

          <Link
            className="rounded-sm font-mono text-2xs text-foreground-muted uppercase tracking-[0.14em] outline-none transition-colors hover:text-foreground focus-visible:shadow-focus"
            href="/blocks"
            prefetch={false}
          >
            Blocks
          </Link>

          <span className="ml-auto">
            <DocsSearch />
          </span>
        </nav>
      </header>

      {children}
    </>
  )
}
