import type { MotionChannel } from '@motion-studio/schema'

import { DISABLED_MOTION, type ResolvedMotion, type TargetProperties } from '../model/preset.types'

export type ReduceKind = 'properties' | 'end-state' | 'instant' | 'disabled'

export interface ReducePolicy {
  readonly kind: ReduceKind
  /** For `properties`: the only properties that may still animate. */
  readonly keep?: readonly string[]
  /** For `properties`: the duration the channel is held to, in milliseconds. */
  readonly duration?: number
}

/** Colour and shadow — the properties that carry no motion, so they survive every reduction. */
const PAINT = ['color', 'backgroundColor', 'borderColor', 'outlineColor', 'boxShadow'] as const

/**
 * ANIMATION_SYSTEM.md § Reduced motion, transcribed. `cursor` and `continuous` are disabled entirely
 * rather than slowed: a cursor effect that still tracks and a background that still drifts are exactly
 * what the setting exists to stop, and "slower" is not the same request.
 */
export const REDUCE_POLICY = {
  entrance: { kind: 'properties', keep: ['opacity'], duration: 120 },
  scroll: { kind: 'end-state' },
  hover: { kind: 'properties', keep: PAINT },
  press: { kind: 'properties', keep: ['opacity', ...PAINT] },
  cursor: { kind: 'disabled' },
  continuous: { kind: 'disabled' },
  exit: { kind: 'instant' },
} as const satisfies Record<MotionChannel, ReducePolicy>

export const policyFor = (channel: MotionChannel): ReducePolicy => REDUCE_POLICY[channel]

/**
 * ADR-142: the floor under every preset's own `resolveReduced`. It filters what it can read — the
 * variants and the properties a resolution declares — and leaves `className` and `keyframes` to the
 * preset, because a class cannot be filtered one property at a time.
 */
export function reduce(resolved: ResolvedMotion, policy: ReducePolicy): ResolvedMotion {
  if (policy.kind === 'disabled') {
    return DISABLED_MOTION
  }

  if (policy.kind === 'instant') {
    return { ...resolved, transition: { duration: 0, delay: 0 } }
  }

  if (policy.kind === 'end-state') {
    return endState(resolved)
  }

  return limited(resolved, policy)
}

/**
 * A scroll-driven animation with nothing driving it: the last variant is where the element ends up, so
 * it becomes the only one, and the listeners that would scrub it are gone.
 */
function endState(resolved: ResolvedMotion): ResolvedMotion {
  const entries = Object.entries(resolved.variants ?? {})
  const last = entries.at(-1)
  const { listeners: _listeners, ...rest } = resolved

  return {
    ...rest,
    ...(last === undefined ? {} : { variants: { [last[0]]: last[1] } }),
    transition: { duration: 0, delay: 0 },
  }
}

function limited(resolved: ResolvedMotion, policy: ReducePolicy): ResolvedMotion {
  const keep = new Set(policy.keep ?? [])
  const variants = Object.fromEntries(
    Object.entries(resolved.variants ?? {}).map(([name, target]) => [name, filter(target, keep)]),
  )

  return {
    ...resolved,
    ...(resolved.variants === undefined ? {} : { variants }),
    ...(resolved.properties === undefined
      ? {}
      : { properties: resolved.properties.filter((property) => keep.has(property)) }),
    transition: {
      ...resolved.transition,
      ...(policy.duration === undefined ? {} : { duration: policy.duration }),
    },
  }
}

const filter = (target: TargetProperties, keep: ReadonlySet<string>): TargetProperties =>
  Object.fromEntries(Object.entries(target).filter(([property]) => keep.has(property)))
