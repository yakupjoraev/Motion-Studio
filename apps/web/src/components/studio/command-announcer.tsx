'use client'

import { useEffect, useRef } from 'react'

import { useStudioStore } from '../../store/editor-store'

/** Long enough that a held `Mod+Z` produces one sentence rather than twenty — ACCESSIBILITY.md § Canvas. */
const DEBOUNCE_MS = 150

/**
 * What just happened to the document, in words — ACCESSIBILITY.md § Canvas: "know the result of an
 * action … Duplicated Hero. 7 blocks." A command's result is otherwise visible only on the canvas,
 * and the selection announcer does not cover it: duplicating a node selects the copy, so the two
 * announcements would say the same thing about different events (ADR-326).
 *
 * The subscription is the store's own rather than a hook: this must not render on an edit, and the
 * text is written to the DOM for the same reason the canvas announcer writes its own.
 */
export function CommandAnnouncer() {
  const region = useRef<HTMLOutputElement | null>(null)

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null

    const announce = (message: string): void => {
      if (timer !== null) {
        clearTimeout(timer)
      }

      timer = setTimeout(() => {
        timer = null

        if (region.current !== null) {
          region.current.textContent = message
        }
      }, DEBOUNCE_MS)
    }

    const unsubscribe = useStudioStore.subscribe((state, previous) => {
      const entry = state.history.past.at(-1)
      const before = previous.history.past.at(-1)
      const undone = state.history.future.length > previous.history.future.length

      if (undone) {
        announce(`Undone. ${blocks(state)}.`)

        return
      }

      if (entry === undefined || entry.id === before?.id) {
        return
      }

      announce(`${entry.label}. ${blocks(state)}.`)
    })

    return () => {
      unsubscribe()

      if (timer !== null) {
        clearTimeout(timer)
      }
    }
  }, [])

  return (
    <output
      aria-atomic="true"
      aria-live="polite"
      className="sr-only"
      data-testid="command-announcer"
      ref={region}
    />
  )
}

const blocks = (state: { readonly document: { readonly nodes: object } }): string => {
  const count = Object.keys(state.document.nodes).length

  return `${count} ${count === 1 ? 'block' : 'blocks'}`
}
