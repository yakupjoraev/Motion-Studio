'use client'

import type { NodeId } from '@motion-studio/schema'
import { cn } from '@motion-studio/utils'
import { type ReactNode, useCallback, useEffect, useId, useMemo, useRef } from 'react'

import { CANVAS_ROOT_CLASS, MARQUEE_CLASS } from './canvas.styles'
import type {
  CanvasHandle,
  CanvasMenuPort,
  CanvasMotionPort,
  CanvasResizePort,
  CanvasScene,
  CanvasSelectionPort,
} from './canvas.types'
import {
  type CanvasRect,
  FIT_PADDING,
  type ViewportTransform,
  canvasRect,
  canvasRectToScreen,
  screenRectToCanvas,
} from './coords/index'
import { useHitTest } from './hit/use-hit-test'
import { useMarquee } from './hit/use-marquee'
import { CanvasContextMenu } from './overlays/context-menu'
import { useHoverSource } from './overlays/hover-outline'
import { OverlayLayer } from './overlays/overlay-layer'
import { useMotionPlayback } from './overlays/use-motion-playback'
import { RectCacheContext, useRectCache } from './rects/use-rect-cache'
import { Artboard } from './scene/artboard'
import { DEFAULT_GRID_SIZE } from './scene/grid'
import type { GridSize } from './scene/grid'
import { Scene } from './scene/scene'
import {
  SelectionAnnouncer,
  describeSelection,
  useAnnouncer,
} from './selection/selection-announcer'
import { useCanvasSelection } from './selection/use-canvas-selection'
import { useKeyboardSelection } from './selection/use-keyboard-selection'
import { DistanceLabels } from './snap/guides/distance-labels'
import { SnapGuides } from './snap/guides/snap-guides'
import { UserGuides } from './snap/guides/user-guides'
import { Rulers } from './snap/rulers/rulers'
import type { CanvasGuidePort } from './snap/snap.types'
import { SnapContext, useSnap } from './snap/use-snap'
import { revealPan } from './viewport/reveal'
import { usePan } from './viewport/use-pan'
import { type ViewportHandle, useViewport } from './viewport/use-viewport'
import { useZoom } from './viewport/use-zoom'
import { ViewportProvider } from './viewport/viewport-context'

export interface CanvasProps {
  readonly rootId: NodeId
  /** The seam: the canvas renders what it is handed and imports neither `editor` nor `blocks`. */
  readonly renderNode: (id: NodeId) => ReactNode
  /** ADR-077. State in, by getter, so a document edit re-renders nodes and not the canvas. */
  readonly scene: CanvasScene
  /** Intent out. Every method is a store command in the application that mounts this. */
  readonly selection: CanvasSelectionPort
  /** Canvas units — the width of the breakpoint being previewed. */
  readonly artboardWidth: number
  readonly className?: string | undefined
  readonly showGrid?: boolean | undefined
  readonly gridSize?: GridSize | undefined
  readonly initialTransform?: ViewportTransform | undefined
  /** Called once per gesture, with the transform the store should record. */
  readonly onTransformCommit?: ((transform: ViewportTransform) => void) | undefined
  readonly showRulers?: boolean | undefined
  /** ADR-087. The list plus its three intents; the canvas stores none of it. */
  readonly guides?: CanvasGuidePort | undefined
  /** Screen pixels, from `viewport.guides.snapThreshold`. Defaults to the 4 of CANVAS.md. */
  readonly snapThreshold?: number | undefined
  /** `viewport.guides.enabled`. */
  readonly snapEnabled?: boolean | undefined
  /** The breakpoint the artboard width belongs to, shown on the frame. */
  readonly breakpointName?: string | undefined
  /** PRODUCT.md § 3. Absent means no right-click menu, which is what a read-only canvas wants. */
  readonly menu?: CanvasMenuPort | undefined
  /** Where a finished resize goes. Absent means the handles have nothing to commit to. */
  readonly resize?: CanvasResizePort | undefined
  /** ADR-100. `Mod+P` and `Mod+Shift+P` do nothing without it. */
  readonly motion?: CanvasMotionPort | undefined
  /**
   * Called with the handle on mount and with `null` on unmount. It is how a host answers questions
   * that need measured geometry — "does the new frame still fit?" — without holding a ref into the
   * canvas's internals.
   */
  readonly onReady?: ((handle: CanvasHandle | null) => void) | undefined
}

