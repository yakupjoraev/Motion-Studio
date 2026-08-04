# 19 — Hit testing and selection

**Milestone** M3 · **Depends on** 18 · **Commit** `feat(canvas): add hit testing, marquee, and rect cache`

## Read first

- `docs/CANVAS.md` — § Hit testing, § Node rendering
- `docs/EDITOR_ENGINE.md` — § Selection
- `docs/ACCESSIBILITY.md` — § Canvas
- `docs/PERFORMANCE.md` — § Canvas specifics

## Goal

Clicking selects the right thing; dragging on empty space marquee-selects; and neither operation
calls `getBoundingClientRect` in a loop. Plus the keyboard selection path and the live-region
announcer.

## Deliverables

```
packages/canvas/src/
├── hit/
│   ├── hit-test.ts            elementsFromPoint → nearest [data-node-id], with the filter chain
│   ├── use-hit-test.ts        rAF-throttled hover tracking
│   ├── marquee.ts             rect intersection over the cache (pure)
│   ├── use-marquee.ts         pointer gesture + the marquee element
│   └── *.test.ts
├── rects/
│   ├── rect-cache.ts          Map + one ResizeObserver + version invalidation
│   ├── use-rect-cache.ts
│   └── *.test.ts
├── selection/
│   ├── use-canvas-selection.ts    click/shift/mod/alt → selection mode
│   ├── use-keyboard-selection.ts  Tab/Enter/Esc/arrows
│   ├── selection-announcer.tsx    the polite live region
│   └── *.test.ts
└── node-wrapper.tsx           data-node-id host; the app's NodeRenderer renders into it
```

## Constraints

### Hit test filter chain

Exactly the four steps in `CANVAS.md` § Hit testing, in order. The third step — "the topmost node
whose parent chain is at the current isolation level" — is the one that makes clicking a nested text
inside an un-entered Hero select the Hero. Get it right; it is what makes the editor feel like Figma
rather than like a DOM inspector.

`Alt+click` bypasses isolation entirely and selects the deepest node.

Use `document.elementsFromPoint`. Do not implement geometric hit testing — the browser already
handles transforms, `overflow`, `border-radius`, and `clip-path` correctly and for free.

### Rect cache

```ts
export interface RectCache {
  get(id: NodeId): Rect | undefined
  invalidate(id?: NodeId): void
  refresh(): void
  observe(id: NodeId, el: Element): () => void
}
```

- **One** `ResizeObserver` for all nodes. Not one per node.
- `refresh()` batches: read all rects in one pass, inside a single `rAF`, so there is at most one
  forced layout per frame rather than N.
- Invalidated on `document.version` change and on scroll of the canvas root.
- Marquee and overlays read the cache, never the DOM.

Test with a fake `ResizeObserver` and assert that N observed elements produce exactly one observer
instance.

### Marquee

```ts
export function marqueeHits(rect: Rect, cache: RectCache, candidates: readonly NodeId[], mode: 'intersect' | 'contain'): NodeId[]
```

Pure, operating on the cache. Candidates are the nodes at the current isolation level only.
`intersect` by default; `contain` with `Alt`.

The marquee visual is one absolutely-positioned div positioned via CSS variables in the `rAF` loop —
not React state. During a marquee across 200 nodes, the canvas must not re-render; selection commits
on pointerup.

### Keyboard selection

Per `CANVAS.md` § Keyboard operation. The canvas is one tab stop with `role="application"` and an
`aria-label`. `role="application"` is only defensible because keyboard operation is complete — add a
comment saying exactly that, so nobody removes the keyboard handlers and leaves the role.

### Announcer

```html
<div role="status" aria-live="polite" aria-atomic="true" class="sr-only">
  Hero selected. 2 of 6 in Page.
</div>
```

Debounced 150 ms so arrow-key navigation does not flood the queue. Announces: selection changes,
count for multi-selection, entering and exiting a container, and the result of an action ("Duplicated
Hero. 7 blocks.").

## Verify

```bash
pnpm --filter @motion-studio/canvas test
pnpm dev    # /studio with placeholder nodes, including nested ones
```

Unit tests:
- Hit filter chain: locked skipped, hidden skipped, isolation respected, `Alt` bypass, nested
  un-entered container returns the container
- `marqueeHits`: intersect vs contain, isolation scoping, empty rect, rect containing everything
- Rect cache: one observer for N elements, batched refresh (assert one layout read per frame),
  invalidation on version change

Manual, and report each:
- Click a nested element → selects the outer container
- Double-click / `Enter` → enters, then clicking selects the child
- `Esc` → exits one level
- `Alt+click` → selects the deepest node directly
- Shift-click adds; mod-click toggles
- Marquee: partial overlap selects (intersect); `Alt+`marquee requires full containment
- Locked and hidden nodes are not selectable
- Tab walks siblings; arrows nudge

A11y:
- With VoiceOver or NVDA, navigate the canvas by keyboard and confirm every selection is announced
  with a useful string. Report the actual announcements you heard.

Performance, 200 nodes:
- Render counter on the canvas root; marquee across the whole canvas. **Counter increments once**
  (on commit). Report the number.

## Done when

- [ ] Hit filter chain complete and tested, including the isolation rule
- [ ] One `ResizeObserver` for all nodes, verified by test
- [ ] Rect refresh batched to one layout read per frame
- [ ] Marquee is pure over the cache; visual driven by CSS variables
- [ ] Marquee over 200 nodes causes exactly one canvas render
- [ ] Keyboard selection complete; `role="application"` justified in a comment
- [ ] Announcer debounced and verified with a real screen reader; announcements reported
- [ ] Verification clean
