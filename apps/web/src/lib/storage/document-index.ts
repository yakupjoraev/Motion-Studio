'use client'

import { type MotionDocument, nodeIds } from '@motion-studio/schema'

/**
 * The document list — STATE_MANAGEMENT.md § Persistence: "localStorage stores the document index,
 * last-open id, and UI preferences." It is in `localStorage` rather than in IndexedDB for the reason
 * ADR-114 gives for panel state: the list is needed synchronously, before the first paint of the
 * dialog that shows it, and reading it must not mean opening a database and deserialising every
 * document to count its nodes.
 *
 * The index is derived data with a copy of its own, which STATE_MANAGEMENT.md § Anti-patterns
 * normally forbids. It is the exception the document *store* cannot serve: the source of truth is
 * IndexedDB, and the whole point is not to open it. `reconcileIndex` is what repairs a divergence.
 */
export const INDEX_KEY = 'motion-studio.documents'
export const LAST_OPEN_KEY = 'motion-studio.last-open'

export interface DocumentEntry {
  readonly id: string
  readonly name: string
  /** Milliseconds. Sorted on, so it is a number rather than the document's ISO string. */
  readonly updatedAt: number
  readonly nodeCount: number
}

const isEntry = (value: unknown): value is DocumentEntry => {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const entry = value as Record<string, unknown>

  return (
    typeof entry['id'] === 'string' &&
    typeof entry['name'] === 'string' &&
    typeof entry['updatedAt'] === 'number' &&
    typeof entry['nodeCount'] === 'number'
  )
}

const byRecency = (left: DocumentEntry, right: DocumentEntry): number =>
  right.updatedAt - left.updatedAt

/** A corrupt index costs the list, not the studio: the editor opens with no recent documents. */
export function readIndex(): readonly DocumentEntry[] {
  if (typeof window === 'undefined') {
    return []
  }

  try {
    const stored: unknown = JSON.parse(window.localStorage.getItem(INDEX_KEY) ?? '[]')

    return Array.isArray(stored) ? stored.filter(isEntry).sort(byRecency) : []
  } catch {
    return []
  }
}

const write = (entries: readonly DocumentEntry[]): readonly DocumentEntry[] => {
  const sorted = [...entries].sort(byRecency)

  try {
    window.localStorage.setItem(INDEX_KEY, JSON.stringify(sorted))
  } catch {
    // A full or refusing `localStorage` loses the list, not the documents — those are in IndexedDB,
    // and `reconcileIndex` rebuilds the list from them on the next load.
  }

  return sorted
}

export const entryOf = (document: MotionDocument, updatedAt: number): DocumentEntry => ({
  id: document.meta.id,
  name: document.meta.name,
  updatedAt,
  nodeCount: nodeIds(document).length,
})

export function upsertEntry(entry: DocumentEntry): readonly DocumentEntry[] {
  return write([...readIndex().filter((existing) => existing.id !== entry.id), entry])
}

export function renameEntry(id: string, name: string): readonly DocumentEntry[] {
  return write(readIndex().map((entry) => (entry.id === id ? { ...entry, name } : entry)))
}

export function removeEntry(id: string): readonly DocumentEntry[] {
  return write(readIndex().filter((entry) => entry.id !== id))
}

/**
 * Drops entries whose document is gone. The two stores can diverge — a browser can evict IndexedDB
 * and keep `localStorage` — and a list offering a document that will not open is worse than a short
 * list.
 */
export function reconcileIndex(known: readonly string[]): readonly DocumentEntry[] {
  const present = new Set(known)

  return write(readIndex().filter((entry) => present.has(entry.id)))
}

export function readLastOpenId(): string | null {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    return window.localStorage.getItem(LAST_OPEN_KEY)
  } catch {
    return null
  }
}

export function writeLastOpenId(id: string): void {
  try {
    window.localStorage.setItem(LAST_OPEN_KEY, id)
  } catch {
    // Same trade as the index: losing "which document was open" costs a click, not the work.
  }
}
