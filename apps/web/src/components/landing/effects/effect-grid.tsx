import { getRequestDictionary } from '../../../lib/i18n/request-locale'
import { SectionIntro } from '../section-intro'
import { Section } from '../section-rail'

import { effectCards } from './effect-cards'
import { EFFECT_GRID_CLASS } from './effect-grid-class'
import { EffectGridIsland } from './effect-grid-island'
import { EffectStage } from './effect-stage'

/**
 * Thirteen effects ship; the five that carry themselves are on the band, all running at once.
 *
 * **The plates are the argument.** A still picture of an effect, on a page about motion, is the wrong
 * argument; so is a switcher, which makes the reader click to see the thing the page is selling. The
 * band is a bento of blueprint plates with an effect painted on each, at four different sizes, and
 * every one of them is the shipped component with the shipped schema behind it.
 *
 * The server renders each plate complete, with its name and description, so the section is finished
 * before any JavaScript arrives and finished still if none of it does. The island paints the live
 * effects over that.
 */
export function EffectGrid() {
  const { effects } = getRequestDictionary().landing
  const cards = effectCards(effects)

  return (
    <Section id="effects" label={effects.rail}>
      <div className="flex flex-col gap-10 py-16 lg:py-24">
        <SectionIntro heading={effects.heading} id="effects-heading">
          {effects.intro}
        </SectionIntro>

        <EffectGridIsland
          fallback={
            <div className={EFFECT_GRID_CLASS}>
              {cards.map((card, index) => (
                <EffectStage card={card} key={card.id} lead={index === 0} />
              ))}
            </div>
          }
        />
      </div>
    </Section>
  )
}
