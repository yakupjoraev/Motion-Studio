import { type ShortcutRegistry, createShortcutRegistry } from '@motion-studio/hooks'

import { EDITING_SHORTCUTS } from './editing-shortcuts'
import { GLOBAL_SHORTCUTS } from './global-shortcuts'
import { PANEL_SHORTCUTS } from './panel-shortcuts'
import { SELECTION_SHORTCUTS } from './selection-shortcuts'
import type { StudioShortcut, StudioShortcutContext } from './shortcut.types'
import { SURFACE_SHORTCUTS } from './surface-shortcuts'
import { TRANSFORM_SHORTCUTS } from './transform-shortcuts'
import { VIEWPORT_SHORTCUTS } from './viewport-shortcuts'

/**
 * Every binding SHORTCUTS.md documents, in one list. The registry throws on a duplicate at module
 * load, so the assertion runs the first time the studio imports this file — in development and in a
 * test alike, which is what makes "add a shortcut" a change that cannot silently take a key twice.
 */
export const STUDIO_SHORTCUTS: readonly StudioShortcut[] = [
  ...GLOBAL_SHORTCUTS,
  ...SELECTION_SHORTCUTS,
  ...EDITING_SHORTCUTS,
  ...TRANSFORM_SHORTCUTS,
  ...VIEWPORT_SHORTCUTS,
  ...PANEL_SHORTCUTS,
  ...SURFACE_SHORTCUTS,
]

export const studioShortcuts: ShortcutRegistry<StudioShortcutContext> =
  createShortcutRegistry(STUDIO_SHORTCUTS)
