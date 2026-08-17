'use client'

import { Tabs } from '@motion-studio/ui'
import { useMemo } from 'react'

import { useStudioStore } from '../../../store/editor-store'

import { isLeftTab, panelTabs } from './panel-tabs'
import { contrastNoticeCount } from './theme/contrast-count'
import { resolveFor } from './theme/theme-variables'

/**
 * The tab strip and its content area. Five tabs at `text-xs` measure about 285 px and § Layout puts the
 * panel's floor at 240 px, so the strip scrolls horizontally rather than clipping its last tab. The
 * scrollbar is suppressed because the strip is 36 px tall and a visible one would eat a third of it.
 *
 * The active tab lives in the store rather than in the component: `Alt+1` … `Alt+5` switch it from
 * the keyboard, and a tab strip that owned its own state would ignore them.
 *
 * The theme is read here for one number — the contrast count on the Theme tab. Resolving is memoised
 * and costs 0.21 ms on a miss (ADR-174), and this renders on a committed theme edit, never during a
 * drag: the drag writes variables and dispatches nothing.
 */
export function LeftPanel() {
  const tab = useStudioStore((state) => state.ui.leftPanel.tab)
  const setLeftTab = useStudioStore((state) => state.setLeftTab)
  const theme = useStudioStore((state) => state.document.theme)

  const items = useMemo(() => panelTabs(contrastNoticeCount(resolveFor(theme))), [theme])

  return (
    <Tabs
      aria-label="Panels"
      className="h-full [&_[role=tablist]]:overflow-x-auto [&_[role=tablist]]:[scrollbar-width:none]"
      items={items}
      onValueChange={(next) => {
        if (isLeftTab(next)) {
          setLeftTab(next)
        }
      }}
      value={tab}
    />
  )
}