/**
 * What `role="application"` obliges the canvas to say — every key it takes over, in the order a
 * reader would need them. ACCESSIBILITY.md § Canvas; the keys themselves are `useKeyboardSelection`.
 */
const CANVAS_HELP =
  'Tab and Shift Tab move between blocks at this level. Enter goes into a group, Escape comes back out. Arrow keys nudge the selection, Command or Control A takes the whole level, and F2 moves to the next panel.'

/**
 * CANVAS.md § DOM structure: a fixed root, one transformed scene, and an overlay layer outside the
 * transform. Pan, zoom and the marquee band write CSS variables inside one `rAF`, so a gesture
 * renders nothing — PERFORMANCE.md § The core rule.
 *
 * `role="application"` with a tab stop, because the arrows and `Space` mean something here that they
 * do not mean in a document — ACCESSIBILITY.md § Canvas. The role is only defensible while
 * `useKeyboardSelection` is mounted: it is what makes the keyboard path complete, and removing it
 * would leave a surface that tells screen readers to stand back from keys nothing then handles.
 */
export function Canvas({
  rootId,
  renderNode,
  scene,
  selection,
  artboardWidth,
  className,
  showGrid,
  gridSize,
  initialTransform,
  onTransformCommit,
  showRulers,
  guides,
  snapThreshold,
  snapEnabled,
  breakpointName,
  menu,
  resize,
  motion,
  onReady,
}: CanvasProps) {
  const artboardRef = useRef<HTMLDivElement | null>(null)
  const viewport: ViewportHandle = useViewport({
    initial: initialTransform,
    onCommit: onTransformCommit,
  })

  // `Shift+1` fits what the artboard actually comes to, which is its unzoomed layout height — the
  // scene's own box is the scaled one, so measuring that would fit the fit.
  const documentRect = useCallback(
    (): CanvasRect =>
      canvasRect({
        x: 0,
        y: 0,
        width: artboardWidth,
        height: artboardRef.current?.offsetHeight ?? artboardWidth,
      }),
    [artboardWidth],
  )

  usePan(viewport)
  useZoom(viewport, { documentRect })

  const cache = useRectCache({ rootRef: viewport.rootRef, scene })

  /**
   * The transform the cache's rects were measured under — ADR-091 in the other direction. An overlay
   * converts a cached rect to canvas units with the transform of the moment it was read; a host asking
   * "where is this node now" needs the rect converted back out under the *current* one, or every
   * answer is stale by whatever the scene has panned since. Measured: 24 px, which was a drop landing
   * one position off the indicator (ADR-183).
   */
  const measured = useRef({ at: viewport.current(), bounds: viewport.viewportRect() })

  useEffect(
    () =>
      cache.subscribe(() => {
        measured.current = { at: viewport.current(), bounds: viewport.viewportRect() }
      }),
    [cache, viewport],
  )

  const handle = useMemo<CanvasHandle>(
    () => ({
      documentRect,
      viewportRect: viewport.viewportRect,
      nodeRect(id) {
        const screen = cache.get(id)

        if (screen === undefined) {
          return undefined
        }

        const { at, bounds } = measured.current

        return canvasRectToScreen(
          screenRectToCanvas(screen, at, bounds),
          viewport.current(),
          viewport.viewportRect(),
        )
      },
      transform: viewport.current,
      fitDocument: () => viewport.fitTo(documentRect()),
      panBy: (dx, dy) => viewport.panBy(dx, dy),
      remeasure() {
        cache.invalidate()
        cache.refresh()
      },
      reveal(id) {
        const rect = cache.get(id)

        if (rect === undefined) {
          return false
        }

        const { dx, dy } = revealPan(rect, viewport.viewportRect(), FIT_PADDING)

        if (dx !== 0 || dy !== 0) {
          viewport.panBy(dx, dy)
          // One gesture, one commit: the store hears the new transform once, as it does after a drag.
          viewport.commit()
        }

        return true
      },
    }),
    [cache, documentRect, viewport],
  )

  useEffect(() => {
    onReady?.(handle)

    return () => onReady?.(null)
  }, [handle, onReady])

  const announcer = useAnnouncer()
  const helpId = useId()

  /*
   * Every selection change, whatever made it — ACCESSIBILITY.md § Canvas asks for a live region "on
   * every change", and the three gesture paths that announce for themselves are not every change: the
   * layers tree, an insert from the palette and an undo all write the selection through the store and
   * used to arrive in silence (ADR-326).
   */
  useEffect(() => {
    let previous = scene.selectedIds().join(',')

    return scene.subscribe(() => {
      const current = scene.selectedIds().join(',')

      if (current === previous) {
        return
      }

      previous = current
      announcer.announce(describeSelection(scene, rootId))
    })
  }, [announcer, rootId, scene])

  const snap = useSnap({ viewport, thresholdPx: snapThreshold, enabled: snapEnabled })

  const hitContext = useCallback(
    () => ({ rootId, isolationId: scene.isolationId(), node: scene.node.bind(scene) }),
    [rootId, scene],
  )

  // The nodes at the current level, minus the ones a click could not select either: a marquee that
  // caught locked nodes would be a second answer to "what is selectable" and the wrong one.
  const candidates = useCallback(() => {
    const children = scene.node(scene.isolationId() ?? rootId)?.children ?? []

    return children.filter((id) => {
      const node = scene.node(id)

      return node !== undefined && !node.locked && !node.hidden
    })
  }, [rootId, scene])

  const commitMarquee = useCallback(
    (ids: readonly NodeId[]) => {
      selection.select(ids, 'replace')
      announcer.announce(describeSelection(scene, rootId))
    },
    [announcer, rootId, scene, selection],
  )

  const marquee = useMarquee({
    rootRef: viewport.rootRef,
    cache,
    candidates,
    onCommit: commitMarquee,
  })

  // ADR-093: the outline reads the hover from here, and the host still hears about it.
  const hover = useHoverSource()
  const onHover = useCallback(
    (id: NodeId | null) => {
      hover.report(id)
      selection.hover(id)
    },
    [hover, selection],
  )

  useHitTest({ rootRef: viewport.rootRef, context: hitContext, onHover })
  useMotionPlayback({ rootRef: viewport.rootRef, motion })
  useCanvasSelection({
    rootRef: viewport.rootRef,
    rootId,
    scene,
    selection,
    marquee,
    announce: announcer.announce,
  })
  useKeyboardSelection({
    rootRef: viewport.rootRef,
    rootId,
    scene,
    selection,
    viewport,
    gridSize: gridSize ?? DEFAULT_GRID_SIZE,
    announce: announcer.announce,
  })

  const root = (
    <div
      aria-describedby={helpId}
      aria-label="Design canvas"
      className={cn(CANVAS_ROOT_CLASS, className)}
      data-testid="canvas-root"
      ref={viewport.rootRef}
      role="application"
      // biome-ignore lint/a11y/noNoninteractiveTabindex: the canvas is one tab stop with its own key map — CANVAS.md § Keyboard operation
      tabIndex={0}
    >
      {/*
        ACCESSIBILITY.md § Canvas specifies this description, and `role="application"` is why it is not
        optional: the role hands every key to the page, including `Tab`, which the canvas uses to walk
        siblings. A reader who is not told that has no way out of the surface — ADR-328.
      */}
      <span className="sr-only" id={helpId}>
        {CANVAS_HELP}
      </span>
      <Scene sceneRef={viewport.sceneRef}>
        <Artboard
          artboardRef={artboardRef}
          gridSize={gridSize}
          showGrid={showGrid}
          width={artboardWidth}
        >
          {renderNode(rootId)}
        </Artboard>
      </Scene>
      <OverlayLayer
        breakpointName={breakpointName}
        cache={cache}
        documentRect={documentRect}
        hover={hover}
        resize={resize}
        rootRef={viewport.rootRef}
        scene={scene}
        viewport={viewport}
      >
        <div className={MARQUEE_CLASS} data-testid="canvas-marquee" ref={marquee.ref} />
        <SnapGuides overlay={snap.overlay} />
        <DistanceLabels overlay={snap.overlay} />
        {guides !== undefined && <UserGuides guides={guides} viewport={viewport} />}
        {showRulers === true && <Rulers guides={guides} viewport={viewport} />}
      </OverlayLayer>
      <SelectionAnnouncer announcer={announcer} />
    </div>
  )

  return (
    <ViewportProvider viewport={viewport}>
      <SnapContext.Provider value={snap}>
        <RectCacheContext.Provider value={cache}>
          {menu === undefined ? root : <CanvasContextMenu menu={menu}>{root}</CanvasContextMenu>}
        </RectCacheContext.Provider>
      </SnapContext.Provider>
    </ViewportProvider>
  )
}
