'use client'

import type { NodeId } from '@motion-studio/schema'
import { type CSSProperties, useRef } from 'react'

import { handlesVisible, writeBox } from './overlay-box'
import { HANDLE_CLASS, HANDLE_GROUP_CLASS, OVERLAY_BOX_STYLE } from './overlay.styles'
import type { OverlayPainter } from './overlay.types'
import { useOverlayPaint } from './use-overlay-rects'
import { RESIZE_HANDLES, type ResizeHandle, type ResizeHandleSpec } from './use-resize'

export interface ResizeHandlesProps {
  readonly id: NodeId
  readonly painter: OverlayPainter
  readonly resize: ResizeHandle
}

const seat = (spec: ResizeHandleSpec): CSSProperties => ({
  left: `${spec.x}%`,
  top: `${spec.y}%`,
  transform: 'translate(-50%, -50%)',
  cursor: spec.cursor,
})

/**
 * Eight squares on one selected node. They are `tabIndex={-1}` by ADR-096: the canvas is a single
 * tab stop, and the keyboard path to a resize is `Mod+Alt`+arrows on the canvas itself.
 */
export function ResizeHandles({ id, painter, resize }: ResizeHandlesProps) {
  const group = useRef<HTMLDivElement | null>(null)

  useOverlayPaint(painter, (frame) => {
    if (!writeBox(group.current, frame.rect(id)) || group.current === null) {
      return
    }

    group.current.dataset['zoomedOut'] = String(!handlesVisible(frame.transform.zoom))
  })

  return (
    <div
      className={HANDLE_GROUP_CLASS}
      data-testid="resize-handles"
      ref={group}
      style={OVERLAY_BOX_STYLE}
    >
      {RESIZE_HANDLES.map((spec) => (
        <button
          aria-label={`Resize ${spec.label}`}
          className={HANDLE_CLASS}
          data-direction={spec.direction}
          data-overlay-control=""
          key={spec.direction}
          onKeyDown={(event) => resize.key(event, spec)}
          onPointerDown={(event) => resize.start(event, spec)}
          style={seat(spec)}
          tabIndex={-1}
          type="button"
        />
      ))}
    </div>
  )
}
