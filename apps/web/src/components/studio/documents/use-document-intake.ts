'use client'

import { useEffect } from 'react'

import { useStudioStore } from '../../../store/editor-store'

import { PASTED_FILE_NAME, connectDocumentPaste, looksLikeDocument } from './document-paste-port'
import { useDocuments } from './documents-context'

const isTextEntry = (target: EventTarget | null): boolean =>
  target instanceof HTMLElement &&
  (target.isContentEditable ||
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement)

/**
 * The two sources that are not the file picker — FILE_FORMAT.md § Import: a drop on the canvas and a
 * paste with nothing selected.
 *
 * A paste arrives by one of two routes, because `Mod+V` is bound only when the store's clipboard
 * holds blocks. With an empty clipboard the binding stands aside and the browser's own paste event
 * fires, which the listener below takes. With blocks on the clipboard the shortcut runs, and it asks
 * the port first — ADR-291. Both routes end in the same `read`.
 */
export function useDocumentIntake(): void {
  const { read } = useDocuments()
  const setActiveDialog = useStudioStore((state) => state.setActiveDialog)

  useEffect(() => {
    const take = (text: string, fileName: string): void => {
      read(text, fileName)
      setActiveDialog('import')
    }

    const onPaste = (event: ClipboardEvent): void => {
      if (isTextEntry(event.target) || useStudioStore.getState().selection.ids.length > 0) {
        return
      }

      const text = event.clipboardData?.getData('text/plain') ?? ''

      if (!looksLikeDocument(text)) {
        return
      }

      event.preventDefault()
      take(text, PASTED_FILE_NAME)
    }

    const onDragOver = (event: DragEvent): void => {
      if (Array.from(event.dataTransfer?.types ?? []).includes('Files')) {
        event.preventDefault()
      }
    }

    const onDrop = (event: DragEvent): void => {
      const file = event.dataTransfer?.files[0]

      if (file === undefined) {
        return
      }

      event.preventDefault()
      void file.text().then((text) => take(text, file.name))
    }

    connectDocumentPaste(take)
    document.addEventListener('paste', onPaste)
    window.addEventListener('dragover', onDragOver)
    window.addEventListener('drop', onDrop)

    return () => {
      connectDocumentPaste(undefined)
      document.removeEventListener('paste', onPaste)
      window.removeEventListener('dragover', onDragOver)
      window.removeEventListener('drop', onDrop)
    }
  }, [read, setActiveDialog])
}
