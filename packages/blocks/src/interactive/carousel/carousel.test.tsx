import { act, screen, waitFor } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { expectNoViolations, renderBlock } from '../../test/render-block'
import { requireAt } from '../../test/require-at'

import { Carousel } from './carousel'
import { carouselDefinition as definition } from './carousel.definition'
import { lastIndex, nextIndex, slidePosition } from './carousel.schema'

/**
 * jsdom lays nothing out and scrolls nothing, so the scroller is the seam — the same shape the dock test uses
 * for its geometry. One slide is 200 px wide, `scrollWidth` is that times the number of slides, and `scrollTo`
 * moves `scrollLeft` and fires `scroll`, which is what a browser does.
 */
const SLIDE_STEP = 200

const scrollLefts = new WeakMap<Element, number>()

const originalScrollWidth = Object.getOwnPropertyDescriptor(Element.prototype, 'scrollWidth')
const originalScrollLeft = Object.getOwnPropertyDescriptor(Element.prototype, 'scrollLeft')
const originalScrollTo = Element.prototype.scrollTo

const layOutScroller = (): void => {
  Object.defineProperty(Element.prototype, 'scrollWidth', {
    configurable: true,
    get(this: Element) {
      return this.children.length * SLIDE_STEP
    },
  })

  Object.defineProperty(Element.prototype, 'scrollLeft', {
    configurable: true,
    get(this: Element) {
      return scrollLefts.get(this) ?? 0
    },
    set(this: Element, value: number) {
      scrollLefts.set(this, value)
    },
  })

  Element.prototype.scrollTo = function scrollTo(this: Element, ...args: unknown[]) {
    const options = args[0]
    const left =
      typeof options === 'object' && options !== null && 'left' in options
        ? Number((options as { left: number }).left)
        : 0

    scrollLefts.set(this, left)
    this.dispatchEvent(new Event('scroll'))
  } as Element['scrollTo']
}

beforeEach(() => {
  layOutScroller()
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.useRealTimers()
  Element.prototype.scrollTo = originalScrollTo
  if (originalScrollWidth !== undefined) {
    Object.defineProperty(Element.prototype, 'scrollWidth', originalScrollWidth)
  }
  if (originalScrollLeft !== undefined) {
    Object.defineProperty(Element.prototype, 'scrollLeft', originalScrollLeft)
  }
})

/** Reduced motion, the way every block reads it: the resolved value of `--ms-reduced-motion`. */
const emulateReducedMotion = () =>
  vi.spyOn(CSSStyleDeclaration.prototype, 'getPropertyValue').mockReturnValue('0')

const track = (): HTMLElement => screen.getByTestId('carousel-track')

const count = definition.defaults.slides.length

describe('the index arithmetic', () => {
  it('stops where the track has nothing left to reveal', () => {
    expect(lastIndex(4, 1)).toBe(3)
    expect(lastIndex(4, 2)).toBe(2)
    expect(lastIndex(2, 4)).toBe(0)
  })

  it('wraps, because a slideshow that stopped at the end would run once', () => {
    expect(nextIndex(0, 4, 2)).toBe(1)
    expect(nextIndex(2, 4, 2)).toBe(0)
  })

  it('labels a slide by its position, which is all it has to say where it is', () => {
    expect(slidePosition(2, 7)).toBe('3 of 7')
  })
})

