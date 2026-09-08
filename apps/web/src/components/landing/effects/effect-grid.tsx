import { getRequestDictionary } from '../../../lib/i18n/request-locale'
import { SectionIntro } from '../section-intro'
import { Section } from '../section-rail'

import { effectCards } from './effect-cards'
import { EffectGridIsland } from './effect-grid-island'
import { EffectShell } from './effect-shell'

/**
 * Thirteen effects ship; six are on the rail. Each panel is a real surface with the real effect
 * painted on it — a still picture of an effect, on a page about motion, is the wrong argument.
 *
 * **The section is a horizontal pin.** It stands still while the track travels sideways, which buys
 * every effect most of a viewport instead of the 128 px a three-column grid could give it. The
 * mechanism is a CSS view timeline and nothing else: no scroll listener, no animation library, and a
 * track you scroll by hand wherever the timeline is unsupported or reduced motion is asked for.
 *
 * The server renders every panel complete, with its name and its description. The island paints the
 * live effect over that after mount, so the section is finished before any of it arrives and finished
 * still if none of it does.
 */
export function EffectGrid() {
  const { effects } = getRequestDictionary().landing
  const cards = effectCards(effects)

  return (
    <Section
      bleed={
        <div className="ms-hpin" style={{ ['--ms-hpin-count' as string]: String(cards.length) }}>
          {/*
            Where the timeline is unsupported and under reduced motion this track is scrolled by
            hand, which makes it a scrollable region — and a scrollable region without a tab stop
            leaves everything past its right edge unreachable from the keyboard. Same rule, same
            reason as the export sample's `pre` (ADR-298); axe names it `scrollable-region-focusable`.
          */}
          <div
            aria-labelledby="effects-heading"
            className="relative ms-hpin-stage"
            // biome-ignore lint/a11y/useSemanticElements: a region that scrolls is a div with a role, not a landmark element
            role="region"
            // biome-ignore lint/a11y/noNoninteractiveTabindex: the tab stop is what makes the far end of the track reachable
            tabIndex={0}
          >
            {/* The coordinate stays with a reader the pin has held for two viewports, and the rule
                fills as the track travels. Both live only where the pin does. */}
            <div
              aria-hidden="true"
              className="ms-hpin-head absolute inset-x-0 top-0 items-center gap-4 px-[max(1.25rem,5vw)] pt-8"
            >
              <span className="font-mono text-[10px] text-foreground-muted uppercase tracking-[0.22em]">
                {effects.rail}
              </span>
              <span className="relative h-px flex-1 bg-border">
                <span className="ms-hpin-fill absolute inset-0 block bg-[var(--ms-l-accent)]" />
              </span>
            </div>

            <EffectGridIsland
              className="ms-hpin-track"
              fallback={cards.map((card, index) => (
                <EffectShell card={card} index={index} key={card.id} total={cards.length} />
              ))}
            />
          </div>
        </div>
      }
      id="effects"
      label={effects.rail}
    >
      <div className="flex flex-col gap-10 pt-16 pb-16 lg:pt-24">
        <SectionIntro heading={effects.heading} id="effects-heading">
          {effects.intro}
        </SectionIntro>
      </div>
    </Section>
  )
}
