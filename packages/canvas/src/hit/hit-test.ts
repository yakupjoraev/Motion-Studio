import type { NodeId } from '@motion-studio/schema'

import type { CanvasSceneNode } from '../canvas.types'
import type { ScreenPoint } from '../coords/index'

/** Written by `NodeWrapper` and read by nothing else, which is what makes the narrowing below sound. */
export const NODE_ID_ATTRIBUTE = 'data-node-id'

export interface HitContext {
  readonly rootId: NodeId
  readonly isolationId: NodeId | null
  node(id: NodeId): CanvasSceneNode | undefined
}

export interface HitOptions {
  /** `Alt`: bypass isolation and take the deepest node — CANVAS.md § Hit testing, step 4. */
  readonly deep?: boolean | undefined
}

/**
 * Topmost first, which is the order `elementsFromPoint` returns and therefore deepest first for
 * nested wrappers. The attribute is a `NodeId` by construction — `NodeWrapper` is its only writer —
 * and this is the one place that is restated, in the same way `schema`'s `nodeIds` restates it for
 * the keys of `nodes`.
 */
export function nodeIdsFromElements(elements: Iterable<Element>): NodeId[] {
  const ids: NodeId[] = []

  for (const element of elements) {
    const id = element.getAttribute(NODE_ID_ATTRIBUTE)

    if (id !== null) {
      ids.push(id as NodeId)
    }
  }

  return ids
}

/** Whether `id` is `ancestorId` or sits below it. Stops on a cycle rather than looping. */
function isWithin(context: HitContext, id: NodeId, ancestorId: NodeId): boolean {
  const seen = new Set<NodeId>()
  let current: NodeId | null = id

  while (current !== null && !seen.has(current)) {
    if (current === ancestorId) {
      return true
    }

    seen.add(current)
    current = context.node(current)?.parentId ?? null
  }

  return false
}

/**
 * ADR-078. Walks up from `id` to the node whose parent is `level` — that is what "the topmost node
 * whose parent chain is at the current isolation level" comes to. `null` means this candidate offers
 * nothing selectable: it is the container itself, it is outside the level, or something between it
 * and the result is locked or hidden, and a locked container is what makes clicks fall through it.
 */
function liftTo(context: HitContext, id: NodeId, level: NodeId): NodeId | null {
  const seen = new Set<NodeId>()
  let current: NodeId | null = id

  while (current !== null && !seen.has(current)) {
    seen.add(current)

    if (current === level) {
      return null
    }

    const node = context.node(current)

    if (node === undefined || node.locked || node.hidden) {
      return null
    }

    if (node.parentId === level) {
      return current
    }

    current = node.parentId
  }

  return null
}

const selectableDeep = (context: HitContext, id: NodeId): NodeId | null => {
  const node = context.node(id)

  return node === undefined || node.locked || node.hidden || id === context.rootId ? null : id
}

/**
 * The filter chain of CANVAS.md § Hit testing, over candidates already ordered topmost first. The
 * root and the isolation container never resolve to themselves, so a click on empty artboard returns
 * `null` — which is what lets the same press start a marquee instead of selecting the page.
 */
export function resolveHit(
  candidates: readonly NodeId[],
  context: HitContext,
  options: HitOptions = {},
): NodeId | null {
  const level = context.isolationId ?? context.rootId

  for (const candidate of candidates) {
    const hit =
      options.deep === true
        ? selectableDeep(context, candidate)
        : level !== context.rootId && isWithin(context, candidate, level)
          ? liftTo(context, candidate, level)
          : liftTo(context, candidate, context.rootId)

    if (hit !== null) {
      return hit
    }
  }

  return null
}

/**
 * The browser has already solved this: `elementsFromPoint` respects transforms, `overflow`,
 * `border-radius` and `clip-path`, and a geometric implementation would have to solve all four
 * again and be wrong about at least one.
 */
export function hitTest(
  point: ScreenPoint,
  context: HitContext,
  options: HitOptions = {},
): NodeId | null {
  return resolveHit(
    nodeIdsFromElements(document.elementsFromPoint(point.x, point.y)),
    context,
    options,
  )
}
