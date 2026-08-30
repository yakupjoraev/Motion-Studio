import type { DialogId } from '@motion-studio/editor'
import { ToastProvider } from '@motion-studio/ui'
import { type RenderResult, render } from '@testing-library/react'
import { IDBFactory } from 'fake-indexeddb'
import type { ReactElement } from 'react'

import { closeDatabase } from '../../../lib/storage/idb'
import { useStudioStore } from '../../../store/editor-store'

import { DocumentsProvider } from './documents-context'

/** A fresh database and a cleared index per test: the storage layer is a global, and tests are not. */
export function resetStorage(): void {
  window.localStorage.clear()
  closeDatabase()
  globalThis.indexedDB = new IDBFactory()
}

/** Every dialog reads its openness from the store, so a test opens one by setting the flag. */
export function openDialog(dialog: DialogId): void {
  useStudioStore.getState().setActiveDialog(dialog)
}

export const renderWithDocuments = (ui: ReactElement): RenderResult =>
  render(
    <ToastProvider>
      <DocumentsProvider>{ui}</DocumentsProvider>
    </ToastProvider>,
  )
