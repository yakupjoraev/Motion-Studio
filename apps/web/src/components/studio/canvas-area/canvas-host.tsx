'use client'

import { Canvas } from '@motion-studio/canvas'
import { selectors } from '@motion-studio/editor'
import { BREAKPOINTS } from '@motion-studio/schema'
import { useCallback, useMemo } from 'react'

import { useStudioStore } from '../../../store/editor-store'

import { NodeRenderer } from './node-renderer'
import { useCanvasPorts } from './use-canvas-ports'

/**
 * Where the two halves meet — ARCHITECTURE.md § The registry seam. The canvas is handed a render
 * function and a set of ports; it still imports neither the store nor a block.
 */
export function CanvasHost() {
  const ports = useCanvasPorts()
  const rootId = useStudioStore(selectors.selectRootId)
  const breakpoint = useStudioStore((state) => state.viewport.breakpoint)
  const grid = useStudioStore((state) => state.viewport.grid)
  const guides = useStudioStore((state) => state.viewport.guides)
  const rulers = useStudioStore((state) => state.viewport.rulers)
  const canvasWidth = useStudioStore((state) => state.document.meta.canvas.width)

  // Read during render on purpose: it is the one getter the rect cache needs as a prop, and the host
  // is what must re-render when the document changes — ADR-077.
  useStudioStore(selectors.selectVersion)

  const renderNode = useCallback((id: Parameters<typeof NodeRenderer>[0]['id']) => {
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
  )
}
