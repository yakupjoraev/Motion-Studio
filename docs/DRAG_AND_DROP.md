# DRAG_AND_DROP

`packages/dnd` wraps dnd-kit into the four drag operations the studio needs. It is a thin,
opinionated layer — not a general abstraction.

## Why dnd-kit

| Requirement | HTML5 DnD | dnd-kit |
| --- | --- | --- |
| Custom drag preview that follows precisely | No — ghost is browser-controlled | Yes |
| Works inside a CSS-transformed scene | Broken | Yes, with a transform-aware modifier |
| Keyboard-operable drag | No | Yes, first-class |
| Screen-reader announcements | No | Built-in announcer |
| Cross-container reorder | Painful | Supported |
| Cancel with `Esc` mid-drag | Unreliable | Yes |

The keyboard sensor is the decisive one. A page builder you cannot use without a mouse is not
accessible, and retrofitting keyboard drag onto HTML5 DnD is not possible.

## The four operations

| # | From | To | Result |
| --- | --- | --- | --- |
| 1 | Block palette card | Canvas | `insertBlock` at the computed drop position |
| 2 | Canvas node | Canvas | `moveNodes` (reparent and/or reorder) |
| 3 | Layers tree row | Layers tree | `moveNodes` |
| 4 | Layers tree row | Canvas / canvas node → tree | Cross-surface `moveNodes` |

All four end in a command. Nothing about drag state lives in the document until drop.

## Sensors

```ts
const sensors = useSensors(
  useSensor(PointerSensor, {
    activationConstraint: { distance: 4 },   // 4px so a click is never a drag
  }),
  useSensor(KeyboardSensor, {
    coordinateGetter: canvasAwareCoordinateGetter,   // steps in canvas units, zoom-corrected
    scrollBehavior: 'smooth',
  }),
)
```

- **4 px activation distance.** Below that a pointer-down is a selection. Users click far more
  often than they drag, and a 0 px threshold makes selection feel unstable.
- **Keyboard sensor** with a custom coordinate getter: `Space`/`Enter` picks up, arrows move by
  one grid cell (divided by zoom so a step is one visual cell), `Space`/`Enter` drops, `Esc`
  cancels. Between containers, arrows move through drop targets rather than by pixels — the
  getter switches mode based on whether the pointer is over a container boundary.

## Drop position resolution

The hardest part is not "which container" but "where inside it". A section list, a flex row, and
a grid all need different insertion feedback.

```ts
export interface DropTarget {
  parentId: NodeId
  slot: string
  index: number
  orientation: 'vertical' | 'horizontal' | 'grid'
  indicator: DropIndicator
}

export type DropIndicator =
  | { kind: 'line'; rect: Rect; axis: 'x' | 'y' }     // between siblings
  | { kind: 'fill'; rect: Rect }                       // into an empty container
  | { kind: 'cell'; rect: Rect }                       // grid cell
  | { kind: 'reject'; rect: Rect; reason: string }      // invalid, with a tooltip
```

Algorithm:

```
1. Hit test the pointer → deepest node under the cursor (excluding the dragged subtree)
2. Walk up until a node whose block declares a slot that accepts the dragged blockId
3. If none found → root, or reject if root's slot rejects it
4. Read the container's resolved layout direction (from its props, not from computed style —
   props are the truth and are available without a DOM read)
5. Compute the insertion index:
   - vertical:   compare pointer.y against each child's vertical midpoint
   - horizontal: compare pointer.x against each child's horizontal midpoint
   - grid:       nearest cell centre; empty cells are valid targets
   - empty container: index 0, indicator 'fill'
6. Validate: slot accepts, maxChildren not exceeded, not dropping into own descendant
7. Return the target with its indicator rect
```

Everything except step 1 is a pure function over the rect cache and the document, so it is
unit-testable without a browser:

```ts
export function resolveDropTarget(args: {
  pointer: CanvasPoint
  hitNodeId: NodeId | null
  draggedBlockId: BlockId
  draggedNodeIds: readonly NodeId[]     // empty for palette drags
  document: MotionDocument
  registry: BlockRegistry
  rects: RectCache
  isolationId: NodeId | null
}): DropTarget | null
```

### Validation rules

| Rule | Failure feedback |
| --- | --- |
| Slot `accepts` includes the block | `reject`, "Section only accepts layout blocks" |
| `maxChildren` not exceeded | `reject`, "Navbar accepts up to 6 links" |
| Target is not the dragged node or a descendant | `reject`, "Cannot drop into itself" |
| Target parent is not locked | `reject`, "Layer is locked" |
| Target parent is not hidden | `reject`, "Layer is hidden" |

Rejection is always shown *before* the drop — a red outline and a reason on the cursor. Silently
dropping nothing is the worst possible feedback.

### Auto-behaviours during drag

- **Auto-scroll** the layers tree when the pointer is within 40 px of its edges, speed ramping
  with proximity.
- **Auto-pan** the canvas when the pointer is within 60 px of a canvas edge, at up to 12 px per
  frame.
