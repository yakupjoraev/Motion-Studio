import Link from 'next/link'

import { buildNav } from '../../lib/docs/build-nav'
import { plainText } from '../../lib/docs/frontmatter'

export interface DocsSidebarProps {
  /** `''` is the index. Server-rendered so `aria-current` is in the HTML — ADR-309. */
  readonly current: string
}

/**
 * `min-h-7` and not `py-1`: a 22 px row fails WCAG 2.5.8's 24 px minimum, which Lighthouse measured
 * on this nav at 96/100 before the change. The rows are 28 px, so the spacing rule is met as well.
 */
const LINK_CLASS =
  'flex min-h-7 items-center rounded-sm px-2 font-mono text-2xs outline-none transition-colors focus-visible:shadow-focus'

export function DocsSidebar({ current }: DocsSidebarProps) {
  const groups = buildNav()

  return (
    <nav aria-label="Documentation" className="flex flex-col gap-4">
      <Link
        aria-current={current === '' ? 'page' : undefined}
        className={`${LINK_CLASS} ${
          current === ''
            ? 'bg-accent-muted text-foreground'
            : 'text-foreground-muted hover:text-foreground'
        }`}
        href="/docs"
        prefetch={false}
      >
        Index
      </Link>

      {groups.map((group) => (
        // Open by default and collapsible with no script: `<details>` is the disclosure, so the nav
        // works before hydration and there is nothing to hydrate.
        <details className="group" key={group.title} open>
          <summary className="flex min-h-7 cursor-pointer items-center rounded-sm px-2 font-mono text-2xs text-foreground-muted uppercase tracking-[0.14em] outline-none marker:text-foreground-muted focus-visible:shadow-focus">
            {group.title}
          </summary>

          <ul className="mt-1 flex flex-col border-border-subtle border-l pl-2">
            {group.items.map((item) => {
              const active = item.slug === current

              return (
                <li key={item.href}>
                  <Link
                    aria-current={active ? 'page' : undefined}
                    className={`${LINK_CLASS} ${
                      active
                        ? 'bg-accent-muted text-foreground'
                        : 'text-foreground-muted hover:text-foreground'
                    }`}
                    href={item.href}
                    prefetch={false}
                    title={plainText(item.summary)}
                  >
                    {item.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </details>
      ))}
    </nav>
  )
}
