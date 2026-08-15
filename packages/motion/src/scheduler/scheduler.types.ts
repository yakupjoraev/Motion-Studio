import type { Point } from '@motion-studio/utils'

/** How far the scroll container has travelled, computed once per frame and shared. */
export interface ScrollProgress {
  /** 0 … 1 across the scrollable span. `0` when there is nothing to scroll. */
  readonly progress: number
  /** Pixels from the top. */
  readonly offset: number
  /** Pixels since the previous frame — the sign is the direction. */
  readonly velocity: number
}

export type VisibilityCallback = (visible: boolean, ratio: number) => void

/** `dt` is milliseconds since the previous frame, so an animation is frame-rate independent. */
export type FrameCallback = (dt: number) => void

export type Unsubscribe = () => void

/**
 * ANIMATION_SYSTEM.md § The scheduler. One observer per threshold bucket, one scroll listener, one
 * pointer listener, one `rAF` loop — for the whole document, however many nodes animate.
 */
export interface MotionScheduler {
  /**
   * The threshold is part of the signature because the pool buckets on it: a preset asking for 0.3
   * shares the 0.25 observer with everything else that asked for something near it.
   */
  observe(element: Element, onVisibility: VisibilityCallback, threshold?: number): Unsubscribe
  onScroll(callback: (progress: ScrollProgress) => void): Unsubscribe
  onPointerMove(callback: (point: Point) => void): Unsubscribe
  /**
   * `element` is optional and load-bearing: a callback that names one is skipped while that element is
   * off screen, which is the difference between four continuous effects and forty.
   */
  onFrame(callback: FrameCallback, element?: Element): Unsubscribe
  /** ADR-100's flag, arriving from the store: the loop stops and the engines freeze. */
  setPaused(paused: boolean): void
  readonly paused: boolean
  destroy(): void
}
