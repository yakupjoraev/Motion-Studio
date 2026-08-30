'use client'

import { useEffect, useRef } from 'react'

import { readLastOpenId, writeLastOpenId } from '../../../lib/storage/document-index'
import { loadDocument } from '../../../lib/storage/document-store'
import { flushPending } from '../../../lib/storage/pending-write'
import { useStudioStore } from '../../../store/editor-store'

/** ADR-286. A fixture session neither restores nor saves: it is a measurement, not somebody's work. */
export const isFixtureSession = (): boolean =>
  typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('fixture')

/**
 * What happens before the first edit — PRODUCT.md § 10: "`/studio` restores the last document."
 *
 * The unload lane is drained **first**, so a tab closed inside the debounce window puts its last edit
 * into IndexedDB before the restore reads from it (ADR-285). Both steps are best-effort: a browser
 * that refuses storage opens an empty studio rather than no studio.
 */
export function useDocumentSession(): void {
  const restored = useRef(false)

  useEffect(() => {
    if (restored.current || isFixtureSession()) {
      return
    }

    restored.current = true

    let live = true

    const run = async (): Promise<void> => {
      /*
       * The lane wins over the last-open id, and not only because it is newer. A tab closed before
       * its first autosave completed has no last-open id at all — nothing has written one — so the
       * document it carries is reachable through the lane or not at all.
       */
      const pending = await flushPending()
      const id = pending?.document.meta.id ?? readLastOpenId()

      if (id === null) {
        return
      }

      const stored = await loadDocument(id)

      if (stored !== undefined && live) {
        useStudioStore.getState().replaceDocument(stored.document)
        writeLastOpenId(id)
      }
    }

    void run().catch(() => undefined)

    return () => {
      live = false
    }
  }, [])
}
