import { defineMarkup, el, slot } from '@motion-studio/schema'

import { heroCopyMarkup } from '../hero-copy.markup'
import { heroInnerStyles, heroSectionStyles } from '../hero.styles'

import {
  heroSplitFrameStyles,
  heroSplitGridStyles,
  heroSplitMediaStyles,
  heroSplitSurfaceStyles,
  heroSplitTextStyles,
} from './hero-split.styles'
import type { HeroSplitProps } from './hero-split.types'

export const heroSplitMarkup = defineMarkup<HeroSplitProps>(
  ({
    props: {
      eyebrow,
      eyebrowStyle,
      headline,
      subtitle,
      actions,
      align,
      maxWidth,
      padding,
      minHeight,
      hidden,
      background,
      reverse,
      ratio,
      mediaAspect,
      mediaFrame,
    },
  }) =>
    el('section', {
      classNames: [
        heroSectionStyles({ padding, minHeight, align: 'start', hidden }),
        heroSplitSurfaceStyles({ background }),
        'justify-center',
      ],
      children: [
        el('div', {
          classNames: [heroInnerStyles({ maxWidth, align: 'start' })],
          children: [
            el('div', {
              classNames: [heroSplitGridStyles({ ratio })],
              children: [
                el('div', {
                  classNames: [heroSplitTextStyles({ reverse })],
                  children: [
                    heroCopyMarkup({
                      actions,
                      align,
                      eyebrow,
                      eyebrowStyle,
                      headline,
                      subtitle,
                      headlineSize: 'display-2',
                      subtitleSize: 'md',
                    }),
                  ],
                }),
                el('div', {
                  classNames: [heroSplitMediaStyles({ reverse })],
                  children: [
                    el('div', {
                      classNames: [heroSplitFrameStyles({ mediaFrame, mediaAspect })],
                      children: [slot('media')],
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    }),
)
