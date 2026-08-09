import { type NodeId, nodeId } from '@motion-studio/schema'
import { vi } from 'vitest'

import type {
  CanvasEdges,
  CanvasScene,
  CanvasSceneNode,
  CanvasSelectionPort,
  SelectionMode,
} from '../canvas.types'

export interface FakeNodeSpec {
  readonly children?: readonly string[]
  readonly locked?: boolean
  readonly hidden?: boolean
  readonly name?: string
  /**
   * Resolved padding and margin, as the host would hand them over — ADR-099. A record keyed by
   * breakpoint is what makes an override testable: `{ base: 16, lg: 32 }` resolves against
   * `fakeScene`'s current breakpoint the way the responsive engine does.
   */
  readonly padding?: Record<string, number>
  readonly margin?: Record<string, number>
}

const NO_EDGES: CanvasEdges = { top: 0, right: 0, bottom: 0, left: 0 }

const edges = (
  values: Record<string, number> | undefined,
  breakpoint: string,
): CanvasEdges | undefined => {
  const value = values?.[breakpoint] ?? values?.['base']

  return value === undefined ? undefined : { top: value, right: value, bottom: value, left: value }
}

export interface FakeScene {
  readonly scene: CanvasScene
  readonly selection: CanvasSelectionPort
  readonly rootId: NodeId
  readonly id: (name: string) => NodeId
  readonly modes: SelectionMode[]
  bump(): void
  /** Both notify the overlay layer, the way a store's own `subscribe` would. */
  setBreakpoint(breakpoint: string): void
  setSelection(ids: readonly NodeId[]): void
}

const toId = (name: string): NodeId => nodeId(`node_${name}`)

/**
 * The "fake viewport and three fake nodes" of CANVAS.md § Public API, spelled out: a tree written as
 * `{ root: { children: ['hero'] } }`, with `parentId` derived rather than declared so a fixture
 * cannot describe a tree the document model would reject.
 *
 * The selection port is real state, not a spy, because the announcer reads back what it just wrote.
 */
export function fakeScene(spec: Record<string, FakeNodeSpec>, rootName = 'root'): FakeScene {
  const nodes = new Map<NodeId, CanvasSceneNode>()
  const spacings = new Map<NodeId, FakeNodeSpec>()
  const rootId = toId(rootName)

  for (const [name, node] of Object.entries(spec)) {
    const children = (node.children ?? []).map(toId)

    spacings.set(toId(name), node)
    nodes.set(toId(name), {
      parentId: null,
      name: node.name ?? name,
      children,
      locked: node.locked ?? false,
      hidden: node.hidden ?? false,
    })
  }

  for (const [id, node] of [...nodes]) {
    for (const child of node.children) {
      const found = nodes.get(child)

      if (found !== undefined) {
        nodes.set(child, { ...found, parentId: id })
      }
    }
  }

  let selected: readonly NodeId[] = []
  let isolationId: NodeId | null = null
  let version = 1
  let breakpoint = 'base'

  const listeners = new Set<() => void>()
  const notify = (): void => {
    for (const listener of listeners) {
      listener()
    }
  }

  const modes: SelectionMode[] = []

  const apply = (ids: readonly NodeId[], mode: SelectionMode): readonly NodeId[] => {
    if (mode === 'add') {
      return [...new Set([...selected, ...ids])]
    }

    if (mode === 'toggle') {
      const next = new Set(selected)

      for (const id of ids) {
        if (next.has(id)) {
          next.delete(id)
        } else {
          next.add(id)
        }
      }

      return [...next]
    }

    return ids
  }

  return {
    rootId,
    id: toId,
    modes,

    scene: {
      node: (id) => nodes.get(id),
      isolationId: () => isolationId,
      selectedIds: () => selected,
      version: () => version,

      spacing(id) {
        const declared = spacings.get(id)
        const padding = edges(declared?.padding, breakpoint)
        const margin = edges(declared?.margin, breakpoint)

        return padding === undefined && margin === undefined
          ? undefined
          : { padding: padding ?? NO_EDGES, margin: margin ?? NO_EDGES }
      },

      subscribe(listener) {
        listeners.add(listener)

        return () => {
          listeners.delete(listener)
        }
      },
    },

    selection: {
      select(ids, mode) {
        modes.push(mode)
        selected = apply(ids, mode)
        notify()
      },
      clear() {
        selected = []
        notify()
      },
      enter(id) {
        isolationId = id
        notify()
      },
      exit() {
        isolationId = isolationId === null ? null : (nodes.get(isolationId)?.parentId ?? null)

        if (isolationId === rootId) {
          isolationId = null
        }
      },
      hover: vi.fn(),
      nudge: vi.fn(),
    },

    bump() {
      version += 1
      notify()
    },

    setBreakpoint(next) {
      breakpoint = next
      notify()
    },

    setSelection(ids) {
      selected = ids
      notify()
    },
  }
}

/** jsdom implements neither `elementsFromPoint` nor layout, so both are handed in by the test. */
export function stubElementsFromPoint(elements: readonly Element[]): void {
  vi.spyOn(document, 'elementsFromPoint').mockReturnValue([...elements])
}
