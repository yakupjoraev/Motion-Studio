'use client'

import { ShortcutSheet, type ShortcutSheetCopy } from '@motion-studio/hooks'
import { Dialog } from '@motion-studio/ui'
import { useMemo } from 'react'

import { useStudio } from '../../../lib/i18n/studio-surface'
import { useStudioStore } from '../../../store/editor-store'

import type { StudioShortcutContext } from './shortcut.types'
import { studioShortcuts } from './studio-registry'

/**
 * `Mod+/`. The modal shell lives here rather than in `packages/hooks`, which sits below `ui` in the
 * dependency graph and cannot import a dialog; the contents are generated from the registry, which
 * is what makes this the only shortcut documentation that cannot go stale.
 */
export function ShortcutSheetDialog({
  context,
}: {
  readonly context: StudioShortcutContext
}) {
  const { chrome } = useStudio()
  const setActiveDialog = useStudioStore((state) => state.setActiveDialog)

  const copy = useMemo<ShortcutSheetCopy>(
    () => ({
      search: chrome.shortcutsSearch,
      searchPlaceholder: chrome.shortcutsSearchPlaceholder,
      empty: chrome.shortcutsEmpty,
      labels: chrome.shortcutLabels,
      groups: chrome.shortcutGroups,
    }),
    [chrome],
  )

  return (
    <Dialog
      description={chrome.shortcutsDescription}
      onOpenChange={(open) => setActiveDialog(open ? 'shortcuts' : null)}
      open
      title={chrome.shortcutsTitle}
    >
      <div data-shortcut-scope="dialog">
        <ShortcutSheet context={context} copy={copy} registry={studioShortcuts} />
      </div>
    </Dialog>
  )
}
