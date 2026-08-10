import { type BlockId, type NodeId, blockIdSchema, nodeIdSchema } from '@motion-studio/schema'

import type { DragPayload, DropOrientation, DropZone } from './dnd.types'

/**
 * dnd-kit types draggable and droppable data as `Record<string, unknown>`, so everything this package
 * put in comes back out unchecked. These two functions are the boundary, and they brand the ids on
 * the way through rather than asserting them.
 */
export function dragPayload(data: unknown): DragPayload | null {
  if (!isRecord(data)) {
    return null
  }

  const block = brandBlock(text(data, 'blockId'))
  const kind = data['kind']

  if (block === null) {
    return null
  }

  if (kind === 'palette-block') {
    const label = text(data, 'label')

    return label === null ? null : { kind, blockId: block, label }
  }

  if (kind !== 'canvas-nodes') {
    return null
  }

  const nodeIds = brandNodes(strings(data, 'nodeIds'))
  const labels = strings(data, 'labels')

  return nodeIds === null || labels === null || nodeIds.length === 0
    ? null
    : { kind, blockId: block, nodeIds, labels }
}

export function dropZone(data: unknown): DropZone | null {
  if (!isRecord(data)) {
    return null
  }

  const parentId = brandNode(text(data, 'parentId'))
  const slot = text(data, 'slot')
  const label = text(data, 'label')
  const childIds = brandNodes(strings(data, 'childIds'))
  const orientation = orientationOf(data['orientation'])

  if (
    parentId === null ||
    slot === null ||
    label === null ||
    childIds === null ||
    orientation === null
  ) {
    return null
  }

  return { parentId, slot, orientation, label, childIds }
}

/** One label for the ghost badge and for the announcements, so the two can never disagree. */
export function payloadLabel(payload: DragPayload): string {
  if (payload.kind === 'palette-block') {
    return payload.label
  }

  const [first] = payload.labels

  return payload.nodeIds.length === 1 && first !== undefined
    ? first
    : `${payload.nodeIds.length} layers`
}

export const draggedNodeIds = (payload: DragPayload): readonly NodeId[] =>
  payload.kind === 'canvas-nodes' ? payload.nodeIds : []

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

function text(record: Record<string, unknown>, key: string): string | null {
  const value = record[key]

  return typeof value === 'string' ? value : null
}

function strings(record: Record<string, unknown>, key: string): readonly string[] | null {
  const value = record[key]

  return Array.isArray(value) && value.every((entry: unknown) => typeof entry === 'string')
    ? value
    : null
}

function orientationOf(value: unknown): DropOrientation | null {
  return value === 'vertical' || value === 'horizontal' || value === 'grid' ? value : null
}

function brandBlock(value: string | null): BlockId | null {
  if (value === null) {
    return null
  }

  const parsed = blockIdSchema.safeParse(value)

  return parsed.success ? parsed.data : null
}

function brandNode(value: string | null): NodeId | null {
  if (value === null) {
    return null
  }

  const parsed = nodeIdSchema.safeParse(value)

  return parsed.success ? parsed.data : null
}

function brandNodes(values: readonly string[] | null): readonly NodeId[] | null {
  if (values === null) {
    return null
  }

  const ids: NodeId[] = []

  for (const value of values) {
    const parsed = brandNode(value)

    if (parsed === null) {
      return null
    }

    ids.push(parsed)
  }

  return ids
}
