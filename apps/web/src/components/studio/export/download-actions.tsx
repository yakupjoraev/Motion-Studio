'use client'

import type { ExportFile } from '@motion-studio/codegen'
import { DownloadIcon, SaveIcon } from '@motion-studio/icons'
import { Button } from '@motion-studio/ui'
import { kebab } from '@motion-studio/utils'
import { useState } from 'react'

export interface DownloadActionsProps {
  readonly files: readonly ExportFile[]
  /** The file the viewer is showing: what a plain download saves. */
  readonly selected: ExportFile | null
  readonly documentName: string
  readonly onCopyAll: () => void
  readonly disabled: boolean
}

/** `hero-page-2026-08-23.zip`: the document, then the day, which is what a downloads folder sorts by. */
export const archiveName = (documentName: string, today: Date): string => {
  const stamp = today.toISOString().slice(0, 10)
  const stem = kebab(documentName)

  return `${stem === '' ? 'export' : stem}-${stamp}.zip`
}

/** A single `Blob` handed to the browser. Revoked on the next frame; the click has already happened. */
const save = (blob: Blob, name: string): void => {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')

  anchor.href = url
  anchor.download = name
  anchor.click()

  requestAnimationFrame(() => URL.revokeObjectURL(url))
}

/**
 * Copy all, download the tree, and zip it. `jszip` is behind the button rather than in the dialog —
 * 28 kB that only a download spends, PERFORMANCE.md § Mandatory dynamic imports.
 */
export function DownloadActions({
  files,
  selected,
  documentName,
  onCopyAll,
  disabled,
}: DownloadActionsProps) {
  const [zipping, setZipping] = useState(false)

  const zip = async (): Promise<void> => {
    setZipping(true)

    try {
      const { default: JSZip } = await import('jszip')
      const archive = new JSZip()

      for (const file of files) {
        archive.file(file.path, file.contents)
      }

      save(await archive.generateAsync({ type: 'blob' }), archiveName(documentName, new Date()))
    } finally {
      setZipping(false)
    }
  }

  return (
    <>
      <Button disabled={disabled} onClick={onCopyAll} size="sm" variant="secondary">
        Copy all
      </Button>

      <Button
        disabled={disabled || selected === null}
        leadingIcon={<SaveIcon size={14} />}
        onClick={() => {
          if (selected !== null) {
            const name = selected.path.slice(selected.path.lastIndexOf('/') + 1)

            save(new Blob([selected.contents], { type: 'text/plain' }), name)
          }
        }}
        size="sm"
        variant="secondary"
      >
        Download file
      </Button>

      <Button
        disabled={disabled || zipping}
        leadingIcon={<DownloadIcon size={14} />}
        onClick={() => void zip()}
        size="sm"
        variant="primary"
      >
        {zipping ? 'Zipping…' : 'Download .zip'}
      </Button>
    </>
  )
}
