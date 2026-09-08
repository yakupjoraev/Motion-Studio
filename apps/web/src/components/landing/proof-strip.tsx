import { getRequestDictionary } from '../../lib/i18n/request-locale'

import { LANDING_STATS } from './landing-stats'
import { ProofFigures } from './proof-figures'

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
      <div className="mx-auto grid w-full max-w-[84rem] gap-8 px-5 py-12 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end sm:px-8 lg:pl-[7.5rem]">
        <ProofFigures figures={figures} />

        <p className="max-w-[30ch] text-foreground-subtle text-sm leading-relaxed sm:text-right">
          {proof.summary}
        </p>
      </div>
    </section>
  )
}
