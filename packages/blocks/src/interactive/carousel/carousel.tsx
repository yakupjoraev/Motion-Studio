'use client'

import { HEADING_TAGS } from '../../marketing/marketing.schema'
import { ControlIcon } from '../control-icon'
import { PanelContent, panelChildren } from '../panel-content'

import { CarouselControls } from './carousel-controls'
import { slidePosition } from './carousel.schema'
import {
  CAROUSEL_SLIDE,
  CAROUSEL_TRACK,
  SLIDE_BASIS,
  SLIDE_TITLE,
  carouselRootStyles,
} from './carousel.styles'
import type { CarouselProps } from './carousel.types'
import { useCarousel } from './use-carousel'

/**
 * A carousel on CSS `scroll-snap`, not on a carousel library.
 *
 * That is the decision the whole block is built around: a native scroller works with touch, a trackpad, a
 * wheel and a keyboard for free, keeps every slide in the accessibility tree instead of hiding the ones off
 * screen, and exports as about twenty lines of CSS. A JavaScript carousel would have to reimplement all four
 * and would export as a dependency.
 *
 * What is left for JavaScript is what a scroller cannot do: report where it is so the arrows and dots agree
 * with it, and advance on a timer. `useCarousel` holds both, and the index is **derived from the scroll
 * position** so a swipe can never disagree with the controls.
 *
 * Autoplay is off by default, never runs under reduced motion, pauses on hover and on focus within, and shows
 * a pause control whenever it is on — the last one from the same condition that starts the timer, because
 * WCAG 2.2.2 makes it a requirement rather than an option.
 */
export function Carousel({
  slides,
  perView,
  arrows,
  dots,
  autoplay,
  autoplayInterval,
  headingLevel,
  ariaLabel,
  hidden,
  children,
}: CarouselProps) {
  const Heading = HEADING_TAGS[headingLevel]
  const carousel = useCarousel({ count: slides.length, perView, autoplay, autoplayInterval })
  const panels = panelChildren(children)
  const basis = SLIDE_BASIS[perView as 1 | 2 | 3 | 4]

  return (
    <section
      aria-label={ariaLabel}
      aria-roledescription="carousel"
      className={carouselRootStyles({ hidden })}
      data-testid="carousel"
      onBlur={() => carousel.interacting(false)}
      onFocus={() => carousel.interacting(true)}
      onPointerEnter={() => carousel.interacting(true)}
      onPointerLeave={() => carousel.interacting(false)}
    >
      <div className={CAROUSEL_TRACK} data-testid="carousel-track" ref={carousel.trackRef}>
        {slides.map((slide, index) => (
          <div
            aria-label={slidePosition(index, slides.length)}
            aria-roledescription="slide"
            className={`${CAROUSEL_SLIDE} ${basis}`}
            data-testid="carousel-slide"
            key={`${slide.label}-${index}`}
            // biome-ignore lint/a11y/useSemanticElements: the suggested element is <fieldset>, which is form markup — a slide is the APG's own role="group"
            role="group"
            // biome-ignore lint/a11y/noNoninteractiveTabindex: a slide in a scroll container has to be focusable, or the off-screen part of the strip is unreachable by keyboard
            tabIndex={0}
          >
            <ControlIcon className="text-accent" name={slide.icon} size={20} />
            <Heading className={SLIDE_TITLE}>{slide.label}</Heading>
            <PanelContent body={slide.body} child={panels[index]} />
          </div>
        ))}
      </div>

      <CarouselControls
        arrows={arrows}
        autoplay={carousel.available}
        count={slides.length}
        dots={dots}
        index={carousel.index}
        onGoTo={carousel.goTo}
        onNext={carousel.next}
        onPrevious={carousel.previous}
        onTogglePaused={carousel.togglePaused}
        paused={carousel.paused}
        perView={perView}
      />
    </section>
  )
}
