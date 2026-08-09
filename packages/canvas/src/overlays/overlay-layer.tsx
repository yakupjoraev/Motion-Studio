'use client'

import type { NodeId } from '@motion-studio/schema'
import {
  type ReactNode,
  type RefObject,
  useCallback,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from 'react'

import { OVERLAYS_CLASS } from '../canvas.styles'
import type { CanvasResizePort, CanvasScene } from '../canvas.types'
import type { CanvasRect } from '../coords/index'
import type { RectCache } from '../rects/rect-cache'
import type { ViewportHandle } from '../viewport/use-viewport'

import { BreakpointFrame } from './breakpoint-frame'
import { HoverOutline, type HoverSource } from './hover-outline'
import { MultiSelectionBox } from './multi-selection-box'
import { ResizeHandles } from './resize-handles'
import { SelectionOutline } from './selection-outline'
import { SpacingOverlay, useAltHeld } from './spacing-overlay'
import { useOverlayRects } from './use-overlay-rects'
import { useResize } from './use-resize'

export interface OverlayLayerProps {
  readonly scene: CanvasScene
  readonly viewport: ViewportHandle
  readonly cache: RectCache
  readonly hover: HoverSource
  readonly rootRef: RefObject<HTMLElement | null>
  /** The artboard's box, for the breakpoint frame. */
  readonly documentRect: () => CanvasRect
  readonly breakpointName?: string | undefined
  readonly resize?: CanvasResizePort | undefined
  /** The overlays the canvas composes itself: the marquee band, the snap guides, the rulers. */
  readonly children?: ReactNode
}

/**
 * The one promoted compositing layer of PERFORMANCE.md § Layer count, and the one `rAF` loop every
 * overlay in it is painted from. It is outside the scene transform, so a 1.5 px outline is 1.5 px at
 * 25 % and at 400 %.
 *
 * React runs here only when *which* overlays exist changes. That is why the selection arrives
 * through `scene.subscribe` rather than as a prop (ADR-092): a prop would re-render the canvas root
 * and, through it, every node.
 */
export function OverlayLayer({
  scene,
  viewport,
  cache,
  hover,
  rootRef,
  documentRect,
  breakpointName,
  resize,
  children,
}: OverlayLayerProps) {
  const painter = useOverlayRects({ viewport, cache })
  const subscribe = useCallback((listener: () => void) => scene.subscribe(listener), [scene])
  const selectionKey = useSyncExternalStore(
    subscribe,
    () => scene.selectedIds().join(' '),
    () => '',
  )

  const ids = useMemo(
    () => (selectionKey === '' ? [] : (selectionKey.split(' ') as NodeId[])),
    [selectionKey],
  )

  const single = ids.length === 1 ? ids[0] : undefined
  // ADR-108: handles on a block that cannot take a size would be a gesture with nowhere to commit.
  const sizeable = single !== undefined && resize?.resizable(single) === true
  const altHeld = useAltHeld()
  const resizing = useResize({
    rootRef,
    cache,
    viewport,
    resize,
    selectedId: () => single ?? null,
  })

  // An outline that unmounts takes its own repaint with it, and the union box has to be told.
  // biome-ignore lint/correctness/useExhaustiveDependencies: `selectionKey` is the trigger, not an input — the effect re-runs because the set changed, and there is nothing to read off the string
  useEffect(() => {
    painter.invalidate()
  }, [painter, selectionKey])

  // A change the selection key cannot see — a breakpoint, a padding edit — still changes what the
  // spacing overlay reads. Repainting is cheaper than re-measuring and is what those need.
  useEffect(() => scene.subscribe(painter.schedule), [painter, scene])

  return (
    <div className={OVERLAYS_CLASS} data-testid="canvas-overlays">
      <BreakpointFrame documentRect={documentRect} name={breakpointName} painter={painter} />
      <HoverOutline hover={hover} painter={painter} rootRef={rootRef} />
      {ids.length > 1 && <MultiSelectionBox ids={ids} painter={painter} />}
      {ids.map((id) => (
        <SelectionOutline
          id={id}
          key={id}
          name={scene.node(id)?.name ?? id}
          painter={painter}
          primary={ids.length === 1}
        />
      ))}
      {single !== undefined && sizeable && (
        <ResizeHandles id={single} painter={painter} resize={resizing} />
      )}
      {altHeld &&
        ids.map((id) => <SpacingOverlay id={id} key={id} painter={painter} scene={scene} />)}
      {children}
    </div>
  )
}
