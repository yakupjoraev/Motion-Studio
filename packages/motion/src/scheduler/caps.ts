import type { Unsubscribe } from './scheduler.types'

/** ANIMATION_SYSTEM.md § GPU discipline and PERFORMANCE.md § Motion performance. */
export const GPU_HEAVY_CAP = 3
export const CONTINUOUS_CAP = 6

export type CapKind = 'gpuHeavy' | 'continuous'

export const CAPS: Readonly<Record<CapKind, number>> = {
  gpuHeavy: GPU_HEAVY_CAP,
  continuous: CONTINUOUS_CAP,
}

export interface CapPool {
  /** Registration order decides who animates: the instances already on screen keep their claim. */
  register(id: string, kind: CapKind): Unsubscribe
  setVisible(id: string, visible: boolean): void
  /** `false` means "render the static end state" — not a degraded animation, and not nothing. */
  isAnimating(id: string): boolean
  subscribe(listener: () => void): Unsubscribe
}

interface Instance {
  readonly id: string
  readonly kind: CapKind
  visible: boolean
}

/**
 * The cap is per viewport: scrolling changes which instances animate, and it is recomputed when
 * visibility changes rather than on every frame — a cap that recomputed per frame would be a per-frame
 * sort of every animated node, which is the cost it exists to avoid.
 */
export function createCapPool(): CapPool {
  const instances = new Map<string, Instance>()
  const listeners = new Set<() => void>()
  let animating = new Set<string>()

  const recompute = (): void => {
    const next = new Set<string>()

    for (const kind of Object.keys(CAPS) as CapKind[]) {
      const claimants = [...instances.values()].filter(
        (instance) => instance.kind === kind && instance.visible,
      )

      for (const instance of claimants.slice(0, CAPS[kind])) {
        next.add(instance.id)
      }
    }

    const changed = next.size !== animating.size || [...next].some((id) => !animating.has(id))

    animating = next

    if (changed) {
      for (const listener of listeners) {
        listener()
      }
    }
  }

  return {
    register(id, kind) {
      instances.set(id, { id, kind, visible: true })
      recompute()

      return () => {
        instances.delete(id)
        recompute()
      }
    },

    setVisible(id, visible) {
      const instance = instances.get(id)

      if (instance === undefined || instance.visible === visible) {
        return
      }

      instance.visible = visible
      recompute()
    },

    isAnimating: (id) => animating.has(id),

    subscribe(listener) {
      listeners.add(listener)

      return () => {
        listeners.delete(listener)
      }
    },
  }
}
