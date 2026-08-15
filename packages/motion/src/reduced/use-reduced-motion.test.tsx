import { act, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

interface Stub {
  readonly matchMedia: ReturnType<typeof vi.fn>
  matches: boolean
  change(next: boolean): void
}

/**
 * A `matchMedia` that counts its calls and can fire a change, because the property under test is *how
 * many* queries the application opens — one, however many components ask.
 */
function stubMatchMedia(initial: boolean): Stub {
  const listeners = new Set<(event: MediaQueryListEvent) => void>()
  const state = { matches: initial }

  const matchMedia = vi.fn((query: string) => ({
    media: query,
    get matches() {
      return state.matches
    },
    addEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => {
      listeners.add(listener)
    },
    removeEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => {
      listeners.delete(listener)
    },
    addListener: () => undefined,
    removeListener: () => undefined,
    onchange: null,
    dispatchEvent: () => false,
  }))

  vi.stubGlobal('matchMedia', matchMedia)

  return {
    matchMedia,
    get matches() {
      return state.matches
    },
    set matches(next: boolean) {
      state.matches = next
    },
    change(next: boolean) {
      state.matches = next

      for (const listener of listeners) {
        listener({ matches: next } as MediaQueryListEvent)
      }
    },
  }
}

/** The module holds process-wide state on purpose, so each test loads its own copy of it. */
const load = async () => {
  vi.resetModules()

  return import('./use-reduced-motion')
}

beforeEach(() => {
  vi.unstubAllGlobals()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('useReducedMotion', () => {
  it('opens exactly one media query for ten consumers', async () => {
    const stub = stubMatchMedia(false)
    const { useReducedMotion } = await load()

    const Consumer = () => <span>{String(useReducedMotion())}</span>

    const ids = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j']

    render(
      <div>
        {ids.map((id) => (
          <Consumer key={id} />
        ))}
      </div>,
    )

    expect(screen.getAllByText('false')).toHaveLength(10)
    expect(stub.matchMedia).toHaveBeenCalledTimes(1)
    expect(stub.matchMedia).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)')
  })

  it('reports the query’s answer and follows it when it changes', async () => {
    const stub = stubMatchMedia(true)
    const { useReducedMotion } = await load()

    const Consumer = () => <span data-testid="value">{String(useReducedMotion())}</span>

    render(<Consumer />)

    expect(screen.getByTestId('value').textContent).toBe('true')

    act(() => stub.change(false))

    expect(screen.getByTestId('value').textContent).toBe('false')
    expect(stub.matchMedia).toHaveBeenCalledTimes(1)
  })

  it('answers outside React as well, for the scheduler and the codegen path', async () => {
    stubMatchMedia(true)

    const { getReducedMotion } = await load()

    expect(getReducedMotion()).toBe(true)
  })

  it('unsubscribes without closing the query, which is shared', async () => {
    const stub = stubMatchMedia(false)
    const { subscribeReducedMotion } = await load()

    const first = subscribeReducedMotion(() => undefined)
    const second = subscribeReducedMotion(() => undefined)

    first()
    second()

    subscribeReducedMotion(() => undefined)

    expect(stub.matchMedia).toHaveBeenCalledTimes(1)
  })

  it('says "not reduced" where there is no media query at all', async () => {
    vi.stubGlobal('matchMedia', undefined)

    const { getReducedMotion } = await load()

    expect(getReducedMotion()).toBe(false)
  })
})
