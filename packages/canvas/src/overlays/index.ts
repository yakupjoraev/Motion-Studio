export { OverlayLayer, type OverlayLayerProps } from './overlay-layer'
export { SelectionOutline, type SelectionOutlineProps } from './selection-outline'
export { MultiSelectionBox, type MultiSelectionBoxProps } from './multi-selection-box'
export {
  HoverOutline,
  useHoverSource,
  type HoverOutlineProps,
  type HoverSource,
} from './hover-outline'
export { ResizeHandles, type ResizeHandlesProps } from './resize-handles'
export { SpacingOverlay, useAltHeld, type SpacingOverlayProps } from './spacing-overlay'
export { BreakpointFrame, type BreakpointFrameProps } from './breakpoint-frame'
export { CanvasContextMenu, type CanvasContextMenuProps } from './context-menu'
export { CANVAS_MENU_ITEMS, canvasMenuEntries, type CanvasMenuItem } from './menu-items'
export {
  MOTION_PAUSED_ATTRIBUTE,
  useMotionPlayback,
  type MotionPlaybackOptions,
} from './use-motion-playback'
export {
  CHIP_HEIGHT_PX,
  HANDLE_MIN_ZOOM,
  handlesVisible,
  shouldFlipChip,
  unionRect,
  writeBox,
  writeSpacing,
} from './overlay-box'
export {
  OVERLAY_BOX_STYLE,
  OVERLAY_VARS,
  SPACING_VARS,
  spacingBandStyle,
  type SpacingKind,
  type SpacingSide,
} from './overlay.styles'
export { useOverlayPaint, useOverlayRects, type OverlayRectsOptions } from './use-overlay-rects'
export type { OverlayFrame, OverlayPaint, OverlayPainter } from './overlay.types'
export {
  MIN_SIZE,
  RESIZE_HANDLES,
  RESIZE_VARS,
  resizeDraft,
  useResize,
  type ResizeDirection,
  type ResizeHandle,
  type ResizeHandleSpec,
  type ResizeHookOptions,
  type ResizeModifiers,
  type ResizeSigns,
} from './use-resize'
