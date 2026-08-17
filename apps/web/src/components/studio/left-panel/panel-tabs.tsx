'use client'

import type { LeftTab } from '@motion-studio/editor'
import type { TabItem } from '@motion-studio/ui'
import dynamic from 'next/dynamic'

import { ThemeTabBadge } from './theme/theme-tab-badge'

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
 * they pull fifty-one presets, thirteen effect components and the motion applier. The theme builder
 * joins them: the colour picker alone is react-aria.
 */
const BlocksTab = dynamic(() => import('./blocks/blocks-tab').then((module) => module.BlocksTab), {
  loading: () => <PanelSkeleton />,
})

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

const ThemeTab = dynamic(() => import('./theme/theme-tab').then((module) => module.ThemeTab), {
  loading: () => <PanelSkeleton />,
})

/**
 * PRODUCT.md § 2, in order.
 *
 * `contrastNotices` puts the theme's repair count on the Theme tab, so a failing pair stays visible
 * from the other four tabs.
 */
export const panelTabs = (contrastNotices = 0): readonly TabItem[] => [
  { value: 'blocks', label: 'Blocks', content: <BlocksTab /> },
  { value: 'motion', label: 'Motion', content: <MotionTab /> },
  { value: 'effects', label: 'Effects', content: <EffectsTab /> },
  {
    value: 'theme',
    label: 'Theme',
    content: <ThemeTab />,
    ...(contrastNotices === 0 ? {} : { icon: <ThemeTabBadge count={contrastNotices} /> }),
  },
  { value: 'layers', label: 'Layers', content: <LayersPanel /> },
]

export const DEFAULT_PANEL_TAB = 'blocks'

const TAB_VALUES: readonly string[] = panelTabs().map((tab) => tab.value)

/** Radix hands a tab change back as a string; the store's tab is a union, and this is the seam. */
export const isLeftTab = (value: string): value is LeftTab => TAB_VALUES.includes(value)
