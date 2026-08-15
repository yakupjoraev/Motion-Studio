'use client'

import { useSyncExternalStore } from 'react'

/** ANIMATION_SYSTEM.md § Reduced motion. The one query string in the codebase. */
export const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

const listeners = new Set<() => void>()

let query: MediaQueryList | null = null
let reduced = false

/**
 * One `matchMedia` for the whole application, opened when the first consumer subscribes and never
 * opened again — ANIMATION_SYSTEM.md § Reduced motion says detection is centralised, and forty nodes
 * each holding their own query is the thing that sentence forbids.
 */
function open(): void {
  if (query !== null || typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return
  }

  query = window.matchMedia(REDUCED_MOTION_QUERY)
  reduced = query.matches

  query.addEventListener('change', (event: MediaQueryListEvent) => {
    reduced = event.matches

    for (const listener of listeners) {
      listener()
    }
  })
}

export function subscribeReducedMotion(listener: () => void): () => void {
  open()
  listeners.add(listener)

  return () => {
    listeners.delete(listener)
  }
}

/** The current answer for code outside React — the scheduler and the codegen path both ask. */
export function getReducedMotion(): boolean {
  open()

  return reduced
}

/** The server has no media query, and the full-motion design is what it renders. */
const getServerSnapshot = (): boolean => false

export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribeReducedMotion, getReducedMotion, getServerSnapshot)
}
