'use client'

import { useScheduler } from '@motion-studio/motion'
import { type RefObject, useEffect, useId, useSyncExternalStore } from 'react'

export interface EffectPlayback {
  /** `true` while the layer is outside the viewport: `effects.css` pauses it. */
  readonly offscreen: boolean
  /** `true` when the cap is already taken: the layer renders its static composition instead. */
  readonly capped: boolean
}

/**
 * How much of itself an effect layer is allowed to run.
 *
 * Two mechanisms, both from PERFORMANCE.md. Off screen it pauses (§ Motion performance rule 3),
 * which costs nothing to resume and keeps a document of twenty bands from animating twenty. On
 * screen, a `heavy` effect claims one of the scheduler's `gpuHeavy` slots (§ Layer count, and
 * ANIMATION_SYSTEM.md § GPU discipline — three at once); past the cap the layer holds its static
 * composition, which is what those effects are designed to look like under reduced motion anyway.
 *
 * Both answers are written to the DOM rather than held in state: a section scrolling past would
 * otherwise re-render every effect it carries, and the answer is a class name, not a component.
 *
 * Outside a provider — Storybook, an exported page — there is no scheduler and the effect simply
 * runs, which is the right answer where nothing is orchestrating anything.
 */
export function useEffectVisibility(
  ref: RefObject<HTMLElement | null>,
  { heavy }: { readonly heavy: boolean },
): void {
  const scheduler = useScheduler()
  const id = useId()
  const caps = scheduler?.caps

  useEffect(() => {
    const element = ref.current

    if (element === null || scheduler === null) {
      return
    }

    element.dataset['effectOffscreen'] = 'true'

    return scheduler.observe(
      element,
      (visible) => {
        element.dataset['effectOffscreen'] = visible ? 'false' : 'true'
        caps?.setVisible(id, visible)
      },
      0,
    )
  }, [ref, scheduler, caps, id])

  useEffect(() => {
    if (caps === undefined || !heavy) {
      return
    }

    return caps.register(id, 'gpuHeavy')
  }, [caps, heavy, id])

  const capped = useSyncExternalStore(
    (listener) => caps?.subscribe(listener) ?? (() => undefined),
    () => (caps === undefined || !heavy ? false : !caps.isAnimating(id)),
    () => false,
  )

  useEffect(() => {
    const element = ref.current

    if (element === null || !heavy) {
      return
    }

    element.dataset['effectCapped'] = capped ? 'true' : 'false'
  }, [capped, heavy, ref])
}
