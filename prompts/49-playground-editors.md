# 49 — Playground editors and sharing

**Milestone** M10 · **Depends on** 48 · **Commit** `feat(web): add clip-path and bezier editors with sharing`

## Read first

- `docs/PLAYGROUND.md` — § Property sandboxes (clip-path, transition), § Compare mode, § Sharing
- `docs/ACCESSIBILITY.md` — § Playground

## Goal

The two features that make the playground a tool rather than a textarea: draggable `clip-path`
vertices and a draggable bezier curve. Plus compare mode, permalinks, and send-to-selection.

## Deliverables

```
apps/web/src/components/playground/
├── clip-path-editor/
│   ├── clip-path-editor.tsx      overlay with draggable vertices
│   ├── parse-polygon.ts          polygon() ↔ vertex array
│   ├── vertex-handle.tsx         focusable, arrow-movable, announced
│   ├── shape-presets.ts
│   └── *.test.ts
├── bezier-editor/
│   ├── bezier-editor.tsx         two draggable control points + preview dot
│   ├── bezier-preview.tsx        an element animating on the current curve
│   └── *.test.ts
├── compare-mode/
│   ├── compare-target.tsx        split target, A | B
│   └── compare-tabs.tsx          two editor tabs
├── sharing/
│   ├── copy-actions.tsx          CSS | Tailwind | CSS variable
│   ├── permalink.ts              hash encode/decode with a 4kB cap
│   └── *.test.ts
└── send-to-selection.tsx
```

## Constraints

### `clip-path` vertex editor

```ts
export function parsePolygon(value: string): Result<Vertex[], CssError>
export function serializePolygon(vertices: Vertex[], unit: '%' | 'px'): string
```

Round-trip exact: `serialize(parse(x)) === normalize(x)` for every shape preset. Test all of them.

- Vertices render as handles over the target, positioned from the parsed values
- Drag moves a vertex; the value updates in the editor **live** (this is the two-way binding that makes
  it feel like a tool)
- Click on an edge inserts a vertex; `Delete` on a focused vertex removes it (minimum 3)
- `%` / `px` unit toggle converts existing values correctly
- Only `polygon()` is editable by handles; `circle()`, `ellipse()`, and `inset()` get their own
  parameter controls; `path()` is text-only with a note saying so

**Accessibility** — each handle is a `<button>`:
- Focusable, `aria-label="Vertex 3, 40 percent 60 percent"`
- Arrows move by 1 % (`Shift` 5 %), announced on change (debounced)
- `Enter` opens a numeric input for exact values
- `Delete` removes, announcing the new count

A drag-only editor excludes keyboard users from the playground's best feature. This is required, not
optional.

### Bezier editor

- Two draggable control points on a unit square with a grid
- The curve renders as an SVG path; the CSS value updates live
- A preview element animates on the current curve, replaying on change and on demand
- Named-curve presets from `EASINGS`, plus "custom"
- Control points can go outside [0,1] on the Y axis (overshoot) but not on X — clamp X, because CSS
  requires it and an invalid curve silently falls back to linear
- Keyboard: focus a control point, arrows move by 0.01 (`Shift` 0.05), announcing all four bezier
  values

### Compare mode

- Split the target down the middle: left renders A, right renders B
- The editor gets two tabs; `Cmd+Shift+S` swaps
- Which half is active is announced
- Off by default — it doubles the render cost of expensive properties

This is how you actually choose between two shadow stacks: same surface, same size, side by side.

### Permalinks

```
#p=box-shadow&v=<base64url>
```

- Encode the property and value; `base64url` (no padding, URL-safe)
- Cap at **4 kB**; beyond that, show "too long to link" and offer the clipboard instead
- Decode validates through `validateCss` before applying — **a permalink is untrusted input**, and this
  is the case where forgetting that would be an actual vulnerability
- Round-trip test, including the cap boundary and a malicious payload in the hash

### Copy actions

- **Copy CSS** — the normalized value
- **Copy as Tailwind** — the arbitrary-value class where one exists (`shadow-[...]`), or a note saying
  the value needs a config entry
- **Copy as CSS variable** — `--custom: <value>;` plus the usage line

### Send to selection

- Enabled only when the studio has a selection (same store)
- Lands on the node's `css` prop for that property, as a command, so it undoes
- Appears in the inspector's Effects section as a `Custom CSS` chip whose edit action reopens the
  playground with the value loaded
- Only properties the block declares as escape-hatch-eligible are accepted; others show why not

## Verify

```bash
pnpm test
pnpm test:e2e
pnpm dev
```

Tests:
- `parsePolygon`/`serializePolygon` round-trip exact for all shape presets
- Vertex drag maths: a pointer delta produces the expected percentage change at a given target size
- Vertex insert on edge, delete with the 3-vertex minimum
- Unit conversion `%` ↔ `px` correct against a known target size
- Bezier: X clamped to [0,1], Y unclamped; `toCssString` round-trip
- Permalink: round-trip, the 4 kB cap boundary, and a malicious payload rejected on decode
- Copy-as-Tailwind: produces a class where possible, a note where not
- Send to selection: dispatches a command; undo removes it; ineligible property shows a reason

E2E `e2e/flows/live-css.spec.ts` (flow D):
1. Open `/playground` → `clip-path` → drag a vertex → value and preview both update
2. Type invalid CSS → error shows, preview keeps the last valid state
3. Apply a preset → editor and preview update
4. Select a node in the studio → send from playground → the chip appears → undo removes it
5. Permalink round-trip in a fresh tab
6. A malicious permalink → rejected, nothing applied

Manual, and report:
- Drag vertices → does it feel precise? Any lag?
- Keyboard-only: focus a vertex, move it with arrows, insert, delete — report the announcements
- Bezier: drag a control point, watch the preview replay; keyboard-move a point and report what was
  announced
- Compare two shadow stacks → is the split useful?
- Copy each of the three formats and paste them somewhere → all three are correct and pasteable

## Done when

- [ ] Polygon parse/serialize round-trips exactly for every preset
- [ ] Vertex editor: drag, insert, delete, unit conversion, live two-way binding
- [ ] Vertices fully keyboard-operable with announced coordinates
- [ ] Bezier editor with X clamped, Y free, live preview replay, keyboard control
- [ ] Compare mode with an announced active half, off by default
- [ ] Permalinks validated on decode; malicious payload test passing
- [ ] Three copy formats all correct
- [ ] Send-to-selection is one undoable command with an inspector chip
- [ ] Flow D E2E spec passing on three browsers
- [ ] M10 complete
