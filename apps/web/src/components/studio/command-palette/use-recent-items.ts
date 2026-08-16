'use client'

import { useCallback, useState } from 'react'

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
 */
export function useRecentItems(): {
  readonly recent: readonly string[]
  readonly remember: (id: string) => void
} {
  const [recent, setRecent] = useState<readonly string[]>(read)

  const remember = useCallback((id: string) => {
    setRecent((current) => {
      const next = [id, ...current.filter((entry) => entry !== id)].slice(0, MAX_RECENT)

      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      } catch {
        // Private mode, or a full quota. The palette still works for this session.
      }

      return next
    })
  }, [])

  return { recent, remember }
}
