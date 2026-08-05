/**
 * `DESIGN_SYSTEM.md` § Z-index. Named and centralised so there is no magic stacking number anywhere
 * in the codebase — the layer order is a system-wide fact and it belongs in one file.
 *
 * The gaps are deliberate: a layer that turns out to need a neighbour gets one without renumbering
 * everything above it.
 */
export const Z_INDEX = {
  canvasContent: 0,
  canvasOverlay: 10,
  canvasHandles: 20,
  panel: 100,
  topBar: 110,
  dragGhost: 200,
  dropdown: 300,
  popover: 400,
  dialog: 500,
  tooltip: 600,
  toast: 700,
  commandPalette: 800,
} as const

export type ZIndexToken = keyof typeof Z_INDEX
