'use client'

import type { MotionDocument } from '@motion-studio/schema'
import { useToast } from '@motion-studio/ui'
import { useCallback, useEffect, useState } from 'react'

import { useStudioStore } from '../../store/editor-store'
import { cloneDocument } from '../documents/clone-document'

import {
  type DocumentEntry,
  entryOf,
  readIndex,
  reconcileIndex,
  removeEntry,
  renameEntry,
  upsertEntry,
  writeLastOpenId,
} from './document-index'
import {
  type SnapshotRecord,
  deleteDocument,
  listDocumentIds,
  loadDocument,
  restoreSnapshots,
  saveDocument,
} from './document-store'

export interface DocumentList {
  readonly entries: readonly DocumentEntry[]
  open(id: string): Promise<boolean>
  rename(id: string, name: string): void
  duplicate(id: string): Promise<void>
  remove(id: string): Promise<void>
  refresh(): Promise<void>
}

/**
 * The document list dialog's whole model. The index is read synchronously so the dialog paints its
 * rows on the frame it opens; the reconciliation against IndexedDB lands a tick later and can only
 * remove rows whose document is gone (ADR-114's trade, applied to the list).
 */
export function useDocumentList(): DocumentList {
  const publish = useToast()
  const [entries, setEntries] = useState<readonly DocumentEntry[]>(readIndex)

  const refresh = useCallback(async (): Promise<void> => {
    try {
      setEntries(reconcileIndex(await listDocumentIds()))
    } catch {
      // Storage the browser refuses leaves the list as it was read. Nothing here is destructive.
      setEntries(readIndex())
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const open = useCallback(async (id: string): Promise<boolean> => {
    const stored = await loadDocument(id)

    if (stored === undefined) {
      return false
    }

    useStudioStore.getState().replaceDocument(stored.document)
    writeLastOpenId(id)

    return true
  }, [])

  const rename = useCallback((id: string, name: string): void => {
    setEntries(renameEntry(id, name))

    void loadDocument(id).then((stored) => {
      if (stored !== undefined) {
        void saveDocument(
          { ...stored.document, meta: { ...stored.document.meta, name } },
          stored.savedAt,
        )
      }
    })
  }, [])

  const duplicate = useCallback(async (id: string): Promise<void> => {
    const stored = await loadDocument(id)

    if (stored === undefined) {
      return
    }

    const copy = cloneDocument(stored.document, { name: `${stored.document.meta.name} copy` })
    const at = Date.now()

    await saveDocument(copy, at)
    setEntries(upsertEntry(entryOf(copy, at)))
  }, [])

  /**
   * No confirmation dialog: the undo toast is the pattern this app uses for every destructive action,
   * and it is better UX than a modal asking a question the user has already answered.
   */
  const remove = useCallback(
    async (id: string): Promise<void> => {
      const stored = await loadDocument(id)

      if (stored === undefined) {
        setEntries(removeEntry(id))

        return
      }

      /** Both halves come back, or the undo is not one — the version history is part of the document. */
      const restore = (
        document: MotionDocument,
        savedAt: number,
        snapshots: readonly SnapshotRecord[],
      ): void => {
        void Promise.all([saveDocument(document, savedAt), restoreSnapshots(snapshots)]).then(
          () => {
            setEntries(upsertEntry(entryOf(document, savedAt)))
          },
        )
      }

      const snapshots = await deleteDocument(id)

      setEntries(removeEntry(id))

      publish({
        title: `Deleted ${stored.document.meta.name}`,
        action: {
          label: 'Undo',
          onClick: () => restore(stored.document, stored.savedAt, snapshots),
        },
      })
    },
    [publish],
  )

  return { entries, open, rename, duplicate, remove, refresh }
}
