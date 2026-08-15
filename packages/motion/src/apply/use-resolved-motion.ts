'use client'

import type { MotionChannel, MotionSpec } from '@motion-studio/schema'
import { useMemo } from 'react'

import { type ComposedMotion, composeMotion } from '../model/compose'
import type { MotionPresetRegistry } from '../model/preset.types'
import { useReducedMotion } from '../reduced/use-reduced-motion'

export type NodeMotion = Partial<Record<MotionChannel, MotionSpec>>

export interface UseResolvedMotionOptions {
  readonly presets: MotionPresetRegistry
  /** `theme.motionScale`. */
  readonly scale: number
  /** The studio's reduced-motion preview: forced on, otherwise the media query answers. */
  readonly forceReduced?: boolean
}

/**
 * ANIMATION_SYSTEM.md § Applying motion. The composition itself is memoised on the four things that
 * change it, and every resolution under it is memoised in `resolveMotion` — so a node re-renders and
 * gets the same objects back, which is what keeps an engine from restarting an animation.
 */
export function useResolvedMotion(
  motion: NodeMotion,
  { presets, scale, forceReduced }: UseResolvedMotionOptions,
): ComposedMotion {
  const detected = useReducedMotion()
  const reduced = forceReduced ?? detected

  return useMemo(
    () => composeMotion(motion, { reduced, scale, presets }),
    [motion, presets, reduced, scale],
  )
}
