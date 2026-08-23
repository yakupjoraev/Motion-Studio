import { children, defineMarkup, el, literal } from '@motion-studio/schema'

import { heroCopyMarkup } from '../hero-copy.markup'
import { heroInnerStyles, heroSectionStyles } from '../hero.styles'

import { HERO_VIDEO_ELEMENT, HERO_VIDEO_FALLBACK, heroVideoScrimStyles } from './hero-video.styles'
import type { HeroVideoProps } from './hero-video.types'

/** Autoplay is an effect the component runs against the element; the element itself is markup. */
export const heroVideoMarkup = defineMarkup<HeroVideoProps>(
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
      src,
      poster,
      captions,
      decorative,
      scrim,
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
          children: [heroCopyMarkup({ actions, align, eyebrow, eyebrowStyle, headline, subtitle })],
        }),
        el('div', {
          classNames: ['pointer-events-none absolute inset-0 z-0'],
          ...(decorative ? { attributes: { 'aria-hidden': literal('true') } } : {}),
          children: children(
            src === ''
              ? el('div', { classNames: [HERO_VIDEO_FALLBACK] })
              : el('video', {
                  classNames: [HERO_VIDEO_ELEMENT],
                  attributes: {
                    loop: literal(true),
                    muted: literal(true),
                    playsInline: literal(true),
                    ...(poster === '' ? {} : { poster: literal(poster) }),
                    preload: literal('metadata'),
                    src: literal(src),
                  },
                  children: children(
                    captions !== '' &&
                      el('track', {
                        attributes: {
                          default: literal(true),
                          kind: literal('captions'),
                          label: literal('Captions'),
                          src: literal(captions),
                          srcLang: literal('en'),
                        },
                      }),
                  ),
                }),
            src !== '' && el('div', { classNames: [heroVideoScrimStyles({ scrim })] }),
          ),
        }),
      ],
    }),
)
