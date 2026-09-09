import Link from 'next/link'

import { localeHref } from '../../../lib/i18n/locale-href'
import { getRequestDictionary, getRequestLocale } from '../../../lib/i18n/request-locale'

import { HeroPageIsland } from './hero-page-island'
import { HeroPageStatic } from './hero-page-static'
import { HeroReel } from './hero-reel'
import { STAGE } from './hero-stage'

/**
 * The first screen, drawn as a sheet.
 *
 * The type sits on graph paper with the marks a drawing carries — a corner origin, a dimension line
 * across the frame with its measurement on it — and the frame under it holds the running product. The
 * marks are not decoration: this editor rules its canvas, prints coordinates and measures gaps, so
 * the page is a drawing of the thing it is selling.
 *
 * **The LCP element is the `<h1>`, server-rendered, with nothing animating it in** — PERFORMANCE.md
 * § Images. What moves arrives after that paint: the rules run out from the corner, the dimension
 * measures itself, the frame lifts.
 */
export function Hero() {
  const locale = getRequestLocale()
  const { hero } = getRequestDictionary().landing

  return (
    <section className="ms-sheet relative isolate border-border border-b" id="hero">
      <div className="mx-auto w-full max-w-[84rem] px-5 pt-10 pb-14 sm:px-8 lg:px-12 lg:pt-14 lg:pb-16">
        {/* The origin. Every drawing has one, and on this one it is where the reading starts. */}
        <div className="relative mb-10 lg:mb-14">
          <span
            aria-hidden="true"
            className="absolute -top-4 left-0 h-4 w-px bg-[var(--ms-l-line-strong)]"
            data-ms-column
          />
          <span
            aria-hidden="true"
            className="absolute -top-px right-0 left-0 h-px origin-left bg-[var(--ms-l-line-strong)]"
            data-ms-rule
          />
          <span className="absolute -top-6 left-2 font-mono text-[10px] text-[var(--ms-l-ink-soft)] tracking-[0.2em]">
            0,0
          </span>
        </div>

        <div className="flex flex-col gap-10">
          <div className="flex flex-col items-start gap-6">
            <p className="inline-flex items-center gap-2 font-mono text-[11px] text-[var(--ms-l-ink-soft)] uppercase tracking-[0.24em]">
              <span aria-hidden="true" className="block h-px w-8 bg-[var(--ms-l-accent)]" />
              {hero.eyebrow}
            </p>

            <h1 className="max-w-[18ch] text-balance font-display text-[clamp(2.75rem,6.4vw,5.25rem)] leading-[0.92] tracking-[-0.035em]">
              {hero.headline}
            </h1>

            {/* A rule run out under the type, the way a drawing closes a block of it. */}
            <span
              aria-hidden="true"
              className="ms-dim w-full max-w-[38rem]"
              data-ms-rule
              style={{ ['--ms-hero-delay' as string]: '120ms' }}
            />
          </div>

          <div className="grid gap-x-12 gap-y-10 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] lg:items-start">
            <div className="flex flex-col items-start gap-6">
              <p className="max-w-[38ch] text-[var(--ms-l-ink-soft)] text-base leading-relaxed">
                {hero.subtitle}
              </p>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                <Link
                  className="bg-[var(--ms-l-accent-strong)] px-6 py-3.5 font-medium text-[var(--ms-l-accent-ink)] text-sm uppercase tracking-[0.1em] outline-none transition-[background-color,transform] duration-[--ms-duration-fast] ease-[--ms-ease-standard] hover:bg-[var(--ms-l-accent)] focus-visible:shadow-focus active:translate-y-px"
                  href={localeHref(locale, '/studio')}
                  prefetch={false}
                >
                  {hero.openStudio}
                </Link>
                <Link
                  className="group inline-flex items-center gap-2 border-[var(--ms-l-ink)] border-b pb-0.5 font-medium text-sm outline-none focus-visible:shadow-focus"
                  href={localeHref(locale, '/playground')}
                  prefetch={false}
                >
                  {hero.tryPlayground}
                  <span
                    aria-hidden="true"
                    className="transition-transform duration-[--ms-duration-fast] ease-[--ms-ease-standard] group-hover:translate-x-1"
                  >
                    →
                  </span>
                </Link>
              </div>
            </div>

            {/*
          The frame, beside the copy rather than under it, and **not** the width of the screen.

          It used to run the full container under everything else: 1216 px of frame holding a 1280 px
          stage at 0.95, 855 px tall, which made the first screen one enormous picture of the product
          with the copy as its caption. The owner's verdict was that it is too big. Beside the subtitle
          it is 517 px tall, the whole screen is one screen, the page inside is still the shipped
          components at the `lg` breakpoint, and the card is still a target a mouse has no trouble with
          — the part that had to survive the shrink.
        */}
            <div
              className="w-full max-w-[34rem] lg:justify-self-end"
              data-ms-rise
              style={{ ['--ms-hero-delay' as string]: '160ms' }}
            >
              <HeroPageIsland fallback={<HeroPageStatic />} />

              {/* The frame, measured. This number is the width the page inside is laid out at. */}
              <div aria-hidden="true" className="mt-4 flex items-center gap-3">
                <span className="ms-dim flex-1" data-ms-rule />
                <span className="font-mono text-[10px] text-[var(--ms-l-ink-soft)] tracking-[0.18em]">
                  {STAGE.width} PX · LG
                </span>
              </div>

              <HeroReel />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
