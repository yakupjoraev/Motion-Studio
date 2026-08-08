'use client'

import type { ReactNode, RefObject } from 'react'

import { ARTBOARD_CLASS } from '../canvas.styles'

import { Grid } from './grid'
import type { GridSize } from './grid'

export interface ArtboardProps {
  /** Canvas units. The breakpoint frame is this wide — RESPONSIVE_ENGINE.md § Preview frames. */
  readonly width: number
  readonly showGrid?: boolean | undefined
  readonly gridSize?: GridSize | undefined
  readonly artboardRef?: RefObject<HTMLDivElement | null> | undefined
  readonly children: ReactNode
}

/**
 * The page the nodes live on. Its width is the breakpoint being previewed, and its height is whatever
 * the content comes to — which is also what `Shift+1` measures to fit the document.
 */
export function Artboard({
  width,
  showGrid = true,
  gridSize,
  artboardRef,
  children,
}: ArtboardProps) {
  return (
    <div
      className={ARTBOARD_CLASS}
      data-testid="canvas-artboard"
      ref={artboardRef}
      style={{ width: `${width}px` }}
    >
      {showGrid ? <Grid size={gridSize} /> : null}
      {children}
    </div>
  )
}
