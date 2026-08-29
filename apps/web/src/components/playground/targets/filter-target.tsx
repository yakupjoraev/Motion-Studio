'use client'

import type { ReactElement } from 'react'

import type { TargetProps } from './target.types'

/**
 * `filter` — an image, text and a gradient inside one filtered element. A filter chain reads
 * differently on each: `contrast()` that flatters a photograph can make body text unreadable, and a
 * sandbox showing only the photograph would hide that.
 */
export function FilterTarget({ targetRef, initialStyle }: TargetProps): ReactElement {
  return (
    <div className="grid h-full w-full place-items-center rounded-md bg-surface-1 p-6 [contain:paint]">
      <div
        ref={targetRef}
        style={initialStyle}
        data-testid="playground-target"
        className="flex h-full w-full flex-col gap-4 overflow-hidden rounded-lg"
      >
        {/* Decorative: the sandbox is about the filter, and the picture carries no information. */}
        <img
          src="/thumbnails/hero-aurora-dark.webp"
          alt=""
          className="h-1/2 w-full rounded-md object-cover"
        />
        <p className="m-0 text-pretty text-foreground text-sm">
          Filters apply to everything the element paints — a photograph, this sentence, and the band
          below it. Judge all three at once.
        </p>
        <div className="h-10 w-full rounded-md bg-[linear-gradient(90deg,oklch(62%_0.19_285),oklch(72%_0.16_200),oklch(74%_0.15_150))]" />
      </div>
    </div>
  )
}
