'use client'

import { Button, Dialog, EmptyState } from '@motion-studio/ui'
import { useEffect, useState } from 'react'

import { type SnapshotMeta, listSnapshots } from '../../../lib/storage/document-store'
import { useStudioStore } from '../../../store/editor-store'

import { useDocuments } from './documents-context'

const at = (createdAt: number): string =>
  new Date(createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })

/**
 * `File → Version history` — FILE_FORMAT.md § Autosave. Ten snapshots, newest first, each with the
 * node count that makes one distinguishable from the next. Restoring dispatches a command, so the
 * step back out is the same `Mod+Z` as any other edit.
 */
export function VersionHistoryDialog() {
  const open = useStudioStore((state) => state.ui.activeDialog === 'version-history')
  const setActiveDialog = useStudioStore((state) => state.setActiveDialog)
  const documentId = useStudioStore((state) => state.document.meta.id)
  const { restore } = useDocuments()
  const [snapshots, setSnapshots] = useState<readonly SnapshotMeta[]>([])

  useEffect(() => {
    if (!open) {
      return
    }

    let live = true

    listSnapshots(documentId)
      .then((found) => {
        if (live) {
          setSnapshots(found)
        }
      })
      .catch(() => undefined)

    return () => {
      live = false
    }
  }, [open, documentId])

  return (
    <Dialog
      description="The last ten versions of this document. Restoring one is an edit, so it undoes."
      onOpenChange={(next) => setActiveDialog(next ? 'version-history' : null)}
      open={open}
      size="sm"
      title="Version history"
    >
      {snapshots.length === 0 ? (
        <EmptyState message="No versions yet. One is kept whenever the document changes materially." />
      ) : (
        <ul className="flex flex-col gap-1" data-testid="version-list">
          {snapshots.map((snapshot, index) => (
            <li
              className="flex items-center justify-between gap-3 rounded-md px-2 py-1.5 hover:bg-surface-2"
              key={snapshot.key}
            >
              <span className="flex min-w-0 flex-col">
                <span className="text-sm">
                  {at(snapshot.createdAt)}
                  {index === 0 ? (
                    <span className="ml-2 text-foreground-muted text-xs">Latest</span>
                  ) : null}
                </span>
                <span className="text-foreground-muted text-xs">{snapshot.nodeCount} blocks</span>
              </span>
              <Button
                onClick={() => {
                  setActiveDialog(null)
                  void restore(snapshot.key)
                }}
                size="sm"
                variant="secondary"
              >
                Restore
              </Button>
            </li>
          ))}
        </ul>
      )}
    </Dialog>
  )
}
