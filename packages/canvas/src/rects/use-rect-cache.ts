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

/** What the cache needs off the scene: the version, and a way to hear that it moved — ADR-112. */
export interface RectCacheSource {
  version(): number
  subscribe(listener: () => void): () => void
}

export interface RectCacheHookOptions {
  /** The canvas root. Anything below it scrolling moves every rect it holds. */
  readonly rootRef: RefObject<HTMLElement | null>
  /**
   * ADR-112: subscribed to rather than read during render. A prop would make every document change a
   * canvas re-render, and an inspector drag commits thirty times a second.
   */
  readonly scene: RectCacheSource
}

export function useRectCache({ rootRef, scene }: RectCacheHookOptions): OwnedRectCache {
  const [cache] = useState(createRectCache)

  useEffect(() => {
    let seen = scene.version()

    cache.invalidate()
    cache.refresh()

    // Only the version: the scene notifies for a selection and a hover too, and re-measuring 200
    // nodes because something was clicked is the cost this comparison exists to avoid.
    return scene.subscribe(() => {
      const next = scene.version()

      if (next === seen) {
        return
      }

      seen = next
      cache.invalidate()
      cache.refresh()
    })
  }, [cache, scene])

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
