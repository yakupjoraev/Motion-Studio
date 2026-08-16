import type { ShortcutGroup, ShortcutScope } from '@motion-studio/hooks'

import type { StudioShortcut } from './shortcut.types'

/**
 * The bindings their own surface implements — ADR-150. A layers row walks with the arrow keys, a
 * number field steps its own value, a drag started with the keyboard moves between drop positions.
 * None of those can be a `run` on a central registry, because each needs state that only lives
 * inside the component holding focus.
 *
 * They are declared anyway, and that is the point: the reference sheet lists every documented key,
 * the palette knows which are taken, and the conflict assertion sees the whole map rather than the
 * half that happens to be centrally implemented.
 */
const delegated = (
  id: string,
  keys: string,
  label: string,
  group: ShortcutGroup,
  scope: ShortcutScope,
  preventDefault = true,
): StudioShortcut => ({
  id,
  keys,
  label,
  group,
  scope,
  delegated: true,
  preventDefault,
  run: () => undefined,
})

/** SHORTCUTS.md § Layers tree, § Inspector, § Drag with the keyboard, § Playground. */
export const SURFACE_SHORTCUTS: readonly StudioShortcut[] = [
  // Layers tree — implemented by `use-tree-keyboard` (prompt 29).
  delegated('layers-up', 'up', 'Move focus up', 'Layers', 'layers'),
  delegated('layers-down', 'down', 'Move focus down', 'Layers', 'layers'),
  delegated('layers-collapse', 'left', 'Collapse row', 'Layers', 'layers'),
  delegated('layers-expand', 'right', 'Expand row', 'Layers', 'layers'),
  delegated('layers-extend-up', 'shift+up', 'Extend selection up', 'Layers', 'layers'),
  delegated('layers-extend-down', 'shift+down', 'Extend selection down', 'Layers', 'layers'),
  delegated('layers-toggle-selection', 'space', 'Toggle selection', 'Layers', 'layers'),
  delegated('layers-rename', 'f2', 'Rename layer', 'Layers', 'layers'),
  delegated('layers-pick-up', 'enter', 'Pick up for a drag', 'Layers', 'layers'),
  delegated('layers-visibility', 'mod+shift+h', 'Toggle row visibility', 'Layers', 'layers'),
  delegated('layers-lock', 'mod+shift+l', 'Toggle row lock', 'Layers', 'layers'),
  delegated('layers-move-up', 'mod+up', 'Move layer up among siblings', 'Layers', 'layers'),
  delegated('layers-move-down', 'mod+down', 'Move layer down among siblings', 'Layers', 'layers'),

  // Inspector — implemented by the controls themselves (prompt 09).
  delegated('inspector-next', 'tab', 'Next control', 'Inspector', 'inspector', false),
  delegated('inspector-previous', 'shift+tab', 'Previous control', 'Inspector', 'inspector', false),
  delegated('inspector-step-up', 'up', 'Step the value up', 'Inspector', 'inspector'),
  delegated('inspector-step-down', 'down', 'Step the value down', 'Inspector', 'inspector'),
  delegated('inspector-step-up-10', 'shift+up', 'Step up ×10', 'Inspector', 'inspector'),
  delegated('inspector-step-down-10', 'shift+down', 'Step down ×10', 'Inspector', 'inspector'),
  delegated('inspector-step-up-tenth', 'alt+up', 'Step up ×0.1', 'Inspector', 'inspector'),
  delegated('inspector-step-down-tenth', 'alt+down', 'Step down ×0.1', 'Inspector', 'inspector'),
  delegated('inspector-commit', 'enter', 'Commit the value', 'Inspector', 'inspector'),
  delegated(
    'inspector-reset',
    'mod+backspace',
    'Reset to the block default',
    'Inspector',
    'inspector',
  ),
  delegated(
    'inspector-clear-override',
    'alt+backspace',
    'Remove the breakpoint override',
    'Inspector',
    'inspector',
  ),

  /*
   * Drag with the keyboard is § Drag with the keyboard in the doc. Its two surfaces are the layers
   * tree, whose Enter is already declared above, and the block palette, which is prompt 37 — so the
   * card binding has no scope to belong to yet and is deliberately absent rather than mis-scoped.
   */

  // Playground — prompt 49 builds the surface; the keys are reserved for it now.
  delegated('playground-apply', 'mod+enter', 'Apply immediately', 'Playground', 'playground'),
  delegated(
    'playground-swap',
    'mod+shift+s',
    'Swap A/B in compare mode',
    'Playground',
    'playground',
  ),
  delegated('playground-copy-css', 'mod+shift+c', 'Copy CSS', 'Playground', 'playground'),
  delegated('playground-send', 'mod+shift+k', 'Send to selection', 'Playground', 'playground'),
  delegated('playground-property-up', 'up', 'Previous property', 'Playground', 'playground'),
  delegated('playground-property-down', 'down', 'Next property', 'Playground', 'playground'),
]
