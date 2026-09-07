'use client'

import { LAYOUT_TRANSPARENT_CLASS } from '@motion-studio/canvas'
import { MotionNode, presetRegistry } from '@motion-studio/motion'
import type { MotionChannel, MotionSpec } from '@motion-studio/schema'
import type { ReactNode } from 'react'

import { useMotionSettings } from './motion-settings'

export type NodeMotionSpecs = Readonly<Partial<Record<MotionChannel, MotionSpec>>>

/**
 * Where the document's motion becomes motion on screen — ANIMATION_SYSTEM.md § Applying motion. The
 * node states its channels, `packages/motion` composes and resolves them, the scheduler the canvas
 * host mounts decides whether this instance is inside the caps, and one engine owns the element.
 *
 * A node with no motion renders its block **unwrapped**: an element that animates nothing has no
 * business carrying an extra box, and on a two-hundred-node document that is two hundred fewer
 * elements to lay out.
 */
export function NodeMotion({
  motion,
  children,
}: {
  readonly motion: NodeMotionSpecs
  readonly children: ReactNode
}) {
  if (!animates(motion)) {
    return <>{children}</>
  }

  return <AnimatedNode motion={motion}>{children}</AnimatedNode>
}

function AnimatedNode({
  motion,
  children,
}: {
  readonly motion: NodeMotionSpecs
  readonly children: ReactNode
}) {
  const { scale, paused, replays } = useMotionSettings()

  return (
    <MotionNode
      // ADR-379: the box the engine animates is one the exported file does not have, so it wears the
      // classes that keep it out of the layout.
      className={LAYOUT_TRANSPARENT_CLASS}
      key={replays}
      motion={motion}
      paused={paused}
      presets={presetRegistry}
      scale={scale}
    >
      {children}
    </MotionNode>
  )
}

/** A channel the user switched off is still stored, so `disabled` counts as no motion at all. */
const animates = (motion: NodeMotionSpecs): boolean =>
  Object.values(motion).some((spec) => spec !== undefined && spec.disabled !== true)
