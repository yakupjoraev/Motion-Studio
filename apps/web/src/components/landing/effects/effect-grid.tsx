import { getRequestDictionary } from '../../../lib/i18n/request-locale'
import { SectionIntro } from '../section-intro'
import { Section } from '../section-rail'

import { effectCards } from './effect-cards'
import { EffectGridIsland } from './effect-grid-island'
import { EffectStack } from './effect-stack'
import { EffectStage } from './effect-stage'

/**
 * Thirteen effects ship; six take the plate in turn.
 *
 * **One subject, not a catalogue.** The band used to be a horizontal pin with six tiles travelling
 * sideways, and it failed the thing it exists to do twice over: a third of a column is not enough
 * surface for an effect made of light, and vellum is not enough dark for one to read on. Three of the
 * six were also measured standing still. So the band is now a single artboard of blueprint with the
 * stack beside it, and the layers take it one at a time — which is also how the studio applies them.
 *
 * The server renders the plate with the first layer's name and description already on it, so the
 * section is finished before any JavaScript arrives and finished still if none of it does. The island
 * paints the live effect over that and starts the cycle.
 */
export function EffectGrid() {
  const { effects } = getRequestDictionary().landing
  const cards = effectCards(effects)
  const first = cards[0]

  return (
    <Section id="effects" label={effects.rail}>
      <div className="flex flex-col gap-10 py-16 lg:py-24">
        <SectionIntro heading={effects.heading} id="effects-heading">
          {effects.intro}
        </SectionIntro>

        <EffectGridIsland
          fallback={
            first === undefined ? null : (
              <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] lg:gap-8">
                <EffectStack active={0} cards={cards} title={effects.stackTitle} />
                <EffectStage card={first} />
              </div>
            )
          }
        />
      </div>
    </Section>
  )
}
