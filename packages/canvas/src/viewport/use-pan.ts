'use client'

import { useEffect, useRef } from 'react'

import { type ViewportHandle, wheelCommitter } from './use-viewport'

/** CANVAS.md § Pan. Below this the throw is not worth starting; below the stop it is over. */
export const MOMENTUM_START = 1.5
export const MOMENTUM_STOP = 0.1
export const MOMENTUM_DECAY = 0.92

/** The middle mouse button, which pans in every tool that has a canvas. */
const MIDDLE_BUTTON = 1

/**
 * ADR-075. `--ms-reduced-motion` is `1` normally, `0` from the media query, and `0` inline when the
 * studio previews reduced motion — one read answers all three.
 */
export function prefersReducedMotion(element: Element | null): boolean {
  if (element === null) {
    return false
  }

  return getComputedStyle(element).getPropertyValue('--ms-reduced-motion').trim() === '0'
}

/** Frames of `v *= decay` until `|v|` is under the stop, so a test can assert termination. */
export function decaySteps(velocity: number): number {
  let speed = Math.abs(velocity)
  let frames = 0

  while (speed >= MOMENTUM_STOP) {
    speed *= MOMENTUM_DECAY
    frames += 1
  }

  return frames
}

interface PanState {
  active: boolean
  pointerId: number | null
  velocity: { x: number; y: number }
}

/**
 * Pan from three sources — held space, the middle button, and a two-finger trackpad wheel — all of
 * them writing the same ref. Nothing here sets React state: the cursor and the "space is down" mode
 * are data attributes on the root, so holding space during a 200-node document costs no render.
 *
 * `movementX/Y` rather than a start point, per CANVAS.md § Pan: it survives a lost pointer capture
 * and it does not accumulate the error a running delta would.
 */
export function usePan(viewport: ViewportHandle): void {
  const state = useRef<PanState>({ active: false, pointerId: null, velocity: { x: 0, y: 0 } })
  const momentum = useRef<number | null>(null)

  useEffect(() => {
    const root = viewport.rootRef.current

    if (root === null) {
      return
    }

    const wheel = wheelCommitter(() => viewport.commit())

    const stopMomentum = (): void => {
      if (momentum.current !== null) {
        cancelAnimationFrame(momentum.current)
        momentum.current = null
      }
    }

    const throwPan = (): void => {
      const velocity = state.current.velocity

      if (prefersReducedMotion(root) || Math.hypot(velocity.x, velocity.y) < MOMENTUM_START) {
        viewport.commit()

        return
      }

      const step = (): void => {
        velocity.x *= MOMENTUM_DECAY
        velocity.y *= MOMENTUM_DECAY

        if (Math.hypot(velocity.x, velocity.y) < MOMENTUM_STOP) {
          momentum.current = null
          viewport.commit()

          return
        }

        viewport.panBy(velocity.x, velocity.y)
        momentum.current = requestAnimationFrame(step)
      }

      momentum.current = requestAnimationFrame(step)
    }

    const start = (event: PointerEvent): void => {
      stopMomentum()
      state.current.active = true
      state.current.pointerId = event.pointerId
      state.current.velocity = { x: 0, y: 0 }
      root.setPointerCapture(event.pointerId)
      root.dataset['panning'] = 'true'
      event.preventDefault()
    }

    const end = (): void => {
      if (!state.current.active) {
        return
      }

      const pointerId = state.current.pointerId

      state.current.active = false
      state.current.pointerId = null
      root.removeAttribute('data-panning')

      if (pointerId !== null && root.hasPointerCapture(pointerId)) {
        root.releasePointerCapture(pointerId)
      }

      throwPan()
    }

    const onPointerDown = (event: PointerEvent): void => {
      if (event.button === MIDDLE_BUTTON || root.dataset['panMode'] === 'true') {
        start(event)
      }
    }

    const onPointerMove = (event: PointerEvent): void => {
      if (!state.current.active) {
        return
      }

      state.current.velocity = { x: event.movementX, y: event.movementY }
      viewport.panBy(event.movementX, event.movementY)
    }

    const onWheel = (event: WheelEvent): void => {
      // A zoom wheel carries the modifier and belongs to `useZoom`; this is the trackpad's pan.
      if (event.ctrlKey || event.metaKey) {
        return
      }

      stopMomentum()
      viewport.panBy(-event.deltaX, -event.deltaY)
      // A wheel has no `up`, so the gesture ends when the events stop. Committing per event would
      // put one store write — and one render — on every tick of a trackpad.
      wheel.bump()
    }

    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.code === 'Space' && !event.repeat) {
        root.dataset['panMode'] = 'true'
      }
    }

    const clearMode = (): void => {
      root.removeAttribute('data-pan-mode')
      end()
    }

    const onKeyUp = (event: KeyboardEvent): void => {
      if (event.code === 'Space') {
        clearMode()
      }
    }

    root.addEventListener('pointerdown', onPointerDown)
    root.addEventListener('pointermove', onPointerMove)
    root.addEventListener('pointerup', end)
    root.addEventListener('lostpointercapture', end)
    root.addEventListener('wheel', onWheel, { passive: true })
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    // Alt-tabbing away with space held is how a design tool gets stuck in pan mode; the key-up it is
    // waiting for is delivered to the other window and never arrives here.
    window.addEventListener('blur', clearMode)

    return () => {
      stopMomentum()
      wheel.cancel()
      root.removeEventListener('pointerdown', onPointerDown)
      root.removeEventListener('pointermove', onPointerMove)
      root.removeEventListener('pointerup', end)
      root.removeEventListener('lostpointercapture', end)
      root.removeEventListener('wheel', onWheel)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('blur', clearMode)
    }
  }, [viewport])
}
