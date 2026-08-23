import { defineMarkup, el } from '@motion-studio/schema'

import { marketingSectionMarkup } from '../marketing-section.markup'
import { marqueeRowMarkup, marqueeStylesMarkup } from '../marquee-row.markup'
import { MARQUEE_ROWS, marqueeRowStyles } from '../marquee.styles'
import { testimonialCardMarkup } from '../testimonial-card/testimonial-card.markup'

import { dealRows, rowDirection, rowDuration } from './testimonial-marquee.schema'
import { MARQUEE_CARD } from './testimonial-marquee.styles'
import type { TestimonialMarqueeProps } from './testimonial-marquee.types'

export const testimonialMarqueeMarkup = defineMarkup<TestimonialMarqueeProps>(
  ({
    props: {
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
    },
    id,
  }) =>
    marketingSectionMarkup({
      copy: { eyebrow, heading, description, headingLevel, headingAlign },
      hidden,
      wide: true,
      children: [
        marqueeStylesMarkup(),
        el('div', {
          classNames: [MARQUEE_ROWS],
          children: dealRows(items, rows).map((row, index) =>
            el('div', {
              classNames: [marqueeRowStyles({ fadeEdges })],
              children: [
                marqueeRowMarkup({
                  direction: rowDirection(index),
                  duration: rowDuration(duration, index),
                  pauseOnHover,
                  children: row.map((entry) =>
                    el('div', {
                      classNames: [MARQUEE_CARD],
                      children: [
                        testimonialCardMarkup({
                          props: {
                            author: entry.author,
                            avatar: entry.avatar,
                            company: entry.company,
                            eyebrow: '',
                            hidden: false,
                            logo: '',
                            logoAlt: '',
                            quote: entry.quote,
                            role: entry.role,
                            treatment: 'card',
                          },
                          id,
                          slots: {},
                        }),
                      ],
                    }),
                  ),
                }),
              ],
            }),
          ),
        }),
      ],
    }),
)
