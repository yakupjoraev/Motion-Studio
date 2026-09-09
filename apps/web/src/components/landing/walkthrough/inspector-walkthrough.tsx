import { getRequestDictionary } from '../../../lib/i18n/request-locale'
import { SectionIntro } from '../section-intro'
import { Section } from '../section-rail'

import { WalkthroughBand } from './walkthrough-band'
import { WalkthroughIsland } from './walkthrough-island'
import { WalkthroughPair, WalkthroughRows } from './walkthrough-panel'
import { STEPS } from './walkthrough-steps'

/**
 * The inspector, doing the thing the inspector does — VISION.md § The product: "the inspector is
 * generated from each component's schema".
 *
 * The panel stays under the hand while the subject beside it is watched, which is the studio's own
 * arrangement and the only one in which the claim reads. Two variants, both designed: the cycling one
 * puts the stack on the subject a row at a time and takes it off again; the reduced-motion one is a
 * **before/after pair**, which `prompts/51` asks for by name — "Not a broken half-state, a designed
 * alternative." The pair is also what the server renders, so the section is complete before any
 * JavaScript arrives.
 *
 * The pair takes half the band each, so both variants come to the same height (ADR-295).
 */
export function InspectorWalkthrough() {
  const { inspector } = getRequestDictionary().landing
  const labels = {
    panelTitle: inspector.panelTitle,
    card: inspector.card,
    stepRadius: inspector.stepRadius,
    stepFlip: inspector.stepFlip,
    stepScale: inspector.stepScale,
    stepFloat: inspector.stepFloat,
    stepGlow: inspector.stepGlow,
  }

  return (
    <Section id="inspector" label={inspector.rail}>
      <div className="flex flex-col gap-10 py-16 lg:py-24">
        <SectionIntro heading={inspector.heading} id="inspector-heading">
          {inspector.intro}
        </SectionIntro>

        <WalkthroughIsland
          fallback={
            <WalkthroughBand
              note={inspector.note}
              rows={<WalkthroughRows applied={STEPS.length} labels={labels} />}
              subject={
                <WalkthroughPair
                  after={inspector.after}
                  before={inspector.before}
                  labels={labels}
                />
              }
            />
          }
          note={inspector.note}
        />
      </div>
    </Section>
  )
}
