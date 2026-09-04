'use client'

import { type ReactNode, useEffect, useId, useMemo, useSyncExternalStore } from 'react'

import { collides } from '../model/compose'
import type { MotionPart } from '../model/compose'
import type { MotionPresetRegistry } from '../model/preset.types'
import type { CapKind } from '../scheduler/caps'
import { useScheduler } from '../scheduler/scheduler-context'

import { CssMotion } from './css-motion'
import { FramerMotion } from './framer-motion'
import { type NodeMotion, useResolvedMotion } from './use-resolved-motion'

export interface MotionNodeProps {
  /** One spec per channel, which is what a node carries — ANIMATION_SYSTEM.md § Composition. */
  readonly motion: NodeMotion
  readonly presets: MotionPresetRegistry
  readonly scale: number
  readonly forceReduced?: boolean | undefined
  /** ADR-100: a paused document holds every animation at its end state. */
  readonly paused?: boolean | undefined
  readonly className?: string | undefined
  readonly children: ReactNode
}

/**
 * ANIMATION_SYSTEM.md § Applying motion. It composes the node's channels, asks the scheduler whether
 * this instance is inside the caps, and hands the result to the one engine that owns the element.
 *
 * `Mod+Shift+P` replays entrances by remounting this subtree with a fresh key from the host. It looks
 * like a hack and it is the correct approach: an entrance is defined as what happens when an element
 * mounts, so replaying one means mounting it again — there is no "play again" on a declarative
 * variant that is already at its destination.
 */
export function MotionNode({
  motion,
  presets,
  scale,
  forceReduced,
  paused = false,
  className,
  children,
}: MotionNodeProps) {
  const scheduler = useScheduler()
  const id = useId()
  const composed = useResolvedMotion(motion, {
    presets,
    scale,
    ...(forceReduced === undefined ? {} : { forceReduced }),
  })

  assertOneEngine(composed.parts)

  const capKind = useMemo(() => capKindOf(motion, presets), [motion, presets])
  const caps = scheduler?.caps

  useEffect(() => {
    if (caps === undefined || capKind === null) {
      return
    }

    return caps.register(id, capKind)
  }, [caps, capKind, id])

  const capped = useSyncExternalStore(
    (listener) => caps?.subscribe(listener) ?? (() => undefined),
    () => (caps === undefined || capKind === null ? false : !caps.isAnimating(id)),
    () => false,
  )

  const active = !paused && !capped
  const { resolved } = composed

  if (resolved.engine === 'css') {
    return (
      <CssMotion active={active} className={className} resolved={resolved}>
        {children}
      </CssMotion>
    )
  }

  return (
    <FramerMotion active={active} className={className} resolved={resolved}>
      {children}
    </FramerMotion>
  )
}

/**
 * § Engine selection: one engine owns an element. Composition already takes the colliding properties
 * off the loser, so this can only fire on a document the resolver could not fix — and in development
 * it should be loud, because on screen it is a flicker nobody can attribute.
 */
export function assertOneEngine(parts: readonly MotionPart[]): void {
  if (process.env['NODE_ENV'] === 'production') {
    return
  }

  for (const part of parts) {
    for (const other of parts) {
      if (part === other || part.resolved.engine === other.resolved.engine) {
        continue
      }

      const shared = [...propertiesOf(part)].filter((property) =>
        [...propertiesOf(other)].some((held) => collides(held, property)),
      )

      if (shared.length > 0) {
        throw new Error(
          `Two engines on one element: ${part.channel} uses ${part.resolved.engine} and ${other.channel} uses ${other.resolved.engine}, and both animate ${shared.join(', ')}.`,
        )
      }
    }
  }
}

const propertiesOf = (part: MotionPart): ReadonlySet<string> => {
  const properties = new Set<string>(part.resolved.properties ?? [])

  for (const target of Object.values(part.resolved.variants ?? {})) {
    for (const property of Object.keys(target)) {
      properties.add(property)
    }
  }

  return properties
}

/** Which cap this node counts against, if any: a `gpuHeavy` preset outranks a merely continuous one. */
function capKindOf(motion: NodeMotion, presets: MotionPresetRegistry): CapKind | null {
  let kind: CapKind | null = null

  for (const [channel, spec] of Object.entries(motion)) {
    if (spec === undefined) {
      continue
    }

    if (presets.get(spec.presetId)?.capabilities.gpuHeavy === true) {
      return 'gpuHeavy'
    }

    if (channel === 'continuous') {
      kind = 'continuous'
    }
  }

  return kind
}
