'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * ACCESSIBILITY.md § Playground: coordinates are announced, debounced. An arrow key held down fires
 * thirty times a second, and thirty sentences is not information.
 */
export const ANNOUNCE_DEBOUNCE_MS = 300

export interface Announcement {
  readonly message: string
  announce: (message: string) => void
}

export function useAnnouncement(delay: number = ANNOUNCE_DEBOUNCE_MS): Announcement {
  const [message, setMessage] = useState('')
  const pending = useRef<number | undefined>(undefined)

  const announce = useCallback(
    (next: string) => {
      window.clearTimeout(pending.current)
      pending.current = window.setTimeout(() => setMessage(next), delay)
    },
    [delay],
  )

  useEffect(() => () => window.clearTimeout(pending.current), [])

  return { message, announce }
}
