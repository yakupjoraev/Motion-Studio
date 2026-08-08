'use client'

import { type ReactNode, createContext, useContext } from 'react'

import type { ViewportHandle } from './use-viewport'

const ViewportContext = createContext<ViewportHandle | null>(null)

export interface ViewportProviderProps {
  readonly viewport: ViewportHandle
  readonly children: ReactNode
}

/**
 * The overlays of CANVAS.md § Overlays draw in screen space and need the live transform to place
 * themselves. They read it through this context — a ref-carrying handle, not a value — so a pan does
 * not render them either: they subscribe to their own `rAF` loop and read `viewport.current()`.
 */
export function ViewportProvider({ viewport, children }: ViewportProviderProps) {
  return <ViewportContext.Provider value={viewport}>{children}</ViewportContext.Provider>
}

export function useViewportContext(): ViewportHandle {
  const viewport = useContext(ViewportContext)

  if (viewport === null) {
    throw new Error('useViewportContext must be used inside the Canvas')
  }

  return viewport
}
