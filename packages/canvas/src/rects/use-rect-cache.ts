'use client'

import { type RefObject, createContext, useContext, useEffect, useState } from 'react'

import { type OwnedRectCache, type RectCache, createRectCache } from './rect-cache'

/**
 * Node wrappers are rendered by the application inside `renderNode`, so they are not the canvas's
 * children in the props sense — the cache reaches them through context rather than a prop drilled
 * through code the canvas does not own.
 */
export const RectCacheContext = createContext<RectCache | null>(null)

export function useRectCacheContext(): RectCache {
  const cache = useContext(RectCacheContext)

  if (cache === null) {
    throw new Error('useRectCacheContext must be used inside the Canvas')
  }

  return cache
}

export interface RectCacheHookOptions {
  /** The canvas root. Anything below it scrolling moves every rect it holds. */
  readonly rootRef: RefObject<HTMLElement | null>
  /** `document.version`: the geometry is stale the moment the tree changes — CANVAS.md § Hit testing. */
  readonly version: number
}

export function useRectCache({ rootRef, version }: RectCacheHookOptions): OwnedRectCache {
  const [cache] = useState(createRectCache)

  // biome-ignore lint/correctness/useExhaustiveDependencies: `version` is the trigger, not an input — the effect re-runs because the geometry changed, and there is nothing to read off the number itself
  useEffect(() => {
    cache.invalidate()
    cache.refresh()
  }, [cache, version])

  useEffect(() => {
    const root = rootRef.current

    if (root === null) {
      return
    }

    // Capture, so an inner scroller counts too: a scroll changes no size, so the `ResizeObserver`
    // never fires, and every rect it moved is silently wrong until something asks for a pass.
    const onScroll = (): void => {
      cache.invalidate()
      cache.refresh()
    }

    root.addEventListener('scroll', onScroll, { capture: true, passive: true })

    return () => {
      root.removeEventListener('scroll', onScroll, { capture: true })
    }
  }, [cache, rootRef])

  useEffect(() => () => cache.dispose(), [cache])

  return cache
}
