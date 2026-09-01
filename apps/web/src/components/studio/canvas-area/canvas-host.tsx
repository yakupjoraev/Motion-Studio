'use client'

import { Canvas, type CanvasHandle } from '@motion-studio/canvas'
import { selectors } from '@motion-studio/editor'
import { MotionSchedulerProvider } from '@motion-studio/motion'
import { type RefObject, useCallback, useMemo, useRef } from 'react'

import { countRender } from '../../../lib/dev/render-counter'
import { useStudioStore } from '../../../store/editor-store'

import { useArtboardResize } from './artboard-resize'
import { useCanvasAutoPan } from './canvas-auto-pan'
import { setCanvasHandle } from './canvas-handle'
import { MotionSettingsProvider } from './motion-settings'
import { MultiFrameView } from './multi-frame-view'
import { NodeRenderer } from './node-renderer'
import { useCanvasPorts } from './use-canvas-ports'

/**
 * The auto-pan subscription, one component below the host: `useDragActive` reads dnd-kit's context,
 * and a context consumer re-renders on every pointer move. Here that costs renders of a component
 * that returns null instead of renders of the canvas — ADR-316.
 */
function CanvasAutoPan({ rootRef }: { readonly rootRef: RefObject<HTMLDivElement | null> }): null {
  useCanvasAutoPan(rootRef)

  return null
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

  const onReady = useCallback((ready: CanvasHandle | null) => {
    handle.current = ready
    // The palette inserts into a canvas it is not rendered inside — it reveals the new node through here.
    setCanvasHandle(ready)
  }, [])

  // ADR-112: nothing here subscribes to the document. The rect cache hears about a change through
  // the scene's own subscription, so an inspector drag re-renders the edited node and nothing else.
  // `renderNode` runs once per canvas render, so counting here counts the canvas rather than its host.
  const renderNode = useCallback((id: Parameters<typeof NodeRenderer>[0]['id']) => {
    countRender('canvas-root')

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
        <CanvasAutoPan rootRef={island} />
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
