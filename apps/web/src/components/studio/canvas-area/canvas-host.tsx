'use client'

import { Canvas } from '@motion-studio/canvas'
import { selectors } from '@motion-studio/editor'
import { MotionSchedulerProvider } from '@motion-studio/motion'
import { BREAKPOINTS } from '@motion-studio/schema'
import { useCallback, useMemo } from 'react'

import { useStudioStore } from '../../../store/editor-store'

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
  const canvasWidth = useStudioStore((state) => state.document.meta.canvas.width)

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

  // The frame the design is being made for: `base` previews the document's own canvas width, and
  // every other breakpoint previews its own — RESPONSIVE_ENGINE.md § Breakpoints.
  const artboardWidth = breakpoint === 'base' ? canvasWidth : BREAKPOINTS[breakpoint].frame

  return (
    <MotionSchedulerProvider paused={motionPaused}>
      <Canvas
        artboardWidth={artboardWidth}
        breakpointName={BREAKPOINTS[breakpoint].label}
        gridSize={grid.size as 4 | 8 | 16 | 24}
        initialTransform={initialTransform}
        menu={ports.menu}
        motion={ports.motion}
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
    </MotionSchedulerProvider>
  )
}
