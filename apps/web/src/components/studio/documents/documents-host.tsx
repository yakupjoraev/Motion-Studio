'use client'

import { useAutosave } from '../../../lib/storage/use-autosave'

import { DocumentListDialog } from './document-list-dialog'
import { ImportDialog } from './import-dialog'
import { SaveAsDialog } from './save-as-dialog'
import { TemplatePicker } from './template-picker'
import { useDocumentIntake } from './use-document-intake'
import { isFixtureSession, useDocumentSession } from './use-document-session'
import { VersionHistoryDialog } from './version-history-dialog'

/**
 * Everything the persistence layer puts on screen, in one mount — the same shape `ThemeHost` uses.
 * The three hooks render nothing; the five dialogs render only when their flag is set, so this costs
 * a studio that never opens one an effect and two listeners.
 *
 * Nothing here is behind `next/dynamic`, and ADR-290 has the measurement: splitting all five bought
 * 2 kB of a 369 kB first load, because the weight is the schema and the registry, which the store
 * already brings.
 */
export function DocumentsHost() {
  useDocumentSession()
  useAutosave({ enabled: !isFixtureSession() })
  useDocumentIntake()

  return (
    <>
      <TemplatePicker />
      <DocumentListDialog />
      <ImportDialog />
      <SaveAsDialog />
      <VersionHistoryDialog />
    </>
  )
}
