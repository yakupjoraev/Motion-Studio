'use client'

import { type CSSProperties, type ReactNode, useEffect, useRef } from 'react'

import type { ResolvedMotion } from '../model/preset.types'
import { useScheduler } from '../scheduler/scheduler-context'

import { toStyle } from './to-style'

/** GSAP takes a loose bag of CSS; the compiled style is exactly that, minus React's typing. */
const vars = (target: Parameters<typeof toStyle>[0]): Record<string, string | number> =>
  Object.fromEntries(
    Object.entries(toStyle(target)).flatMap(([key, value]) =>
      typeof value === 'string' || typeof value === 'number' ? [[key, value]] : [],
    ),
  )

export interface GsapMotionProps {
  readonly resolved: ResolvedMotion
  readonly className?: string | undefined
  readonly active?: boolean | undefined
  readonly children: ReactNode
}

/**
 * TECH_STACK.md § GSAP asks for the reason at every use, so: **Motion cannot scrub a timeline against
 * scroll progress and pin an element while it plays.** `useScroll` gives a progress value, but a
 * scroll-driven timeline of several elements with pinning is `ScrollTrigger`'s job, and this is the
 * only channel that needs it.
 *
 * The library is imported on first use and never in the initial chunk — PERFORMANCE.md § Mandatory
 * dynamic imports. The scroll progress itself comes from the shared bus, not from a second listener.
 */
export function GsapMotion({ resolved, className, active = true, children }: GsapMotionProps) {
  const ref = useRef<HTMLDivElement>(null)
  const scheduler = useScheduler()

  useEffect(() => {
    const element = ref.current
    const variants = Object.values(resolved.variants ?? {})
    const from = variants[0]
    const to = variants.at(-1)

    if (element === null || !active || from === undefined || to === undefined) {
      return
    }

    let disposed = false
    let quickSet: ((progress: number) => void) | null = null
    /** How the timeline is undone: GSAP writes inline styles, and they outlive the timeline. */
    let revert: (() => void) | null = null
    /** The progress asked for before the library arrived, applied as soon as it does. */
    let queued: number | null = null

    const seek = (progress: number): void => {
      if (quickSet === null) {
        queued = progress

        return
      }

      quickSet(progress)
    }

    void import('gsap').then(({ gsap }) => {
      if (disposed) {
        return
      }

      const timeline = gsap.timeline({ paused: true })
      const [first, ...rest] = variants

      // Every stop, in order — a three-keyframe scrub is three tweens, not a jump from the first
      // state to the last. GSAP normalises the whole timeline to a progress of 0…1 itself.
      timeline.set(element, vars(first ?? {}))

      for (const stop of rest) {
        timeline.to(element, { ...vars(stop), duration: 1, ease: 'none' })
      }

      quickSet = (progress: number) => timeline.progress(progress)
      revert = () => {
        timeline.kill()
        gsap.set(element, { clearProps: 'all' })
      }

      if (queued !== null) {
        quickSet(queued)
        queued = null
      }
    })

    // A gsap preset is either scrubbed by scroll or played once when it arrives. `text-reveal` is the
    // second kind, and treating every gsap preset as a scrub would leave it at its first frame.
    const scrubbed = (resolved.listeners ?? []).some((listener) => listener.event === 'scroll')
    const stop = scrubbed
      ? scheduler?.onScroll(({ progress }) => seek(progress))
      : scheduler?.observe(
          element,
          (visible) => {
            if (visible) {
              seek(1)
            }
          },
          0.25,
        )

    return () => {
      disposed = true
      stop?.()
      revert?.()
    }
  }, [active, resolved, scheduler])

  const settled = Object.values(resolved.variants ?? {}).at(-1)

  return (
    <div
      className={[className, resolved.className].filter(Boolean).join(' ') || undefined}
      ref={ref}
      // The end state is what the element shows before the library arrives and where it stays when the
      // channel is not active, so the frame before the import is never a blank one.
      style={
        {
          ...(active || settled === undefined ? {} : toStyle(settled)),
          ...(resolved.cssVars as CSSProperties | undefined),
        } as CSSProperties
      }
    >
      {children}
    </div>
  )
}
