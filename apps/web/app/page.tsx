import type { Metadata } from 'next'

import { Architecture } from '../src/components/landing/architecture'
import { Cta } from '../src/components/landing/cta'
import { EffectGrid } from '../src/components/landing/effects/effect-grid'
import { ExportReveal } from '../src/components/landing/export-reveal'
import { Hero } from '../src/components/landing/hero/hero'
import { LandingNav } from '../src/components/landing/landing-nav'
import { Problem } from '../src/components/landing/problem'
import { Stack } from '../src/components/landing/stack'
import { InspectorWalkthrough } from '../src/components/landing/walkthrough/inspector-walkthrough'

export const metadata: Metadata = {
  title: 'Motion Studio — drag it, tune it, take the code',
  description:
    'A visual editor over a real React component registry. Tune a component directly, then export the source — React, Next, HTML or JSON. Local-first, no account.',
  openGraph: {
    title: 'Motion Studio',
    description: 'Direct manipulation over real components, with code as the output format.',
    type: 'website',
  },
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
export default function HomePage() {
  return (
    <>
      <a
        className="sr-only rounded-md bg-surface-2 px-3 py-2 focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-30 focus:shadow-focus"
        href="#main"
      >
        Skip to content
      </a>

      <LandingNav />

      <main id="main">
        <Hero />
        <Problem />
        <EffectGrid />
        <InspectorWalkthrough />
        <ExportReveal />
        <Architecture />
        <Stack />
        <Cta />
      </main>

      <footer className="border-border-subtle border-t">
        <div className="mx-auto flex w-full max-w-[76rem] flex-wrap items-center gap-x-6 gap-y-2 px-5 py-8 font-mono text-2xs text-foreground-muted uppercase tracking-[0.14em] sm:px-8 lg:pl-[7.5rem]">
          <span>Motion Studio</span>
          <span>MIT</span>
          <span>No telemetry</span>
        </div>
      </footer>
    </>
  )
}
