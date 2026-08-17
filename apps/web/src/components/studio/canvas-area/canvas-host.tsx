'use client'

import { Canvas, type CanvasHandle } from '@motion-studio/canvas'
import { selectors } from '@motion-studio/editor'
import { MotionSchedulerProvider } from '@motion-studio/motion'
import { useCallback, useMemo, useRef } from 'react'

import { useStudioStore } from '../../../store/editor-store'

import { useArtboardResize } from './artboard-resize'
import { useCanvasAutoPan } from './canvas-auto-pan'
import { setCanvasHandle } from './canvas-handle'
import { MotionSettingsProvider } from './motion-settings'
import { MultiFrameView } from './multi-frame-view'
import { NodeRenderer } from './node-renderer'
import { useCanvasPorts } from './use-canvas-ports'

/**
 * The counter PERFORMANCE.md's canvas budget is checked against: `renderNode` runs once per canvas
 * render, so this is how many times the canvas rendered. Not in production, and read by the perf
 * tests and by a browser walkthrough rather than by anything in the app.
 */
const countCanvasRender = (): void => {
  if (process.env.NODE_ENV === 'production' || typeof window === 'undefined') {
    return
  }

  const held = window as unknown as { __canvasRenders?: number }

  held.__canvasRenders = (held.__canvasRenders ?? 0) + 1
}

/**
 * Where the two halves meet — ARCHITECTURE.md § The registry seam. The canvas is handed a render
 * function and a set of ports; it still imports neither the store nor a block.
 */
export function CanvasHost() {
  const ports = useCanvasPorts()
  const motionPaused = useStudioStore((state) => state.viewport.motionPaused)
  const rootId = useStudioStore(selectors.selectRootId)
  const breakpoint = useStudioStore((state) => state.viewport.breakpoint)
  const grid = useStudioStore((state) => state.viewport.grid)
  const guides = useStudioStore((state) => state.viewport.guides)
  const rulers = useStudioStore((state) => state.viewport.rulers)
  const multiFrame = useStudioStore((state) => state.viewport.multiFrame)
  const handle = useRef<CanvasHandle | null>(null)
  const artboard = useArtboardResize(handle)
  const island = useRef<HTMLDivElement>(null)

  useCanvasAutoPan(island)

  const onReady = useCallback((ready: CanvasHandle | null) => {
    handle.current = ready
    // The palette inserts into a canvas it is not rendered inside — it reveals the new node through here.
    setCanvasHandle(ready)
  }, [])

  // ADR-112: nothing here subscribes to the document. The rect cache hears about a change through
  // the scene's own subscription, so an inspector drag re-renders the edited node and nothing else.
  const renderNode = useCallback((id: Parameters<typeof NodeRenderer>[0]['id']) => {
    countCanvasRender()

    return <NodeRenderer id={id} />
  }, [])

  const onTransformCommit = useCallback(
    (transform: { zoom: number; pan: { x: number; y: number } }) => {
      const { setZoom, setPan } = useStudioStore.getState()

      setZoom(transform.zoom)
      setPan(transform.pan)
    },
    [],
  )

  const initialTransform = useMemo(() => {
    const { zoom, pan } = useStudioStore.getState().viewport

    return { zoom, pan }
  }, [])

  return (
    <MotionSchedulerProvider paused={motionPaused}>
      <MotionSettingsProvider>
        {multiFrame ? (
          <MultiFrameView />
        ) : (
          // The wrapper is what hears the artboard's own width transition finish — ADR-164.
          <div className="h-full w-full" onTransitionEnd={artboard.onTransitionEnd} ref={island}>
            <Canvas
              artboardWidth={artboard.width}
              breakpointName={breakpoint}
              gridSize={grid.size as 4 | 8 | 16 | 24}
              initialTransform={initialTransform}
              menu={ports.menu}
              motion={ports.motion}
              onReady={onReady}
              onTransformCommit={onTransformCommit}
              renderNode={renderNode}
              resize={ports.resize}
              rootId={rootId}
              scene={ports.scene}
              selection={ports.selection}
              showGrid={grid.enabled}
              showRulers={rulers}
              snapEnabled={guides.enabled}
              snapThreshold={guides.snapThreshold}
            />
          </div>
        )}
      </MotionSettingsProvider>
    </MotionSchedulerProvider>
  )
}
