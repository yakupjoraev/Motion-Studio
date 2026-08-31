import type { ReactNode } from 'react'

import type { DocHeading } from '../../lib/docs/headings'

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
 * Below `lg` the nav is a short scrollable strip rather than 29 links stacked above the article. The
 * skip link is what a keyboard reader uses to step over it, which is the reason it is the first
 * focusable element on the page.
 */
export function DocsShell({ current, headings, children }: DocsShellProps) {
  return (
    <div className="mx-auto grid w-full max-w-[88rem] gap-x-8 gap-y-6 px-5 py-10 sm:px-8 lg:grid-cols-[15rem_minmax(0,1fr)_14rem]">
      <aside className="max-h-44 min-w-0 overflow-y-auto lg:sticky lg:top-20 lg:max-h-[calc(100vh-7rem)] lg:self-start">
        <DocsSidebar current={current} />
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
