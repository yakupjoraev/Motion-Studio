import { defineMarkup, el } from '@motion-studio/schema'

import { heroCopyMarkup } from '../hero-copy.markup'
import { heroInnerStyles, heroSectionStyles } from '../hero.styles'

import { auroraBackdropMarkup } from './aurora-backdrop.markup'
import type { HeroAuroraProps } from './hero-aurora.types'

export const heroAuroraMarkup = defineMarkup<HeroAuroraProps>(
  ({
    props: {
      eyebrow,
      eyebrowStyle,
      headline,
      subtitle,
      actions,
      trust,
      align,
      maxWidth,
      padding,
      minHeight,
      hidden,
      palette,
      intensity,
      drift,
      noise,
    },
  }) =>
    el('section', {
      classNames: [
        heroSectionStyles({ padding, minHeight, align, hidden }),
        'justify-center overflow-hidden bg-surface-0',
      ],
      children: [
        el('div', {
          classNames: [heroInnerStyles({ maxWidth, align })],
          children: [
            heroCopyMarkup({ actions, align, eyebrow, eyebrowStyle, headline, subtitle, trust }),
          ],
        }),
        auroraBackdropMarkup({ drift, intensity, noise, palette }),
      ],
    }),
)