- **Spring-open** collapsed layer tree groups after hovering 600 ms.
- **Cancel** on `Esc`, on window blur, and on pointer capture loss.

## Drag preview

```tsx
<DragOverlay dropAnimation={null} modifiers={[snapToCursorOffset]}>
  {active?.data.current?.kind === 'palette-block'
    ? <BlockCardPreview blockId={active.data.current.blockId} />
    : <NodeGhost ids={active?.data.current?.nodeIds ?? []} />}
</DragOverlay>
```

- Palette drags show the block card at 90 % opacity with a slight scale and shadow.
- Node drags show a **thumbnail-scaled outline**, not a live copy. Rendering a live copy of a
  Hero with an aurora background at cursor rate is a frame-rate disaster; a translucent box with
  the node name is more readable anyway.
- Multi-node drags show a stacked box with a count badge (`3 layers`).
- The overlay is rendered in a portal at `Z.dragGhost`, transformed via `rAF`, never React state.
- `dropAnimation: null` — the snap-back animation implies failure. Drops are immediate.

## Working inside the transformed canvas

dnd-kit computes deltas in screen space. The canvas scene is scaled, so a raw delta is wrong by
a factor of `zoom`.

```ts
export const canvasTransformModifier = (zoom: number): Modifier =>
  ({ transform }) => ({
    ...transform,
    x: transform.x / zoom,
    y: transform.y / zoom,
  })
```

Applied only to canvas-internal drags. Palette → canvas drags keep screen-space movement for the
overlay (it follows the cursor 1:1) and convert only the final drop point via `screenToCanvas`.

This is exactly the class of bug that branded coordinate types prevent — see
[CANVAS.md](CANVAS.md) § Coordinate spaces.

## Accessibility

dnd-kit's announcer, with our own strings:

```ts
const announcements: Announcements = {
  onDragStart: ({ active }) => `Picked up ${label(active)}. Use arrow keys to move, space to drop, escape to cancel.`,
  onDragOver: ({ active, over }) => over
    ? `${label(active)} over ${label(over)}, position ${index(over) + 1} of ${count(over)}.`
    : `${label(active)} is not over a valid target.`,
  onDragEnd: ({ active, over }) => over
    ? `Dropped ${label(active)} into ${label(over)} at position ${index(over) + 1}.`
    : `Cancelled. ${label(active)} returned to its original position.`,
  onDragCancel: ({ active }) => `Cancelled. ${label(active)} returned to its original position.`,
}
```

Requirements:
- Every palette card and layer row is focusable with `role="button"` and
  `aria-roledescription="draggable block"`.
- The full drag can be performed with the keyboard on all four operations. Each is an E2E test.
- Rejected targets announce the reason, not just "invalid".
- `aria-live="assertive"` for the announcer region (dnd-kit's default); it must not be inside a
  container that gets `aria-hidden` when a dialog opens.

## Performance

| Concern | Mitigation |
| --- | --- |
| Rect measurement per frame | Rect cache, refreshed at drag start and on `ResizeObserver` only |
| Drop target recomputation | `rAF`-throttled; skipped if the pointer moved < 2 px |
| Live preview cost | Ghost outline, not a live render |
| Collision detection | Custom detector reading the rect cache, not dnd-kit's default `rectIntersection` over all droppables |
| Re-render on drag state | Drag state lives in a ref; only the overlay and the active indicator subscribe |

The measurable target: dragging a node across a 200-node canvas holds 60 fps, and the canvas root
does **not** re-render during the drag. Verified by a render counter in the E2E trace.

## Public API

```ts
// packages/dnd/src/index.ts
export { DndProvider } from './provider'
export { useDraggableBlock } from './use-draggable-block'
export { useDraggableNode } from './use-draggable-node'
export { useDropZone } from './use-drop-zone'
export { resolveDropTarget } from './resolve-drop-target'
export { DropIndicatorLayer } from './drop-indicator'
export type { DropTarget, DropIndicator, DragPayload } from './types'
```

`DndProvider` wraps the studio, owns the `DndContext`, sensors, modifiers, announcements, and the
overlay. It receives `onDrop(target, payload)` and calls it once per successful drop — dispatching
the command is the app's job, not the dnd layer's.

## Testing

**Unit** (`node`) — `resolveDropTarget` against a fixture document and a fake rect cache:
vertical list above/below midpoint, horizontal row, grid cells, empty container, nested
containers, self-drop rejection, locked parent, `maxChildren`, isolation scoping.

**E2E** (Playwright) — one spec per operation, each run twice: once with the mouse, once with
the keyboard.

1. Palette → empty canvas → node exists, is selected.
2. Palette → between two sections → correct index.
3. Canvas node → reorder within parent → correct order, one undo step.
4. Canvas node → different parent → reparented, `parentId` and `children` consistent.
5. Tree row → reparent → canvas reflects it.
6. Drop into own descendant → rejected with the reason announced.
7. `Esc` mid-drag → nothing changed, no history entry.
8. Drag with 200 nodes present → frame budget assertion.
