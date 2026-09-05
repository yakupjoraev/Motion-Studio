import Link from 'next/link'

import { getDictionary } from '../../src/lib/i18n/dictionary'
import { localeHref } from '../../src/lib/i18n/locale-href'
import { DEFAULT_LOCALE } from '../../src/lib/i18n/locales'

/**
 * A 404 that behaves like the rest of the product: says what happened, where, and what to do —
 * UI_GUIDELINES.md § Copy. No apology, no illustration, and the two links a lost visitor actually
 * wants.
 *
 * It carries no document actions on purpose. Nothing has failed here: a wrong URL is not a crash,
 * and offering a crash recovery would suggest otherwise.
 *
 * **English, whatever the URL said.** `not-found.tsx` renders outside the segment that carries the
 * locale — Next has no params for a route that did not match — so reading one here would be reading
 * a guess. The visitor is one link from a page that knows its language.
 */
export default function NotFound() {
  const { errors } = getDictionary(DEFAULT_LOCALE)

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center gap-4 px-6">
      <p className="text-2xs text-foreground-subtle uppercase tracking-[0.14em]">
        {errors.notFoundCode}
      </p>
      <h1 className="font-semibold text-2xl">{errors.notFoundTitle}</h1>
      <p className="text-foreground-muted text-sm">{errors.notFoundBody}</p>

      <div className="flex flex-wrap items-center gap-2">
        <Link
          className="h-9 rounded-md border border-border px-3 py-2 font-medium text-sm hover:bg-surface-2"
          href={localeHref(DEFAULT_LOCALE, '/blocks')}
        >
          {errors.browseBlocks}
        </Link>
        <Link
          className="h-9 rounded-md border border-border px-3 py-2 font-medium text-sm hover:bg-surface-2"
          href={localeHref(DEFAULT_LOCALE, '/studio')}
        >
          {errors.openStudio}
        </Link>
      </div>
    </main>
  )
}
