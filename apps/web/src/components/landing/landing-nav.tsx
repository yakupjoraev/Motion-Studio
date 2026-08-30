import Link from 'next/link'

/**
 * Nothing here prefetches. `/studio` is a 373 kB route, and a landing page that downloads it for a
 * visitor who has not asked for it spends their bandwidth on a guess — measured as a 117 ms long task
 * and 1.3 s of simulated LCP (ADR-295).
 *
 * A hairline bar, not a floating glass pill. The page's own device is the ruler rail down its left
 * edge (`section-rail.tsx`), and two floating chrome elements at the top of the same screen would
 * compete — DESIGN_REFERENCES.md § Applying it per surface: loudness is spent in one place.
 */
const LINKS = [
  { href: '/studio', label: 'Studio' },
  { href: '/playground', label: 'Playground' },
  { href: '/blocks', label: 'Blocks' },
  { href: '/docs', label: 'Docs' },
] as const

export function LandingNav() {
  return (
    <header className="sticky top-0 z-20 border-border-subtle border-b bg-surface-0/80 backdrop-blur-[--ms-blur-md]">
      <nav
        aria-label="Main"
        className="mx-auto flex h-14 w-full max-w-[76rem] items-center gap-6 px-5 sm:px-8"
      >
        <Link
          className="rounded-sm font-medium text-sm tracking-tight outline-none focus-visible:shadow-focus"
          href="/"
        >
          Motion Studio
        </Link>

        <ul className="hidden flex-1 items-center gap-5 sm:flex">
          {LINKS.map((link) => (
            <li key={link.href}>
              <Link
                className="rounded-sm font-mono text-2xs text-foreground-muted uppercase tracking-[0.14em] outline-none transition-colors hover:text-foreground focus-visible:shadow-focus"
                href={link.href}
                prefetch={false}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <Link
          className="ml-auto rounded-md bg-accent px-3 py-1.5 font-medium text-foreground-onAccent text-sm outline-none transition-colors hover:bg-accent-hover focus-visible:shadow-focus"
          href="/studio"
          prefetch={false}
        >
          Open the studio
        </Link>
      </nav>
    </header>
  )
}
