import type { NodeId } from '@motion-studio/schema'
import type { ReactNode } from 'react'

import type {
  CanvasHandle,
  CanvasMenuPort,
  CanvasMotionPort,
  CanvasResizePort,
  CanvasScene,
  CanvasSelectionPort,
} from './canvas.types'
import type { ViewportTransform } from './coords/index'
import type { GridSize } from './scene/grid'
import type { CanvasGuidePort } from './snap/snap.types'

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
