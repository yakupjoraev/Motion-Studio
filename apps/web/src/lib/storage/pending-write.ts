'use client'

import { type MotionDocument, documentSchema, serializeDocument } from '@motion-studio/schema'

import { loadDocument, saveDocument } from './document-store'

/**
 * The unload lane — ADR-285. `beforeunload` cannot await and every IndexedDB write is a promise, so
 * the last edit before a tab closes goes to `localStorage`, which is synchronous, and the next load
 * moves it into IndexedDB.
 */
export const PENDING_KEY = 'motion-studio.pending-write'

export interface PendingWrite {
  readonly document: MotionDocument
  readonly savedAt: number
}

/** Returns whether the lane took it: a document over the ~5 MB quota cannot use it, and says so. */
export function writePending(document: MotionDocument, savedAt: number): boolean {
  try {
    window.localStorage.setItem(
      PENDING_KEY,
      `{"savedAt":${savedAt},"document":${serializeDocument(document)}}`,
    )

    return true
  } catch {
    return false
  }
}

export function readPending(): PendingWrite | null {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const stored: unknown = JSON.parse(window.localStorage.getItem(PENDING_KEY) ?? 'null')

    if (typeof stored !== 'object' || stored === null) {
      return null
    }

    const { savedAt, document } = stored as { savedAt?: unknown; document?: unknown }
    const parsed = documentSchema.safeParse(document)

    return parsed.success && typeof savedAt === 'number' ? { document: parsed.data, savedAt } : null
  } catch {
    return null
  }
}

export function clearPending(): void {
  try {
    window.localStorage.removeItem(PENDING_KEY)
  } catch {
    // Nothing to do: the lane is a backstop, and a browser refusing to clear it will refuse to write
    // it too. The `savedAt` comparison below is what keeps a stale entry from winning.
  }
}

/**
 * Runs before the store is hydrated. The lane loses to a newer IndexedDB record, so an unload write
 * that the debounced path had already committed cannot roll the document back.
 */
export async function flushPending(): Promise<PendingWrite | null> {
  const pending = readPending()

  if (pending === null) {
    return null
  }

  clearPending()

  const stored = await loadDocument(pending.document.meta.id)

  if (stored !== undefined && stored.savedAt >= pending.savedAt) {
    return null
  }

  await saveDocument(pending.document, pending.savedAt)

  return pending
}
