import type { Metadata } from 'next'

import { Architecture } from '../../src/components/landing/architecture'
import { Cta } from '../../src/components/landing/cta'
import { EffectGrid } from '../../src/components/landing/effects/effect-grid'
import { ExportReveal } from '../../src/components/landing/export-reveal'
import { Hero } from '../../src/components/landing/hero/hero'
import { LandingNav } from '../../src/components/landing/landing-nav'
import { Problem } from '../../src/components/landing/problem'
import { ProofStrip } from '../../src/components/landing/proof-strip'
import { Stack } from '../../src/components/landing/stack'
import { StructuredData } from '../../src/components/landing/structured-data'
import { InspectorWalkthrough } from '../../src/components/landing/walkthrough/inspector-walkthrough'
import { getDictionary } from '../../src/lib/i18n/dictionary'
import { localeHref } from '../../src/lib/i18n/locale-href'
import { DEFAULT_LOCALE, isLocale } from '../../src/lib/i18n/locales'
import { setRequestLocale } from '../../src/lib/i18n/request-locale'
import { LandingDictionary } from '../../src/lib/i18n/surfaces'
import { alternatesFor } from '../../src/lib/site'

interface HomePageProps {
  readonly params: Promise<{ readonly locale: string }>
}

export async function generateMetadata({ params }: HomePageProps): Promise<Metadata> {
  const { locale } = await params
  const resolved = isLocale(locale) ? locale : DEFAULT_LOCALE
  const { landing } = getDictionary(resolved)

  return {
    title: landing.metaTitle,
    description: landing.metaDescription,
    alternates: alternatesFor(resolved, '/'),
    openGraph: {
      title: landing.ogTitle,
      description: landing.ogDescription,
      type: 'website',
    },
  }
}

/**
 * A Server Component, top to bottom — PRODUCT.md § 9 and ARCHITECTURE.md § Rendering strategy. The
 * three interactive parts are `next/dynamic` islands inside their own sections, so none of them is in
 * this route's first-load JS and none of them gates a paint.
 *
 * No `Suspense` boundary wraps them: each island renders its own server-rendered fallback until it
 * mounts, which is a stronger guarantee than a spinner — the page is complete without JavaScript and
 * identical in shape with it.
 */
export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params
  // Every section below reads the locale from the request store rather than from a prop chain.
  const resolved = setRequestLocale(locale)
  const dictionary = getDictionary(resolved)
  const { nav } = dictionary

  return (
    <>
      <StructuredData
        description={dictionary.landing.metaDescription}
        name="Motion Studio"
        path={localeHref(resolved, '/')}
      />

      <a
        className="sr-only rounded-md bg-surface-2 px-3 py-2 focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-30 focus:shadow-focus"
        href="#main"
      >
        {nav.skipToContent}
      </a>

      <div className="ms-landing">
        <LandingNav />
      </div>

      <main className="ms-landing" id="main">
        <LandingDictionary value={dictionary.landing}>
          <Hero />
          <ProofStrip />
          <Problem />
          <EffectGrid />
          <InspectorWalkthrough />
          <ExportReveal />
          <Architecture />
          <Stack />
          <Cta />
        </LandingDictionary>
      </main>

      <footer className="ms-landing border-border-subtle border-t">
        <div className="mx-auto flex w-full max-w-[76rem] flex-wrap items-center gap-x-6 gap-y-2 px-5 py-8 font-mono text-foreground-muted text-xs uppercase tracking-[0.12em] sm:px-8 lg:pl-[7.5rem]">
          <span>{nav.brand}</span>
          <span>{nav.footerLicence}</span>
          <span>{nav.footerTelemetry}</span>
          {/* The two legal pages are reachable from every visit, which is the point of having them
              — `prompts/69` § 2. They sit at the end because they are a destination nobody browses to. */}
          <a
            className="ms-transition-control hover:text-foreground"
            href={localeHref(resolved, '/privacy')}
          >
            {nav.footerPrivacy}
          </a>
          <a
            className="ms-transition-control hover:text-foreground"
            href={localeHref(resolved, '/terms')}
          >
            {nav.footerTerms}
          </a>
        </div>
      </footer>
    </>
  )
}
