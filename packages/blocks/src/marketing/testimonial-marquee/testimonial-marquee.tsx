import { MarketingSection } from '../marketing-section'
import { MarqueeRow } from '../marquee-row'
import { MarqueeStyles } from '../marquee-styles'
import { MARQUEE_ROWS, marqueeRowStyles } from '../marquee.styles'
import { TestimonialCard } from '../testimonial-card/testimonial-card'

import { dealRows, rowDirection, rowDuration } from './testimonial-marquee.schema'
import { MARQUEE_CARD } from './testimonial-marquee.styles'
import type { TestimonialMarqueeProps } from './testimonial-marquee.types'

/**
 * Rows of testimonials scrolling in alternating directions.
 *
 * The cards are `TestimonialCard`, the same block a user can place on its own — one implementation of a
 * testimonial, the way there is one implementation of the marquee. The animation is the `marquee` preset's
 * (ADR-186), so speed, seam and pause-on-hover behave identically here and on a node that carries the
 * preset as a motion channel.
 */
export function TestimonialMarquee({
  eyebrow,
  heading,
  description,
  headingLevel,
  headingAlign,
  rows,
  duration,
  pauseOnHover,
  fadeEdges,
  items,
  hidden,
}: TestimonialMarqueeProps) {
  const copy = { eyebrow, heading, description, headingLevel, headingAlign }
  const dealt = dealRows(items, rows)

  return (
    <MarketingSection copy={copy} hidden={hidden} testId="testimonial-marquee" wide>
      <MarqueeStyles />

      <div className={MARQUEE_ROWS}>
        {dealt.map((row, index) => (
          // A row is identified by which row it is: its direction and its speed both come from the index,
          // and the items in it are dealt by index too (`dealRows`).
          // biome-ignore lint/suspicious/noArrayIndexKey: the index is the row's identity.
          <div className={marqueeRowStyles({ fadeEdges })} key={`row-${index}`}>
            <MarqueeRow
              direction={rowDirection(index)}
              duration={rowDuration(duration, index)}
              pauseOnHover={pauseOnHover}
            >
              {row.map((entry, entryIndex) => (
                <div className={MARQUEE_CARD} key={`${entry.author}-${entryIndex}`}>
                  <TestimonialCard
                    author={entry.author}
                    avatar={entry.avatar}
                    company={entry.company}
                    eyebrow=""
                    hidden={false}
                    logo=""
                    logoAlt=""
                    quote={entry.quote}
                    role={entry.role}
                    treatment="card"
                  />
                </div>
              ))}
            </MarqueeRow>
          </div>
        ))}
      </div>
    </MarketingSection>
  )
}
