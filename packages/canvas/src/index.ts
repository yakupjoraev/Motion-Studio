export {
  FIT_PADDING,
  MAX_FIT_DOCUMENT_ZOOM,
  MAX_FIT_SELECTION_ZOOM,
  MAX_ZOOM,
  MIN_ZOOM,
  ZOOM_QUANTUM,
  ZOOM_STEPS,
  canvasPoint,
  canvasRect,
  canvasRectToScreen,
  canvasToScreen,
  clampZoom,
  fitToRect,
  fitToSelection,
  nodePoint,
  quantizeZoom,
  screenPoint,
  screenRect,
  screenRectToCanvas,
  screenToCanvas,
  zoomAt,
  type CanvasPoint,
  type CanvasRect,
  type NodePoint,
  type ScreenPoint,
  type ScreenRect,
  type ViewportRect,
  type ViewportTransform,
} from './coords/index'

export { Canvas, type CanvasProps } from './canvas'
export type {
  CanvasScene,
  CanvasSceneNode,
  CanvasSelectionPort,
  SelectionMode,
} from './canvas.types'
export { NodeWrapper, type NodeWrapperProps } from './node-wrapper'
export { Scene, type SceneProps } from './scene/scene'
export { Artboard, type ArtboardProps } from './scene/artboard'
export {
  DEFAULT_GRID_SIZE,
  GRID_SIZES,
  Grid,
  type GridProps,
  type GridSize,
} from './scene/grid'
export {
  NODE_ID_ATTRIBUTE,
  hitTest,
  nodeIdsFromElements,
  resolveHit,
  type HitContext,
  type HitOptions,
} from './hit/hit-test'
export { useHitTest, type HitTestHookOptions } from './hit/use-hit-test'
export { marqueeHits, marqueeRect, type MarqueeMode } from './hit/marquee'
export {
  MARQUEE_VARS,
  useMarquee,
  type MarqueeHandle,
  type MarqueeHookOptions,
} from './hit/use-marquee'
export {
  createRectCache,
  type OwnedRectCache,
  type RectCache,
  type RectCacheOptions,
} from './rects/rect-cache'
export {
  RectCacheContext,
  useRectCache,
  useRectCacheContext,
  type RectCacheHookOptions,
} from './rects/use-rect-cache'
export {
  ANNOUNCE_DEBOUNCE_MS,
  SelectionAnnouncer,
  describeEnter,
  describeExit,
  describeSelection,
  useAnnouncer,
  type Announcer,
  type SelectionAnnouncerProps,
} from './selection/selection-announcer'
export {
  useCanvasSelection,
  type CanvasSelectionHookOptions,
} from './selection/use-canvas-selection'
export {
  NUDGE_STEP,
  NUDGE_STEP_COARSE,
  arrowStep,
  useKeyboardSelection,
  type KeyboardSelectionHookOptions,
} from './selection/use-keyboard-selection'
export {
  IDENTITY,
  VIEWPORT_VARS,
  WHEEL_IDLE_MS,
  gridOpacity,
  useViewport,
  wheelCommitter,
  type ViewportHandle,
  type ViewportOptions,
} from './viewport/use-viewport'
export {
  MOMENTUM_DECAY,
  MOMENTUM_START,
  MOMENTUM_STOP,
  decaySteps,
  prefersReducedMotion,
  usePan,
} from './viewport/use-pan'
export { WHEEL_ZOOM_CLAMP, nextZoomStep, useZoom, wheelZoomFactor } from './viewport/use-zoom'
export { ViewportProvider, useViewportContext } from './viewport/viewport-context'
