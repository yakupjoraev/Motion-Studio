'use client'

import { ShortcutSheet } from '@motion-studio/hooks'
import { Dialog } from '@motion-studio/ui'

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
  const setActiveDialog = useStudioStore((state) => state.setActiveDialog)

  return (
    <Dialog
      description="Every shortcut the studio knows, generated from the registry that runs them."
      onOpenChange={(open) => setActiveDialog(open ? 'shortcuts' : null)}
      open
      title="Keyboard shortcuts"
    >
      <div data-shortcut-scope="dialog">
        <ShortcutSheet context={context} registry={studioShortcuts} />
      </div>
    </Dialog>
  )
}
