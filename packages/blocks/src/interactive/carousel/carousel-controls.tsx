import { ChevronLeftIcon, ChevronRightIcon, PauseIcon, PlayIcon } from '@motion-studio/icons'

import { ICON_CONTROL } from '../interactive.styles'

import { goToSlideLabel, lastIndex } from './carousel.schema'
import {
  CAROUSEL_ARROWS,
  CAROUSEL_CONTROLS,
  CAROUSEL_DOT,
  CAROUSEL_DOTS,
  carouselDotMarkStyles,
} from './carousel.styles'

export interface CarouselControlsProps {
  readonly count: number
  readonly perView: number
  readonly index: number
  readonly arrows: boolean
  readonly dots: boolean
  readonly autoplay: boolean
  readonly paused: boolean
  onPrevious(): void
  onNext(): void
  onGoTo(index: number): void
  onTogglePaused(): void
}

/**
 * The arrows, the dots and — whenever the slideshow can move on its own — the pause control.
 *
 * Every one of them is a real `<button>` with a name that says what it does: "Previous slide", "Go to slide
 * 3", "Pause slideshow". A glyph with no name is the commonest carousel defect, and a `div` with a click
 * handler is the second.
 *
 * The pause control is **not optional** when autoplay is on. WCAG 2.2.2 requires a mechanism to stop moving
 * content, so it is rendered from the same condition that starts the timer rather than from a prop somebody
 * could turn off.
 */
export function CarouselControls({
  count,
  perView,
  index,
  arrows,
  dots,
  autoplay,
  paused,
  onPrevious,
  onNext,
  onGoTo,
  onTogglePaused,
}: CarouselControlsProps) {
  const last = lastIndex(count, perView)

  if (!arrows && !dots && !autoplay) {
    return null
  }

  return (
    <div className={CAROUSEL_CONTROLS} data-testid="carousel-controls">
      {dots ? (
        <ul className={CAROUSEL_DOTS} data-testid="carousel-dots">
          {Array.from({ length: last + 1 }, (_unused, dot) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: a dot is its index — a scroll position has no other identity
            <li key={dot}>
              <button
                aria-current={dot === index ? 'true' : undefined}
                aria-label={goToSlideLabel(dot)}
                className={CAROUSEL_DOT}
                data-testid="carousel-dot"
                onClick={() => onGoTo(dot)}
                type="button"
              >
                <span
                  aria-hidden="true"
                  className={carouselDotMarkStyles({ current: dot === index })}
                />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <span />
      )}

      <div className={CAROUSEL_ARROWS}>
        {autoplay && (
          <button
            aria-label={paused ? 'Play slideshow' : 'Pause slideshow'}
            className={ICON_CONTROL}
            data-testid="carousel-pause"
            onClick={onTogglePaused}
            type="button"
          >
            {paused ? (
              <PlayIcon aria-hidden="true" size={18} />
            ) : (
              <PauseIcon aria-hidden="true" size={18} />
            )}
          </button>
        )}

        {arrows && (
          <>
            <button
              aria-label="Previous slide"
              className={ICON_CONTROL}
              data-testid="carousel-previous"
              disabled={index <= 0}
              onClick={onPrevious}
              type="button"
            >
              <ChevronLeftIcon aria-hidden="true" size={18} />
            </button>
            <button
              aria-label="Next slide"
              className={ICON_CONTROL}
              data-testid="carousel-next"
              disabled={index >= last}
              onClick={onNext}
              type="button"
            >
              <ChevronRightIcon aria-hidden="true" size={18} />
            </button>
          </>
        )}
      </div>
    </div>
  )
}
