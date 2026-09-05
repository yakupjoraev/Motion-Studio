'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { useLocale } from '../../lib/i18n/locale-context'
import { localeCookieHeader } from '../../lib/i18n/locale-cookie'
import { switchLocaleHref } from '../../lib/i18n/locale-href'
import { LOCALES, LOCALE_NAME, LOCALE_SHORT, type Locale } from '../../lib/i18n/locales'

export interface LocaleSwitchProps {
  /** The accessible name of the group — the word "Language" in the current locale. */
  readonly label: string
}

/**
 * In the header, visible, not in a menu — the fourth thing the owner specified.
 *
 * Two links rather than a `<select>`: the target is a real URL, so it is shareable, crawlable and
 * middle-clickable, and the current language is readable without opening anything. The click also
 * writes the cookie, and that write is the whole of "an explicit choice always wins" — from then on
 * the guess does not run (ADR-362).
 *
 * A `nav`, not a `div role="group"`: these are links to the same page in another language, which is
 * what a landmark labelled "Language" tells a screen-reader user before they read the two letters.
 * `fieldset` — what the lint rule suggests for a group — belongs to a form.
 */
export function LocaleSwitch({ label }: LocaleSwitchProps) {
  const { locale } = useLocale()
  const pathname = usePathname()

  const choose = (target: Locale) => () => {
    document.cookie = localeCookieHeader(target)
  }

  return (
    <nav
      aria-label={label}
      className="flex items-center gap-0.5 rounded-md border border-border-subtle p-0.5"
    >
      {LOCALES.map((candidate) => {
        const current = candidate === locale

        return (
          <Link
            aria-current={current ? 'true' : undefined}
            className={`rounded-[calc(var(--ms-radius-md)-2px)] px-2 py-1 font-mono text-2xs uppercase tracking-[0.14em] outline-none transition-colors focus-visible:shadow-focus ${
              current
                ? 'bg-surface-2 text-foreground'
                : 'text-foreground-muted hover:text-foreground'
            }`}
            data-testid={`locale-switch-${candidate}`}
            href={switchLocaleHref(pathname, candidate)}
            hrefLang={candidate}
            key={candidate}
            onClick={choose(candidate)}
            prefetch={false}
            title={LOCALE_NAME[candidate]}
          >
            {LOCALE_SHORT[candidate]}
          </Link>
        )
      })}
    </nav>
  )
}
