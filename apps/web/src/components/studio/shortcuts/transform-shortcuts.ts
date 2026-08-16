import { commands } from '@motion-studio/editor'

import { type StudioShortcut, hasSelection } from './shortcut.types'

const ARROWS = ['up', 'down', 'left', 'right'] as const

/**
 * SHORTCUTS.md § Transform. Nudging and resizing are the canvas's own (ADR-080, ADR-096): a node has
 * no coordinates in the model, so an arrow is an intent the canvas turns into a command with the
 * geometry it alone has measured. The entries are here so the sheet lists them and nothing else can
 * claim the keys.
 */
const NUDGE: readonly StudioShortcut[] = ARROWS.flatMap((arrow) => [
  {
    id: `nudge-${arrow}`,
    keys: arrow,
    label: `Nudge ${arrow} 1 px`,
    group: 'Transform',
    scope: 'canvas',
    delegated: true,
    run: () => undefined,
  },
  {
    id: `nudge-${arrow}-large`,
    keys: `shift+${arrow}`,
    label: `Nudge ${arrow} 10 px`,
    group: 'Transform',
    scope: 'canvas',
    delegated: true,
    run: () => undefined,
  },
  {
    id: `nudge-${arrow}-grid`,
    keys: `alt+${arrow}`,
    label: `Nudge ${arrow} by the grid size`,
    group: 'Transform',
    scope: 'canvas',
    delegated: true,
    run: () => undefined,
  },
  {
    id: `resize-${arrow}`,
    keys: `mod+alt+${arrow}`,
    label:
      arrow === 'left' || arrow === 'right'
        ? `${arrow === 'left' ? 'Decrease' : 'Increase'} width by 1`
        : `${arrow === 'up' ? 'Decrease' : 'Increase'} height by 1`,
    group: 'Transform',
    scope: 'canvas',
    delegated: true,
    run: () => undefined,
  },
])

const ALIGN_KEYS: Readonly<Record<(typeof commands.ALIGN_EDGES)[number], string>> = {
  left: 'alt+a',
  right: 'alt+d',
  center: 'alt+h',
  top: 'alt+w',
  bottom: 'alt+s',
  middle: 'alt+v',
}

/** SHORTCUTS.md § Alignment. ADR-057: these write `align`/`justify` on the parent, not coordinates. */
const ALIGN: readonly StudioShortcut[] = commands.ALIGN_EDGES.map((edge) => ({
  id: `align-${edge}`,
  keys: ALIGN_KEYS[edge],
  label: `Align ${edge}`,
  group: 'Alignment',
  scope: 'global',
  when: hasSelection,
  run: ({ store }) => {
    store.getState().dispatch(commands.alignNodes({ ids: store.getState().selection.ids, edge }))
  },
}))

const DISTRIBUTE: readonly StudioShortcut[] = (['horizontal', 'vertical'] as const).map((axis) => ({
  id: `distribute-${axis}`,
  keys: axis === 'horizontal' ? 'alt+shift+h' : 'alt+shift+v',
  label: `Distribute ${axis}ly`,
  group: 'Alignment',
  scope: 'global',
  when: ({ store }) => store.getState().selection.ids.length > 2,
  run: ({ store }) => {
    store
      .getState()
      .dispatch(commands.distributeNodes({ ids: store.getState().selection.ids, axis }))
  },
}))

export const TRANSFORM_SHORTCUTS: readonly StudioShortcut[] = [...NUDGE, ...ALIGN, ...DISTRIBUTE]
