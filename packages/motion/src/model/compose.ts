import type { MotionChannel, MotionSpec } from '@motion-studio/schema'

import {
  DISABLED_MOTION,
  type ResolveContext,
  type ResolvedMotion,
  type TargetProperties,
} from './preset.types'
import { resolveMotion } from './resolve'

export interface MotionConflict {
  /** The channel that keeps the properties, and the one that loses them. */
  readonly winner: MotionChannel
  readonly loser: MotionChannel
  readonly properties: readonly string[]
  /** Written for the warning chip in the motion panel, so it names both channels and the properties. */
  readonly reason: string
}

/** One channel's own resolution, kept beside the merge so a host can ask which engine wants what. */
export interface MotionPart {
  readonly channel: MotionChannel
  readonly resolved: ResolvedMotion
}

export interface ComposedMotion {
  readonly resolved: ResolvedMotion
  readonly conflicts: readonly MotionConflict[]
  /** In precedence order, and only the channels that resolved to something. */
  readonly parts: readonly MotionPart[]
}

/**
 * Which channel keeps a property when two want it. ANIMATION_SYSTEM.md § Composition states one pair —
 * `scroll` beats `entrance` — and the rest follows the same principle: the longer a channel owns the
 * element, the higher it sits, because the shorter one can give the property back and the longer one
 * cannot. `cursor` is last and never collides: it writes custom properties, not properties.
 */
export const CHANNEL_PRECEDENCE: readonly MotionChannel[] = [
  'scroll',
  'entrance',
  'exit',
  'continuous',
  'hover',
  'press',
  'cursor',
]

/**
 * The pieces `transform` is made of. Two of them compose — `x` and `scale` are separate motion values
 * and separate CSS functions — but the whole property does not compose with any of them, because
 * writing `transform` replaces every component at once (ADR-143).
 */
export const TRANSFORM_COMPONENTS: readonly string[] = [
  'x',
  'y',
  'z',
  'translateX',
  'translateY',
  'translateZ',
  'scale',
  'scaleX',
  'scaleY',
  'rotate',
  'rotateX',
  'rotateY',
  'rotateZ',
  'skew',
  'skewX',
  'skewY',
]

const COMPONENTS = new Set(TRANSFORM_COMPONENTS)

/** Whether two animated properties can be written by two channels at once. */
export const collides = (one: string, other: string): boolean =>
  one === other ||
  (one === 'transform' && COMPONENTS.has(other)) ||
  (other === 'transform' && COMPONENTS.has(one))

/**
 * What a resolution animates. Custom properties are deliberately absent: a cursor preset writes
 * `--ms-cursor-x`, which no other channel is competing for, and that is the mechanism behind "cursor
 * composes with everything" (ADR-140).
 */
export function motionProperties(resolved: ResolvedMotion): ReadonlySet<string> {
  const properties = new Set<string>(resolved.properties ?? [])

  for (const target of Object.values(resolved.variants ?? {})) {
    for (const property of Object.keys(target)) {
      properties.add(property)
    }
  }

  return properties
}

/**
 * ANIMATION_SYSTEM.md § Composition. One spec per channel, merged into the single resolution an
 * element runs — and the conflicts are found by comparing property sets, never channel names, so the
 * rule holds for presets nobody has written yet.
 */
export function composeMotion(
  specs: Partial<Record<MotionChannel, MotionSpec>>,
  ctx: ResolveContext,
): ComposedMotion {
  const conflicts: MotionConflict[] = []
  /** Property → the channel that got there first, in precedence order. */
  const claimed = new Map<string, MotionChannel>()
  const parts: MotionPart[] = []

  for (const channel of CHANNEL_PRECEDENCE) {
    const spec = specs[channel]

    if (spec === undefined) {
      continue
    }

    const resolved = resolveMotion(spec, ctx)

    if (isEmpty(resolved)) {
      continue
    }

    const taken = new Map<string, MotionChannel>()

    for (const property of motionProperties(resolved)) {
      const owner = ownerOf(claimed, property)

      if (owner === undefined) {
        claimed.set(property, channel)
      } else {
        taken.set(property, owner)
      }
    }

    for (const [winner, properties] of groupByWinner(taken)) {
      conflicts.push({
        winner,
        loser: channel,
        properties,
        reason: `${winner} and ${channel} both animate ${properties.join(', ')}; ${winner} keeps it.`,
      })
    }

    parts.push({ channel, resolved: strip(resolved, new Set(taken.keys())) })
  }

  return { resolved: merge(parts.map((part) => part.resolved)), conflicts, parts }
}

