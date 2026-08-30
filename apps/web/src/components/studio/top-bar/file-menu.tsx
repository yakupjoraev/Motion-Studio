'use client'

import { ChevronDownIcon } from '@motion-studio/icons'
import { Button, Dropdown, type DropdownEntry, useToast } from '@motion-studio/ui'

import { downloadDocument } from '../../../lib/documents/download'
import { useDocumentList } from '../../../lib/storage/use-document-list'
import { useStudioStore } from '../../../store/editor-store'

/** Enough to be useful in a menu, few enough that the menu stays a menu. */
const RECENT_LIMIT = 5

/**
 * `File` — PRODUCT.md § 10 and FILE_FORMAT.md § Autosave. Every entry here is a dialog or a download;
 * the writing itself belongs to autosave, which is why `Save` is a **flush**, not a save button.
 */
export function FileMenu() {
  const setActiveDialog = useStudioStore((state) => state.setActiveDialog)
  const documentId = useStudioStore((state) => state.document.meta.id)
  const publish = useToast()
  const { entries, open } = useDocumentList()

  const recent = entries.filter((entry) => entry.id !== documentId).slice(0, RECENT_LIMIT)

  const entriesForMenu: readonly DropdownEntry[] = [
    {
      id: 'new',
      label: 'New',
      // No shortcut hint: SHORTCUTS.md § Global has no binding for New or Save as, and a menu that
      // advertises a key nothing listens for is worse than one that advertises none.
      onSelect: () => setActiveDialog('templates'),
    },
    { id: 'open', label: 'Open', shortcut: 'Mod+O', onSelect: () => setActiveDialog('documents') },
    { kind: 'separator', id: 'after-open' },
    {
      id: 'save',
      label: 'Download a copy',
      shortcut: 'Mod+S',
      // Autosave already owns the write. What a person wants from `Save` in a local-first editor is
      // the file in their hands, so that is what this does — and it says so.
      onSelect: () => downloadDocument(useStudioStore.getState().document),
    },
    {
      id: 'save-as',
      label: 'Save as',
      shortcut: 'Mod+Shift+S',
      onSelect: () => setActiveDialog('save-as'),
    },
    { id: 'import', label: 'Import a document', onSelect: () => setActiveDialog('import') },
    {
      id: 'version-history',
      label: 'Version history',
      onSelect: () => setActiveDialog('version-history'),
    },
    { kind: 'separator', id: 'after-import' },
    { kind: 'label', id: 'recent-label', label: 'Recent' },
    ...(recent.length === 0
      ? [
          {
            id: 'recent-empty',
            label: 'No other documents',
            disabled: true,
            onSelect: () => undefined,
          } satisfies DropdownEntry,
        ]
      : recent.map(
          (entry): DropdownEntry => ({
            id: `recent-${entry.id}`,
            label: entry.name,
            hint: `${entry.nodeCount} blocks`,
            onSelect: () => {
              void open(entry.id).then((loaded) => {
                if (!loaded) {
                  publish({ title: `Could not open ${entry.name}`, tone: 'danger' })
                }
              })
            },
          }),
        )),
  ]

  return (
    <Dropdown
      align="start"
      items={entriesForMenu}
      trigger={
        <Button size="sm" trailingIcon={<ChevronDownIcon size={16} />} variant="ghost">
          File
        </Button>
      }
    />
  )
}
