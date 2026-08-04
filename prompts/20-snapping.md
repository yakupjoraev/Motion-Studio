# 20 — Snapping and guides

**Milestone** M3 · **Depends on** 19 · **Commit** `feat(canvas): add snapping engine with alignment guides`

## Read first

- `docs/CANVAS.md` — § Snapping, § Guides
- `docs/DESIGN_SYSTEM.md` — § Space (the grid values)

## Goal

The feature that makes layouts look designed instead of approximate: five kinds of snap candidate,
a zoom-independent threshold, priority resolution, and visible guides with distance labels.

Equal-spacing snapping is included. It is the one most builders skip and the one users notice most.

## Deliverables

```
packages/canvas/src/snap/
├── snap.types.ts             SnapCandidate, SnapResult, SnapGuide, SnapKind
├── generate-candidates.ts    the five generators
├── compute-snap.ts           threshold + priority resolution (pure)
├── snap.constants.ts         THRESHOLD_PX 4, PRIORITY order
├── guides/
│   ├── snap-guides.tsx       screen-space guide lines
│   ├── distance-labels.tsx   gap measurements with end caps
│   └── user-guides.tsx       ruler-dragged guides
├── rulers/
│   ├── rulers.tsx            both axes, cursor marker, drag-to-create
│   └── ruler-ticks.ts        tick spacing by zoom level (pure)
└── *.test.ts
```

## Constraints

### The five candidate generators

Per `CANVAS.md` § Snapping:

1. `grid` — nearest multiples of the grid size for each moving edge and centre
2. `edge` — every visible sibling's left/right/centre-x and top/bottom/centre-y
3. `center` — the parent's content-box centres
4. `guide` — user guides
5. `spacing` — **the position that equalises the gaps** when the moving node sits between two
   siblings. Compute for both axes; there may be several equal-spacing positions in a list of
   siblings, and all of them are candidates.

Generated **once at drag start**, not per frame. Siblings do not move during a drag, so per-frame
generation is pure waste. Write that reasoning as a comment.

### Threshold

```ts
const thresholdCanvas = THRESHOLD_PX / zoom
```

4 px in **screen** space, converted. Snapping must feel identical at 25 % and 400 % zoom. Test at
three zoom levels.

### Priority

```ts
const PRIORITY: Record<SnapKind, number> = { guide: 5, center: 4, edge: 3, spacing: 2, grid: 1 }
```

Per axis: nearest candidate within threshold wins; ties break by priority. Test a deliberate tie.

### Disable

`Ctrl`/`Cmd` held during a drag disables snapping entirely. Read the modifier live, not at drag
start — users press it mid-drag when a snap is fighting them.

### Multi-selection

Snapping applies to the selection's **bounding box**, not per node, so relative positions are
preserved. Test with three nodes.

### Guides

- 1 px lines in screen space, extending 24 px past the aligned edges — bounded, so multiple guides
  stay readable. Not full-viewport lines.
- Centre alignments dashed.
- Distance labels at each gap's midpoint with small end caps, only when a spacing snap fires.
- Appear on the frame the snap engages, removed on drop. **No fade** — a fading guide reads as lag.

### Rulers

Tick spacing adapts to zoom (`ruler-ticks.ts` is pure and tested): major ticks every 100 canvas
units at 100 %, every 500 at 25 %, every 50 at 200 %. Cursor position marker. Drag from a ruler
creates a user guide; drag a guide back onto the ruler deletes it; double-click a guide to type an
exact value.

## Verify

```bash
pnpm --filter @motion-studio/canvas test --coverage
```

`computeSnap` tests — this function carries the prompt:
- Nothing in range → zero delta, no guides
- One axis snaps, the other does not
- Both axes snap
- Two candidates in range → nearest wins
- Two candidates at equal distance → priority wins
- Threshold boundary: exactly at threshold snaps; one unit beyond does not
- Same scenario at zoom 0.25, 1, and 4 → identical *screen-space* feel (the canvas-space delta
  differs, the screen-space distance at which it engages does not)
- Equal-spacing: three siblings, moving node between two → snaps to the equalising position
- Multi-selection bounding box, not per node

`generateCandidates` tests: each of the five kinds produced for a fixture layout, with the expected
values.

`rulerTicks` tests: spacing at five zoom levels.

Manual, and report each:
- Drag a node near a sibling edge → snaps, guide appears bounded and immediately
- Drag between two siblings → equal-spacing snap fires with distance labels
- Hold `Cmd` mid-drag → snapping stops immediately
- Same behaviour at 25 % and 400 % zoom
- Drag from a ruler → guide created; drag it back → deleted; double-click → exact value
- Multi-select three nodes and drag → relative positions preserved

## Done when

- [ ] All five candidate kinds implemented, including equal-spacing
- [ ] Candidates generated once per drag, with the reasoning commented
- [ ] Threshold is zoom-independent, tested at three zoom levels
- [ ] Priority resolution tested with a deliberate tie
- [ ] `Cmd` disables snapping live, mid-drag
- [ ] Multi-selection snaps as a bounding box
- [ ] Guides bounded, dashed for centres, no fade, with distance labels
- [ ] Rulers with adaptive ticks and full user-guide lifecycle
- [ ] ≥ 85 % / ≥ 80 % coverage on the snap module
