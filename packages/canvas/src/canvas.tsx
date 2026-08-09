'use client'

import type { NodeId } from '@motion-studio/schema'
import { cn } from '@motion-studio/utils'
import { type ReactNode, useCallback, useRef } from 'react'

import { CANVAS_ROOT_CLASS, MARQUEE_CLASS, OVERLAYS_CLASS } from './canvas.styles'
import type { CanvasScene, CanvasSelectionPort } from './canvas.types'
import { type CanvasRect, type ViewportTransform, canvasRect } from './coords/index'
import { useHitTest } from './hit/use-hit-test'
import { useMarquee } from './hit/use-marquee'
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
}

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

  const cache = useRectCache({ rootRef: viewport.rootRef, version: scene.version() })
  const announcer = useAnnouncer()
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

  useHitTest({ rootRef: viewport.rootRef, context: hitContext, onHover: selection.hover })
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

  return (
    <ViewportProvider viewport={viewport}>
      <SnapContext.Provider value={snap}>
        <RectCacheContext.Provider value={cache}>
          <div
            aria-label="Design canvas"
            className={cn(CANVAS_ROOT_CLASS, className)}
            data-testid="canvas-root"
            ref={viewport.rootRef}
            role="application"
            // biome-ignore lint/a11y/noNoninteractiveTabindex: the canvas is one tab stop with its own key map — CANVAS.md § Keyboard operation
            tabIndex={0}
          >
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
            <div className={OVERLAYS_CLASS} data-testid="canvas-overlays">
              <div className={MARQUEE_CLASS} data-testid="canvas-marquee" ref={marquee.ref} />
              <SnapGuides overlay={snap.overlay} />
              <DistanceLabels overlay={snap.overlay} />
              {guides !== undefined && <UserGuides guides={guides} viewport={viewport} />}
              {showRulers === true && <Rulers guides={guides} viewport={viewport} />}
            </div>
            <SelectionAnnouncer announcer={announcer} />
          </div>
        </RectCacheContext.Provider>
      </SnapContext.Provider>
    </ViewportProvider>
  )
}
