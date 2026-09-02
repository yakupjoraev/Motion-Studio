'use client'

import { Button } from '@motion-studio/ui'
import { useState } from 'react'

import { downloadDocument } from '../../lib/documents/download'
import { type DocumentSource, recoverDocument } from '../../lib/errors/recover-document'
import { useStudioStore } from '../../store/editor-store'

export interface DownloadDocumentButtonProps {
  /** `secondary` inside a panel of actions, `primary` where it is the only thing worth doing. */
  readonly variant?: 'primary' | 'secondary'
  readonly label?: string
}

/** What the button says afterwards, so a user knows which copy of their work they are holding. */
const SOURCE_NOTE: Readonly<Record<DocumentSource, string>> = {
  store: 'Downloaded from this session.',
  autosave: 'Downloaded from the last autosave.',
  'unload-lane': 'Downloaded from the last save before the tab closed.',
}

/**
 * The escape hatch every boundary offers — `prompts/58`: a crash must never lose the user's work.
 *
 * It reads the store first and falls back to IndexedDB and then to the unload lane, because the case
 * this is really for is the one where the store is what broke. `recoverDocument` owns that order;
 * this owns saying which lane answered, since "your work is safe" is worth nothing if the user
 * cannot tell whether they are holding this minute's document or yesterday's.
 */
export function DownloadDocumentButton({
  variant = 'secondary',
  label = 'Download document',
}: DownloadDocumentButtonProps) {
  const [note, setNote] = useState<string | null>(null)

  const download = (): void => {
    void recoverDocument({
      // Guarded, not trusted: reading a store that has been torn down throws, and this button exists
      // for exactly that case.
      fromStore: () => useStudioStore.getState().document ?? null,
    }).then((recovered) => {
      if (recovered === null) {
        setNote('No document could be recovered from this browser.')

        return
      }

      // The same writer the File menu uses, so a file recovered from a crash is byte-for-byte the
      // file a working session would have produced — and re-imports the same way.
      downloadDocument(recovered.document)
      setNote(SOURCE_NOTE[recovered.source])
    })
  }

  return (
    <div className="flex flex-col gap-1">
      <Button onClick={download} size="sm" variant={variant}>
        {label}
      </Button>
      {note === null ? null : <output className="text-2xs text-foreground-muted">{note}</output>}
    </div>
  )
}
