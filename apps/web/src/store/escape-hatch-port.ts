/**
 * What the playground knows about the studio's selection, and nothing more — ADR-279.
 *
 * `/playground` must not import the editor store: the store is built over `blockRegistry`, and
 * pulling seventy block definitions into a page whose job is to check a CSS value would cost more
 * than the page. So the studio publishes a five-field summary here and the playground reads it. This
 * module imports nothing at runtime: the one import below is a type and is erased.
 */
import type { NodeId } from '@motion-studio/schema'

export interface EscapeHatchTarget {
  readonly nodeId: NodeId
  readonly nodeName: string
  readonly blockName: string
  /** The properties the block accepts on its `css` prop — ADR-275. */
  readonly properties: readonly string[]
  /** The node's current escape-hatch declarations, so the chip and the editor agree. */
  readonly css: string
}

export type EscapeHatchWriter = (property: string, value: string) => void

let target: EscapeHatchTarget | undefined
let writer: EscapeHatchWriter | undefined
const listeners = new Set<() => void>()

const notify = (): void => {
  for (const listener of listeners) {
    listener()
  }
}

const same = (a: EscapeHatchTarget | undefined, b: EscapeHatchTarget | undefined): boolean =>
  a === b ||
  (a !== undefined &&
    b !== undefined &&
    a.nodeId === b.nodeId &&
    a.nodeName === b.nodeName &&
    a.css === b.css &&
    a.properties.join() === b.properties.join())

export const escapeHatchPort = {
  publish(next: EscapeHatchTarget | undefined): void {
    if (same(target, next)) {
      return
    }

    target = next
    notify()
  },

  /** The studio registers the dispatcher once; the playground never sees a command. */
  register(next: EscapeHatchWriter): void {
    writer = next
  },

  subscribe(listener: () => void): () => void {
    listeners.add(listener)

    return () => {
      listeners.delete(listener)
    }
  },

  snapshot(): EscapeHatchTarget | undefined {
    return target
  },

  write(property: string, value: string): boolean {
    if (writer === undefined || target === undefined) {
      return false
    }

    writer(property, value)

    return true
  },

  /** Tests own the module's lifetime; nothing in the application calls this. */
  reset(): void {
    target = undefined
    writer = undefined
    listeners.clear()
  },
}
