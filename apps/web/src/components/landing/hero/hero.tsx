import Link from 'next/link'

import { localeHref } from '../../../lib/i18n/locale-href'
import { getRequestDictionary, getRequestLocale } from '../../../lib/i18n/request-locale'

import { HeroPageIsland } from './hero-page-island'
import { HeroPageStatic } from './hero-page-static'

/**
 * The first screen, and the only one that has to do two jobs at once: say what the product is, and
 * be it.
 *
 * **The LCP element is the `<h1>`, server-rendered, with nothing animating it in** — PERFORMANCE.md
 * § Images. Everything that moves arrives after that paint: the rules draw themselves, the frame
 * lifts, and the page inside it is real blocks out of the shipped registry with a real block on a
 * card beside them. A visitor who drags that card onto the page has used the product before deciding
 * whether to open it, which is the only argument this page can make that a screenshot cannot.
 */
export function Hero() {
  const locale = getRequestLocale()
  const { hero } = getRequestDictionary().landing

  return (
    <section className="relative isolate overflow-hidden border-border-subtle border-b" id="hero">
      {/*
        The ground, in three layers, all decorative and all behind text that is already painted.

        The lattice is the canvas's own dot grid at the canvas's own size: the page is laid out on the
        surface the product draws on, which is the one piece of decoration here that is also an
        argument.
      */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 [background-size:32px_32px] [background:radial-gradient(circle_at_1px_1px,color-mix(in_oklch,var(--ms-color-foreground)_10%,transparent)_1px,transparent_0)] [mask-image:radial-gradient(64rem_40rem_at_22%_34%,#000,transparent_78%)]"
      />

      {/* Light on that surface. Two cores and a floor wash, so the bottom of the screen is lit
          surface rather than void — the reference's whole trick for a dark page that is not flat. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 [background:radial-gradient(52rem_30rem_at_6%_-4%,color-mix(in_oklch,var(--ms-color-accent)_38%,transparent),transparent_70%),radial-gradient(44rem_26rem_at_72%_-8%,color-mix(in_oklch,var(--ms-color-info)_26%,transparent),transparent_68%),radial-gradient(70rem_32rem_at_40%_116%,color-mix(in_oklch,var(--ms-color-accent)_18%,transparent),transparent_72%)]"
      />

      {/* The two rules the composition hangs off: the top one lit where the first core falls on it,
          the left one running the height of the screen. They draw themselves on load. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px [background:linear-gradient(90deg,transparent,color-mix(in_oklch,var(--ms-color-accent)_60%,transparent)_18%,color-mix(in_oklch,var(--ms-color-info)_28%,transparent)_46%,transparent_78%)]"
        data-ms-rule
      />
      <div
        aria-hidden="true"
        className="ms-ruler-y pointer-events-none absolute top-0 bottom-0 left-0 hidden w-6 lg:block"
        data-ms-column
        style={{ ['--ms-hero-delay' as string]: '80ms' }}
      />

      <div className="relative mx-auto grid w-full max-w-[84rem] items-center gap-10 px-5 pt-14 pb-14 sm:px-8 lg:grid-cols-[minmax(0,30rem)_minmax(0,1fr)] lg:gap-12 lg:pt-16 lg:pb-16 lg:pl-[7.5rem]">
        <div className="flex flex-col items-start gap-6 [container-type:inline-size]">
          <p className="rounded-full border border-border bg-surface-1/80 px-3 py-1 font-mono text-foreground-muted text-xs uppercase tracking-[0.16em] backdrop-blur-sm">
            {hero.eyebrow}
          </p>

          <h1 className="text-balance font-display text-display-1">{hero.headline}</h1>

          <p className="max-w-[46ch] text-foreground-muted text-lg leading-relaxed">
            {hero.subtitle}
          </p>

          <div
            className="flex flex-wrap items-center gap-3 pt-1"
            data-ms-rise
            style={{ ['--ms-hero-delay' as string]: '160ms' }}
          >
            <Link
              className="rounded-md bg-accent px-5 py-3 font-medium text-foreground-onAccent outline-none transition-[background-color,transform] duration-[--ms-duration-fast] ease-[--ms-ease-standard] hover:bg-accent-hover focus-visible:shadow-focus active:translate-y-px"
              href={localeHref(locale, '/studio')}
              prefetch={false}
            >
              {hero.openStudio}
            </Link>
            <Link
              className="rounded-md border border-border bg-surface-1/70 px-5 py-3 font-medium outline-none backdrop-blur-sm transition-[border-color,transform] duration-[--ms-duration-fast] ease-[--ms-ease-standard] hover:border-border-strong focus-visible:shadow-focus active:translate-y-px"
              href={localeHref(locale, '/playground')}
              prefetch={false}
            >
              {hero.tryPlayground}
            </Link>
          </div>
        </div>

        {/*
          The stage runs off the right edge of the container on purpose: a page continues past the
          window it is being edited in, and a frame that ends politely inside the margin says the
          opposite. Below `lg` it comes back inside and holds its aspect ratio.
        */}
        <div
          className="lg:-mr-8 xl:-mr-20"
          data-ms-rise
          style={{ ['--ms-hero-delay' as string]: '220ms' }}
        >
          <HeroPageIsland fallback={<HeroPageStatic />} />
        </div>
      </div>
    </section>
  )
}
