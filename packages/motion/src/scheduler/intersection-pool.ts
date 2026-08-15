import type { Unsubscribe, VisibilityCallback } from './scheduler.types'

/**
 * The thresholds the pool keeps observers for. Six buckets is the whole point: a preset asking for
 * 0.3 gets 0.25, nobody can perceive the difference, and forty presets asking for forty slightly
 * different numbers still cost six observers.
 */
export const THRESHOLD_BUCKETS = [0, 0.1, 0.25, 0.5, 0.75, 1] as const

export type ThresholdBucket = (typeof THRESHOLD_BUCKETS)[number]

export function bucketFor(threshold: number): ThresholdBucket {
  const clamped = Math.min(Math.max(threshold, 0), 1)

  return THRESHOLD_BUCKETS.reduce((best, bucket) =>
    Math.abs(bucket - clamped) < Math.abs(best - clamped) ? bucket : best,
  )
}

export interface IntersectionPool {
  observe(element: Element, callback: VisibilityCallback, threshold?: number): Unsubscribe
  /** What the frame loop asks before ticking a callback that named an element. */
  isVisible(element: Element): boolean
  readonly observerCount: number
  destroy(): void
}

interface Entry {
  readonly callback: VisibilityCallback
  readonly bucket: ThresholdBucket
}

/**
 * One `IntersectionObserver` per bucket, created on the first consumer of that bucket and kept for the
 * life of the scheduler. Visibility is remembered per element so the frame loop can ask about an
 * element it never observed itself.
 */
export function createIntersectionPool(): IntersectionPool {
  const observers = new Map<ThresholdBucket, IntersectionObserver>()
  const entries = new Map<Element, Set<Entry>>()
  const visible = new Map<Element, boolean>()

  const handle = (records: readonly IntersectionObserverEntry[]): void => {
    for (const record of records) {
      visible.set(record.target, record.isIntersecting)

      for (const entry of entries.get(record.target) ?? []) {
        entry.callback(record.isIntersecting, record.intersectionRatio)
      }
    }
  }

  const observerFor = (bucket: ThresholdBucket): IntersectionObserver | null => {
    if (typeof IntersectionObserver === 'undefined') {
      return null
    }

    const known = observers.get(bucket)

    if (known !== undefined) {
      return known
    }

    const created = new IntersectionObserver(handle, { threshold: bucket })

    observers.set(bucket, created)

    return created
  }

  return {
    observe(element, callback, threshold = 0) {
      const bucket = bucketFor(threshold)
      const observer = observerFor(bucket)
      const entry: Entry = { callback, bucket }
      const forElement = entries.get(element) ?? new Set<Entry>()

      forElement.add(entry)
      entries.set(element, forElement)
      observer?.observe(element)

      return () => {
        forElement.delete(entry)

        if (forElement.size === 0) {
          entries.delete(element)
          visible.delete(element)

          for (const each of observers.values()) {
            each.unobserve(element)
          }
        }
      }
    },

    /** Unknown means "not observed", and an element nobody watches is not one to skip. */
    isVisible: (element) => visible.get(element) ?? true,

    get observerCount() {
      return observers.size
    },

    destroy() {
      for (const observer of observers.values()) {
        observer.disconnect()
      }

      observers.clear()
      entries.clear()
      visible.clear()
    },
  }
}
