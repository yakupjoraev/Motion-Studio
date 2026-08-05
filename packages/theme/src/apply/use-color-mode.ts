'use client'

// A client module: it subscribes to a media query. See the note in `theme-scope.tsx` for why the
// directive is per module rather than on the package barrel.

import { useEffect, useState } from 'react'

import type { ColorMode } from '@motion-studio/tokens'

const QUERY = '(prefers-color-scheme: dark)'

/**
 * `THEME_ENGINE.md` § Colour mode. **One** `matchMedia` call and one `change` handler in the whole app:
 * the query object and the listener live on the module, every hook instance reads the same cached value,
 * and the listener is attached on the first subscriber and removed after the last.
 *
 * A hook that owned its own subscription would mean one listener per component, which is how a `system`
 * preference change turns into hundreds of simultaneous re-renders. `use-color-mode.test.tsx` asserts both
 * counts rather than trusting the comment.
 */

type Listener = (mode: ColorMode) => void

const listeners = new Set<Listener>()
let query: MediaQueryList | undefined
let queried = false
let current: ColorMode | undefined

/** Creates the query object at most once per process, including for the initial read. */
function ensureQuery(): MediaQueryList | undefined {
  if (!queried) {
    queried = true
    query =
      typeof window !== 'undefined' && typeof window.matchMedia === 'function'
        ? window.matchMedia(QUERY)
        : undefined
  }

  return query
}

function readMode(): ColorMode {
  current ??= ensureQuery()?.matches === true ? 'dark' : 'light'

  return current
}

function handleChange(event: MediaQueryListEvent): void {
  current = event.matches ? 'dark' : 'light'
  for (const listener of listeners) {
    listener(current)
  }
}

function subscribe(listener: Listener): () => void {
  if (listeners.size === 0) {
    ensureQuery()?.addEventListener('change', handleChange)
  }
  listeners.add(listener)

  return () => {
    listeners.delete(listener)
    if (listeners.size === 0) {
      query?.removeEventListener('change', handleChange)
    }
  }
}

/** Test seam: the module-level query and listener outlive a single test otherwise. */
export function resetColorModeSubscription(): void {
  query?.removeEventListener('change', handleChange)
  listeners.clear()
  query = undefined
  queried = false
  current = undefined
}

/** The environment's colour mode, kept current through the single shared subscription. */
export function useColorMode(): ColorMode {
  const [mode, setMode] = useState<ColorMode>(readMode)

  useEffect(() => subscribe(setMode), [])

  return mode
}

/** How many hooks are listening. Exists so the "one subscription" claim is testable. */
export function colorModeSubscriberCount(): number {
  return listeners.size
}
