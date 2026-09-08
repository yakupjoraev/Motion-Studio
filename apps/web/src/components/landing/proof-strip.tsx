import { getRequestDictionary } from '../../lib/i18n/request-locale'

import { LANDING_STATS } from './landing-stats'

/**
 * The three numbers, as their own band directly under the hero.
 *
 * They were inside the hero, which made it five text elements deep: eyebrow, headline, subtitle,
 * two buttons and a stat row. A hero is one moment — the claim and the way in — and a proof strip is
 * the answer to the question the claim raises, which is a different moment and belongs below it.
 *
 * The values come from `LANDING_STATS`, which `landing-stats.test.ts` checks against the registry, so
 * the strip cannot drift from the build (ADR-370).
 */
export function ProofStrip() {
  const { proof } = getRequestDictionary().landing

  const figures = [
    { label: proof.blocks, value: LANDING_STATS.blocks },
    { label: proof.presets, value: LANDING_STATS.presets },
    { label: proof.targets, value: LANDING_STATS.exportTargets },
  ]

  return (
    <section
      aria-label={proof.summary}
      className="relative border-border-subtle border-t bg-surface-0"
    >
      <div className="mx-auto grid w-full max-w-[76rem] gap-8 px-5 py-10 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end sm:px-8 lg:pl-[7.5rem]">
        <dl className="grid grid-cols-3 gap-x-6 gap-y-2 sm:max-w-[34rem]">
          {figures.map((figure) => (
            <div className="flex flex-col gap-1" key={figure.label}>
              {/*
                The number leads and it is display type, not a mono caption: this band exists to be
                read across the page at a glance, and the label under it says what was counted.
              */}
              <dd className="font-display text-4xl leading-none tracking-[-0.02em] tabular-nums">
                {figure.value}
              </dd>
              <dt className="text-foreground-muted text-sm">{figure.label}</dt>
            </div>
          ))}
        </dl>

        <p className="max-w-[34ch] text-foreground-subtle text-sm leading-relaxed sm:text-right">
          {proof.summary}
        </p>
      </div>
    </section>
  )
}
