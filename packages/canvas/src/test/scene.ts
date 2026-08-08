import { type NodeId, nodeId } from '@motion-studio/schema'
import { vi } from 'vitest'

import type {
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
}

export interface FakeScene {
  readonly scene: CanvasScene
  readonly selection: CanvasSelectionPort
  readonly rootId: NodeId
  readonly id: (name: string) => NodeId
  readonly modes: SelectionMode[]
  bump(): void
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
  const rootId = toId(rootName)

  for (const [name, node] of Object.entries(spec)) {
    const children = (node.children ?? []).map(toId)

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
    },

    selection: {
      select(ids, mode) {
        modes.push(mode)
        selected = apply(ids, mode)
      },
      clear() {
        selected = []
      },
      enter(id) {
        isolationId = id
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
    },
  }
}

/** jsdom implements neither `elementsFromPoint` nor layout, so both are handed in by the test. */
export function stubElementsFromPoint(elements: readonly Element[]): void {
  vi.spyOn(document, 'elementsFromPoint').mockReturnValue([...elements])
}
