# 27 — Drag and drop foundation

**Milestone** M5 · **Depends on** 26 · **Commit** `feat(dnd): add drag layer with transform-aware sensors`

## Read first

- `docs/DRAG_AND_DROP.md` — **all of it**
- `docs/CANVAS.md` — § Coordinate spaces
- `docs/ACCESSIBILITY.md` — § Block palette

## Goal

`packages/dnd` — the dnd-kit layer configured for a transformed canvas, with keyboard drag working
from day one rather than retrofitted.

## Deliverables

```
packages/dnd/src/
├── provider.tsx                 DndProvider: context, sensors, modifiers, overlay, announcer
├── sensors/
│   ├── pointer-sensor.ts        4px activation constraint
│   ├── keyboard-sensor.ts       canvasAwareCoordinateGetter
│   └── *.test.ts
├── modifiers/
│   ├── canvas-transform.ts      delta / zoom
│   ├── snap-to-cursor-offset.ts
│   └── *.test.ts
├── use-draggable-block.ts       palette card source
├── use-draggable-node.ts        canvas node source
├── use-drop-zone.ts             container target registration
├── collision/
│   ├── rect-cache-collision.ts  custom detector reading the rect cache
│   └── *.test.ts
├── overlay/
│   ├── drag-overlay.tsx
│   ├── block-card-preview.tsx
│   └── node-ghost.tsx           outline + count badge, NOT a live copy
├── announcements.ts
├── dnd.types.ts                 DragPayload, DropTarget, DropIndicator
└── index.ts
```

Dependencies: `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/modifiers`,
`@dnd-kit/accessibility`.

## Constraints

### Activation constraint

`{ distance: 4 }`. Below that a pointer-down is a selection, and selection happens far more often
than dragging. A 0 px threshold makes clicking feel unstable — that is the reason, and it belongs in a
comment.

### The transform modifier

```ts
export const canvasTransformModifier = (zoom: number): Modifier =>
  ({ transform }) => ({ ...transform, x: transform.x / zoom, y: transform.y / zoom })
```

Applied **only** to canvas-internal drags. Palette→canvas drags keep screen-space movement so the
overlay tracks the cursor 1:1, converting only the final drop point via `screenToCanvas`.

Getting this wrong produces a ghost that drifts away from the cursor at non-100 % zoom. Test at zoom
0.5, 1, and 2.

### Keyboard sensor

`canvasAwareCoordinateGetter` has two modes:

- **Within a container**: arrows move by one grid cell divided by zoom, so a step is one *visual* cell
- **Across containers**: arrows move between drop targets, in document order

Switch mode based on whether the current pointer position is at a container boundary. `Space`/`Enter`
picks up and drops, `Esc` cancels.

This is the part most implementations skip. It is also the part that makes the product accessible, and
it has its own E2E spec in prompt 29.

### Collision detection

dnd-kit's default `rectIntersection` measures every droppable on every move. With 200 nodes that is a
frame killer. Write a detector that reads the rect cache from `packages/canvas` instead:

```ts
export function rectCacheCollision(cache: RectCache): CollisionDetection
```

`packages/dnd` must not import `packages/canvas` — take the cache as a prop on `DndProvider`. State
that in a comment and let `check-deps` enforce it.

### Node ghost

An **outline with the node name and a count badge**, not a live render. Rendering a live copy of an
aurora hero at cursor rate destroys the frame budget, and a translucent labelled box is more readable
anyway. `dropAnimation: null` — snap-back implies failure, and drops are immediate.

### Announcements

Exactly the strings in `DRAG_AND_DROP.md` § Accessibility. Rejected targets announce **the reason**,
not just "invalid". The announcer region must not sit inside anything that gets `aria-hidden` when a
dialog opens.

## Verify

```bash
pnpm --filter @motion-studio/dnd test
pnpm dev    # /studio
```

Tests:
- Transform modifier: delta correct at zoom 0.5, 1, 2
- Pointer sensor: 3 px movement does not activate; 5 px does
- Keyboard coordinate getter: within-container step scales with zoom; cross-container mode moves
  between targets
- `rectCacheCollision` returns the expected target for a fixture layout without touching the DOM

Manual, and report each:
- Drag a palette card onto the canvas at zoom 100 % → ghost tracks the cursor exactly
- Same at zoom 50 % and 200 % → **still tracks exactly** (this is the modifier test in practice)
- Drag a canvas node → outline ghost with its name, no live render
- Multi-select three nodes and drag → stacked ghost with "3 layers"
- Press `Esc` mid-drag → nothing changes, no history entry
- Alt-tab mid-drag → drag cancels cleanly
- With a screen reader: pick up a palette card with `Space`, move with arrows, drop with `Space` —
  report the announcements you heard verbatim

## Done when

- [ ] 4 px activation with the reasoning commented
- [ ] Transform modifier correct at three zoom levels, tested and verified visually
- [ ] Keyboard sensor works in both modes
- [ ] Custom collision detection reads the rect cache; `dnd` does not import `canvas`
- [ ] Ghost is an outline, not a live render; `dropAnimation: null`
- [ ] `Esc` and window-blur cancel cleanly with no history entry
- [ ] Announcements verified with a real screen reader and reported verbatim
- [ ] Verification clean
