'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'

import { useAutosave } from '../../../lib/storage/use-autosave'
import { useStudioStore } from '../../../store/editor-store'

import { useDocumentIntake } from './use-document-intake'
import { isFixtureSession, useDocumentSession } from './use-document-session'

/**
 * The five dialogs, each mounted from the first time it opens — ADR-313.
 *
 * ADR-290 measured this split at 2 kB and declined it, correctly at the time: the weight was the
 * schema and the registry, which the store brought anyway. The registry left the first load, so the
 * premise went with it, and what these five hold up now is Radix's dialog machinery —
 * `react-remove-scroll` and the dismissable layer — for a studio in which every one of them is
 * closed.
 *
 * They are prefetched on idle, so opening one is still a render rather than a request.
 */
const TemplatePicker = dynamic(
  () => import('./template-picker').then((module) => module.TemplatePicker),
  { ssr: false },
)

const DocumentListDialog = dynamic(
  () => import('./document-list-dialog').then((module) => module.DocumentListDialog),
  { ssr: false },
)

const ImportDialog = dynamic(
  () => import('./import-dialog').then((module) => module.ImportDialog),
  {
    ssr: false,
  },
)

const SaveAsDialog = dynamic(
  () => import('./save-as-dialog').then((module) => module.SaveAsDialog),
  {
    ssr: false,
  },
)

const VersionHistoryDialog = dynamic(
  () => import('./version-history-dialog').then((module) => module.VersionHistoryDialog),
  { ssr: false },
)

const prefetchDialogs = (): void => {
  void import('./template-picker')
  void import('./document-list-dialog')
  void import('./import-dialog')
  void import('./save-as-dialog')
  void import('./version-history-dialog')
}

/**
 * Everything the persistence layer puts on screen, in one mount — the same shape `ThemeHost` uses.
 * The three hooks render nothing, so a studio that never opens a dialog costs an effect and two
 * listeners.
 */
export function DocumentsHost() {
  useDocumentSession()
  useAutosave({ enabled: !isFixtureSession() })
  useDocumentIntake()

  const active = useStudioStore((state) => state.ui.activeDialog)
  const [opened, setOpened] = useState<ReadonlySet<string>>(new Set())

  useEffect(() => {
    if (active === null || opened.has(active)) {
      return
    }

    setOpened((current) => new Set([...current, active]))
  }, [active, opened])

  useEffect(() => {
    if (typeof requestIdleCallback !== 'function') {
      prefetchDialogs()

      return
    }

    const handle = requestIdleCallback(prefetchDialogs, { timeout: 3000 })

    return () => cancelIdleCallback(handle)
  }, [])

  return (
    <>
      {opened.has('templates') ? <TemplatePicker /> : null}
      {opened.has('documents') ? <DocumentListDialog /> : null}
      {opened.has('import') ? <ImportDialog /> : null}
      {opened.has('save-as') ? <SaveAsDialog /> : null}
      {opened.has('version-history') ? <VersionHistoryDialog /> : null}
    </>
  )
}
