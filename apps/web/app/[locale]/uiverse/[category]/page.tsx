import {
  UIVERSE_CATEGORIES,
  isUiverseCategory,
  rankCategory,
  readViews,
} from '@motion-studio/uiverse'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { LandingNav } from '../../../../src/components/landing/landing-nav'
import { ElementCard } from '../../../../src/components/uiverse/element-card'
import { getDictionary } from '../../../../src/lib/i18n/dictionary'
import { DEFAULT_LOCALE, isLocale } from '../../../../src/lib/i18n/locales'
import { setRequestLocale } from '../../../../src/lib/i18n/request-locale'

interface CategoryPageProps {
  readonly params: Promise<{ readonly locale: string; readonly category: string }>
  readonly searchParams: Promise<{ readonly page?: string }>
}

/** Buttons alone is 1 231 elements, and each one mounts a shadow root. A page is a page of them. */
const PER_PAGE = 48

export function generateStaticParams() {
  return UIVERSE_CATEGORIES.map((category) => ({ category }))
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { locale, category } = await params
  const { uiverse } = getDictionary(isLocale(locale) ? locale : DEFAULT_LOCALE)

  return { title: `${category} — ${uiverse.metaTitle}`, description: uiverse.metaDescription }
}

/**
 * One category, most-seen first.
 *
 * The ranking is server-side and the page is a slice of it, because the alternative — shipping the
 * category and sorting in the browser — means shipping up to 3 MB of markup to sort forty-eight
 * cards. The sort key is the view count, the only popularity signal Uiverse publishes; elements
 * whose count has not been collected keep catalogue order at the end rather than reading as zero.
 */
export default async function UiverseCategoryPage({ params, searchParams }: CategoryPageProps) {
  const { locale, category } = await params
  const { page } = await searchParams

  if (!isUiverseCategory(category)) {
    notFound()
  }

  const { uiverse, nav } = getDictionary(setRequestLocale(locale))
  const views = readViews()
  const ranked = rankCategory(category, views)

  const pages = Math.max(1, Math.ceil(ranked.length / PER_PAGE))
  const current = Math.min(Math.max(1, Number(page ?? '1') || 1), pages)
  const from = (current - 1) * PER_PAGE
  const shown = ranked.slice(from, from + PER_PAGE)

  return (
    <>
      <a
        className="sr-only rounded-md bg-surface-2 px-3 py-2 focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-30 focus:shadow-focus"
        href="#main"
      >
        {nav.skipToContent}
      </a>

      <LandingNav />

      <main
        className="mx-auto flex w-full max-w-[76rem] flex-col gap-8 px-5 py-12 sm:px-8"
        id="main"
      >
        <header className="flex flex-col gap-3">
          <Link
            className="w-fit rounded-sm font-mono text-2xs text-foreground-muted uppercase tracking-[0.18em] outline-none hover:text-foreground focus-visible:shadow-focus"
            href="/uiverse"
          >
            {uiverse.categories}
          </Link>
          <h1 className="m-0 font-display font-semibold text-3xl text-foreground tracking-[-0.03em] sm:text-4xl">
            {category}
          </h1>
          <p className="m-0 text-foreground-muted text-sm">
            {views === null
              ? `${uiverse.sortedAlphabetically} · ${uiverse.viewsMissing}`
              : `${uiverse.sortedByViews} · ${uiverse.viewsCollected.replace('{date}', views.collected)}`}
          </p>
          <p className="m-0 font-mono text-2xs text-foreground-subtle tabular-nums">
            {uiverse.showing
              .replace('{from}', String(from + 1))
              .replace('{to}', String(from + shown.length))
              .replace('{total}', String(ranked.length))}
          </p>
        </header>

        <ul className="m-0 grid list-none grid-cols-1 gap-3 p-0 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((entry) => (
            <li key={entry.element.id}>
              <ElementCard element={entry.element} views={entry.views} />
            </li>
          ))}
        </ul>

        <nav
          aria-label={uiverse.page
            .replace('{page}', String(current))
            .replace('{pages}', String(pages))}
          className="flex items-center justify-between gap-3"
        >
          {current > 1 ? (
            <Link
              className="rounded-md border border-border px-3 py-2 text-sm outline-none transition-colors hover:border-border-strong focus-visible:shadow-focus"
              href={`/uiverse/${category}?page=${current - 1}`}
            >
              {uiverse.previous}
            </Link>
          ) : (
            <span />
          )}

          <span className="font-mono text-2xs text-foreground-muted tabular-nums">
            {uiverse.page.replace('{page}', String(current)).replace('{pages}', String(pages))}
          </span>

          {current < pages ? (
            <Link
              className="rounded-md border border-border px-3 py-2 text-sm outline-none transition-colors hover:border-border-strong focus-visible:shadow-focus"
              href={`/uiverse/${category}?page=${current + 1}`}
            >
              {uiverse.next}
            </Link>
          ) : (
            <span />
          )}
        </nav>
      </main>
    </>
  )
}
