# 37 — Block palette

**Milestone** M7 · **Depends on** 36 · **Commit** `feat(web): add searchable block palette`

## Read first

- `docs/PRODUCT.md` — § 2. Left panel (Blocks)
- `docs/ACCESSIBILITY.md` — § Block palette
- `docs/PERFORMANCE.md` — § Virtualization, § Images
- `docs/DRAG_AND_DROP.md` — § The four operations

## Goal

The Blocks tab: a fast, searchable, keyboard-operable grid of every registry entry, with thumbnails
that animate on hover and drag sources that work by mouse and keyboard.

Small prompt, but it is the panel users touch first and most, so it gets the polish.

## Deliverables

```
apps/web/src/components/studio/left-panel/blocks/
├── blocks-tab.tsx           search + category filter + grid
├── block-grid.tsx           role="grid", virtualized, 2D arrow navigation
├── block-card.tsx           memo'd: thumbnail, name, category chip, drag source
├── block-thumbnail.tsx      WebP + hover WebM, reduced-motion aware
├── category-filter.tsx      chips, multi-select
├── use-block-search.ts       deferred query, fuzzy over name + tags + category
├── use-insert-block.ts       Enter/double-click insertion
└── *.test.tsx
```

## Constraints

### Search

- `useDeferredValue` on the query, so typing never waits on filtering
- Fuzzy over `name`, `tags`, `description`, and `category` — reuse `fuzzy-match.ts` from prompt 33
  rather than writing a second scorer
- Result count in an `aria-live` region: "8 blocks match"
- Must return in **under 16 ms** over the full registry. Measure with `performance.measure` and report
  the number.
- Empty result → "No blocks match "xyz"" plus a clear action

### Grid and keyboard

```html
<div role="grid" aria-label="Blocks">
  <div role="row">
    <div role="gridcell"><button aria-roledescription="draggable block">…</button></div>
```

- 2D arrow navigation: `←`/`→` within a row, `↑`/`↓` between rows, `Home`/`End` to row edges,
  `PageUp`/`PageDown` by a viewport
- Roving tabindex — one tab stop for the whole grid
- Accessible name includes the category: "Pricing table, marketing block"
- `Enter` inserts into the current selection's parent (the primary path for keyboard users), `Space`
  picks up for a keyboard drag
- Virtualized above 40 cards

### Thumbnails

- Static WebP with `blurDataURL`, exact `320 × 200` so there is no layout shift
- Hover plays the WebM: `preload="none"`, loaded on first hover, `aria-hidden`
- **No video under reduced motion** — not paused, not loaded. Check `useReducedMotion` before creating
  the element.
- Both light and dark variants; pick by the current colour mode
- A missing thumbnail renders a token-coloured placeholder with the block icon, never a broken image

### Insertion behaviour

`Enter` on a card inserts into:
1. The isolation container, if isolated
2. Otherwise the selection's parent, after the selection
3. Otherwise root, at the end

Same resolution as paste, so use the shared `resolvePasteTarget` helper rather than a second
implementation. If it needs generalising, generalise it and note the refactor.

The inserted node is **selected** and **scrolled into view** on the canvas. Inserting something the
user then has to hunt for is a small failure that adds up.

### Categories

The ten categories from `COMPONENT_LIBRARY.md`. Multi-select chips, with counts. Selected filters
persist for the session.

## Verify

```bash
pnpm test
pnpm dev
```

Tests:
- Search returns expected orderings for a query fixture
- Search over the full registry in under 16 ms (assert on a measured duration)
- 2D arrow navigation: all six key behaviours
- `Enter` insertion: all three target-resolution branches
- Inserted node is selected
- Thumbnail: no video element created under reduced motion
- Missing thumbnail → placeholder, not a broken image
- Grid `role`/`aria` attributes, including virtualized `aria-setsize`

Manual, and report:
- Type in the search box → results filter with no perceptible lag; report the measured search time
- Hover a card → the animation plays; with reduced motion on → it does not, and no network request for
  the WebM (check the Network panel)
- Navigate the whole grid with arrows only, insert a block with `Enter` → it appears, is selected, and
  is in view
- Keyboard-drag a card with `Space` + arrows → drops correctly
- With a screen reader: report the announced name of a focused card and the result-count announcement
- Filter by two categories → correct union
- Both colour modes → thumbnails match the mode

## Done when

- [ ] Search deferred, fuzzy, under 16 ms over the full registry; number reported
- [ ] `role="grid"` with complete 2D keyboard navigation and roving tabindex
- [ ] `Enter` insertion shares the paste-target resolver
- [ ] Inserted node selected and scrolled into view
- [ ] No video element or request under reduced motion, verified in the Network panel
- [ ] Missing thumbnails degrade to a placeholder
- [ ] Virtualized above 40 cards with correct ARIA
- [ ] Screen-reader names and announcements verified and reported
- [ ] M7 complete
