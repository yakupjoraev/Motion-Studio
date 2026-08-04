# CANVAS

`packages/canvas` owns geometry. It knows about viewports, coordinates, snapping, hit testing,
and overlays. It does **not** know what a Hero is — it receives a render function.

## Coordinate spaces

Three spaces, and most canvas bugs are a confusion between two of them. Names are enforced by
branded types so the compiler catches the mistake.

```ts
export type ScreenPoint = { x: number; y: number } & { readonly __space: 'screen' }
export type CanvasPoint = { x: number; y: number } & { readonly __space: 'canvas' }
export type NodePoint   = { x: number; y: number } & { readonly __space: 'node' }
```

| Space | Origin | Unit |
| --- | --- | --- |
| **Screen** | Viewport top-left | CSS px, zoom-affected |
| **Canvas** | Artboard origin | Canvas units, zoom-independent |
| **Node** | The node's own box | CSS px, unzoomed |

```ts
export interface ViewportTransform {
  zoom: number          // 0.1 – 4
  pan: { x: number; y: number }   // canvas units
}

export function screenToCanvas(p: ScreenPoint, t: ViewportTransform, rect: DOMRect): CanvasPoint {
  return canvasPoint(
    (p.x - rect.left) / t.zoom - t.pan.x,
    (p.y - rect.top) / t.zoom - t.pan.y,
  )
}

export function canvasToScreen(p: CanvasPoint, t: ViewportTransform, rect: DOMRect): ScreenPoint {
  return screenPoint(
    (p.x + t.pan.x) * t.zoom + rect.left,
    (p.y + t.pan.y) * t.zoom + rect.top,
  )
}
```

These two functions are pure and have a round-trip property test: for random points and
transforms, `canvasToScreen(screenToCanvas(p)) ≈ p` within 0.001. That test catches every sign
error.

## DOM structure

```html
<div class="canvas-root" data-testid="canvas-root">        <!-- fixed, overflow hidden -->
  <div class="canvas-scene" style="transform: translate(var(--ms-vp-x), var(--ms-vp-y)) scale(var(--ms-vp-zoom))">
    <div class="canvas-artboard" style="width: var(--ms-artboard-w)">
      <!-- rendered nodes -->
    </div>
  </div>
  <div class="canvas-overlays">      <!-- NOT transformed; drawn in screen space -->
    <SelectionOutline /> <HoverOutline /> <SnapGuides /> <Marquee /> <Rulers />
  </div>
</div>
```

Two decisions worth stating:

1. **The scene transform is driven by CSS variables**, so pan and zoom during a gesture are
   variable writes at `rAF` rate with no React render. `transform` on a single element composites
   on the GPU.

2. **Overlays live outside the transform.** If a selection outline were inside the scene, its
   1.5 px border would scale to 6 px at 400 % zoom and 0.4 px at 25 %. Overlays are computed in
   screen space from the node's `getBoundingClientRect()`, so line weights stay constant. This
   also keeps overlays out of the node's layout, which matters because export must emit the node
   without any editor wrapper.

## Pan

```
Space + drag        → pan (cursor: grabbing)
Middle mouse drag   → pan
Two-finger trackpad → pan (wheel event without ctrlKey)
Scrollbar-less      → no scroll container at all; the canvas never scrolls the page
```

```ts
function onPointerMove(e: PointerEvent) {
  if (!panState.current.active) return
  panState.current.pan.x += e.movementX / transformRef.current.zoom
  panState.current.pan.y += e.movementY / transformRef.current.zoom
  scheduleFrame()                     // rAF-coalesced variable write
}
```

`movementX/Y` rather than tracking a start point — it survives pointer capture loss and does not
accumulate error. On `pointerup`, one `setPan` command commits to the store.

Momentum: on release with velocity above a threshold, decay at `v *= 0.92` per frame until below
0.1 px/frame. Disabled under reduced motion.

## Zoom

```ts
export function zoomAt(t: ViewportTransform, factor: number, anchor: ScreenPoint, rect: DOMRect): ViewportTransform {
  const nextZoom = clamp(t.zoom * factor, MIN_ZOOM, MAX_ZOOM)
  const anchorCanvas = screenToCanvas(anchor, t, rect)

  // keep the anchor point stationary in screen space
  return {
    zoom: nextZoom,
    pan: {
      x: (anchor.x - rect.left) / nextZoom - anchorCanvas.x,
      y: (anchor.y - rect.top) / nextZoom - anchorCanvas.y,
    },
  }
}
```

Zoom-to-cursor is derived, never accumulated. Repeated zoom in/out returns to the same pan — a
test performs 100 alternating zooms and asserts drift `< 0.01` px. Accumulating pan deltas
instead of recomputing is the classic source of the canvas slowly wandering off.

