import { type CapPool, createCapPool } from './caps'
import { type FrameLoop, createFrameLoop } from './frame-loop'
import { type IntersectionPool, createIntersectionPool } from './intersection-pool'
import { type PointerBus, createPointerBus } from './pointer-bus'
import type { MotionScheduler } from './scheduler.types'
import {
  type ScrollBus,
  type ScrollSource,
  createScrollBus,
  windowScrollSource,
} from './scroll-bus'

export interface SchedulerOptions {
  /** The scrolling context. The studio hands in its canvas viewport; a page hands in the window. */
  readonly source?: ScrollSource
}

export interface MotionSchedulerHandle extends MotionScheduler {
  /** The caps live beside the scheduler because they are recomputed from its visibility data. */
  readonly caps: CapPool
  readonly observers: number
}

/**
 * ANIMATION_SYSTEM.md § The scheduler, assembled. Four shared primitives and one flag; every animated
 * node in the document subscribes here instead of opening its own observer, listener or loop.
 */
export function createScheduler({ source }: SchedulerOptions = {}): MotionSchedulerHandle {
  const intersections: IntersectionPool = createIntersectionPool()
  const caps: CapPool = createCapPool()
  const frames: FrameLoop = createFrameLoop({
    isVisible: (element) => intersections.isVisible(element),
  })
  const pointer: PointerBus = createPointerBus()
  const scroll: ScrollBus = createScrollBus({
    source: source ?? windowScrollSource(),
  })

  return {
    observe: (element, onVisibility, threshold) =>
      intersections.observe(element, onVisibility, threshold),
    onScroll: (callback) => scroll.subscribe(callback),
    onPointerMove: (callback) => pointer.subscribe(callback),
    onFrame: (callback, element) => frames.add(callback, element),
    setPaused: (paused) => frames.setPaused(paused),

    get paused() {
      return frames.paused
    },

    caps,

    get observers() {
      return intersections.observerCount
    },

    destroy() {
      frames.destroy()
      pointer.destroy()
      scroll.destroy()
      intersections.destroy()
    },
  }
}
