'use client'

import { Button, Dialog, EmptyState } from '@motion-studio/ui'
import { useEffect, useState } from 'react'

import { useLocale } from '../../../lib/i18n/locale-context'
import type { Locale } from '../../../lib/i18n/locales'
import { formatPlural } from '../../../lib/i18n/plural'
import { useStudio } from '../../../lib/i18n/studio-surface'
import { type SnapshotMeta, listSnapshots } from '../../../lib/storage/document-store'
import { useStudioStore } from '../../../store/editor-store'

import { useDocuments } from './documents-context'

const at = (createdAt: number, locale: Locale): string =>
  new Date(createdAt).toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' })

/**
 * `File → Version history` — FILE_FORMAT.md § Autosave. Ten snapshots, newest first, each with the
 * node count that makes one distinguishable from the next. Restoring dispatches a command, so the
 * step back out is the same `Mod+Z` as any other edit.
 */
export function VersionHistoryDialog() {
  const { documents: copy } = useStudio()
  const { locale } = useLocale()
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
      description={copy.versionsDescription}
      onOpenChange={(next) => setActiveDialog(next ? 'version-history' : null)}
      open={open}
      size="sm"
      title={copy.versionsTitle}
    >
      {snapshots.length === 0 ? (
        <EmptyState message={copy.versionsEmpty} />
      ) : (
        <ul className="flex flex-col gap-1" data-testid="version-list">
          {snapshots.map((snapshot, index) => (
            <li
              className="flex items-center justify-between gap-3 rounded-md px-2 py-1.5 hover:bg-surface-2"
              key={snapshot.key}
            >
              <span className="flex min-w-0 flex-col">
                <span className="text-sm">
                  {at(snapshot.createdAt, locale)}
                  {index === 0 ? (
                    <span className="ml-2 text-foreground-muted text-xs">{copy.latest}</span>
                  ) : null}
                </span>
                <span className="text-foreground-muted text-xs">
                  {formatPlural(locale, snapshot.nodeCount, copy.blockCount)}
                </span>
              </span>
              <Button
                onClick={() => {
                  setActiveDialog(null)
                  void restore(snapshot.key)
                }}
                size="sm"
                variant="secondary"
              >
                {copy.restore}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </Dialog>
  )
}
