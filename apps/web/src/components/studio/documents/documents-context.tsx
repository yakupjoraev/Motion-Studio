'use client'

import { blockRegistry } from '@motion-studio/blocks'
import { commands } from '@motion-studio/editor'
import { createEmptyDocument } from '@motion-studio/schema'
import { useToast } from '@motion-studio/ui'
import { type ReactNode, createContext, useContext, useMemo, useState } from 'react'

import { cloneDocument } from '../../../lib/documents/clone-document'
import { downloadText } from '../../../lib/documents/download'
import type { ImportRejection, ImportSuccess } from '../../../lib/documents/import-document'
import { importDocument } from '../../../lib/documents/import-document'
import { entryOf, upsertEntry, writeLastOpenId } from '../../../lib/storage/document-index'
import { loadSnapshot, saveDocument } from '../../../lib/storage/document-store'
import { useStudioStore } from '../../../store/editor-store'

/** What the report dialog shows, plus the bytes it offers back — a repair must not destroy the copy. */
export interface PendingImport extends ImportSuccess {
  readonly fileName: string
  readonly original: string
}

export interface DocumentsValue {
  readonly pending: PendingImport | null
  readonly rejection: (ImportRejection & { fileName: string; original: string }) | null
  newBlank(): Promise<void>
  newFromTemplate(slug: string): Promise<void>
  saveAs(name: string): Promise<void>
  /** Runs the pipeline and opens the report; nothing reaches the store until `applyImport`. */
  read(text: string, fileName: string): void
  applyImport(): void
  dismissImport(): void
  downloadOriginal(): void
  restore(key: string): Promise<void>
}

const DocumentsContext = createContext<DocumentsValue | null>(null)

export function useDocuments(): DocumentsValue {
  const value = useContext(DocumentsContext)

  if (value === null) {
    throw new Error('useDocuments must be called inside a DocumentsProvider')
  }

  return value
}

/**
 * The document actions the File menu and the five dialogs share. It holds one piece of state — the
 * import waiting for its report to be read — because that is the one thing two surfaces need and
 * neither owns: the dialog that ran the pipeline is closed by the time the report is on screen.
 */
export function DocumentsProvider({ children }: { children: ReactNode }) {
  const publish = useToast()
  const [pending, setPending] = useState<PendingImport | null>(null)
  const [rejection, setRejection] = useState<DocumentsValue['rejection']>(null)

  const value = useMemo<DocumentsValue>(() => {
    /** Every path that puts a document on screen writes it immediately, so a reload has it. */
    const adopt = async (document: Parameters<typeof saveDocument>[0]): Promise<void> => {
      const at = Date.now()

      useStudioStore.getState().replaceDocument(document)
      writeLastOpenId(document.meta.id)
      upsertEntry(entryOf(document, at))

      try {
        await saveDocument(document, at)
      } catch {
        publish({
          title: 'Could not save the new document',
          description: 'It is open and editable. Storage refused the write.',
          tone: 'danger',
        })
      }
    }

    return {
      pending,
      rejection,

      async newBlank() {
        await adopt(createEmptyDocument({ generator: 'motion-studio@0.0.0' }))
      },

      async newFromTemplate(slug: string) {
        const response = await fetch(`/templates/${encodeURIComponent(slug)}.motion.json`)

        if (!response.ok) {
          publish({ title: `Could not load the ${slug} template`, tone: 'danger' })

          return
        }

        const outcome = importDocument(await response.text(), blockRegistry)

        if (!outcome.ok) {
          publish({ title: outcome.error.title, description: outcome.error.detail, tone: 'danger' })

          return
        }

        // Fresh ids, so editing a template cannot write back to it — FILE_FORMAT.md § Templates.
        await adopt(cloneDocument(outcome.value.document))
      },

      async saveAs(name: string) {
        await adopt(cloneDocument(useStudioStore.getState().document, { name }))
      },

      read(text: string, fileName: string) {
        const outcome = importDocument(text, blockRegistry)

        if (outcome.ok) {
          setRejection(null)
          setPending({ ...outcome.value, fileName, original: text })

          return
        }

        setPending(null)
        setRejection({ ...outcome.error, fileName, original: text })
      },

      applyImport() {
        if (pending === null) {
          return
        }

        setPending(null)
        void adopt(pending.document)
      },

      dismissImport() {
        setPending(null)
        setRejection(null)
      },

      downloadOriginal() {
        const source = pending ?? rejection

        if (source !== null) {
          downloadText(source.original, source.fileName)
        }
      },

      async restore(key: string) {
        const snapshot = await loadSnapshot(key)

        if (snapshot === undefined) {
          publish({ title: 'That version is no longer stored', tone: 'danger' })

          return
        }

        useStudioStore.getState().dispatch(commands.restoreSnapshot({ document: snapshot }))
      },
    }
  }, [pending, rejection, publish])

  return <DocumentsContext.Provider value={value}>{children}</DocumentsContext.Provider>
}
