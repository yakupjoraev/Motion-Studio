import { SectionIntro } from '../section-intro'
import { Section } from '../section-rail'

import { EFFECT_CARDS } from './effect-cards'
import { EffectGridIsland } from './effect-grid-island'
import { EffectShell } from './effect-shell'

/**
 * Thirteen effects ship; six are here. Each card is a real surface with the real effect painted on
 * it — DESIGN_REFERENCES.md § Applying it per surface puts the effects category at maximum loudness,
 * and a still image of an effect on a page about motion would be the wrong argument.
 *
 * The server renders every card complete, with its name, its description and a static surface. The
 * island paints the live effect over that after mount, so the section is finished before any of it
 * arrives and finished still if none of it does.
 */
export function EffectGrid() {
  return (
    <Section id="effects" label="02 / effects">
      <div className="flex flex-col gap-10 py-16 lg:py-24">
        <SectionIntro heading="Every effect is a component with a schema." id="effects-heading">
          Not a snippet to paste and patch. Each one is parameterised, tunable in the inspector,
          correct under reduced motion, and exportable as source you can read.
        </SectionIntro>

        <EffectGridIsland
          fallback={
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {EFFECT_CARDS.map((card) => (
                <EffectShell card={card} key={card.id} />
              ))}
            </div>
          }
        />
      </div>
    </Section>
  )
}
