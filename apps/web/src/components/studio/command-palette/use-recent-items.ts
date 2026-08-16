'use client'

import { useCallback, useRef, useState } from 'react'

const STORAGE_KEY = 'motion-studio.palette.recent'
const MAX_RECENT = 5

const read = (): readonly string[] => {
  if (typeof window === 'undefined') {
    return []
  }

  try {
    const raw: unknown = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '[]')

    return Array.isArray(raw)
      ? raw.filter((entry): entry is string => typeof entry === 'string')
      : []
  } catch {
    // A corrupt entry is not worth a broken palette; the list rebuilds itself as the user works.
    return []
  }
}

/**
 * SHORTCUTS.md § Command palette: "recent items first (last 5, persisted)". They are ids rather than
 * items, so an entry whose source has gone — a deleted layer — simply stops matching.
 *
 * The write happens outside the state updater on purpose. Running an item closes the palette, which
 * unmounts this hook in the same tick; React is free to drop the queued update, and with the write
 * inside it the pick was never recorded. Measured in the browser: the item just run came back
 * *below* the defaults on the next open.
 */
export function useRecentItems(): {
  readonly recent: readonly string[]
  readonly remember: (id: string) => void
} {
  const [recent, setRecent] = useState<readonly string[]>(read)
  const held = useRef(recent)

  held.current = recent

  const remember = useCallback((id: string) => {
    const next = [id, ...held.current.filter((entry) => entry !== id)].slice(0, MAX_RECENT)

    held.current = next

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {
      // Private mode, or a full quota. The palette still works for this session.
    }

    setRecent(next)
  }, [])

  return { recent, remember }
}
