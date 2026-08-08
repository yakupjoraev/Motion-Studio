import { renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { VIEWPORT_QUERY, useViewportGuard } from './use-viewport-guard'

/** A `matchMedia` that answers by query string, which is the only thing the hook distinguishes. */
const stubMatchMedia = (matches: Readonly<Record<string, boolean>>): void => {
  vi.stubGlobal(
    'matchMedia',
    (query: string): MediaQueryList =>
      ({
        matches: matches[query] === true,
        media: query,
        onchange: null,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        addListener: () => undefined,
        removeListener: () => undefined,
        dispatchEvent: () => false,
      }) as MediaQueryList,
  )
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('useViewportGuard', () => {
  it('reports `wide` at 1280 and above', () => {
    stubMatchMedia({ [VIEWPORT_QUERY.wide]: true, [VIEWPORT_QUERY.overlay]: true })

    expect(renderHook(() => useViewportGuard()).result.current).toBe('wide')
  })

  it('reports `overlay` between 1024 and 1280', () => {
    stubMatchMedia({ [VIEWPORT_QUERY.overlay]: true })

    expect(renderHook(() => useViewportGuard()).result.current).toBe('overlay')
  })

  it('reports `narrow` below 1024', () => {
    stubMatchMedia({})

    expect(renderHook(() => useViewportGuard()).result.current).toBe('narrow')
  })

  it('uses the same two thresholds the stylesheet does', () => {
    expect(VIEWPORT_QUERY).toEqual({
      wide: '(min-width: 1280px)',
      overlay: '(min-width: 1024px)',
    })
  })
})
