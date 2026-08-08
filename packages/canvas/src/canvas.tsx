'use client'

import type { NodeId } from '@motion-studio/schema'
import { cn } from '@motion-studio/utils'
import { type ReactNode, useCallback, useRef } from 'react'

import { CANVAS_ROOT_CLASS } from './canvas.styles'
import { type CanvasRect, type ViewportTransform, canvasRect } from './coords/index'
import { Artboard } from './scene/artboard'
import type { GridSize } from './scene/grid'
import { Scene } from './scene/scene'
import { usePan } from './viewport/use-pan'
import { type ViewportHandle, useViewport } from './viewport/use-viewport'
import { useZoom } from './viewport/use-zoom'
import { ViewportProvider } from './viewport/viewport-context'

export interface CanvasProps {
  readonly rootId: NodeId
  /** The seam: the canvas renders what it is handed and imports neither `editor` nor `blocks`. */
  readonly renderNode: (id: NodeId) => ReactNode
  /** Canvas units — the width of the breakpoint being previewed. */
  readonly artboardWidth: number
  readonly className?: string | undefined
  readonly showGrid?: boolean | undefined
  readonly gridSize?: GridSize | undefined
  readonly initialTransform?: ViewportTransform | undefined
  /** Called once per gesture, with the transform the store should record. */
  readonly onTransformCommit?: ((transform: ViewportTransform) => void) | undefined
}

/**
 * CANVAS.md § DOM structure: a fixed root, one transformed scene, and an overlay layer outside the
 * transform (prompt 21 fills it). Pan and zoom write CSS variables inside one `rAF`, so a gesture
 * renders nothing — PERFORMANCE.md § The core rule.
 *
 * `role="application"` with a tab stop, because the arrows and `Space` mean something here that they
 * do not mean in a document — ACCESSIBILITY.md § Canvas.
 */
export function Canvas({
  rootId,
  renderNode,
  artboardWidth,
  className,
  showGrid,
  gridSize,
  initialTransform,
  onTransformCommit,
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

  return (
    <ViewportProvider viewport={viewport}>
      <div
        aria-label="Canvas"
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
      </div>
    </ViewportProvider>
  )
}
