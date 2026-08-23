'use client'

import { useShortcuts } from '@motion-studio/hooks'
import { useToast } from '@motion-studio/ui'
import dynamic from 'next/dynamic'
import { useMemo } from 'react'

import { useStudioStore } from '../../../store/editor-store'

import type { CanvasCommands, PanelCommands, StudioShortcutContext } from './shortcut.types'
import { studioShortcuts } from './studio-registry'

/**
 * Both overlays are chunks, and both are mounted only while they are open. The palette's item list
 * reaches the whole preset catalogue, every block and every theme — 150 kB of the studio's budget if
 * it were in the first load, for a surface that opens on `Mod+K` and not before.
 */
const CommandPalette = dynamic(
  () => import('../command-palette/command-palette').then((module) => module.CommandPalette),
  { ssr: false },
)

const ShortcutSheetDialog = dynamic(
  () => import('./shortcut-sheet-dialog').then((module) => module.ShortcutSheetDialog),
  { ssr: false },
)

export interface ShortcutHostProps {
  /** Present once the canvas has mounted; the bindings that need geometry check for it. */
  readonly canvas?: CanvasCommands | null
  /** The shell's own panel state, which is a layout preference rather than document state. */
  readonly panels?: PanelCommands | null
}

/**
 * The one keydown listener the studio has, and the two surfaces generated from the same registry it
 * runs: the command palette and the `Mod+/` reference sheet.
 */
export function ShortcutHost({ canvas = null, panels = null }: ShortcutHostProps) {
  const paletteOpen = useStudioStore((state) => state.ui.commandPaletteOpen)
  const sheetOpen = useStudioStore((state) => state.ui.activeDialog === 'shortcuts')

  const notify = useToast()

  const context = useMemo<StudioShortcutContext>(
    () => ({ store: useStudioStore, canvas, panels, notify }),
    [canvas, notify, panels],
  )

  useShortcuts({ registry: studioShortcuts, context })

  return (
    <>
      {/* The map is a chunk (ADR-152), so "are the shortcuts live yet" is a real question with a
          real answer. A test waits for this; a browser walkthrough can read it too. */}
      <span data-testid="shortcut-host" hidden />
      {paletteOpen ? <CommandPalette context={context} /> : null}
      {sheetOpen ? <ShortcutSheetDialog context={context} /> : null}
    </>
  )
}
