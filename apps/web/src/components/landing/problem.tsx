import { getRequestDictionary } from '../../lib/i18n/request-locale'

import { SectionIntro } from './section-intro'
import { Section } from './section-rail'

/**
 * VISION.md § The problem, as the page's argument — and as a drawing of itself.
 *
 * The claim is that two kinds of tool leave a hole between them, so the two sides sit apart with the
 * hole between them and a dimension line across it, which is the mark a drawing uses to say "this
 * distance is the subject". The conclusion is written in that gap rather than trailing after the
 * cards, because the conclusion *is* the gap.
 *
 * The two sides drift apart as the band is read. Under reduced motion, and on an engine without view
 * timelines, they are simply already apart — the composition carries the argument on its own and the
 * motion only points at it.
 */
export function Problem() {
  const { problem } = getRequestDictionary().landing

  const sides = [
    {
      kind: problem.designKind,
      examples: problem.designExamples,
      can: problem.designCan,
      cannot: problem.designCannot,
      className: 'ms-split-a',
    },
    {
      kind: problem.libraryKind,
      examples: problem.libraryExamples,
      can: problem.libraryCan,
      cannot: problem.libraryCannot,
      className: 'ms-split-b',
    },
  ]

  return (
    <Section id="problem" label={problem.rail}>
      <div className="flex flex-col gap-12 py-16 lg:py-24">
        <SectionIntro heading={problem.heading} id="problem-heading">
          {problem.intro}
        </SectionIntro>

        <div className="ms-split grid items-stretch gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,23rem)_minmax(0,1fr)] lg:gap-0">
          {sides.map((side, index) => (
            <article
              className={`${side.className} flex flex-col gap-4 border border-border bg-surface-1 p-6 sm:p-8 ${
                index === 1 ? 'lg:order-3' : ''
              }`}
              key={side.kind}
            >
              <div className="flex flex-col gap-1">
                <h3 className="font-medium text-lg tracking-tight">{side.kind}</h3>
                <p className="font-mono text-foreground-muted text-xs uppercase tracking-[0.12em]">
                  {side.examples}
                </p>
              </div>
              <p className="text-foreground-muted">{side.can}</p>
              <p className="border-border-subtle border-t pt-4 text-foreground">{side.cannot}</p>
            </article>
          ))}

          {/* The hole, measured. */}
          <div className="flex flex-col items-center justify-center gap-4 px-2 py-6 text-center lg:order-2 lg:px-8">
            <div aria-hidden="true" className="flex w-full items-center">
              <span className="relative h-px flex-1 bg-border">
                <span className="ms-split-seam absolute inset-0 block bg-[var(--ms-l-accent)]" />
              </span>
            </div>

            <p className="text-balance leading-relaxed">
              <span className="block text-foreground-muted text-sm">{problem.conclusionLead}</span>
              <strong className="mt-2 block font-medium text-[1.0625rem] text-foreground leading-snug">
                {problem.conclusionStrong}
              </strong>
            </p>

            <div aria-hidden="true" className="flex w-full items-center">
              <span className="relative h-px flex-1 bg-border">
                <span className="ms-split-seam absolute inset-0 block bg-[var(--ms-l-accent)]" />
              </span>
            </div>
          </div>
        </div>
      </div>
    </Section>
  )
}
