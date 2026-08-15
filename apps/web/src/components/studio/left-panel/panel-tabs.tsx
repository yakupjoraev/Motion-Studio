'use client'

import { EmptyState, type TabItem } from '@motion-studio/ui'
import dynamic from 'next/dynamic'

const LayersSkeleton = () => (
  <div className="flex flex-col gap-1 p-2" data-testid="layers-loading">
    <span className="h-[26px] w-full animate-pulse rounded-xs bg-surface-2" />
    <span className="h-[26px] w-full animate-pulse rounded-xs bg-surface-2" />
  </div>
)

/**
 * The tree, the virtualizer and the drag wiring are a chunk the studio downloads when the Layers tab
 * is first opened — the contract's 250 kB budget for `/studio`, and the same treatment the inspector's
 * body gets.
 */
const LayersPanel = dynamic(
  () => import('./layers/layers-panel').then((module) => module.LayersPanel),
  { loading: () => <LayersSkeleton /> },
)

/**
 * PRODUCT.md § 2, in order. A tab whose content does not exist yet shows its empty state: one
 * sentence, no illustration, and no action, because the thing that would fill it — the registry — has
 * no reader until its own prompt.
 */
const TABS: readonly { value: string; label: string; message: string }[] = [
  { value: 'blocks', label: 'Blocks', message: 'No blocks are registered.' },
  { value: 'motion', label: 'Motion', message: 'No motion presets are registered.' },
  { value: 'effects', label: 'Effects', message: 'No effects are registered.' },
  { value: 'theme', label: 'Theme', message: 'No document is open.' },
]

export const PANEL_TABS: readonly TabItem[] = [
  ...TABS.map((tab) => ({
    value: tab.value,
    label: tab.label,
    content: <EmptyState className="h-full" message={tab.message} />,
  })),
  { value: 'layers', label: 'Layers', content: <LayersPanel /> },
]

export const DEFAULT_PANEL_TAB = 'blocks'
