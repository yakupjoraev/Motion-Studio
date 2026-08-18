'use client'

import { type RefObject, useCallback, useEffect, useRef, useState } from 'react'

import { prefersReducedMotion } from '../../reduced-motion'

import { lastIndex, nextIndex } from './carousel.schema'

export interface CarouselOptions {
  readonly count: number
  readonly perView: number
  readonly autoplay: boolean
  readonly autoplayInterval: number
}

export interface Carousel {
  readonly trackRef: RefObject<HTMLDivElement | null>
  /** The leftmost slide in view, read back from the scroll position rather than held as the truth. */
  readonly index: number
  /** Whether the slideshow is advancing right now — false while paused, hovered, focused, or still. */
  readonly running: boolean
  /**
   * Whether it *can* advance: autoplay asked for, and motion allowed. The pause control is rendered from this
   * rather than from the prop, because a page that cannot move needs no control to stop it — and a button
   * labelled "Pause" beside a strip that was never going to move is a control that lies.
   */
  readonly available: boolean
  readonly paused: boolean
  goTo(index: number): void
  next(): void
  previous(): void
  togglePaused(): void
  /** Hover and focus-within pause the slideshow, which WCAG 2.2.2 asks of anything that moves. */
  interacting(active: boolean): void
}

/**
 * The carousel's behaviour, over a **native scroller**.
 *
 * The track is a `scroll-snap` strip, so the browser owns the gesture: touch, trackpad, a mouse wheel and
 * `Tab` into a slide all work without a line of ours. What is left is the part a scroller cannot do for
 * itself — telling the arrows and the dots where it is, and advancing on a timer.
 *
 * The index is therefore **derived from `scrollLeft`**, never stored as the truth: a swipe moves the strip
 * without asking anything, and a component that held its own index would disagree with the page the moment a
 * reader touched it.
 */
export function useCarousel({
  count,
  perView,
  autoplay,
  autoplayInterval,
}: CarouselOptions): Carousel {
  const trackRef = useRef<HTMLDivElement>(null)
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const [interactive, setInteractive] = useState(false)
  const [still, setStill] = useState(false)

  /** One slide's worth of scroll, from the track's own metrics — there is no other honest source. */
  const step = useCallback((track: HTMLDivElement): number => {
    const slides = track.children.length

    return slides === 0 ? 0 : track.scrollWidth / slides
  }, [])

  const goTo = useCallback(
    (target: number) => {
      const track = trackRef.current

      if (track === null) {
        return
      }

      const bounded = Math.min(Math.max(target, 0), lastIndex(count, perView))
      const left = step(track) * bounded

      track.scrollTo({
        left,
        behavior: prefersReducedMotion(track) ? 'auto' : 'smooth',
      })
      setIndex(bounded)
    },
    [count, perView, step],
  )

  const next = useCallback(() => {
    goTo(index + 1)
  }, [goTo, index])

  const previous = useCallback(() => {
    goTo(index - 1)
  }, [goTo, index])

  /*
   * The scroll listener is what keeps a gesture and the controls in agreement. `scroll` is passive and the
   * read is one property, so this is not the layout thrash PERFORMANCE.md § The rules is about — and it is
   * throttled to a frame besides, because a flick fires dozens of events.
   */
  useEffect(() => {
    const track = trackRef.current

    if (track === null) {
      return
    }

    let frame: number | null = null

    const measure = (): void => {
      frame = null

      const width = step(track)

      setIndex(width === 0 ? 0 : Math.round(track.scrollLeft / width))
    }

    const onScroll = (): void => {
      if (frame === null) {
        frame = requestAnimationFrame(measure)
      }
    }

    track.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      track.removeEventListener('scroll', onScroll)
      if (frame !== null) {
        cancelAnimationFrame(frame)
      }
    }
  }, [step])

  /** Read once, from the element: `--ms-reduced-motion` answers the media query and the studio's override. */
  useEffect(() => {
    const track = trackRef.current

    if (track !== null) {
      setStill(prefersReducedMotion(track))
    }
  }, [])

  const available = autoplay && !still
  const running = available && !paused && !interactive

  useEffect(() => {
    if (!running) {
      return
    }

    const timer = setInterval(() => {
      const track = trackRef.current

      if (track === null) {
        return
      }

      const width = step(track)
      const current = width === 0 ? 0 : Math.round(track.scrollLeft / width)
      const target = nextIndex(current, count, perView)

      track.scrollTo({ left: width * target, behavior: 'smooth' })
      setIndex(target)
    }, autoplayInterval)

    return () => {
      clearInterval(timer)
    }
  }, [autoplayInterval, count, perView, running, step])

  const togglePaused = useCallback(() => {
    setPaused((current) => !current)
  }, [])

  const interacting = useCallback((active: boolean) => {
    setInteractive(active)
  }, [])

  return {
    trackRef,
    index,
    running,
    available,
    paused,
    goTo,
    next,
    previous,
    togglePaused,
    interacting,
  }
}
