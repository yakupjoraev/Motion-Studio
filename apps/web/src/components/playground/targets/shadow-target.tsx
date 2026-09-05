'use client'

import type { ReactElement } from 'react'

import { usePlayground } from '../../../lib/i18n/playground-surface'

import type { TargetProps } from './target.types'

/**
 * `box-shadow` — a card on a **mid-tone** surface. The reason is the whole point of a purpose-built
 * target: a shadow is invisible on white and invisible on black, and a sandbox that showed either
 * would let a reader ship a shadow they never actually saw.
 */
export function ShadowTarget({ targetRef, initialStyle }: TargetProps): ReactElement {
  const copy = usePlayground()

  return (
    <div className="grid h-full w-full place-items-center rounded-md bg-[oklch(72%_0.02_265)] p-10 [contain:paint]">
      <div
        ref={targetRef}
        style={initialStyle}
        data-testid="playground-target"
        className="grid h-full max-h-64 w-full max-w-sm place-items-center rounded-lg bg-[oklch(97%_0.004_265)] p-6 text-center font-medium text-[oklch(20%_0.01_265)] text-sm"
      >
        {copy.cardOnSurface}
      </div>
    </div>
  )
}
