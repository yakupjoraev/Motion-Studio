import { render, screen } from '@testing-library/react'
import { act } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  colorModeSubscriberCount,
  resetColorModeSubscription,
  useColorMode,
} from './use-color-mode'

/**
 * The claim in `THEME_ENGINE.md` § Colour mode is "a single `matchMedia` change handler". A hook per
 * component would mean one browser listener per component, so the count is asserted rather than assumed.
 */
type Handler = (event: MediaQueryListEvent) => void

let handlers: Handler[] = []
let queries = 0

function stubMatchMedia(initialDark: boolean): void {
  queries = 0
  handlers = []
  vi.stubGlobal('matchMedia', (media: string) => {
    queries += 1

    return {
      matches: initialDark,
      media,
      addEventListener: (_: string, handler: Handler) => handlers.push(handler),
      removeEventListener: (_: string, handler: Handler) => {
        handlers = handlers.filter((entry) => entry !== handler)
      },
    }
  })
}

function emit(dark: boolean): void {
  act(() => {
    for (const handler of [...handlers]) {
      handler({ matches: dark } as MediaQueryListEvent)
    }
  })
}

function Probe({ label }: { label: string }) {
  const mode = useColorMode()

  return <span>{`${label}:${mode}`}</span>
}

beforeEach(() => {
  resetColorModeSubscription()
  stubMatchMedia(false)
})

afterEach(() => {
  resetColorModeSubscription()
  vi.unstubAllGlobals()
})

describe('useColorMode', () => {
  it('reports the current preference', () => {
    stubMatchMedia(true)
    render(<Probe label="a" />)

    expect(screen.getByText('a:dark')).toBeDefined()
  })

  it('updates when the preference changes', () => {
    render(<Probe label="a" />)
    expect(screen.getByText('a:light')).toBeDefined()

    emit(true)

    expect(screen.getByText('a:dark')).toBeDefined()
  })

  it('opens one browser subscription for many consumers', () => {
    render(
      <>
        <Probe label="a" />
        <Probe label="b" />
        <Probe label="c" />
      </>,
    )

    expect(handlers).toHaveLength(1)
    expect(queries).toBe(1)
    expect(colorModeSubscriberCount()).toBe(3)
  })

  it('updates every consumer from that one subscription', () => {
    render(
      <>
        <Probe label="a" />
        <Probe label="b" />
      </>,
    )

    emit(true)

    expect(screen.getByText('a:dark')).toBeDefined()
    expect(screen.getByText('b:dark')).toBeDefined()
  })

  it('tears the subscription down after the last consumer unmounts', () => {
    const { unmount } = render(<Probe label="a" />)

    expect(handlers).toHaveLength(1)

    unmount()

    expect(handlers).toHaveLength(0)
    expect(colorModeSubscriberCount()).toBe(0)
  })

  it('keeps the subscription while any consumer remains', () => {
    const first = render(<Probe label="a" />)
    render(<Probe label="b" />)

    first.unmount()

    expect(handlers).toHaveLength(1)
  })

  it('reports light where matchMedia is unavailable', () => {
    vi.stubGlobal('matchMedia', undefined)
    render(<Probe label="a" />)

    expect(screen.getByText('a:light')).toBeDefined()
    expect(handlers).toHaveLength(0)
  })
})
