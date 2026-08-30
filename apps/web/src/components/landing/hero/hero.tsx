import Link from 'next/link'

import { HeroDemoIsland } from './hero-demo-island'
import { HeroDemoStatic } from './hero-demo-static'

/**
 * The first screen — PRODUCT.md § 9 and PERFORMANCE.md § Images: **the LCP element is the `<h1>`,
 * server-rendered, with nothing animating it in.** Everything that moves on this screen arrives
 * after that paint and is loaded from its own chunk.
 *
 * The thesis is in the second column rather than in a screenshot: a real canvas node the visitor can
 * move, with the value it writes shown beside it. VISION.md's one sentence is "feels it, tunes it,
 * walks away with the source", and a picture of an editor demonstrates none of the three.
 */
export function Hero() {
  return (
    <section className="relative overflow-hidden" id="hero">
      {/* The aurora is a decorative wash behind text that is already painted — never the LCP. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 [background:radial-gradient(52rem_30rem_at_12%_-14%,color-mix(in_oklch,var(--ms-color-accent)_38%,transparent),transparent_68%),radial-gradient(40rem_26rem_at_78%_-6%,color-mix(in_oklch,var(--ms-color-info)_26%,transparent),transparent_66%),radial-gradient(34rem_22rem_at_58%_92%,color-mix(in_oklch,var(--ms-color-accent)_14%,transparent),transparent_70%)]"
      />

      {/* The hairline the light falls on. One rule at the top of the section, brightest under the
          first gradient — the reference's whole trick for making a dark surface look lit. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px [background:linear-gradient(90deg,transparent,color-mix(in_oklch,var(--ms-color-accent)_55%,transparent)_22%,transparent_60%)]"
      />

      <div className="relative mx-auto grid w-full max-w-[76rem] gap-12 px-5 pt-16 pb-20 sm:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,28rem)] lg:items-center lg:gap-16 lg:pt-24 lg:pb-28 lg:pl-[7.5rem]">
        <div className="flex flex-col items-start gap-6">
          <p className="rounded-full border border-border bg-surface-1 px-3 py-1 font-mono text-2xs text-foreground-muted uppercase tracking-[0.18em]">
            Local-first · MIT · no account
          </p>

          <h1 className="max-w-[16ch] text-balance font-display text-5xl leading-[0.95] tracking-[-0.03em] sm:text-6xl">
            Drag it. Tune it. Take the code.
          </h1>

          <p className="max-w-[52ch] text-foreground-muted text-lg leading-relaxed">
            A visual editor over a real React component registry. The inspector is generated from
            each component&rsquo;s schema, and the export button emits the component you were just
            looking at.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              className="rounded-md bg-accent px-4 py-2.5 font-medium text-foreground-onAccent outline-none transition-colors hover:bg-accent-hover focus-visible:shadow-focus"
              href="/studio"
              prefetch={false}
            >
              Open the studio
            </Link>
            <Link
              className="rounded-md border border-border bg-surface-1 px-4 py-2.5 font-medium outline-none transition-colors hover:border-border-strong focus-visible:shadow-focus"
              href="/playground"
              prefetch={false}
            >
              Try the playground
            </Link>
          </div>

          {/*
            A three-column grid with labels short enough that none of them can wrap. The first
            version put label and value on one line and wrapped to two the moment Geist Mono
            replaced the fallback — 22 px that moved the rest of the page, and 0.073 of a 0.02 CLS
            budget (ADR-295). A fixed column count cannot do that.
          */}
          <dl className="grid w-full max-w-[26rem] grid-cols-3 gap-x-6 pt-4">
            {[
              { label: 'Blocks', value: '72' },
              { label: 'Presets', value: '51' },
              { label: 'Targets', value: '4' },
            ].map((stat) => (
              <div className="flex flex-col gap-0.5" key={stat.label}>
                <dt className="font-mono text-2xs text-foreground-muted uppercase tracking-[0.14em]">
                  {stat.label}
                </dt>
                <dd className="font-mono text-foreground-muted text-sm tabular-nums">
                  {stat.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <HeroDemoIsland fallback={<HeroDemoStatic />} />
      </div>
    </section>
  )
}
