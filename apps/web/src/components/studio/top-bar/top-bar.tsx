'use client'

import { CodeIcon, PanelLeftIcon, PanelRightIcon, SearchIcon } from '@motion-studio/icons'
import { Button, Kbd, Separator } from '@motion-studio/ui'

import type { PanelSide } from '../../../hooks/panel-layout'
import { useStudio } from '../../../lib/i18n/studio-surface'
import { useStudioStore } from '../../../store/editor-store'

import { BreakpointSwitcher } from './breakpoint-switcher'
import { EditMenu } from './edit-menu'
import { ExportButton } from './export-button'
import { FileMenu } from './file-menu'
import { HistoryButtons } from './history-buttons'
import { PlaygroundLink } from './playground-link'
import { ZoomControl } from './zoom-control'

export interface TopBarProps {
  readonly leftOpen: boolean
  readonly rightOpen: boolean
  readonly onTogglePanel: (side: PanelSide) => void
}

/** § Density scale: 48 px, hairline below, no shadow — depth in the chrome comes from value. */
export function TopBar({ leftOpen, rightOpen, onTogglePanel }: TopBarProps) {
  const { chrome } = useStudio()
  const codePanelOpen = useStudioStore((state) => state.ui.codePanelOpen)
  const setCodePanelOpen = useStudioStore((state) => state.setCodePanelOpen)

  return (
    <header className="col-span-3 flex h-[48px] items-center gap-2 border-border border-b bg-surface-1 px-2">
      <Button
        aria-label={chrome.toggleLeftPanel}
        aria-pressed={leftOpen}
        onClick={() => onTogglePanel('left')}
        size="icon"
        variant="ghost"
      >
        <PanelLeftIcon size={20} />
      </Button>

      <span className="px-1 font-medium text-sm tracking-tight">{chrome.brand}</span>

      <Separator className="mx-1 h-4" orientation="vertical" />

      <FileMenu />
      <EditMenu />

      <div className="flex flex-1 items-center justify-center gap-2">
        <HistoryButtons />
        <Separator className="mx-1 h-4" orientation="vertical" />
        <ZoomControl />
        <Separator className="mx-1 h-4" orientation="vertical" />
        <BreakpointSwitcher />
      </div>

      <Button aria-label={chrome.commandPalette} disabled size="sm" variant="ghost">
        <SearchIcon size={16} />
        <Kbd keys="Mod+K" />
      </Button>

      {/* Beside the inspector toggle because it toggles the region beside the inspector. Discoverable
          here rather than only on `Mod+Alt+C`: the code is what makes this not a page builder, and a
          differentiator nobody is told about is one nobody finds — `prompts/68`. */}
      <Button
        aria-label={chrome.toggleCodePanel}
        aria-pressed={codePanelOpen}
        data-testid="toggle-code-panel"
        onClick={() => setCodePanelOpen(!codePanelOpen)}
        size="icon"
        variant="ghost"
      >
        <CodeIcon size={20} />
      </Button>

      <Button
        aria-label={chrome.toggleInspector}
        aria-pressed={rightOpen}
        onClick={() => onTogglePanel('right')}
        size="icon"
        variant="ghost"
      >
        <PanelRightIcon size={20} />
      </Button>

      <PlaygroundLink />
      <ExportButton />
    </header>
  )
}
