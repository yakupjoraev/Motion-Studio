import { findElement, readViews } from '@motion-studio/uiverse'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { CopyButton } from '../../../../../src/components/gallery/detail/copy-button'
import { LandingNav } from '../../../../../src/components/landing/landing-nav'
import { ElementPreview } from '../../../../../src/components/uiverse/element-preview'
import { getDictionary } from '../../../../../src/lib/i18n/dictionary'
import { DEFAULT_LOCALE, isLocale } from '../../../../../src/lib/i18n/locales'
import { setRequestLocale } from '../../../../../src/lib/i18n/request-locale'

interface ElementPageProps {
  readonly params: Promise<{
    readonly locale: string
    readonly category: string
    readonly element: string
  }>
}

export async function generateMetadata({ params }: ElementPageProps): Promise<Metadata> {
  const { locale, category, element } = await params
  const { uiverse } = getDictionary(isLocale(locale) ? locale : DEFAULT_LOCALE)
  const found = findElement(`${category}/${element}`)

  return {
    title: found === null ? uiverse.metaTitle : `${found.slug} — ${uiverse.metaTitle}`,
    description: uiverse.metaDescription,
  }
}

const NUMBER = new Intl.NumberFormat('en-US')

/**
 * One element, big enough to judge and with its source beside it.
 *
 * There is no `generateStaticParams` here: 3 802 pages of prerendered markup is a build cost for
 * pages nobody has asked for yet. The category pages are static, this one is rendered when it is
 * opened, and the data it reads is already on disk.
 */
export default async function UiverseElementPage({ params }: ElementPageProps) {
  const { locale, category, element } = await params
  const { uiverse, nav } = getDictionary(setRequestLocale(locale))
  const found = findElement(`${category}/${element}`)

  if (found === null) {
    notFound()
  }

  const views = readViews()?.views[found.id] ?? null

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
        className="mx-auto flex w-full max-w-[64rem] flex-col gap-8 px-5 py-12 sm:px-8"
        id="main"
      >
        <header className="flex flex-col gap-3">
          <Link
            className="w-fit rounded-sm font-mono text-2xs text-foreground-muted uppercase tracking-[0.18em] outline-none hover:text-foreground focus-visible:shadow-focus"
            href={`/uiverse/${found.category}`}
          >
            {found.category}
          </Link>

          <h1 className="m-0 font-display font-semibold text-3xl text-foreground tracking-[-0.03em] sm:text-4xl">
            {found.slug}
          </h1>

          <p className="m-0 text-foreground-muted text-sm">
            {uiverse.byAuthor.replace('{author}', found.author)}
            {' · '}
            {found.styling === 'tailwind' ? uiverse.tailwind : uiverse.css}
            {' · '}
            {views === null
              ? uiverse.viewsUnknown
              : uiverse.views.replace('{count}', NUMBER.format(views))}
          </p>

          <a
            className="w-fit rounded-sm text-accent text-sm outline-none hover:text-accent-hover focus-visible:shadow-focus"
            href={`https://uiverse.io/${found.author}/${found.slug}`}
            rel="noreferrer"
            target="_blank"
          >
            {uiverse.openOnUiverse}
          </a>
        </header>

        {/* Not `inert` here: this is the element's own page, so its buttons and inputs are the point. */}
        <div className="grid min-h-[22rem] place-items-center overflow-hidden rounded-xl border border-border bg-surface-2">
          <ElementPreview css={found.css} html={found.html} styling={found.styling} />
        </div>

        {found.tags.length === 0 ? null : (
          <section className="flex flex-col gap-2">
            <h2 className="m-0 font-medium text-foreground text-sm">{uiverse.tags}</h2>
            <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
              {found.tags.map((tag) => (
                <li
                  className="rounded-sm bg-surface-2 px-2 py-1 font-mono text-2xs text-foreground-muted"
                  key={tag}
                >
                  {tag}
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-3">
            <h2 className="m-0 font-medium text-foreground text-sm">{uiverse.markup}</h2>
            <CopyButton
              announcement={uiverse.copyAnnouncement}
              copiedLabel={uiverse.copied}
              failedLabel={uiverse.copyFailed}
              label={uiverse.copyMarkup}
              testId="copy-uiverse-html"
              text={found.html}
              tone="quiet"
            />
          </div>
          <pre className="m-0 max-h-80 min-w-0 overflow-auto rounded-lg border border-border-subtle bg-surface-inset p-3 font-mono text-2xs leading-relaxed">
            <code>{found.html}</code>
          </pre>
        </section>

        <section className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-3">
            <h2 className="m-0 font-medium text-foreground text-sm">{uiverse.styles}</h2>
            {found.styling === 'tailwind' ? null : (
              <CopyButton
                announcement={uiverse.copyAnnouncement}
                copiedLabel={uiverse.copied}
                failedLabel={uiverse.copyFailed}
                label={uiverse.copyStyles}
                testId="copy-uiverse-css"
                text={found.css}
                tone="quiet"
              />
            )}
          </div>

          {found.styling === 'tailwind' ? (
            <p className="m-0 text-foreground-muted text-sm">{uiverse.tailwindNote}</p>
          ) : (
            <pre className="m-0 max-h-96 min-w-0 overflow-auto rounded-lg border border-border-subtle bg-surface-inset p-3 font-mono text-2xs leading-relaxed">
              <code>{found.css}</code>
            </pre>
          )}
        </section>

        <p className="m-0 text-foreground-subtle text-xs leading-relaxed">{uiverse.licence}</p>
      </main>
    </>
  )
}
