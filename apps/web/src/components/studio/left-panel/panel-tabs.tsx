'use client'

import { EmptyState, type TabItem } from '@motion-studio/ui'

/**
 * PRODUCT.md § 2, in order. Each tab's body is its empty state: one sentence, no illustration, and no
 * action, because the thing that would fill it — the registry, a document — does not exist yet and a
 * button that leads nowhere is worse than none.
 */
const TABS: readonly { value: string; label: string; message: string }[] = [
  { value: 'blocks', label: 'Blocks', message: 'No blocks are registered.' },
  { value: 'motion', label: 'Motion', message: 'No motion presets are registered.' },
  { value: 'effects', label: 'Effects', message: 'No effects are registered.' },
  { value: 'theme', label: 'Theme', message: 'No document is open.' },
  { value: 'layers', label: 'Layers', message: 'No document is open.' },
]

export const PANEL_TABS: readonly TabItem[] = TABS.map((tab) => ({
  value: tab.value,
  label: tab.label,
  content: <EmptyState className="h-full" message={tab.message} />,
}))

export const DEFAULT_PANEL_TAB = 'blocks'
