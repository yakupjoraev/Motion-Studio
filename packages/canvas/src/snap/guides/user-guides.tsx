'use client'

import { type CSSProperties, useState } from 'react'

import type { ViewportHandle } from '../../viewport/use-viewport'
import {
  GUIDE_INPUT_CLASS,
  USER_GUIDE_CLASS,
  USER_GUIDE_HANDLE_CLASS,
  placeOnAxis,
} from '../snap.styles'
import type { CanvasGuidePort, UserGuide } from '../snap.types'

import { useGuideDrag } from './use-guide-drag'

export interface UserGuidesProps {
  readonly viewport: ViewportHandle
  readonly guides: CanvasGuidePort
}

const along = (guide: UserGuide): CSSProperties =>
  guide.axis === 'x'
    ? { left: placeOnAxis('x', guide.value) }
    : { top: placeOnAxis('y', guide.value) }

/**
 * The guides the user dragged off the rulers. They are React-rendered — their positions change on
 * commit, not per frame, and `calc()` over the viewport variables is what keeps them in place while
 * the canvas pans and zooms without anything re-rendering (ADR-086).
 */
export function UserGuides({ viewport, guides }: UserGuidesProps) {
  const [editing, setEditing] = useState<UserGuide | null>(null)
  const drag = useGuideDrag({ viewport, guides })

  return (
    <>
      {guides.guides.map((guide) => (
        <div
          className={USER_GUIDE_CLASS}
          data-axis={guide.axis}
          data-overlay-control=""
          data-testid={`user-guide-${guide.id}`}
          key={guide.id}
          onDoubleClick={() => setEditing(guide)}
          onPointerDown={(event) => drag.start(event, guide)}
          style={along(guide)}
        >
          {/* A 1 px line is not a pointer target; this is the 8 px of grab around it. */}
          <span className={USER_GUIDE_HANDLE_CLASS} data-axis={guide.axis} />
        </div>
      ))}
      {editing !== null && (
        <GuideInput
          guide={editing}
          onClose={() => setEditing(null)}
          onCommit={(value) => guides.move(editing.id, value)}
        />
      )}
    </>
  )
}

interface GuideInputProps {
  readonly guide: UserGuide
  readonly onCommit: (value: number) => void
  readonly onClose: () => void
}

/** Double-click to type an exact value — CANVAS.md § Guides. */
function GuideInput({ guide, onCommit, onClose }: GuideInputProps) {
  const [text, setText] = useState(String(guide.value))

  const commit = (): void => {
    const value = Number(text)

    if (Number.isFinite(value)) {
      onCommit(value)
    }

    onClose()
  }

  return (
    <input
      aria-label={`Guide position, ${guide.axis} axis`}
      // biome-ignore lint/a11y/noAutofocus: the field exists because the user double-clicked the guide, and it is the only thing the gesture asked for — the rule is about focus stolen on load
      autoFocus
      className={GUIDE_INPUT_CLASS}
      data-testid="guide-input"
      onBlur={onClose}
      onChange={(event) => setText(event.target.value)}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          commit()
        }

        if (event.key === 'Escape') {
          onClose()
        }
      }}
      style={along(guide)}
      type="number"
      value={text}
    />
  )
}