| Input | Behaviour |
| --- | --- |
| `Cmd/Ctrl + wheel` | Zoom at cursor, factor `1 - deltaY * 0.01`, clamped per event |
| Pinch (`wheel` with `ctrlKey`) | Same path — the browser reports pinch as ctrl+wheel |
| `Cmd/Ctrl + =` / `-` | Zoom at viewport centre, ×1.2 steps |
| `Cmd/Ctrl + 0` | 100 % |
| `Shift + 1` | Fit document |
| `Shift + 2` | Zoom to selection (padded 64 px, capped at 200 %) |
| Zoom dropdown | 25 / 50 / 75 / 100 / 150 / 200 / 400 %, Fit, Fill |

Zoom is quantised to 0.0001 to avoid float noise in the displayed percentage.

## Grid

- 8 px dots (configurable 4 / 8 / 16 / 24) as a `background-image` of two `radial-gradient`s on
  the artboard, sized in canvas units so it scales with the scene.
- A stronger line every 10 cells.
- Opacity fades between 50 % and 25 % zoom; hidden below 25 %.
- Rendering the grid as CSS rather than SVG or canvas costs nothing and never re-renders.

## Snapping

```ts
export interface SnapCandidate {
  axis: 'x' | 'y'
  value: number                 // canvas coordinate
  kind: 'grid' | 'edge' | 'center' | 'guide' | 'spacing'
  sourceId?: NodeId
}

export interface SnapResult {
  delta: { x: number; y: number }
  guides: SnapGuide[]
}

export function computeSnap(
  moving: Rect,
  candidates: readonly SnapCandidate[],
  threshold: number,             // screen px, converted to canvas units by the caller
): SnapResult
```

Candidate generation per drag (not per frame — computed once at drag start, since siblings do
not move):

1. **Grid** — nearest multiples of the grid size for each moving edge and centre.
2. **Sibling edges** — left/right/centre-x and top/bottom/centre-y of every visible sibling.
3. **Container** — parent's content-box edges and centres.
4. **User guides** — dragged from the rulers.
5. **Equal spacing** — if the moving node sits between two siblings, the position that makes the
   two gaps equal. This is the snap that makes layouts look designed, and it is the one most
   builders skip.

Selection rules:
- Threshold is **4 px in screen space**, so it feels identical at every zoom level. Convert:
  `thresholdCanvas = 4 / zoom`.
- Per axis, the nearest candidate within threshold wins. Ties break by priority:
  `guide > center > edge > spacing > grid`.
- `Ctrl`/`Cmd` held during a drag disables snapping entirely.
- Snapping applies to the selection's bounding box, not to each node — multi-drag keeps relative
  positions.

`computeSnap` is pure and heavily unit-tested: nothing in range, one axis only, both axes,
competing candidates, priority ties, threshold boundaries at several zoom levels.

## Guides

Rendered in screen space:

- 1 px `canvas-snap` line spanning from 24 px before the earlier aligned edge to 24 px past the
  later one — bounded, not full-viewport, so multiple guides stay readable.
- Centre alignments render dashed.
- When a spacing snap fires, a label shows the matched gap (`24`) at each gap's midpoint with
  small end caps.
- Guides appear on the frame the snap engages and are removed on drop. No fade — a fading guide
  reads as lag.

User guides: drag from a ruler to create; drag back onto the ruler to delete; double-click a
guide to enter an exact value; guides are stored in the document and export as nothing.

## Hit testing

Two mechanisms, both used:

**Pointer hit test** — `document.elementsFromPoint(x, y)`, then walk up for the nearest
`[data-node-id]`. Cheap, correct with any CSS (transforms, overflow, border-radius, clip-path),
and free — the browser already solved it. Filters applied in order:

1. Skip `hidden` and `locked` nodes.
2. If isolated, prefer descendants of `isolationId`.
3. Otherwise return the topmost node whose parent chain is at the current isolation level —
   clicking a nested text inside an un-entered Hero selects the Hero.
4. `Alt+click` bypasses isolation and selects the deepest node directly.

**Rect intersection** (marquee) — for a marquee we need every intersecting node, which
`elementsFromPoint` cannot give. Maintain a rect cache:

```ts
export interface RectCache {
  get(id: NodeId): Rect | undefined
  invalidate(id?: NodeId): void
  refresh(): void                      // batched getBoundingClientRect via ResizeObserver
}
```

Populated by one `ResizeObserver` over all node elements plus an invalidation on `version`
change. Marquee reads the cache, never the DOM, so a marquee across 200 nodes costs nothing.

