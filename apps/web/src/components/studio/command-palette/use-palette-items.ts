'use client'

import { blockRegistry } from '@motion-studio/blocks'
import { commands } from '@motion-studio/editor'
import { PRESETS as MOTION_PRESETS } from '@motion-studio/motion'
import { effectId } from '@motion-studio/schema'
import { type PresetId, PRESETS as THEME_PRESETS } from '@motion-studio/theme'
import { useMemo } from 'react'

import { useStudioStore } from '../../../store/editor-store'
import type { StudioShortcutContext } from '../shortcuts/shortcut.types'
import { studioShortcuts } from '../shortcuts/studio-registry'

import { applyPreset } from '../motion/apply-preset'

export type PaletteGroup =
  | 'Insert'
  | 'Motion'
  | 'Effects'
  | 'Edit'
  | 'View'
  | 'Theme'
  | 'Layer'
  | 'Document'
  | 'Help'

export interface PaletteItem {
  readonly id: string
  readonly label: string
  readonly group: PaletteGroup
  readonly keywords: readonly string[]
  readonly shortcut?: string | undefined
  readonly available: boolean
  run(): void
}

const GROUP_FOR_SHORTCUT: Readonly<Record<string, PaletteGroup>> = {
  Global: 'Document',
  Selection: 'Edit',
  Editing: 'Edit',
  Transform: 'Edit',
  Alignment: 'Edit',
  Viewport: 'View',
  Breakpoints: 'View',
  Panels: 'View',
  Inspector: 'Edit',
  Layers: 'Layer',
  Playground: 'Document',
}

/**
 * SHORTCUTS.md § Command palette: the sources are every registered shortcut, every block, every
 * motion preset, every theme preset and every layer. The list is memoised on the document version
 * and the selection, which is what keeps opening it under the 50 ms the document asks for — building
 * it costs more than rendering it, and neither has to happen on a keystroke.
 */
export function usePaletteItems(context: StudioShortcutContext): readonly PaletteItem[] {
  const version = useStudioStore((state) => state.version)
  const selectionKey = useStudioStore((state) => state.selection.ids.join(' '))

  // biome-ignore lint/correctness/useExhaustiveDependencies: `version` and `selectionKey` are the triggers — the list is read off the store inside, and there is nothing to read from the numbers themselves
  return useMemo(() => {
    const state = useStudioStore.getState()
    const items: PaletteItem[] = []

    for (const shortcut of studioShortcuts.list()) {
      if (shortcut.delegated === true) {
        continue
      }

      items.push({
        id: `shortcut:${shortcut.id}`,
        label: shortcut.label,
        group: GROUP_FOR_SHORTCUT[shortcut.group] ?? 'Document',
        keywords: shortcut.keywords ?? [],
        shortcut: shortcut.keys,
        available: shortcut.when === undefined || shortcut.when(context),
        run: () => shortcut.run(context),
      })
    }

    for (const definition of blockRegistry.list()) {
      const isEffect = definition.category === 'effects'
      const [target] = state.selection.ids

      items.push({
        id: `block:${definition.id}`,
        label: isEffect ? `Add ${definition.name}` : `Insert ${definition.name}`,
        group: isEffect ? 'Effects' : 'Insert',
        keywords: [definition.category, ...definition.tags],
        available: isEffect ? target !== undefined : true,
        run: () => {
          const current = useStudioStore.getState()
          const [selected] = current.selection.ids

          if (isEffect) {
            if (selected !== undefined) {
              current.dispatch(
                commands.addEffect({ nodeId: selected, effectId: effectId(definition.id) }),
              )
            }

            return
          }

          const parentId = selected ?? current.document.rootId
          const parent = current.document.nodes[parentId]
          const slot =
            parent === undefined ? undefined : blockRegistry.get(parent.blockId)?.slots[0]?.name

          if (parent === undefined || slot === undefined) {
            return
          }

          current.dispatch(
            commands.insertBlock({
              blockId: definition.id,
              parentId,
              slot,
              index: parent.children.length,
            }),
          )
        },
      })
    }

    for (const preset of MOTION_PRESETS) {
      items.push({
        id: `preset:${preset.id}`,
        label: `Apply ${preset.name}`,
        group: 'Motion',
        keywords: [preset.channel, preset.engine, 'motion'],
        available: state.selection.ids.length > 0,
        run: () => applyPreset(useStudioStore, preset),
      })
    }

    for (const [id, preset] of Object.entries(THEME_PRESETS)) {
      items.push({
        id: `theme:${id}`,
        label: `Theme: ${preset.name}`,
        group: 'Theme',
        keywords: ['theme', 'palette'],
        available: true,
        run: () => useStudioStore.getState().applyThemePreset(id as PresetId),
      })
    }

    for (const node of Object.values(state.document.nodes)) {
      items.push({
        id: `layer:${node.id}`,
        label: `Select ${node.name}`,
        group: 'Layer',
        keywords: [node.blockId],
        available: true,
        run: () => useStudioStore.getState().select([node.id]),
      })
    }

    return items
  }, [context, version, selectionKey])
}
