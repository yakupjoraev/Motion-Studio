import type { ReactNode } from 'react'

import type { DocHeading } from '../../lib/docs/headings'

import { getRequestDictionary } from '../../lib/i18n/request-locale'
import { DocsSidebar } from './docs-sidebar'
import { DocsToc } from './docs-toc'

export interface DocsShellProps {
  readonly current: string
  readonly headings: readonly DocHeading[]
  readonly children: ReactNode
}

/**
 * Sidebar, content, table of contents — in that order in the DOM, because ACCESSIBILITY.md § Manual
 * requires the focus order to match the visual one and the sidebar is on the left at every width
 * where it is beside the text.
 *
 * Below `lg` the list is collapsed behind a link rather than opened above the article. It was a
 * scrollable strip before, and the strip cost 176 px of an 844 px phone with 1 136 px of list inside
 * it — the article's own heading began at 349 px (ADR-396).
 *
 * The disclosure is `:target` and not `<details>`, measured: WebKit renders nothing inside a closed
 * `<details>` whatever CSS says, so a `<details>` that is meant to be open from `lg` up cannot exist
 * without script or a second copy of all 29 links.
 */
export function DocsShell({ current, headings, children }: DocsShellProps) {
  const { docs } = getRequestDictionary()

  return (
    <div className="mx-auto grid w-full max-w-[88rem] gap-x-8 gap-y-6 px-5 py-10 sm:px-8 lg:grid-cols-[15rem_minmax(0,1fr)_14rem]">
      {/* `scroll-mt-24`: following `#docs-nav` scrolls this to the top, and the header is sticky. */}
      <aside
        className="group min-w-0 scroll-mt-24 lg:sticky lg:top-20 lg:max-h-[calc(100vh-7rem)] lg:self-start lg:overflow-y-auto"
        id="docs-nav"
      >
        <a
          className="flex min-h-9 items-center rounded-sm font-mono text-2xs text-foreground-muted uppercase tracking-[0.14em] outline-none hover:text-foreground focus-visible:shadow-focus group-[:target]:hidden lg:hidden"
          href="#docs-nav"
        >
          {docs.navExpand}
        </a>

        <a
          className="hidden min-h-9 items-center rounded-sm font-mono text-2xs text-foreground-muted uppercase tracking-[0.14em] outline-none hover:text-foreground focus-visible:shadow-focus group-[:target]:flex lg:group-[:target]:hidden"
          href="#main"
        >
          {docs.navCollapse}
        </a>

        <div className="hidden group-[:target]:block lg:block">
          <DocsSidebar current={current} />
        </div>
      </aside>

      <main className="min-w-0" id="main">
        {children}
      </main>

      <aside className="min-w-0 lg:sticky lg:top-20 lg:max-h-[calc(100vh-7rem)] lg:self-start lg:overflow-y-auto">
        <DocsToc headings={headings} />
      </aside>
    </div>
  )
}