Marquee semantics: intersect (not contain) by default; `Alt` switches to contain-only. Only
nodes at the current isolation level are candidates.

## Overlays

| Overlay | Position source | Notes |
| --- | --- | --- |
| Selection outline | Rect cache | 1.5 px, outside the box, name chip top-left |
| Multi-selection box | Union of rects | Dashed bounding box plus per-node thin outlines |
| Hover outline | `elementsFromPoint` on move, `rAF`-throttled | Hidden during drag |
| Resize handles | Rect cache | Single selection only; 8 × 8; hidden below 40 % zoom |
| Snap guides | Snap engine | Screen space |
| Marquee | Pointer positions | One absolutely-positioned div |
| Spacing overlay | Rect cache, on `Alt` | Padding and margin tints |
| Breakpoint frame | Artboard width | 1 px outline plus a width label |
| Distance badges | Snap engine | Only while dragging |

All overlays are in one `canvas-overlays` layer with `pointer-events: none`, except handles which
opt back in. They update via a single `rAF` loop reading refs — overlay position is never React
state during a gesture.

## Node rendering

```tsx
export interface CanvasProps {
  renderNode: (id: NodeId) => ReactNode      // injected by apps/web
  rootId: NodeId
}
```

The canvas calls `renderNode` and knows nothing else. In `apps/web`:

```tsx
const NodeRenderer = memo(function NodeRenderer({ id }: { id: NodeId }) {
  const node = useEditorStore(useCallback((s) => s.document.nodes[id], [id]))
  const breakpoint = useEditorStore(selectBreakpoint)
  if (!node || node.hidden) return null

  const Component = renderRegistry[node.blockId]
  const props = resolveResponsiveProps(node, breakpoint)

  return (
    <MotionNode spec={node.motion} data-node-id={id}>
      <Component {...props}>
        {node.children.map((childId) => <NodeRenderer key={childId} id={childId} />)}
      </Component>
    </MotionNode>
  )
})
```

Why this re-renders correctly and cheaply:

- Each renderer subscribes to **its own node only**. Editing node 7 re-renders node 7.
- `memo` with an `id` prop means a parent re-render does not cascade — children only re-render if
  their own node changed.
- `data-node-id` is on the wrapper, which is what hit testing looks for.
- Children are passed through, so a block controls its own layout and the editor does not inject
  wrappers into the layout tree.

## Performance

| Technique | Where |
| --- | --- |
| CSS-variable scene transform | Pan/zoom never renders React |
| Per-node memoised subscription | Edit affects one subtree |
| Rect cache + one `ResizeObserver` | No `getBoundingClientRect` in a loop |
| `rAF`-coalesced overlay updates | One write per frame maximum |
| `content-visibility: auto` on off-screen sections | Skips layout and paint |
| Snap candidates computed at drag start | Not per frame |
| `startTransition` for selection changes | Keeps the gesture responsive |
| Overlay layer promoted with `transform: translateZ(0)` | Own compositing layer |
| Motion paused when off-screen | Via the motion scheduler |

Budget: **60 fps with 200 nodes** while panning, zooming, dragging, and marquee-selecting, on a
mid-range laptop. Measured by a Playwright trace assertion in CI, not by feel.

## Keyboard operation

The canvas is a single tab stop with `role="application"` and an `aria-label`. Once focused:

| Key | Action |
| --- | --- |
| `Tab` / `Shift+Tab` | Next / previous sibling |
| `Enter` | Enter container |
| `Esc` | Exit container, then clear selection |
| Arrows | Nudge 1 px |
| `Shift` + arrows | Nudge 10 px |
| `Space` (hold) | Pan mode; arrows pan |
| `Cmd+0` / `Shift+1` / `Shift+2` | Zoom reset / fit / to selection |
| `Cmd+A` | Select siblings at the current level |

Selection changes announce via a polite live region: `"Hero selected. 2 of 6 in Section."`
See [ACCESSIBILITY.md](ACCESSIBILITY.md).

## Public API

```ts
// packages/canvas/src/index.ts
export { Canvas } from './canvas'
export { useViewport, useViewportTransform } from './viewport'
export { screenToCanvas, canvasToScreen, zoomAt, fitToRect } from './coords'
export { computeSnap, generateSnapCandidates } from './snap'
export { useRectCache } from './rects'
export type { ViewportTransform, SnapResult, ScreenPoint, CanvasPoint } from './types'
```

Dependencies: `utils`, `schema` (types only), `hooks`, React. **Not** `editor`, **not** `blocks`.
The store is reached through props and injected selectors, which is what lets the canvas be
tested with a fake viewport and three fake nodes.
