'use client'

import type { NodeId } from '@motion-studio/schema'
import { useEffect, useRef, useState } from 'react'

import type { CanvasScene, NodeSpacing } from '../canvas.types'

import { writeBox, writeSpacing } from './overlay-box'
import {
  OVERLAY_BOX_STYLE,
  SPACING_BAND_CLASS,
  SPACING_BOX_CLASS,
  type SpacingKind,
  type SpacingSide,
  spacingBandStyle,
} from './overlay.styles'
import type { OverlayPainter } from './overlay.types'
import { useOverlayPaint } from './use-overlay-rects'

const SIDES: readonly SpacingSide[] = ['top', 'right', 'bottom', 'left']
const KINDS: readonly SpacingKind[] = ['padding', 'margin']

/** UI_GUIDELINES.md § Canvas presentation: the visualization is on `Alt`, and only while it is held. */
export function useAltHeld(): boolean {
  const [held, setHeld] = useState(false)

  useEffect(() => {
    const read = (event: KeyboardEvent): void => setHeld(event.altKey)
    // A window that loses focus mid-hold never sends the `keyup`, and the tint would stay.
    const clear = (): void => setHeld(false)

    window.addEventListener('keydown', read)
    window.addEventListener('keyup', read)
    window.addEventListener('blur', clear)

    return () => {
      window.removeEventListener('keydown', read)
      window.removeEventListener('keyup', read)
      window.removeEventListener('blur', clear)
    }
  }, [])

  return held
}

export interface SpacingOverlayProps {
  readonly id: NodeId
  readonly scene: CanvasScene
  readonly painter: OverlayPainter
}

/** ADR-099: the numbers are the resolved props the inspector shows, not what the browser laid out. */
export function SpacingOverlay({ id, scene, painter }: SpacingOverlayProps) {
  const box = useRef<HTMLDivElement | null>(null)
  const bands = useRef<Map<string, HTMLDivElement | null>>(new Map())

  useOverlayPaint(painter, (frame) => {
    const spacing = scene.spacing(id)

    if (spacing === undefined || !writeBox(box.current, frame.rect(id))) {
      box.current?.removeAttribute('data-active')

      return
    }

    writeSpacing(box.current, spacing)
    label(bands.current, spacing)
  })

  return (
    <div
      aria-hidden
      className={SPACING_BOX_CLASS}
      data-testid={`spacing-overlay-${id}`}
      ref={box}
      style={OVERLAY_BOX_STYLE}
    >
      {KINDS.flatMap((kind) =>
        SIDES.map((side) => (
          <div
            className={SPACING_BAND_CLASS}
            data-kind={kind}
            data-testid={`spacing-${kind}-${side}`}
            key={`${kind}-${side}`}
            ref={(element) => {
              bands.current.set(`${kind}-${side}`, element)
            }}
            style={spacingBandStyle(kind, side)}
          />
        )),
      )}
    </div>
  )
}

/** A side with no value has nothing to say, so it is hidden rather than labelled zero. */
function label(bands: Map<string, HTMLDivElement | null>, spacing: NodeSpacing): void {
  for (const kind of KINDS) {
    for (const side of SIDES) {
      const element = bands.get(`${kind}-${side}`)
      const value = spacing[kind][side]

      if (element === null || element === undefined) {
        continue
      }

      element.dataset['zero'] = String(value === 0)
      element.textContent = value === 0 ? '' : String(value)
    }
  }
}
