'use client'

import type { HistoryEntry } from '@motion-studio/editor'
import { type MotionDocument, nodeIds } from '@motion-studio/schema'
import { useToast } from '@motion-studio/ui'
import { useCallback, useEffect, useRef } from 'react'

import { useStudioStore } from '../../store/editor-store'
import { downloadDocument } from '../documents/download'

import { entryOf, upsertEntry, writeLastOpenId } from './document-index'
import { saveDocument, takeSnapshot } from './document-store'
import { writePending } from './pending-write'

/** STATE_MANAGEMENT.md § Persistence: two seconds after the last change. */
export const AUTOSAVE_DEBOUNCE_MS = 2000

/** ADR-284: patches since the last snapshot, above which the next autosave takes one. */
export const SNAPSHOT_PATCH_THRESHOLD = 20

export interface AutosaveOptions {
  /** The fixture path opts out — ADR-286. */
  readonly enabled?: boolean
  readonly debounceMs?: number
}

/**
 * ```
 * change → dirty → debounce 2000 ms → serialize → put
 *                ↘ visibilitychange (hidden) → flush now
 *                ↘ beforeunload → the localStorage lane (ADR-285)
 * ```
 *
 * The failure path is the reason this hook is not three lines: a write that fails silently loses the
 * user's work, so it raises a toast that does not dismiss itself and hands them the file.
 */
export function useAutosave({
  enabled = true,
  debounceMs = AUTOSAVE_DEBOUNCE_MS,
}: AutosaveOptions = {}): void {
  const publish = useToast()
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const unsaved = useRef(false)
  const patchesSinceSnapshot = useRef(0)
  /** The newest history entry, by id and size: coalescing grows an entry rather than pushing one. */
  const lastEntry = useRef<{ id: string; patches: number } | null>(null)
  const snapshotNodeCount = useRef<number | null>(null)
  const reported = useRef(false)

  const report = useCallback(
    (document: MotionDocument): void => {
      if (reported.current) {
        return
      }

      reported.current = true
      publish({
        title: 'Could not save',
        description: 'Your changes are still open in this tab. Download the document to keep them.',
        tone: 'danger',
        // Radix skips the dismissal timer entirely at `Infinity`, which is what "persistent" means
        // here: the toast stays until the user acts on it.
        duration: Number.POSITIVE_INFINITY,
        action: { label: 'Download document', onClick: () => downloadDocument(document) },
      })
    },
    [publish],
  )

  const save = useCallback(
    async (document: MotionDocument, at: number): Promise<void> => {
      try {
        await saveDocument(document, at)
        unsaved.current = false
        reported.current = false
        upsertEntry(entryOf(document, at))
        writeLastOpenId(document.meta.id)

        const nodeCount = nodeIds(document).length
        const counted = patchesSinceSnapshot.current

        if (snapshotNodeCount.current !== nodeCount || counted >= SNAPSHOT_PATCH_THRESHOLD) {
          /*
           * Booked before the write, not after it. A second autosave can start while this one is in
           * flight, and one that reads a counter the finished write has not reset yet snapshots
           * twice. Subtracted rather than zeroed, so an edit made *during* the write still counts
           * towards the next snapshot.
           */
          snapshotNodeCount.current = nodeCount
          patchesSinceSnapshot.current -= counted

          await takeSnapshot(document, at)
        }
      } catch {
        report(document)
      }
    },
    [report],
  )

  const flush = useCallback((): void => {
    if (timer.current !== null) {
      clearTimeout(timer.current)
      timer.current = null
    }

    if (!unsaved.current) {
      return
    }

    void save(useStudioStore.getState().document, Date.now())
  }, [save])

  useEffect(() => {
    if (!enabled) {
      return
    }

    const schedule = (): void => {
      unsaved.current = true

      if (timer.current !== null) {
        clearTimeout(timer.current)
      }

      timer.current = setTimeout(() => {
        timer.current = null
        void save(useStudioStore.getState().document, Date.now())
      }, debounceMs)
    }

    const count = (past: readonly HistoryEntry[]): void => {
      const newest = past.at(-1)

      if (newest === undefined) {
        return
      }

      // An entry the coalescing window grew counts only its growth; a new entry counts in full. An
      // undo lands on an older entry and counts it again, which errs towards a snapshot — the
      // direction a version history should err in.
      patchesSinceSnapshot.current +=
        lastEntry.current?.id === newest.id
          ? Math.max(0, newest.patches.length - lastEntry.current.patches)
          : newest.patches.length
      lastEntry.current = { id: newest.id, patches: newest.patches.length }
    }

    /*
     * Two subscriptions, because the store commits the document *before* it records the entry: a
     * listener on `version` runs while `history.past` is still one entry behind, and counting there
     * lags the document by an edit.
     */
    const stopScheduling = useStudioStore.subscribe((state) => state.version, schedule)
    const stopCounting = useStudioStore.subscribe((state) => state.history.past, count)

    return () => {
      stopScheduling()
      stopCounting()
    }
  }, [enabled, debounceMs, save])

  useEffect(() => {
    if (!enabled) {
      return
    }

    const onVisibility = (): void => {
      if (document.visibilityState === 'hidden') {
        flush()
      }
    }

    /*
     * The lane, not a flush: this handler runs on a page the browser is already tearing down, and a
     * promise it starts settles on a task that will not run.
     */
    const onUnload = (): void => {
      if (unsaved.current) {
        writePending(useStudioStore.getState().document, Date.now())
      }
    }

    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('beforeunload', onUnload)

    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('beforeunload', onUnload)
    }
  }, [enabled, flush])
}
