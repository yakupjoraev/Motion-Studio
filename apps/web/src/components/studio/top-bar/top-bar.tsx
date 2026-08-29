'use client'

import { PanelLeftIcon, PanelRightIcon, SearchIcon } from '@motion-studio/icons'
import { Button, Kbd, Separator } from '@motion-studio/ui'

import type { PanelSide } from '../../../hooks/panel-layout'

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
  return (
    <header className="col-span-3 flex h-[48px] items-center gap-2 border-border border-b bg-surface-1 px-2">
      <Button
        aria-label="Toggle left panel"
        aria-pressed={leftOpen}
        onClick={() => onTogglePanel('left')}
        size="icon"
        variant="ghost"
      >
        <PanelLeftIcon size={20} />
      </Button>

      <span className="px-1 font-medium text-sm tracking-tight">Motion Studio</span>

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

      <Button aria-label="Command palette" disabled size="sm" variant="ghost">
        <SearchIcon size={16} />
        <Kbd keys="Mod+K" />
      </Button>

      <Button
        aria-label="Toggle inspector"
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
