'use client'

import Link from 'next/link'

import { useLocale } from '../../lib/i18n/locale-context'
import { useNav } from '../../lib/i18n/surfaces'
import { LocaleSwitch } from '../nav/locale-switch'

/**
 * Nothing here prefetches. `/studio` is a 373 kB route, and a landing page that downloads it for a
 * visitor who has not asked for it spends their bandwidth on a guess — measured as a 117 ms long task
 * and 1.3 s of simulated LCP (ADR-295).
 *
 * A hairline bar, not a floating glass pill. The page's own device is the ruler rail down its left
 * edge (`section-rail.tsx`), and two floating chrome elements at the top of the same screen would
 * compete — DESIGN_REFERENCES.md § Applying it per surface: loudness is spent in one place.
 *
 * A Client Component since ADR-361, for the one reason a header needs the client: the language
 * switch has to know which URL the reader is on. The links themselves are still plain `<a>`s in the
 * HTML the server sends.
 */
export function LandingNav() {
  const { href } = useLocale()
  const nav = useNav()

  const links = [
    { href: '/studio', label: nav.studio },
    { href: '/playground', label: nav.playground },
    { href: '/blocks', label: nav.blocks },
    { href: '/docs', label: nav.docs },
  ]

  return (
    <header className="sticky top-0 z-20 border-border-subtle border-b bg-surface-0/80 backdrop-blur-[--ms-blur-md]">
      <nav
        aria-label={nav.main}
        className="mx-auto flex h-14 w-full max-w-[76rem] items-center gap-6 px-5 sm:px-8"
      >
        <Link
          className="rounded-sm font-medium text-sm tracking-tight outline-none focus-visible:shadow-focus"
          href={href('/')}
        >
          {nav.brand}
        </Link>

        <ul className="hidden flex-1 items-center gap-5 sm:flex">
          {links.map((link) => (
            <li key={link.href}>
              <Link
                className="rounded-sm font-mono text-sm text-foreground-muted uppercase tracking-[0.12em] outline-none transition-colors hover:text-foreground focus-visible:shadow-focus"
                href={href(link.href)}
                prefetch={false}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="ml-auto flex items-center gap-3">
          <LocaleSwitch label={nav.language} />

          <Link
            className="rounded-md bg-accent px-3 py-1.5 font-medium text-foreground-onAccent text-sm outline-none transition-colors hover:bg-accent-hover focus-visible:shadow-focus"
            href={href('/studio')}
            prefetch={false}
          >
            {nav.openStudio}
          </Link>
        </div>
      </nav>
    </header>
  )
}
