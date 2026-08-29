'use client'

import { Segmented } from '@motion-studio/ui'
import { type ReactElement, useState } from 'react'

import type { TargetProps } from './target.types'

/**
 * `mask-image` — the image sits on a checkerboard, because a mask is defined by what it *removed*, and
 * a masked photograph over an opaque background shows none of that.
 *
 * Three view modes, per PLAYGROUND.md § Property sandboxes: the result, the mask on its own, and both
 * side by side. The mask panel paints the same value as a `background-image`, which is the same
 * gradient the mask is made of rather than a second drawing of it.
 */
const VIEWS = [
  { value: 'result', label: 'Result', content: 'Result' },
  { value: 'mask', label: 'Mask', content: 'Mask' },
  { value: 'both', label: 'Both', content: 'Both' },
]

type View = 'result' | 'mask' | 'both'

/** The standard transparency grid: two gradients, offset by half a cell. */
const CHECKERBOARD =
  'bg-[length:16px_16px] bg-[position:0_0,0_8px,8px_-8px,-8px_0] bg-[linear-gradient(45deg,oklch(30%_0_0)_25%,transparent_25%),linear-gradient(-45deg,oklch(30%_0_0)_25%,transparent_25%),linear-gradient(45deg,transparent_75%,oklch(30%_0_0)_75%),linear-gradient(-45deg,transparent_75%,oklch(30%_0_0)_75%)]'

export function MaskTarget({ targetRef, applied, initialStyle }: TargetProps): ReactElement {
  const [view, setView] = useState<View>('result')
  const showsResult = view !== 'mask'
  const showsMask = view !== 'result'

  return (
    <div className="grid h-full w-full grid-rows-[1fr_auto] gap-3 rounded-md p-3 [contain:paint]">
      <div className={`grid gap-3 ${view === 'both' ? 'grid-cols-2' : 'grid-cols-1'}`}>
        {/*
          The target stays mounted in every view: it is the element the property is set on, and
          unmounting it would drop the value the moment somebody looked at the mask.
        */}
        <div
          className={`relative overflow-hidden rounded-md ${CHECKERBOARD} ${showsResult ? '' : 'hidden'}`}
        >
          <div
            ref={targetRef}
            style={initialStyle}
            data-testid="playground-target"
            className="h-full w-full bg-[url(/thumbnails/hero-aurora-dark.webp)] bg-center bg-cover"
          />
        </div>
        {showsMask && (
          <div
            data-testid="playground-mask-view"
            className={`relative overflow-hidden rounded-md ${CHECKERBOARD}`}
          >
            <div
              className="h-full w-full bg-center bg-cover"
              style={{ backgroundImage: applied === '' ? undefined : applied }}
            />
          </div>
        )}
      </div>
      <div className="justify-self-center">
        <Segmented
          value={view}
          onValueChange={(next) => setView(next as View)}
          options={VIEWS}
          aria-label="Mask preview"
        />
      </div>
    </div>
  )
}
