'use client'

import type { LeftTab } from '@motion-studio/editor'
import type { TabItem } from '@motion-studio/ui'

import dynamic from 'next/dynamic'
import type { Dictionary } from '../../../lib/i18n/dictionary'

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
export const panelTabs = (
  copy: Dictionary['studio']['panels'],
  contrastNotices = 0,
): readonly TabItem[] => [
  { value: 'blocks', label: copy.blocks, content: <BlocksTab /> },
  { value: 'motion', label: copy.motion, content: <MotionTab /> },
  { value: 'effects', label: copy.effects, content: <EffectsTab /> },
  {
    value: 'theme',
    label: copy.theme,
    content: <ThemeTab />,
    ...(contrastNotices === 0 ? {} : { icon: <ThemeTabBadge count={contrastNotices} /> }),
  },
  { value: 'layers', label: copy.layers, content: <LayersPanel /> },
]

export const DEFAULT_PANEL_TAB = 'blocks'

/*
 * The values, written out rather than read back from `panelTabs`. A tab's value is not translated,
 * so this seam has no business holding a dictionary — and importing one here would have put every
 * string in the product into the studio's first-load chunk, measured at 1.9 kB over its budget.
 */
const TAB_VALUES: readonly string[] = ['blocks', 'motion', 'effects', 'theme', 'layers']

/** Radix hands a tab change back as a string; the store's tab is a union, and this is the seam. */
export const isLeftTab = (value: string): value is LeftTab => TAB_VALUES.includes(value)
