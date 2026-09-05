'use client'

import { UploadIcon } from '@motion-studio/icons'
import { Button, Dialog } from '@motion-studio/ui'
import { cn } from '@motion-studio/utils'
import { type DragEvent, useRef, useState } from 'react'

import { useLocale } from '../../../lib/i18n/locale-context'
import { formatPlural } from '../../../lib/i18n/plural'
import { useStudio } from '../../../lib/i18n/studio-surface'
import { useStudioStore } from '../../../store/editor-store'

import { useDocuments } from './documents-context'
import { ImportReport } from './import-report'

/** FILE_FORMAT.md § Import caps a file at 10 MB; the picker states the format it takes. */
const ACCEPT = '.json,.motion,application/json'

/**
 * The three sources FILE_FORMAT.md § Import names — a picker, a drop and a paste — behind one dialog.
 * Nothing it reads reaches the store: the pipeline runs here and the outcome goes to the report,
 * which is the surface that decides.
 */
export function ImportDialog() {
  const { documents: copy } = useStudio()
  const { locale } = useLocale()
  const open = useStudioStore((state) => state.ui.activeDialog === 'import')
  const setActiveDialog = useStudioStore((state) => state.setActiveDialog)
  const { pending, rejection, read, applyImport, dismissImport, downloadOriginal } = useDocuments()
  const input = useRef<HTMLInputElement>(null)
  const [over, setOver] = useState(false)

  const close = (): void => {
    dismissImport()
    setActiveDialog(null)
  }

  const take = (file: File | undefined): void => {
    if (file === undefined) {
      return
    }

    void file.text().then((text) => read(text, file.name))
  }

  const onDrop = (event: DragEvent<HTMLDivElement>): void => {
    event.preventDefault()
    setOver(false)
    take(event.dataTransfer.files[0])
  }

  const outcome = pending ?? rejection

  return (
    <Dialog
      description={copy.importDescription}
      onOpenChange={(next) => {
        if (!next) {
          close()
        }
      }}
      open={open}
      size="md"
      title={outcome === null ? copy.importTitle : outcome.fileName}
      footer={
        pending !== null ? (
          <>
            <Button onClick={downloadOriginal} size="sm" variant="secondary">
              {copy.downloadOriginal}
            </Button>
            <Button
              onClick={() => {
                applyImport()
                setActiveDialog(null)
              }}
              size="sm"
              variant="primary"
            >
              {copy.continue}
            </Button>
          </>
        ) : rejection !== null ? (
          <>
            <Button onClick={downloadOriginal} size="sm" variant="secondary">
              {copy.downloadOriginal}
            </Button>
            <Button onClick={dismissImport} size="sm" variant="primary">
              {copy.tryAnotherFile}
            </Button>
          </>
        ) : null
      }
    >
      {pending !== null ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm">
            {pending.notes.length === 0
              ? copy.readyToOpen.replace('{name}', pending.document.meta.name)
              : formatPlural(locale, pending.notes.length, copy.openingWithRepairs).replace(
                  '{name}',
                  pending.document.meta.name,
                )}
          </p>
          <ImportReport notes={pending.notes} />
        </div>
      ) : rejection !== null ? (
        <div className="flex flex-col gap-2" data-testid="import-rejection">
          <p className="font-medium text-sm text-warning">{rejection.title}</p>
          <p className="text-foreground-muted text-sm">{rejection.detail}</p>
          <p className="text-foreground-muted text-sm">{copy.untouched}</p>
        </div>
      ) : (
        <div
          className={cn(
            'flex flex-col items-center gap-3 rounded-lg border border-dashed px-6 py-10 text-center',
            over ? 'border-accent bg-surface-2' : 'border-border',
          )}
          data-testid="import-dropzone"
          onDragLeave={() => setOver(false)}
          onDragOver={(event) => {
            event.preventDefault()
            setOver(true)
          }}
          onDrop={onDrop}
        >
          <UploadIcon size={24} />
          <p className="text-sm">{copy.dropHere}</p>
          <Button onClick={() => input.current?.click()} size="sm" variant="secondary">
            {copy.chooseFile}
          </Button>
          <input
            accept={ACCEPT}
            className="sr-only"
            onChange={(event) => take(event.target.files?.[0])}
            ref={input}
            type="file"
          />
        </div>
      )}
    </Dialog>
  )
}
