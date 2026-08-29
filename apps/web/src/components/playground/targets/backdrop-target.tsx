'use client'

import { Segmented } from '@motion-studio/ui'
import { type ReactElement, useState } from 'react'

import type { TargetProps } from './target.types'

/**
 * `backdrop-filter` — a glass panel over something busy. Over a flat surface the property does nothing
 * visible, so the sandbox ships the backdrop with it and lets the reader change what is behind the
 * glass: PLAYGROUND.md § Property sandboxes calls that the backdrop swatch picker.
 */
const BACKDROPS = {
  photo: 'bg-[url(/thumbnails/hero-aurora-dark.webp)] bg-cover bg-center',
  gradient:
    'bg-[conic-gradient(from_210deg,oklch(62%_0.19_285),oklch(72%_0.16_200),oklch(74%_0.15_150),oklch(68%_0.19_25),oklch(62%_0.19_285))]',
  pattern:
    'bg-[repeating-linear-gradient(45deg,oklch(62%_0.19_285)_0_14px,oklch(20%_0.01_265)_14px_28px)]',
} as const

type Backdrop = keyof typeof BACKDROPS

const OPTIONS = [
  { value: 'photo', label: 'Photo', content: 'Photo' },
  { value: 'gradient', label: 'Gradient', content: 'Gradient' },
  { value: 'pattern', label: 'Pattern', content: 'Pattern' },
]

export function BackdropTarget({ targetRef, initialStyle }: TargetProps): ReactElement {
  const [backdrop, setBackdrop] = useState<Backdrop>('photo')

  return (
    <div className="relative grid h-full w-full place-items-center overflow-hidden rounded-md [contain:paint]">
      <div className={`absolute inset-0 ${BACKDROPS[backdrop]}`} aria-hidden="true" />
      <div
        ref={targetRef}
        style={initialStyle}
        data-testid="playground-target"
        className="relative grid h-1/2 w-2/3 place-items-center rounded-xl border border-[oklch(100%_0_0_/_0.16)] bg-[oklch(100%_0_0_/_0.12)] text-center font-medium text-sm text-white"
      >
        Glass panel
      </div>
      <div className="-translate-x-1/2 absolute bottom-3 left-1/2">
        <Segmented
          value={backdrop}
          onValueChange={(next) => setBackdrop(next as Backdrop)}
          options={OPTIONS}
          aria-label="What is behind the glass"
        />
      </div>
    </div>
  )
}
