'use client'

import { Button, Slider, Switch } from '@motion-studio/ui'
import { type ReactElement, useCallback, useEffect, useRef, useState } from 'react'

import type { TargetProps } from './target.types'

/**
 * `transition` — two states, and the controls that make a 600 ms curve watchable: play, loop, and a
 * scrub.
 *
 * The scrub is the real transition, paused. A CSS transition is a `CSSTransition` animation on the
 * element, so pausing it and writing `currentTime` moves along the author's own easing rather than
 * along a straight line we drew ourselves — which is the difference between showing the curve and
 * describing it.
 *
 * PERFORMANCE.md § Playground: a hidden tab pauses, and under reduced motion nothing plays on its own —
 * the scrub is how the states are compared, which is ANIMATION_SYSTEM.md's rule that a reduced
 * experience is still a complete one.
 */
const FROM = 'translateX(0) scale(1) rotate(0deg)'
const TO = 'translateX(220px) scale(1.12) rotate(6deg)'

const animationsOf = (element: HTMLElement | null): readonly Animation[] =>
  element === null || typeof element.getAnimations !== 'function' ? [] : element.getAnimations()

const durationOf = (animation: Animation): number => {
  const timing = animation.effect?.getComputedTiming()
  const duration = timing?.duration

  return typeof duration === 'number' ? duration + (timing?.delay ?? 0) : 0
}

export function TransitionTarget({ targetRef, initialStyle }: TargetProps): ReactElement {
  const element = useRef<HTMLDivElement | null>(null)
  const [at, setAt] = useState<'from' | 'to'>('from')
  const [playing, setPlaying] = useState(false)
  const [loop, setLoop] = useState(false)
  const [progress, setProgress] = useState(100)
  const reduced = useReducedMotionPreference()

  const attach = useCallback(
    (node: HTMLDivElement | null) => {
      element.current = node

      if (typeof targetRef === 'function') {
        targetRef(node)
      } else if (targetRef !== null) {
        // biome-ignore lint/style/noParameterAssign: a ref object is written, which is what it is for
        ;(targetRef as { current: HTMLDivElement | null }).current = node
      }
    },
    [targetRef],
  )

  /** Play toggles the state and lets the value under test do the work. */
  const toggle = useCallback(() => {
    setAt((current) => (current === 'from' ? 'to' : 'from'))
    setProgress(100)
  }, [])

  useEffect(() => {
    if (!playing) {
      return
    }

    toggle()
  }, [playing, toggle])

  /** A hidden tab pauses: an animation nobody is looking at is a frame budget spent on nothing. */
  useEffect(() => {
    const onVisibility = (): void => {
      if (document.visibilityState === 'hidden') {
        setPlaying(false)
      }
    }

    document.addEventListener('visibilitychange', onVisibility)

    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])

  const onTransitionEnd = useCallback(() => {
    if (!playing) {
      return
    }

    if (loop) {
      toggle()

      return
    }

    setPlaying(false)
  }, [loop, playing, toggle])

  const scrub = useCallback((next: number) => {
    setProgress(next)

    for (const animation of animationsOf(element.current)) {
      animation.pause()
      animation.currentTime = (durationOf(animation) * next) / 100
    }
  }, [])

  return (
    <div className="grid h-full w-full grid-rows-[1fr_auto] gap-4 rounded-md bg-surface-2 p-6 [contain:paint]">
      <div className="flex items-center">
        <div
          ref={attach}
          data-testid="playground-target"
          onTransitionEnd={onTransitionEnd}
          style={{ ...initialStyle, transform: at === 'from' ? FROM : TO }}
          className="grid h-24 w-24 place-items-center rounded-xl bg-[linear-gradient(140deg,oklch(62%_0.19_285),oklch(72%_0.16_200))] text-center font-medium text-white text-xs"
        >
          {at === 'from' ? 'A' : 'B'}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => (playing ? setPlaying(false) : setPlaying(true))}
          disabled={reduced}
        >
          {playing ? 'Pause' : 'Play'}
        </Button>
        <Button variant="ghost" size="sm" onClick={toggle}>
          Toggle state
        </Button>
        {/* A span, not a label: the switch is a button, and `for` cannot point at one. */}
        <span className="flex items-center gap-2 text-foreground-muted text-xs">
          <Switch checked={loop} onCheckedChange={setLoop} aria-label="Loop" disabled={reduced} />
          Loop
        </span>
        <div className="flex min-w-48 flex-1 items-center gap-2">
          <span className="text-foreground-muted text-xs">Scrub</span>
          <Slider
            value={progress}
            onValueChange={scrub}
            min={0}
            max={100}
            step={1}
            aria-label="Transition progress"
          />
        </div>
      </div>
      {reduced && (
        <p className="m-0 text-foreground-subtle text-xs">
          Reduced motion is on, so nothing plays by itself. Toggle the state and scrub to compare
          the two.
        </p>
      )}
    </div>
  )
}

/** The setting, read once and watched: a preference that changes mid-session changes this sandbox. */
function useReducedMotionPreference(): boolean {
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')

    setReduced(query.matches)

    const onChange = (event: MediaQueryListEvent): void => setReduced(event.matches)

    query.addEventListener('change', onChange)

    return () => query.removeEventListener('change', onChange)
  }, [])

  return reduced
}
