'use client'

import { useEffect } from 'react'

import { useStudioStore } from '../../../store/editor-store'

import { useDocuments } from './documents-context'

/**
 * A cheap shape test, run before the pipeline: the two required fields of the envelope. It is not
 * validation — `importDocument` does that, and reports what it found. This only answers "is this
 * paste meant for us, or is it someone's prose".
 */
export const looksLikeDocument = (text: string): boolean => {
  const trimmed = text.trimStart()

  return trimmed.startsWith('{') && trimmed.includes('"version"') && trimmed.includes('"nodes"')
}

const isTextEntry = (target: EventTarget | null): boolean =>
  target instanceof HTMLElement &&
  (target.isContentEditable ||
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement)

/**
 * The two sources that are not the file picker — FILE_FORMAT.md § Import: a drop on the canvas and a
 * paste with nothing selected.
 *
 * The paste rides the **native** event rather than the shortcut registry. `Mod+V` is bound only when
 * the store's clipboard holds blocks (`menuAvailability`), so with an empty clipboard the binding
 * stands aside, the browser's own paste fires, and this listener sees it. When blocks *are* on the
 * clipboard the block paste wins, which is the right answer for that keystroke.
 */
export function useDocumentIntake(): void {
  const { read } = useDocuments()
  const setActiveDialog = useStudioStore((state) => state.setActiveDialog)

  useEffect(() => {
    const onPaste = (event: ClipboardEvent): void => {
      if (isTextEntry(event.target) || useStudioStore.getState().selection.ids.length > 0) {
        return
      }

      const text = event.clipboardData?.getData('text/plain') ?? ''

      if (!looksLikeDocument(text)) {
        return
      }

      event.preventDefault()
      read(text, 'Pasted document.motion.json')
      setActiveDialog('import')
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
      void file.text().then((text) => {
        read(text, file.name)
        setActiveDialog('import')
      })
    }

    document.addEventListener('paste', onPaste)
    window.addEventListener('dragover', onDragOver)
    window.addEventListener('drop', onDrop)

    return () => {
      document.removeEventListener('paste', onPaste)
      window.removeEventListener('dragover', onDragOver)
      window.removeEventListener('drop', onDrop)
    }
  }, [read, setActiveDialog])
}
