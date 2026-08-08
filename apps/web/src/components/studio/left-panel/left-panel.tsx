'use client'

import { Tabs } from '@motion-studio/ui'

import { DEFAULT_PANEL_TAB, PANEL_TABS } from './panel-tabs'

/**
 * The tab strip and its content area. Five tabs at `text-xs` measure about 285 px and § Layout puts the
 * panel's floor at 240 px, so the strip scrolls horizontally rather than clipping its last tab. The
 * scrollbar is suppressed because the strip is 36 px tall and a visible one would eat a third of it.
 */
export function LeftPanel() {
  return (
    <Tabs
      aria-label="Panels"
      className="h-full [&_[role=tablist]]:overflow-x-auto [&_[role=tablist]]:[scrollbar-width:none]"
      defaultValue={DEFAULT_PANEL_TAB}
      items={PANEL_TABS}
    />
  )
}
