'use client'

import { MoreHorizontalIcon } from '@motion-studio/icons'
import { PRESETS, type PresetId, type ThemeConfig } from '@motion-studio/theme'
import { Button, Dropdown } from '@motion-studio/ui'
import { useState } from 'react'

import { useStudioStore } from '../../../../store/editor-store'

import { PresetCard } from './preset-card'
import { PresetRename } from './preset-rename'

import type { CustomPresets } from './use-custom-presets'

const SHIPPED = Object.entries(PRESETS) as readonly (readonly [PresetId, ThemeConfig])[]

export interface PresetPickerProps {
  readonly activeId: string
  readonly custom: CustomPresets
}

/**
 * The ten shipped presets and the saved shelf — `THEME_ENGINE.md` § Presets and § Theme builder UI.
 *
 * Applying is one command either way, so it is one undo step however many tokens it moves:
 * `applyThemePreset` for a shipped preset, whose id the union names, and `setTheme` for a saved one,
 * whose id it cannot — ADR-173.
 */
export function PresetPicker({ activeId, custom }: PresetPickerProps) {
  const applyPreset = useStudioStore((state) => state.applyThemePreset)
  const setTheme = useStudioStore((state) => state.setTheme)
  const [renaming, setRenaming] = useState<string | null>(null)

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-2 gap-2" data-testid="theme-presets">
        {SHIPPED.map(([id, preset]) => (
          <PresetCard
            applied={activeId === id}
            key={id}
            onApply={() => applyPreset(id)}
            theme={preset}
          />
        ))}
      </div>

      {custom.presets.length === 0 ? null : (
        <>
          <h3 className="px-1 font-medium text-[11px] text-foreground-subtle uppercase tracking-wide">
            Saved
          </h3>
          <div className="grid grid-cols-2 gap-2" data-testid="theme-saved-presets">
            {custom.presets.map((preset) =>
              renaming === preset.id ? (
                <PresetRename
                  key={preset.id}
                  name={preset.name}
                  onCancel={() => setRenaming(null)}
                  onSubmit={(name) => {
                    custom.rename(preset.id, name)
                    setRenaming(null)
                  }}
                />
              ) : (
                <PresetCard
                  actions={
                    <Dropdown
                      align="end"
                      items={[
                        {
                          id: 'rename',
                          label: 'Rename',
                          onSelect: () => setRenaming(preset.id),
                        },
                        {
                          id: 'delete',
                          label: 'Delete',
                          danger: true,
                          onSelect: () => custom.remove(preset.id),
                        },
                      ]}
                      trigger={
                        <Button
                          aria-label={`Saved preset ${preset.name} actions`}
                          className="h-5 w-5"
                          size="icon"
                          variant="ghost"
                        >
                          <MoreHorizontalIcon size={12} />
                        </Button>
                      }
                    />
                  }
                  applied={activeId === preset.id}
                  key={preset.id}
                  onApply={setTheme}
                  theme={preset}
                />
              ),
            )}
          </div>
        </>
      )}
    </div>
  )
}
