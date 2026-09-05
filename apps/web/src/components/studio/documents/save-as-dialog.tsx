'use client'

import { Button, Dialog, Input, Label } from '@motion-studio/ui'
import { type FormEvent, useState } from 'react'

import { useStudio } from '../../../lib/i18n/studio-surface'
import { useStudioStore } from '../../../store/editor-store'

import { useDocuments } from './documents-context'

/**
 * `Save as` copies the open document under a new name and switches to the copy, which is what the
 * command means everywhere else it exists. The original stays exactly as it was on disk — that is
 * the whole difference between this and a rename.
 */
export function SaveAsDialog() {
  const { documents: copy } = useStudio()
  const open = useStudioStore((state) => state.ui.activeDialog === 'save-as')
  const setActiveDialog = useStudioStore((state) => state.setActiveDialog)
  const currentName = useStudioStore((state) => state.document.meta.name)
  const { saveAs } = useDocuments()
  const [name, setName] = useState('')

  const submit = (event: FormEvent): void => {
    event.preventDefault()

    const chosen = name.trim() === '' ? `${currentName} copy` : name.trim()

    setActiveDialog(null)
    setName('')
    void saveAs(chosen)
  }

  return (
    <Dialog
      description={copy.saveAsDescription}
      onOpenChange={(next) => setActiveDialog(next ? 'save-as' : null)}
      open={open}
      size="sm"
      title={copy.saveAsTitle}
    >
      <form className="flex flex-col gap-3" onSubmit={submit}>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="save-as-name">{copy.name}</Label>
          <Input
            autoFocus
            id="save-as-name"
            onChange={(event) => setName(event.target.value)}
            placeholder={`${currentName} copy`}
            value={name}
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button onClick={() => setActiveDialog(null)} size="sm" type="button" variant="secondary">
            {copy.cancel}
          </Button>
          <Button size="sm" type="submit" variant="primary">
            {copy.saveCopy}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
