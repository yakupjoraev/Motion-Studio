export { computeSnap } from './compute-snap'
export { generateSnapCandidates } from './generate-candidates'
export { GAP_LABEL_SLOTS, GUIDE_OVERHANG_PX, PRIORITY, THRESHOLD_PX } from './snap.constants'
export { placeOnAxis } from './snap.styles'
export {
  SnapContext,
  useSnap,
  useSnapContext,
  type ModifierState,
  type SnapHandle,
  type SnapHookOptions,
} from './use-snap'
export {
  GAP_VARS,
  SNAP_VARS,
  clearSnap,
  paintSnap,
  type SnapGapSlot,
  type SnapOverlay,
} from './guides/paint-guides'
export { SnapGuides, type SnapGuidesProps } from './guides/snap-guides'
export { DistanceLabels, type DistanceLabelsProps } from './guides/distance-labels'
export { UserGuides, type UserGuidesProps } from './guides/user-guides'
export { useGuideDrag, type GuideDragHandle, type GuideDragOptions } from './guides/use-guide-drag'
export { RULER_SIZE_PX, Rulers, type RulersProps } from './rulers/rulers'
export {
  MIN_MAJOR_SPACING_PX,
  TICK_LADDER,
  majorTickStep,
  minorTickStep,
  rulerTicks,
} from './rulers/ruler-ticks'
export {
  CURSOR_VAR,
  RULER_ATTRIBUTE,
  canvasAt,
  overRuler,
  useRulerDrag,
  type AxisRefs,
  type RulerDragHandle,
  type RulerDragOptions,
} from './rulers/use-ruler-drag'
export type {
  CanvasGuidePort,
  SnapAxis,
  SnapBox,
  SnapCandidate,
  SnapCandidateInput,
  SnapEdge,
  SnapGap,
  SnapGuide,
  SnapKind,
  SnapResult,
  SnapSpacing,
  UserGuide,
} from './snap.types'
