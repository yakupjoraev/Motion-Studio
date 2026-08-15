'use client'

import { type CSSProperties, type ReactNode, useMemo, useRef, useState } from 'react'

import { toCssString } from '../curves/bezier'
import { motionProperties } from '../model/compose'
import type { ResolvedMotion } from '../model/preset.types'

import { toStyle, toTransition } from './to-style'
import { useWillChange } from './use-will-change'

export interface CssMotionProps {
  readonly resolved: ResolvedMotion
  readonly className?: string | undefined
  /** Off means: render the end state and never transition — the cap's static fallback and pause. */
  readonly active?: boolean | undefined
  readonly children: ReactNode
}

const REST = 'rest'

/**
 * ANIMATION_SYSTEM.md § Engine selection: hover, press and simple continuous effects are a class and a
 * transition, and nothing on the interaction path is JavaScript. The listeners a resolution declares
 * become the two gestures CSS can express; everything else stays where the engine that can do it is.
 */
export function CssMotion({ resolved, className, active = true, children }: CssMotionProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [variant, setVariant] = useState(REST)
  const properties = useMemo(() => [...motionProperties(resolved)], [resolved])
  const willChange = useWillChange(ref, properties)

  const byEvent = useMemo(() => {
    const map = new Map<string, string>()

    for (const listener of resolved.listeners ?? []) {
      map.set(listener.event, listener.variant)
    }

    return map
  }, [resolved])

  const enter = (event: 'hover' | 'press'): void => {
    const next = byEvent.get(event)

    if (next === undefined || !active) {
      return
    }

    willChange.start()
    setVariant(next)
  }

  const leave = (): void => {
    setVariant(REST)
    willChange.stop()
  }

  const target = resolved.variants?.[variant] ?? resolved.variants?.[REST]
  const style: CSSProperties = {
    ...(target === undefined ? {} : toStyle(target)),
    ...(resolved.cssVars as CSSProperties | undefined),
    // A class-driven animation has no variant to hold: freezing it is what pausing means here, and it
    // is the same declaration the cap's static fallback needs (ADR-100).
    ...(active ? {} : { animationPlayState: 'paused' as const }),
    ...(active && resolved.transition !== undefined
      ? {
          transition: toTransition(
            properties,
            resolved.transition.duration ?? 0,
            resolved.transition.delay ?? 0,
            resolved.transition.ease === undefined
              ? 'linear'
              : toCssString(resolved.transition.ease),
          ),
        }
      : {}),
  }

  return (
    <div
      className={[className, resolved.className].filter(Boolean).join(' ') || undefined}
      data-motion-variant={variant}
      onBlur={leave}
      onFocus={() => enter('hover')}
      onPointerDown={() => enter('press')}
      onPointerEnter={() => enter('hover')}
      onPointerLeave={leave}
      onPointerUp={() => enter('hover')}
      ref={ref}
      style={style}
    >
      {resolved.keyframes === undefined ? null : (
        // The preset's own keyframes, emitted once beside the element that uses them. `buildIR`
        // dedupes them by content for the export; in the studio one copy per node is what React gives.
        // biome-ignore lint/security/noDangerouslySetInnerHtml: a preset's keyframes are source it wrote, not user input.
        <style dangerouslySetInnerHTML={{ __html: resolved.keyframes }} />
      )}
      {children}
    </div>
  )
}
