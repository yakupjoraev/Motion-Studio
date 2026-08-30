'use client'

import { CopyIcon, DeleteIcon } from '@motion-studio/icons'
import { Button, Dialog, EmptyState, Input } from '@motion-studio/ui'
import { useState } from 'react'

import { useDocumentList } from '../../../lib/storage/use-document-list'
import { useStudioStore } from '../../../store/editor-store'

/** Same clock the status bar reads: a list sorted by recency has to say how recent. */
const when = (updatedAt: number): string =>
  new Date(updatedAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })

/**
 * Open, rename, duplicate, delete — PRODUCT.md § 10. Delete has no confirmation dialog: the undo
 * toast `useDocumentList` publishes is the pattern every destructive action in this app uses, and it
 * asks nothing of a user who meant it.
 */
export function DocumentListDialog() {
  const open = useStudioStore((state) => state.ui.activeDialog === 'documents')
  const setActiveDialog = useStudioStore((state) => state.setActiveDialog)
  const openId = useStudioStore((state) => state.document.meta.id)
  const { entries, open: load, rename, duplicate, remove } = useDocumentList()
  const [editing, setEditing] = useState<string | null>(null)

  return (
    <Dialog
      description="Everything saved in this browser. Nothing here has left the machine."
      onOpenChange={(next) => setActiveDialog(next ? 'documents' : null)}
      open={open}
      size="md"
      title="Documents"
    >
      {entries.length === 0 ? (
        <EmptyState message="No documents yet. The one you are editing appears here once it saves." />
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
                  aria-label="Document name"
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
                      <span className="ml-2 text-foreground-muted text-xs">Open</span>
                    ) : null}
                  </span>
                  <span className="text-foreground-muted text-xs">
                    {entry.nodeCount} blocks · {when(entry.updatedAt)}
                  </span>
                </button>
              )}

              <Button
                aria-label={`Rename ${entry.name}`}
                onClick={() => setEditing(entry.id)}
                size="sm"
                variant="ghost"
              >
                Rename
              </Button>
              <Button
                aria-label={`Duplicate ${entry.name}`}
                onClick={() => void duplicate(entry.id)}
                size="icon"
                variant="ghost"
              >
                <CopyIcon size={16} />
              </Button>
              <Button
                aria-label={`Delete ${entry.name}`}
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
