import { BREAKPOINTS, CASCADE_ORDER } from '@motion-studio/schema'

import { type StudioShortcut, hasCanvas } from './shortcut.types'

/** CANVAS.md § Zoom, the same ladder the wheel and the buttons walk (ADR-073). */
const ZOOM_STEPS = [0.1, 0.25, 0.5, 0.75, 1, 1.5, 2, 3, 4] as const

const stepZoom = (current: number, direction: 1 | -1): number => {
  const ordered = direction === 1 ? ZOOM_STEPS : [...ZOOM_STEPS].reverse()

  return ordered.find((step) => (direction === 1 ? step > current : step < current)) ?? current
}

/** SHORTCUTS.md § Viewport and § Breakpoints. The pointer rows belong to the canvas's own gestures. */
export const VIEWPORT_SHORTCUTS: readonly StudioShortcut[] = [
  {
    id: 'zoom-in',
    keys: 'mod+=',
    label: 'Zoom in',
    group: 'Viewport',
    scope: 'global',
    run: ({ store }) => {
      store.getState().setZoom(stepZoom(store.getState().viewport.zoom, 1))
    },
  },
  {
    id: 'zoom-out',
    keys: 'mod+-',
    label: 'Zoom out',
    group: 'Viewport',
    scope: 'global',
    run: ({ store }) => {
      store.getState().setZoom(stepZoom(store.getState().viewport.zoom, -1))
    },
  },
  {
    id: 'zoom-100',
    keys: 'mod+0',
    label: 'Zoom to 100 %',
    group: 'Viewport',
    scope: 'global',
    run: ({ store }) => {
      store.getState().setZoom(1)
    },
  },
  {
    id: 'fit-document',
    keys: 'shift+1',
    label: 'Fit document',
    group: 'Viewport',
    scope: 'global',
    when: hasCanvas,
    run: ({ canvas }) => canvas?.fitDocument(),
  },
  {
    id: 'zoom-to-selection',
    keys: 'shift+2',
    label: 'Zoom to selection',
    group: 'Viewport',
    scope: 'global',
    when: hasCanvas,
    run: ({ canvas }) => canvas?.zoomToSelection(),
  },
  {
    id: 'toggle-grid',
    keys: "mod+'",
    label: 'Toggle grid',
    group: 'Viewport',
    scope: 'global',
    run: ({ store }) => {
      store.getState().toggleGrid()
    },
  },
  {
    id: 'toggle-snapping',
    keys: "mod+shift+'",
    label: 'Toggle snapping',
    group: 'Viewport',
    scope: 'global',
    run: ({ store }) => {
      store.getState().toggleSnapping()
    },
  },
  {
    id: 'toggle-rulers',
    keys: 'mod+r',
    label: 'Toggle rulers',
    group: 'Viewport',
    scope: 'global',
    run: ({ store }) => {
      store.getState().toggleRulers()
    },
  },
  {
    id: 'toggle-motion',
    keys: 'mod+p',
    label: 'Toggle motion playback',
    group: 'Viewport',
    scope: 'global',
    run: ({ store }) => {
      store.getState().toggleMotionPaused()
    },
  },
  {
    id: 'replay-entrances',
    keys: 'mod+shift+p',
    label: 'Replay entrance animations',
    group: 'Viewport',
    scope: 'global',
    when: hasCanvas,
    run: ({ canvas }) => canvas?.replayEntrances(),
  },
  {
    id: 'pan-hold',
    keys: 'space',
    label: 'Hold to pan',
    group: 'Viewport',
    scope: 'canvas',
    // The canvas holds the key down and watches for blur, which a run-once binding cannot express.
    delegated: true,
    preventDefault: false,
    run: () => undefined,
  },
  ...CASCADE_ORDER.map(
    (id, index): StudioShortcut => ({
      id: `breakpoint-${id}`,
      keys: `mod+${index + 1}`,
      label: `Breakpoint: ${BREAKPOINTS[id].label}`,
      group: 'Breakpoints',
      scope: 'global',
      keywords: ['responsive', id],
      run: ({ store }) => {
        store.getState().setBreakpoint(id)
      },
    }),
  ),
  {
    id: 'multi-frame',
    keys: 'mod+shift+m',
    label: 'Toggle multi-frame comparison',
    group: 'Breakpoints',
    scope: 'global',
    keywords: ['responsive', 'compare'],
    run: ({ store }) => {
      store.getState().toggleMultiFrame()
    },
  },
]
