import { type MarkupElement, children, defineMarkup, el, literal, txt } from '@motion-studio/schema'
import { cn } from '@motion-studio/utils'

import { HEADING_TAGS } from '../../marketing/marketing.schema'
import { iconMarkup } from '../../markup/icon'
import { ICON_CONTROL } from '../interactive.styles'
import { panelContentMarkup } from '../panel-content.markup'

import { goToSlideLabel, lastIndex, slidePosition } from './carousel.schema'
import {
  CAROUSEL_ARROWS,
  CAROUSEL_CONTROLS,
  CAROUSEL_DOT,
  CAROUSEL_DOTS,
  CAROUSEL_SLIDE,
  CAROUSEL_TRACK,
  SLIDE_BASIS,
  SLIDE_TITLE,
  carouselDotMarkStyles,
  carouselRootStyles,
} from './carousel.styles'
import type { CarouselProps } from './carousel.types'

/**
 * The strip is markup; the arrows and the dots are the controls that drive it, and they are drawn in
 * the state a page opens in — first slide, not paused. What moves them is behaviour (ADR-243).
 */
const controlsMarkup = (
  count: number,
  perView: number,
  arrows: boolean,
  dots: boolean,
  autoplay: boolean,
): MarkupElement | null => {
  if (!arrows && !dots && !autoplay) {
    return null
  }

  const last = lastIndex(count, perView)

  return el('div', {
    classNames: [CAROUSEL_CONTROLS],
    children: children(
      dots
        ? el('ul', {
            classNames: [CAROUSEL_DOTS],
            children: Array.from({ length: last + 1 }, (_unused, dot) =>
              el('li', {
                children: [
                  el('button', {
                    classNames: [CAROUSEL_DOT],
                    attributes: {
                      ...(dot === 0 ? { 'aria-current': literal('true') } : {}),
                      'aria-label': literal(goToSlideLabel(dot)),
                      type: literal('button'),
                    },
                    children: [
                      el('span', {
                        classNames: [carouselDotMarkStyles({ current: dot === 0 })],
                        attributes: { 'aria-hidden': literal('true') },
                      }),
                    ],
                  }),
                ],
              }),
            ),
          })
        : el('span'),
      el('div', {
        classNames: [CAROUSEL_ARROWS],
        children: children(
          autoplay &&
            el('button', {
              classNames: [ICON_CONTROL],
              attributes: {
                'aria-label': literal('Pause slideshow'),
                type: literal('button'),
              },
              children: children(iconMarkup({ name: 'pause', size: 18 })),
            }),
          arrows &&
            el('button', {
              classNames: [ICON_CONTROL],
              attributes: {
                'aria-label': literal('Previous slide'),
                disabled: literal(true),
                type: literal('button'),
              },
              children: children(iconMarkup({ name: 'chevron-left', size: 18 })),
            }),
          arrows &&
            el('button', {
              classNames: [ICON_CONTROL],
              attributes: {
                'aria-label': literal('Next slide'),
                ...(last <= 0 ? { disabled: literal(true) } : {}),
                type: literal('button'),
              },
              children: children(iconMarkup({ name: 'chevron-right', size: 18 })),
            }),
        ),
      }),
    ),
  })
}

export const carouselMarkup = defineMarkup<CarouselProps>(
  ({ props: { slides, perView, arrows, dots, autoplay, headingLevel, ariaLabel, hidden } }) => {
    const basis = SLIDE_BASIS[perView as 1 | 2 | 3 | 4]

    return el('section', {
      classNames: [carouselRootStyles({ hidden })],
      attributes: {
        'aria-label': literal(ariaLabel),
        'aria-roledescription': literal('carousel'),
      },
      children: children(
        el('div', {
          classNames: [CAROUSEL_TRACK],
          children: slides.map((slide, index) =>
            el('div', {
              classNames: [cn(CAROUSEL_SLIDE, basis)],
              attributes: {
                'aria-label': literal(slidePosition(index, slides.length)),
                'aria-roledescription': literal('slide'),
                role: literal('group'),
                tabIndex: literal(0),
              },
              children: children(
                iconMarkup({ name: slide.icon, size: 20, className: 'text-accent' }),
                el(HEADING_TAGS[headingLevel], {
                  classNames: [SLIDE_TITLE],
                  children: [txt(slide.label)],
                }),
                ...panelContentMarkup(slide.body, index),
              ),
            }),
          ),
        }),
        controlsMarkup(slides.length, perView, arrows, dots, autoplay),
      ),
    })
  },
)
