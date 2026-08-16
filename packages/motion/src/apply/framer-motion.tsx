'use client'

import { type Transition, type Variants, motion } from 'motion/react'
import { type ReactNode, useMemo, useRef } from 'react'

import { motionProperties } from '../model/compose'
import type { ResolvedMotion, TransitionConfig } from '../model/preset.types'

import { useWillChange } from './use-will-change'

export interface FramerMotionProps {
  readonly resolved: ResolvedMotion
  readonly className?: string | undefined
  /** Off means the end state, held: the cap's static fallback, and what a paused document shows. */
  readonly active?: boolean | undefined
  readonly children: ReactNode
}

/**
 * ANIMATION_SYSTEM.md § Engine selection: entrances, exits, springs and in-view triggers. The listener
 * list a resolution declares becomes the props Motion already has for each of them, so this file
 * translates and does not decide.
 */
export function FramerMotion({ resolved, className, active = true, children }: FramerMotionProps) {
  const ref = useRef<HTMLDivElement>(null)
  const properties = useMemo(() => [...motionProperties(resolved)], [resolved])
  const willChange = useWillChange(ref, properties)

  const variants = resolved.variants as Variants | undefined
  const transition = useMemo(() => toTransition(resolved.transition), [resolved.transition])
  const events = useMemo(
    () => new Map((resolved.listeners ?? []).map((listener) => [listener.event, listener])),
    [resolved.listeners],
  )

  const inView = events.get('inView')
  const hover = events.get('hover')
  const press = events.get('press')
  const initial = variants === undefined ? undefined : Object.keys(variants)[0]
  const settled = settledVariant(variants)
  /** Where the element starts: the first variant while it may animate, the last while it may not. */
  const state = active ? initial : settled

  return (
    <motion.div
      className={[className, resolved.className].filter(Boolean).join(' ') || undefined}
      {...(active ? {} : settled === undefined ? {} : { animate: settled })}
      {...(state === undefined ? {} : { initial: state })}
      onAnimationComplete={() => willChange.stop()}
      onAnimationStart={() => willChange.start()}
      ref={ref}
      {...(resolved.cssVars === undefined ? {} : { style: resolved.cssVars })}
      {...(transition === undefined ? {} : { transition })}
      {...(variants === undefined ? {} : { variants })}
      {...(active && inView !== undefined
        ? { whileInView: inView.variant, viewport: { once: true, amount: 0.3 } }
        : {})}
      {...(active && hover !== undefined ? { whileHover: hover.variant } : {})}
      {...(active && press !== undefined ? { whileTap: press.variant } : {})}
    >
      {children}
    </motion.div>
  )
}

/**
 * Where a paused or capped element stands: the state in which it is **present and finished**.
 *
 * For an entrance that is the last variant, and for an exit it is the first — an exit's last variant
 * is the element gone, and holding a card statically at "gone" is how a cap turns into a blank space.
 * The catalogue names those states `visible` and `rest`, so the convention is readable rather than
 * positional.
 */
export function settledVariant(variants: Variants | undefined): string | undefined {
  if (variants === undefined) {
    return undefined
  }

  const names = Object.keys(variants)

  return names.find((name) => name === 'visible' || name === 'rest') ?? names.at(-1)
}

/** Milliseconds here, seconds there — that conversion is the whole of this function. */
function toTransition(transition: TransitionConfig | undefined): Transition | undefined {
  if (transition === undefined) {
    return undefined
  }

  const timing: Transition =
    transition.spring === undefined
      ? {
          duration: (transition.duration ?? 0) / 1000,
          ...(transition.ease === undefined ? {} : { ease: [...transition.ease] }),
        }
      : {
          type: 'spring',
          stiffness: transition.spring.stiffness,
          damping: transition.spring.damping,
          mass: transition.spring.mass,
        }

  return {
    ...timing,
    ...(transition.delay === undefined ? {} : { delay: transition.delay / 1000 }),
    ...(transition.repeat === undefined
      ? {}
      : {
          repeat: transition.repeat === 'infinite' ? Number.POSITIVE_INFINITY : transition.repeat,
        }),
    ...(transition.repeatType === undefined ? {} : { repeatType: transition.repeatType }),
    ...(transition.stagger === undefined
      ? {}
      : { staggerChildren: transition.stagger.each / 1000 }),
  }
}
