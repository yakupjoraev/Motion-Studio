import { children, defineMarkup, el, literal } from '@motion-studio/schema'

import { heroCopyMarkup } from '../hero-copy.markup'
import { heroInnerStyles, heroSectionStyles } from '../hero.styles'

import { HERO_PREVIEW_GLOW, heroAppPreviewSurfaceStyles } from './hero-app-preview.styles'
import type { HeroAppPreviewProps } from './hero-app-preview.types'
import { previewPlateMarkup } from './preview-plate.markup'

export const heroAppPreviewMarkup = defineMarkup<HeroAppPreviewProps>(
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
      image,
      imageWidth,
      imageHeight,
      tiltX,
      tiltY,
      perspective,
      glow,
    },
  }) =>
    el('section', {
      classNames: [
        heroSectionStyles({ padding, minHeight, align: 'start', hidden }),
        heroAppPreviewSurfaceStyles({ background }),
        'justify-center',
      ],
      children: [
        el('div', {
          classNames: [heroInnerStyles({ maxWidth, align: 'start' })],
          children: [
            el('div', {
              classNames: ['grid w-full items-center gap-12 lg:grid-cols-2 lg:gap-16'],
              children: [
                el('div', {
                  classNames: ['min-w-0'],
                  children: [
                    heroCopyMarkup({
                      actions,
                      align,
                      eyebrow,
                      eyebrowStyle,
                      headline,
                      headlineSize: 'display-2',
                      subtitle,
                      subtitleSize: 'md',
                    }),
                  ],
                }),
                el('div', {
                  classNames: ['relative min-w-0'],
                  children: children(
                    previewPlateMarkup({
                      height: imageHeight,
                      image,
                      perspective,
                      tiltX,
                      tiltY,
                      width: imageWidth,
                    }),
                    glow &&
                      el('div', {
                        classNames: [HERO_PREVIEW_GLOW],
                        attributes: { 'aria-hidden': literal('true') },
                      }),
                  ),
                }),
              ],
            }),
          ],
        }),
      ],
    }),
)
