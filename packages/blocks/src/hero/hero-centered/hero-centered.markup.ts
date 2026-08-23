import { children, defineMarkup, el, literal } from '@motion-studio/schema'

import { heroCopyMarkup } from '../hero-copy.markup'
import { heroInnerStyles, heroSectionStyles } from '../hero.styles'

import { HERO_CENTERED_GLOW, heroCenteredSurfaceStyles } from './hero-centered.styles'
import type { HeroCenteredProps } from './hero-centered.types'

export const heroCenteredMarkup = defineMarkup<HeroCenteredProps>(
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
      background,
      glow,
    },
  }) =>
    el('section', {
      classNames: [
        heroSectionStyles({ padding, minHeight, align, hidden }),
        heroCenteredSurfaceStyles({ background }),
        'justify-center',
      ],
      children: children(
        el('div', {
          classNames: [heroInnerStyles({ maxWidth, align })],
          children: [
            heroCopyMarkup({
              actions,
              align,
              eyebrow,
              eyebrowStyle,
              headline,
              subtitle,
              trust,
            }),
          ],
        }),
        glow &&
          el('div', {
            classNames: [HERO_CENTERED_GLOW],
            attributes: { 'aria-hidden': literal('true') },
          }),
      ),
    }),
)
