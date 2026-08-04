# 28 — Drop resolution

**Milestone** M5 · **Depends on** 27 · **Commit** `feat(dnd): add drop target resolution and indicators`

## Read first

- `docs/DRAG_AND_DROP.md` — § Drop position resolution, § Validation rules, § Auto-behaviours
- `docs/COMPONENT_LIBRARY.md` — § BlockDefinition (slots)

## Goal

The pure function that decides where a drop lands, plus the visual feedback that tells the user before
they release. "Where inside this container" is the hard part, and it differs for vertical lists,
horizontal rows, grids, and empty containers.

## Deliverables

```
packages/dnd/src/
├── resolve-drop-target.ts       the pure resolver
├── resolve-drop-target.test.ts  the bulk of this prompt's value
├── validate-drop.ts             the five rules, each returning a reason string
├── indicators/
│   ├── drop-indicator-layer.tsx
│   ├── line-indicator.tsx       between siblings
│   ├── fill-indicator.tsx       into an empty container
│   ├── cell-indicator.tsx       grid cell
│   └── reject-indicator.tsx     red outline + reason on the cursor
├── auto/
│   ├── use-auto-pan.ts          canvas edge panning
│   ├── use-auto-scroll.ts       tree edge scrolling
│   └── use-spring-open.ts       600ms hover to expand a collapsed group
└── on-drop.ts                   target + payload → the right command
```

## Constraints

### The resolver signature

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

Pure. No DOM, no store. The `hitNodeId` comes from the caller (which did the `elementsFromPoint`), so
the whole resolution is testable with a fixture document and a fake rect cache. This separation is the
point.

### The algorithm

Exactly the seven steps in `DRAG_AND_DROP.md` § Drop position resolution. Step 4 matters: read the
container's layout direction **from its props, not from computed style**. Props are the truth and are
available without a DOM read, and a computed-style read mid-drag is a forced layout.

Insertion index:
- vertical → pointer.y against each child's vertical midpoint
- horizontal → pointer.x against each child's horizontal midpoint
- grid → nearest cell centre; empty cells are valid targets
- empty container → index 0, `fill` indicator

### Validation

Five rules from the table, each returning a **human reason string**:

```ts
{ ok: false, reason: 'Navbar accepts up to 6 links' }
{ ok: false, reason: 'Cannot drop into itself' }
{ ok: false, reason: 'Section only accepts layout blocks' }
{ ok: false, reason: 'Layer is locked' }
{ ok: false, reason: 'Layer is hidden' }
```

Rejection is shown **before** release — red outline plus the reason next to the cursor, and announced.
Silently dropping nothing is the worst possible feedback and is what most builders do.

### Auto-behaviours

- Auto-pan: pointer within 60 px of a canvas edge, up to 12 px/frame, ramping with proximity. Runs in
  the drag `rAF` loop, writes the viewport ref — never React state.
- Auto-scroll: same for the layers tree, 40 px threshold.
- Spring-open: 600 ms hover over a collapsed group expands it. Cancelled if the pointer leaves.

### Performance

- Resolution is `rAF`-throttled and **skipped entirely if the pointer moved less than 2 px** since the
  last resolution. Most `pointermove` events during a slow drag are noise.
- Rect reads come from the cache, refreshed at drag start only.
- The indicator element is one div moved via CSS variables; changing the indicator *kind* re-renders,
  changing its *position* does not.

## Verify

```bash
pnpm --filter @motion-studio/dnd test --coverage
```

`resolveDropTarget` tests — this list is the prompt:
- Vertical list: pointer above child 2's midpoint → index 1; below → index 2
- Vertical list: above the first child → index 0; below the last → index n
- Horizontal row: same four cases on the x axis
- Grid: pointer in cell (1,2) → the corresponding index; empty cell → valid target
- Empty container → index 0, `fill` indicator
- Nested containers: pointer in a child container resolves to the child, not the parent
- Pointer over a node whose parent rejects the block → walks further up
- No valid ancestor → root, or `reject` if root rejects it
- Self-drop: into itself, into a child, into a grandchild → all three rejected
- Locked parent, hidden parent → rejected with the right reasons
- `maxChildren` exceeded → rejected with the count in the reason
- Isolation: only nodes at the current level are candidates
- Dragged nodes excluded from their own drop-index calculation (moving a node down one position in its
  own list is the off-by-one trap — test it)

Manual, and report each:
- Drag over a vertical section list → line indicator at the right position, moving as you cross
  midpoints
- Drag over a grid → cell indicator
- Drag over an empty container → fill indicator
- Drag a node into itself → red outline + "Cannot drop into itself", and the reason is announced
- Drag toward a canvas edge → auto-pan
- Drag over a collapsed tree group → springs open after ~600 ms
- Drag with 200 nodes present → smooth; add a temporary counter and confirm the canvas root does not
  re-render during the drag. Report the number.

Coverage on `resolve-drop-target.ts`: **≥ 95 %**. It is a pure function with many branches and no
excuse.

## Done when

- [ ] Resolver is pure, takes the rect cache as an argument, does no DOM access
- [ ] All four orientation modes correct, including the self-exclusion off-by-one
- [ ] All five validation rules return human reasons, shown before release and announced
- [ ] Layout direction read from props, not computed style
- [ ] Auto-pan, auto-scroll, spring-open working
- [ ] Resolution `rAF`-throttled with the 2 px skip
- [ ] Zero canvas re-renders during a drag over 200 nodes; reported
- [ ] ≥ 95 % coverage on the resolver
