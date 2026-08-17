'use client'

import { PRESETS, type PresetId } from '@motion-studio/theme'
import { Button, ScrollArea } from '@motion-studio/ui'
import { useState } from 'react'

import { useStudioStore } from '../../../../store/editor-store'

import { ContrastReport } from './contrast-report'
import { ExportTokensDialog } from './export-tokens-dialog'
import { ModeToggle } from './mode-toggle'
import { PaletteControls } from './palette-controls'
import { PresetPicker } from './preset-picker'
import { PresetRename } from './preset-rename'
import { ScaleControls } from './scale-controls'
import { SurfaceControls } from './surface-controls'
import { ThemeSection } from './theme-section'
import { resolveFor } from './theme-variables'
import { TypographyControls } from './typography-controls'
import { useCustomPresets } from './use-custom-presets'
import { useThemeEdit } from './use-theme-edit'

const isPresetId = (id: string): id is PresetId => Object.hasOwn(PRESETS, id)

/**
 * The Theme tab — `THEME_ENGINE.md` § Theme builder UI, in that order: mode, presets, palette, scales,
 * typography, surface, and the contrast report above the action row.
 *
 * Every control writes its variables immediately and dispatches a coalesced command, so the document
 * repaints at 60 fps with no React render and the whole session is one undo step per control.
 */
export function ThemeTab() {
  const { config } = useThemeEdit()
  const applyPreset = useStudioStore((state) => state.applyThemePreset)
  const setTheme = useStudioStore((state) => state.setTheme)
  const custom = useCustomPresets()
  const [naming, setNaming] = useState(false)

  /** `Reset` goes back to the preset the theme is based on — `config.id` names it, and editing a
   * token never changes the id. A theme based on nothing the shelf or the catalogue holds has nothing
   * to go back to, and the button says so rather than guessing. */
  const resetAction = (): (() => void) | undefined => {
    const id = config.id

    if (isPresetId(id)) {
      return () => applyPreset(id)
    }

    const saved = custom.presets.find((preset) => preset.id === id)

    return saved === undefined ? undefined : () => setTheme(saved)
  }

  const reset = resetAction()

  return (
    <ScrollArea className="h-full">
      <div className="flex flex-col gap-4 p-2" data-testid="theme-tab">
        <ThemeSection title="Mode">
          <ModeToggle />
        </ThemeSection>

        <ThemeSection title="Preset">
          <PresetPicker activeId={config.id} custom={custom} />
        </ThemeSection>

        <ThemeSection title="Palette">
          <PaletteControls />
        </ThemeSection>

        <ThemeSection title="Scales">
          <ScaleControls />
        </ThemeSection>

        <ThemeSection title="Typography">
          <TypographyControls />
        </ThemeSection>

        <ThemeSection title="Surface">
          <SurfaceControls />
        </ThemeSection>

        <ContrastReport resolution={resolveFor(config)} />

        <div className="flex flex-wrap items-center gap-2 border-border border-t pt-3">
          <Button
            disabled={reset === undefined}
            onClick={reset}
            size="sm"
            title={reset === undefined ? 'This theme is not based on a preset' : undefined}
            variant="ghost"
          >
            Reset
          </Button>
          <Button onClick={() => setNaming(true)} size="sm" variant="secondary">
            Save as preset
          </Button>
          <ExportTokensDialog config={config} />
        </div>

        {naming ? (
          <PresetRename
            name={`${config.name} copy`}
            onCancel={() => setNaming(false)}
            onSubmit={(name) => {
              custom.save(config, name)
              setNaming(false)
            }}
          />
        ) : null}
      </div>
    </ScrollArea>
  )
}
