'use client'

import { Tabs } from '@motion-studio/ui'

import { useStudioStore } from '../../../store/editor-store'

import { PANEL_TABS, isLeftTab } from './panel-tabs'

/**
 * The tab strip and its content area. Five tabs at `text-xs` measure about 285 px and § Layout puts the
 * panel's floor at 240 px, so the strip scrolls horizontally rather than clipping its last tab. The
 * scrollbar is suppressed because the strip is 36 px tall and a visible one would eat a third of it.
 *
 * The active tab lives in the store rather than in the component: `Alt+1` … `Alt+5` switch it from
 * the keyboard, and a tab strip that owned its own state would ignore them.
 */
export function LeftPanel() {
  const tab = useStudioStore((state) => state.ui.leftPanel.tab)
  const setLeftTab = useStudioStore((state) => state.setLeftTab)

  return (
    <Tabs
      aria-label="Panels"
      className="h-full [&_[role=tablist]]:overflow-x-auto [&_[role=tablist]]:[scrollbar-width:none]"
      items={PANEL_TABS}
      onValueChange={(next) => {
        if (isLeftTab(next)) {
          setLeftTab(next)
        }
      }}
      value={tab}
    />
  )
}
