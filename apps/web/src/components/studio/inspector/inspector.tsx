'use client'

import { EmptyState, PanelHeader } from '@motion-studio/ui'

/**
 * UI_GUIDELINES.md § Loading and empty states wants document settings here when nothing is selected.
 * Those settings are properties of a document, and the document model arrives in prompt 12; until it
 * does, the honest state is that there is nothing to select.
 */
export function Inspector() {
  return (
    <div className="flex h-full flex-col">
      <PanelHeader title="Inspector" />
      <EmptyState className="flex-1" message="No selection." />
    </div>
  )
}
