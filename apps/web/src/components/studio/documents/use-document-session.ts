'use client'

import { useToast } from '@motion-studio/ui'
import { useEffect, useRef } from 'react'

import { downloadText } from '../../../lib/documents/download'
import { readLastOpenId, writeLastOpenId } from '../../../lib/storage/document-index'
import { loadDocument, loadRawDocument } from '../../../lib/storage/document-store'
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
  const notify = useToast()

  useEffect(() => {
    if (restored.current || isFixtureSession()) {
      return
    }

    restored.current = true

    let live = true

    /**
     * A stored document the schema rejects is the one restore failure a user can see and not
     * understand: the studio opens empty and says nothing, so their last session looks deleted. It is
     * not — the bytes are still in IndexedDB, and this hands them over.
     */
    const reportUnreadable = (id: string, raw: unknown): void => {
      notify({
        title: 'Your last document could not be opened',
        description: 'It is still stored in this browser. Download it, then start from a new one.',
        tone: 'danger',
        action: {
          label: 'Download it',
          onClick: () => downloadText(JSON.stringify(raw, null, 2), `${id}.motion.json`),
        },
      })
    }

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

      if (!live) {
        return
      }

      if (stored === undefined) {
        /*
         * Two different failures answer `undefined`, and only one is worth a toast: a record that is
         * there and unreadable, versus a last-open id pointing at a document that was deleted. The
         * second is ordinary — the studio opens a new document, which is what the user asked for by
         * deleting the old one.
         */
        const raw = await loadRawDocument(id)

        if (live && raw !== undefined) {
          reportUnreadable(id, raw)
        }

        return
      }

      useStudioStore.getState().replaceDocument(stored.document)
      writeLastOpenId(id)
    }

    void run().catch(() => undefined)

    return () => {
      live = false
    }
  }, [notify])
}
