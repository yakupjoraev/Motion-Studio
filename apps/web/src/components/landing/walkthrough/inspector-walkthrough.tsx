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
const NOTE =
  'One control, two ends of its range. The studio scrubs it with a drag; this page scrubs it with the scroll.'

export function InspectorWalkthrough() {
  return (
    <Section id="inspector" label="03 / inspector">
      <div className="flex flex-col gap-10 py-16 lg:py-24">
        <SectionIntro
          heading="Change a value; watch the component, not a preview of one."
          id="inspector-heading"
        >
          Controls come from each block&rsquo;s Zod schema, so a prop that exists has a control and
          a prop that does not cannot be set. Scrub one and the canvas is already the answer.
        </SectionIntro>

        <WalkthroughIsland
          fallback={
            <div className="flex flex-col gap-3">
              <WalkthroughPanel caption="before" compact values={START} />
              <WalkthroughPanel caption="after" compact values={END} />
              <p className="text-foreground-muted text-sm">{NOTE}</p>
            </div>
          }
          note={NOTE}
        />
      </div>
    </Section>
  )
}
