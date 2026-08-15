import type { Modifier } from '@dnd-kit/core'

/**
 * The overlay is positioned at the rect of the element the drag started on, and a ghost is rarely
 * that element's size: a palette card becomes a preview, six nodes become one stacked box. Without
 * this the cursor sits at an offset inside the ghost that nothing explains.
 *
 * The correction keeps the cursor at the same *fraction* across the ghost as it was across the
 * source, and since that fraction does not change during the drag, the shift is constant and the
 * ghost still follows the cursor 1:1 — ADR-126.
 */
export const snapToCursorOffset: Modifier = ({
  activatorEvent,
  activeNodeRect,
  draggingNodeRect,
  transform,
}) => {
  const cursor = eventCoordinates(activatorEvent)

  if (cursor === null || activeNodeRect === null || draggingNodeRect === null) {
    return transform
  }

  return {
    ...transform,
    x:
      transform.x +
      shift(cursor.x - activeNodeRect.left, activeNodeRect.width, draggingNodeRect.width),
    y:
      transform.y +
      shift(cursor.y - activeNodeRect.top, activeNodeRect.height, draggingNodeRect.height),
  }
}

const shift = (grab: number, source: number, ghost: number): number =>
  source === 0 ? 0 : grab * (1 - ghost / source)

/**
 * A pointer drag activates on a `PointerEvent`, which carries the cursor. A keyboard drag activates
 * on a key press and carries nothing, and that is the `null` the caller returns the transform
 * unchanged for.
 *
 * The test is the two fields rather than `instanceof MouseEvent`, because `instanceof` evaluates its
 * right operand: the studio prerenders its chrome, dnd-kit runs the modifier list during that render,
 * and on the server there is no `MouseEvent` to name.
 */
const eventCoordinates = (
  event: Event | null,
): { readonly x: number; readonly y: number } | null => {
  if (event === null || !('clientX' in event) || !('clientY' in event)) {
    return null
  }

  const { clientX, clientY } = event

  return typeof clientX === 'number' && typeof clientY === 'number'
    ? { x: clientX, y: clientY }
    : null
}
