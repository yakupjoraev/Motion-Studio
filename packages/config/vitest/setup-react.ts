import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { toHaveNoViolations } from 'jest-axe'
import { afterEach, expect, vi } from 'vitest'

expect.extend(toHaveNoViolations)

afterEach(() => {
  cleanup()
})

/**
 * jsdom implements none of `matchMedia`, `ResizeObserver`, or `IntersectionObserver`, and every
 * component that reads a media query, measures itself, or reveals on scroll calls one of them
 * during its first render. Stubbing them once here keeps a missing global from surfacing as an
 * unrelated `TypeError` in a test that is about something else.
 *
 * `matches: false` is the deliberate default for every query, including
 * `prefers-reduced-motion`: the full-motion design is what a component renders unless a test
 * overrides the stub, so the reduced-motion path is always tested explicitly rather than by
 * accident. ANIMATION_SYSTEM.md § Reduced motion treats the two as parallel designs.
 */
const createMediaQueryList = (query: string): MediaQueryList => ({
  matches: false,
  media: query,
  onchange: null,
  addEventListener: () => undefined,
  removeEventListener: () => undefined,
  addListener: () => undefined,
  removeListener: () => undefined,
  dispatchEvent: () => false,
})

class ResizeObserverStub implements ResizeObserver {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

class IntersectionObserverStub implements IntersectionObserver {
  readonly root: Element | Document | null = null
  readonly rootMargin: string = '0px'
  readonly thresholds: readonly number[] = []
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
  takeRecords(): IntersectionObserverEntry[] {
    return []
  }
}

vi.stubGlobal('matchMedia', createMediaQueryList)
vi.stubGlobal('ResizeObserver', ResizeObserverStub)
vi.stubGlobal('IntersectionObserver', IntersectionObserverStub)
