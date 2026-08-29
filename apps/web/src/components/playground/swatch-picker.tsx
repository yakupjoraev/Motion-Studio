'use client'

import { ColorPicker } from '@motion-studio/ui'
import { type ReactElement, useEffect, useRef } from 'react'

import type { ColorHit } from './color-swatches'

/**
 * The picker a swatch opens — PLAYGROUND.md § Editor. It is the studio's own `ColorPicker`, floating at
 * the swatch the reader clicked, and it writes back into the exact range the swatch decorated: the
 * editor keeps the text, and this only replaces a colour with a colour.
 */
export interface SwatchPickerProps {
  readonly hit: ColorHit
  readonly onChange: (color: string) => void
  readonly onClose: () => void
}

export function SwatchPicker({ hit, onChange, onClose }: SwatchPickerProps): ReactElement {
  const panel = useRef<HTMLDivElement | null>(null)

  /** Escape and a click outside close it, which is what every other floating surface here does. */
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    const onPointerDown = (event: PointerEvent): void => {
      if (panel.current?.contains(event.target as Node) !== true) {
        onClose()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('pointerdown', onPointerDown)

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('pointerdown', onPointerDown)
    }
  }, [onClose])

  return (
    <div
      ref={panel}
      data-testid="swatch-picker"
      style={{ left: hit.x, top: hit.y + 8 }}
      className="fixed z-50 rounded-lg border border-border bg-surface-2 p-3 shadow-lg"
    >
      <ColorPicker
        label="Colour"
        value={{ kind: 'color', color: hit.value }}
        onChange={(next) => {
          if (next.kind === 'color') {
            onChange(next.color)
          }
        }}
        onCommit={(next) => {
          if (next.kind === 'color') {
            onChange(next.color)
          }
        }}
        alpha
      />
    </div>
  )
}