describe('Carousel', () => {
  it('is a labelled carousel region of labelled slides', () => {
    renderBlock(definition, Carousel)

    const region = screen.getByRole('region', { name: definition.defaults.ariaLabel })

    expect(region).toHaveAttribute('aria-roledescription', 'carousel')

    const slides = screen.getAllByRole('group')

    expect(slides).toHaveLength(count)
    expect(requireAt(slides, 2)).toHaveAttribute('aria-label', `3 of ${count}`)
    expect(requireAt(slides, 2)).toHaveAttribute('aria-roledescription', 'slide')
  })

  it('scrolls with CSS rather than with a library', () => {
    renderBlock(definition, Carousel)

    expect(track().className).toContain('snap-x')
    expect(track().className).toContain('snap-mandatory')
    expect(track().className).toContain('overflow-x-auto')
  })

  it('makes every slide a focus stop, so the strip is scrollable by keyboard', () => {
    renderBlock(definition, Carousel)

    for (const slide of screen.getAllByRole('group')) {
      expect(slide).toHaveAttribute('tabindex', '0')
    }
  })

  describe('the arrows', () => {
    it('move one slide at a time', async () => {
      renderBlock(definition, Carousel)

      await userEvent.click(screen.getByRole('button', { name: 'Next slide' }))

      expect(track().scrollLeft).toBe(SLIDE_STEP)

      await userEvent.click(screen.getByRole('button', { name: 'Previous slide' }))

      expect(track().scrollLeft).toBe(0)
    })

    it('disable at the ends rather than doing nothing', async () => {
      renderBlock(definition, Carousel)

      expect(screen.getByRole('button', { name: 'Previous slide' })).toBeDisabled()

      const last = lastIndex(count, definition.defaults.perView)

      for (let step = 0; step < last; step += 1) {
        await userEvent.click(screen.getByRole('button', { name: 'Next slide' }))
      }

      expect(screen.getByRole('button', { name: 'Next slide' })).toBeDisabled()
    })
  })

  describe('the dots', () => {
    it('jump straight to a slide and name where they go', async () => {
      renderBlock(definition, Carousel)

      const dots = screen.getAllByTestId('carousel-dot')

      expect(requireAt(dots, 1)).toHaveAccessibleName('Go to slide 2')

      await userEvent.click(requireAt(dots, 2))

      expect(track().scrollLeft).toBe(SLIDE_STEP * 2)
    })

    it('mark the current slide with a longer bar as well as aria-current', async () => {
      renderBlock(definition, Carousel)

      const dots = screen.getAllByTestId('carousel-dot')

      expect(requireAt(dots, 0)).toHaveAttribute('aria-current', 'true')
      expect(requireAt(dots, 0).querySelector('span')?.className).toContain('w-5')

      await userEvent.click(requireAt(dots, 1))

      expect(requireAt(screen.getAllByTestId('carousel-dot'), 1)).toHaveAttribute(
        'aria-current',
        'true',
      )
    })

    it('follow a scroll the reader performed themselves', async () => {
      renderBlock(definition, Carousel)

      act(() => {
        track().scrollLeft = SLIDE_STEP * 2
        track().dispatchEvent(new Event('scroll'))
      })

      await waitFor(() => {
        expect(requireAt(screen.getAllByTestId('carousel-dot'), 2)).toHaveAttribute(
          'aria-current',
          'true',
        )
      })
    })
  })

  describe('autoplay', () => {
    it('is off by default, and shows no pause control', () => {
      vi.useFakeTimers()
      renderBlock(definition, Carousel)

      act(() => {
        vi.advanceTimersByTime(20_000)
      })

      expect(screen.queryByTestId('carousel-pause')).toBeNull()
      expect(track().scrollLeft).toBe(0)
    })

    it('advances on its own when it is asked for', () => {
      vi.useFakeTimers()
      renderBlock(definition, Carousel, { autoplay: true, autoplayInterval: 3000 })

      act(() => {
        vi.advanceTimersByTime(3000)
      })

      expect(track().scrollLeft).toBe(SLIDE_STEP)
    })

    it('offers a pause control whenever it is on, because moving content has to be stoppable', async () => {
      renderBlock(definition, Carousel, { autoplay: true })

      const pause = screen.getByRole('button', { name: 'Pause slideshow' })

      await userEvent.click(pause)

      expect(screen.getByRole('button', { name: 'Play slideshow' })).toBeInTheDocument()
    })

    it('stops once it is paused', async () => {
      renderBlock(definition, Carousel, { autoplay: true, autoplayInterval: 3000 })

      await userEvent.click(screen.getByRole('button', { name: 'Pause slideshow' }))

      vi.useFakeTimers()
      act(() => {
        vi.advanceTimersByTime(9000)
      })

      expect(track().scrollLeft).toBe(0)
    })

    it('pauses while the pointer is over it', async () => {
      renderBlock(definition, Carousel, { autoplay: true, autoplayInterval: 3000 })

      await userEvent.hover(screen.getByTestId('carousel'))

      vi.useFakeTimers()
      act(() => {
        vi.advanceTimersByTime(9000)
      })

      expect(track().scrollLeft).toBe(0)
    })

    it('pauses while focus is inside it', async () => {
      renderBlock(definition, Carousel, { autoplay: true, autoplayInterval: 3000 })

      await userEvent.tab()

      vi.useFakeTimers()
      act(() => {
        vi.advanceTimersByTime(9000)
      })

      expect(track().scrollLeft).toBe(0)
    })

    /* The strip cannot move, so there is nothing to stop — and a Pause button beside it would be a lie. */
    it('never starts under reduced motion, and shows no control to stop it', () => {
      emulateReducedMotion()
      vi.useFakeTimers()
      renderBlock(definition, Carousel, { autoplay: true, autoplayInterval: 3000 })

      act(() => {
        vi.advanceTimersByTime(12_000)
      })

      expect(track().scrollLeft).toBe(0)
      expect(screen.queryByTestId('carousel-pause')).toBeNull()
    })
  })

  it('shows nothing but the strip when every control is off', () => {
    renderBlock(definition, Carousel, { arrows: false, dots: false })

    expect(screen.queryByTestId('carousel-controls')).toBeNull()
    expect(screen.getAllByRole('group')).toHaveLength(count)
  })

  it.each([
    [1, 'basis-full'],
    [2, '@min-[640px]/frame:basis-1/2'],
    [3, '@min-[1024px]/frame:basis-1/3'],
    [4, '@min-[1024px]/frame:basis-1/4'],
  ] as const)('gives %s per view the literal basis class %s', (perView, basis) => {
    renderBlock(definition, Carousel, { perView })

    expect(requireAt(screen.getAllByRole('group'), 0).className).toContain(basis)
  })

  it('lets a child win over a slide’s own text, per index', () => {
    renderBlock(definition, Carousel, {
      children: <span data-testid="dropped">dropped block</span>,
    })

    expect(screen.getByTestId('dropped')).toBeInTheDocument()
  })

  it('hides itself with the responsive visibility class', () => {
    renderBlock(definition, Carousel, { hidden: true })

    expect(screen.getByTestId('carousel').className).toContain('hidden')
  })

  it('has no axe violations, with and without autoplay', async () => {
    const still = renderBlock(definition, Carousel)

    await expectNoViolations(still.container)

    const playing = renderBlock(definition, Carousel, { autoplay: true })

    await expectNoViolations(playing.container)
  })
})
