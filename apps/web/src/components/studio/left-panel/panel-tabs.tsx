'use client'

import type { LeftTab } from '@motion-studio/editor'
import { EmptyState, type TabItem } from '@motion-studio/ui'
import dynamic from 'next/dynamic'

const PanelSkeleton = () => (
  <div className="flex flex-col gap-1 p-2" data-testid="panel-loading">
    <span className="h-[26px] w-full animate-pulse rounded-xs bg-surface-2" />
    <span className="h-[26px] w-full animate-pulse rounded-xs bg-surface-2" />
  </div>
)

/**
 * The tree, the virtualizer and the drag wiring are a chunk the studio downloads when the Layers tab
 * is first opened — the contract's 250 kB budget for `/studio`, and the same treatment the inspector's
 * body gets. The motion and effects catalogues are the same trade for the same reason: between them
 * they pull fifty-one presets, thirteen effect components and the motion applier.
 */
const LayersPanel = dynamic(
  () => import('./layers/layers-panel').then((module) => module.LayersPanel),
  { loading: () => <PanelSkeleton /> },
)

const MotionTab = dynamic(() => import('./motion-tab').then((module) => module.MotionTab), {
  loading: () => <PanelSkeleton />,
})

const EffectsTab = dynamic(() => import('./effects-tab').then((module) => module.EffectsTab), {
  loading: () => <PanelSkeleton />,
})

/**
 * PRODUCT.md § 2, in order. A tab whose content does not exist yet shows its empty state: one
 * sentence, no illustration, and no action, because the thing that would fill it — the block
 * palette — has no reader until its own prompt.
 */
export const PANEL_TABS: readonly TabItem[] = [
  {
    value: 'blocks',
    label: 'Blocks',
    content: <EmptyState className="h-full" message="No blocks are registered." />,
  },
  { value: 'motion', label: 'Motion', content: <MotionTab /> },
  { value: 'effects', label: 'Effects', content: <EffectsTab /> },
  {
    value: 'theme',
    label: 'Theme',
    content: <EmptyState className="h-full" message="No document is open." />,
  },
  { value: 'layers', label: 'Layers', content: <LayersPanel /> },
]

export const DEFAULT_PANEL_TAB = 'blocks'

/** Radix hands a tab change back as a string; the store's tab is a union, and this is the seam. */
export const isLeftTab = (value: string): value is LeftTab =>
  PANEL_TABS.some((tab) => tab.value === value)