/** The first channel that already writes something this property cannot share with. */
function ownerOf(
  claimed: ReadonlyMap<string, MotionChannel>,
  property: string,
): MotionChannel | undefined {
  for (const [held, channel] of claimed) {
    if (collides(held, property)) {
      return channel
    }
  }

  return undefined
}

const isEmpty = (resolved: ResolvedMotion): boolean =>
  resolved.variants === undefined &&
  resolved.listeners === undefined &&
  resolved.cssVars === undefined &&
  resolved.className === undefined &&
  resolved.keyframes === undefined &&
  resolved.properties === undefined

/** One conflict per pair of channels, not one per property: the chip names the pair. */
function groupByWinner(
  taken: ReadonlyMap<string, MotionChannel>,
): ReadonlyMap<MotionChannel, string[]> {
  const grouped = new Map<MotionChannel, string[]>()

  for (const [property, winner] of taken) {
    grouped.set(winner, [...(grouped.get(winner) ?? []), property])
  }

  return grouped
}

/** The loser keeps everything it does not share — a conflict costs one property, not one preset. */
function strip(resolved: ResolvedMotion, lost: ReadonlySet<string>): ResolvedMotion {
  if (lost.size === 0) {
    return resolved
  }

  const variants = Object.fromEntries(
    Object.entries(resolved.variants ?? {}).map(([name, target]) => [
      name,
      withoutLost(target, lost),
    ]),
  )

  return {
    ...resolved,
    ...(resolved.variants === undefined ? {} : { variants }),
    ...(resolved.properties === undefined
      ? {}
      : { properties: resolved.properties.filter((property) => !lost.has(property)) }),
  }
}

const withoutLost = (target: TargetProperties, lost: ReadonlySet<string>): TargetProperties =>
  Object.fromEntries(Object.entries(target).filter(([property]) => !lost.has(property)))

/**
 * The merged element. The engine and the transition come from the highest-precedence part that
 * animates anything: one element runs one engine (§ Engine selection), and a single `ResolvedMotion`
 * carries a single transition — the parts below it keep their variants, listeners and variables.
 */
function merge(parts: readonly ResolvedMotion[]): ResolvedMotion {
  const [first] = parts

  if (first === undefined) {
    return DISABLED_MOTION
  }

  const variants: Record<string, TargetProperties> = {}
  const cssVars: Record<string, string> = {}
  const listeners = parts.flatMap((part) => part.listeners ?? [])
  const classNames = parts.flatMap((part) => (part.className === undefined ? [] : [part.className]))
  const keyframes = parts.flatMap((part) => (part.keyframes === undefined ? [] : [part.keyframes]))
  const properties = [...new Set(parts.flatMap((part) => part.properties ?? []))]

  for (const part of parts) {
    for (const [name, target] of Object.entries(part.variants ?? {})) {
      variants[name] = { ...variants[name], ...target }
    }

    for (const [name, value] of Object.entries(part.cssVars ?? {})) {
      cssVars[name] = value
    }
  }

  return {
    engine: first.engine,
    ...(Object.keys(variants).length === 0 ? {} : { variants }),
    ...(first.transition === undefined ? {} : { transition: first.transition }),
    ...(listeners.length === 0 ? {} : { listeners }),
    ...(Object.keys(cssVars).length === 0 ? {} : { cssVars }),
    ...(classNames.length === 0 ? {} : { className: classNames.join(' ') }),
    ...(keyframes.length === 0 ? {} : { keyframes: keyframes.join('\n') }),
    ...(properties.length === 0 ? {} : { properties }),
  }
}
