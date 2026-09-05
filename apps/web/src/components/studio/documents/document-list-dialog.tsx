'use client'

import { CopyIcon, DeleteIcon } from '@motion-studio/icons'
import { Button, Dialog, EmptyState, Input } from '@motion-studio/ui'
import { useState } from 'react'

import { useLocale } from '../../../lib/i18n/locale-context'
import type { Locale } from '../../../lib/i18n/locales'
import { formatPlural } from '../../../lib/i18n/plural'
import { useStudio } from '../../../lib/i18n/studio-surface'
import { useDocumentList } from '../../../lib/storage/use-document-list'
import { useStudioStore } from '../../../store/editor-store'

/** Same clock the status bar reads: a list sorted by recency has to say how recent. */
const when = (updatedAt: number, locale: Locale): string =>
  new Date(updatedAt).toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' })

/**
 * Open, rename, duplicate, delete — PRODUCT.md § 10. Delete has no confirmation dialog: the undo
 * toast `useDocumentList` publishes is the pattern every destructive action in this app uses, and it
 * asks nothing of a user who meant it.
 */
export function DocumentListDialog() {
  const { documents: copy } = useStudio()
  const { locale } = useLocale()
  const open = useStudioStore((state) => state.ui.activeDialog === 'documents')
  const setActiveDialog = useStudioStore((state) => state.setActiveDialog)
  const openId = useStudioStore((state) => state.document.meta.id)
  const { entries, open: load, rename, duplicate, remove } = useDocumentList()
  const [editing, setEditing] = useState<string | null>(null)

  return (
    <Dialog
      description={copy.listDescription}
      onOpenChange={(next) => setActiveDialog(next ? 'documents' : null)}
      open={open}
      size="md"
      title={copy.listTitle}
    >
      {entries.length === 0 ? (
        <EmptyState message={copy.listEmpty} />
      ) : (
        <ul className="flex flex-col gap-1" data-testid="document-list">
          {entries.map((entry) => (
            <li
              className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-surface-2"
              data-testid={`document-${entry.id}`}
              key={entry.id}
            >
              {editing === entry.id ? (
                <Input
                  aria-label={copy.documentName}
                  autoFocus
                  className="flex-1"
                  defaultValue={entry.name}
                  onBlur={(event) => {
                    rename(entry.id, event.target.value.trim() || entry.name)
                    setEditing(null)
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.currentTarget.blur()
                    }

                    if (event.key === 'Escape') {
                      setEditing(null)
                    }
                  }}
                />
              ) : (
                <button
                  className="flex min-w-0 flex-1 flex-col items-start rounded-sm text-left outline-none focus-visible:shadow-focus"
                  onClick={() => {
                    void load(entry.id).then((loaded) => {
                      if (loaded) {
                        setActiveDialog(null)
                      }
                    })
                  }}
                  onDoubleClick={() => setEditing(entry.id)}
                  type="button"
                >
                  <span className="truncate font-medium text-sm">
                    {entry.name}
                    {entry.id === openId ? (
                      <span className="ml-2 text-foreground-muted text-xs">{copy.open}</span>
                    ) : null}
                  </span>
                  <span className="text-foreground-muted text-xs">
                    {formatPlural(locale, entry.nodeCount, copy.blockCount)} ·{' '}
                    {when(entry.updatedAt, locale)}
                  </span>
                </button>
              )}

              <Button
                aria-label={copy.renameOne.replace('{name}', entry.name)}
                onClick={() => setEditing(entry.id)}
                size="sm"
                variant="ghost"
              >
                {copy.rename}
              </Button>
              <Button
                aria-label={copy.duplicateOne.replace('{name}', entry.name)}
                onClick={() => void duplicate(entry.id)}
                size="icon"
                variant="ghost"
              >
                <CopyIcon size={16} />
              </Button>
              <Button
                aria-label={copy.deleteOne.replace('{name}', entry.name)}
                onClick={() => void remove(entry.id)}
                size="icon"
                variant="ghost"
              >
                <DeleteIcon size={16} />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </Dialog>
  )
}
