import { getRequestDictionary } from '../../../lib/i18n/request-locale'
import { SectionIntro } from '../section-intro'
import { Section } from '../section-rail'

import { WalkthroughIsland } from './walkthrough-island'
import { END, START, WalkthroughPanel } from './walkthrough-values'

/**
 * The inspector, doing the thing the inspector does — VISION.md § The product: "the inspector is
 * generated from each component's schema".
 *
 * Two variants, both designed. The scroll-driven one scrubs a value as the section passes; the
 * reduced-motion one is a **before/after pair**, which `prompts/51` asks for by name: "Not a broken
 * half-state — a designed alternative." The pair is also what the server renders, so the section is
 * complete before any JavaScript arrives.
 *
 * The note under them is in both variants, and the pair is compact — the two have to be the same
 * height or the swap moves everything below them (ADR-295).
 */
export function InspectorWalkthrough() {
  const { inspector } = getRequestDictionary().landing
  const labels = {
    panelTitle: inspector.panelTitle,
    radius: inspector.radius,
    glow: inspector.glow,
    card: inspector.card,
  }

  return (
    <Section id="inspector" label={inspector.rail}>
      <div className="flex flex-col gap-10 py-16 lg:py-24">
        <SectionIntro heading={inspector.heading} id="inspector-heading">
          {inspector.intro}
        </SectionIntro>

        <WalkthroughIsland
          fallback={
            <div className="flex flex-col gap-3">
              <WalkthroughPanel caption={inspector.before} compact labels={labels} values={START} />
              <WalkthroughPanel caption={inspector.after} compact labels={labels} values={END} />
              <p className="text-foreground-muted text-sm">{inspector.note}</p>
            </div>
          }
          note={inspector.note}
        />
      </div>
    </Section>
  )
}
