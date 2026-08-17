'use client'

import { Input } from '@motion-studio/ui'
import { useState } from 'react'

export interface PresetRenameProps {
  readonly name: string
  readonly onSubmit: (name: string) => void
  readonly onCancel: () => void
}

/**
 * Renaming a saved preset in place — the same shape the layers tree uses: `Enter` commits, `Escape`
 * cancels, blur commits. A blank name cancels rather than saving an unnamed preset.
 */
export function PresetRename({ name, onSubmit, onCancel }: PresetRenameProps) {
  const [draft, setDraft] = useState(name)

  const submit = (): void => {
    const trimmed = draft.trim()

    if (trimmed === '' || trimmed === name) {
      onCancel()

      return
    }

    onSubmit(trimmed)
  }

  return (
    <Input
      aria-label="Preset name"
      autoFocus
      className="h-7 text-xs"
      onBlur={submit}
      onChange={(event) => setDraft(event.target.value)}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          event.preventDefault()
          submit()
        }

        if (event.key === 'Escape') {
          event.preventDefault()
          onCancel()
        }
      }}
      value={draft}
    />
  )
}
