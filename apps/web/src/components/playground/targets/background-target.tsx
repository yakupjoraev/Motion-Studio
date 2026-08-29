'use client'

import type { ReactElement } from 'react'

import type { TargetProps } from './target.types'

/**
 * `background` — PLAYGROUND.md § Property sandboxes: a full-bleed rectangle. A gradient judged inside a
 * small padded card is a gradient judged at the wrong scale, so the value owns the whole frame.
 */
export function BackgroundTarget({ targetRef, initialStyle }: TargetProps): ReactElement {
  return (
    <div
      ref={targetRef}
      style={initialStyle}
      data-testid="playground-target"
      className="h-full w-full rounded-md [contain:paint]"
    />
  )
}
