'use client'

import type { ReactElement } from 'react'

import type { TargetProps } from './target.types'

/**
 * `transform` — the card sits inside a container that has `perspective`, because `rotateX` without one
 * is a squash rather than a rotation, and a sandbox that showed the squash would teach the wrong thing.
 *
 * The perspective is on the parent and the value is on the child, which is the arrangement the property
 * is designed for.
 */
export function TransformTarget({ targetRef, initialStyle }: TargetProps): ReactElement {
  return (
    <div className="grid h-full w-full place-items-center rounded-md bg-surface-2 p-10 [contain:paint] [perspective:1000px]">
      <div
        ref={targetRef}
        style={initialStyle}
        data-testid="playground-target"
        className="grid h-48 w-72 place-items-center rounded-xl bg-[linear-gradient(140deg,oklch(62%_0.19_285),oklch(72%_0.16_200))] p-6 text-center font-medium text-sm text-white shadow-lg"
      >
        Card in a perspective container
      </div>
    </div>
  )
}
