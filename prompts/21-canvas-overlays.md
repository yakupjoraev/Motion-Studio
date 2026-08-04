# 21 — Canvas overlays

**Milestone** M3 · **Depends on** 20 · **Commit** `feat(canvas): add selection and measurement overlays`

## Read first

- `docs/CANVAS.md` — § DOM structure, § Overlays
- `docs/UI_GUIDELINES.md` — § Canvas presentation
- `docs/PERFORMANCE.md` — § Layer count

## Goal

Everything drawn on top of the canvas: selection outlines, hover, handles, spacing visualization,
breakpoint frame, context menu. All in screen space, all sibling elements, all updated through one
`rAF` loop reading refs.

## Deliverables

```
packages/canvas/src/overlays/
├── overlay-layer.tsx          the single promoted container; one rAF loop for all children
├── selection-outline.tsx      1.5px outline + name chip with edge flipping
├── multi-selection-box.tsx    dashed union box + thin per-node outlines
├── hover-outline.tsx          1px, 50% opacity, hidden during drag
├── resize-handles.tsx         8×8 at corners + midpoints, single selection, hidden below 40% zoom
├── spacing-overlay.tsx        padding/margin tints on Alt hold
├── breakpoint-frame.tsx       outline + width label
├── context-menu.tsx           the full menu from PRODUCT § 3
├── use-overlay-rects.ts       subscribes to the rect cache, drives the rAF loop
└── *.test.ts
```

## Constraints

### One layer, one loop

All overlays live inside `overlay-layer.tsx`, which is:
- **Outside** the scene transform (screen space, so line weights stay constant at every zoom)
- `pointer-events: none`, with handles opting back in
- One promoted compositing layer (`transform: translateZ(0)`), not one per overlay
- Driven by **one** `rAF` loop that reads the rect cache and the transform ref, writing CSS variables
  or `transform` on each overlay element

Overlay position is never React state during a gesture. React re-renders an overlay only when *which*
overlays exist changes (selection changed), not when they move.

### Selection outline

- Drawn **outside** the node's box (so a 1.5 px outline does not overlap content)
- Name chip at the top-left in `text-2xs`, flipping below the box when it would clip the viewport top
- Multi-selection: a dashed union box plus a thin outline per node, so it is clear what is included
- The outline is never a wrapper around the node — that would change the node's layout and break what
  export emits. Add a comment saying so.

### Resize handles

- Hidden below 40 % zoom (they would be unusably small and visually noisy)
- Single selection only
- Each handle is a focusable button with an `aria-label` ("Resize bottom-right"); arrows resize by
  1 px, `Shift` by 10
- Drag writes a CSS variable on the node and commits `setProp` on release — the transient pattern
- Constrained resize with `Shift` (aspect ratio), from-centre with `Alt`

### Spacing overlay

On `Alt` hold: padding tinted `accent/12`, margin `warning/12`, with numeric labels on each side when
the value is non-zero. Reads resolved props, not computed style, so the numbers match what the
inspector shows.

### Context menu

Radix `ContextMenu` with the full item list from `PRODUCT.md` § 3. Items disabled with a reason in
their tooltip when unavailable (Paste with an empty clipboard, Unwrap on a non-container). Every item
shows its shortcut via `Kbd`. Every item is also in the command palette (prompt 33) — this menu is a
convenience, never the only path.

### Motion playback control

`Cmd+P` freezes all motion; `Cmd+Shift+P` replays entrances. Implement the control surface here as a
viewport flag (`motionPaused`); the motion engine consumes it in prompt 31. Wire the flag and the
status-bar indicator now.

## Verify

```bash
pnpm --filter @motion-studio/canvas test
pnpm dev    # /studio with placeholder nodes
```

Unit tests:
- Name chip flips when the box top is within the chip height of the viewport top
- Handles hidden below 40 % zoom
- Multi-selection union box geometry
- Spacing overlay reads resolved props (assert against a fixture with responsive overrides)

Manual, and report each:
- Select → outline outside the box, chip readable, chip flips near the top edge
- Zoom to 25 % and 400 % → outline is still 1.5 px, chip still readable
- Multi-select → union box plus per-node outlines
- Hover → 1 px outline; start a drag → hover outline disappears
- Handles: resize by drag, by keyboard, with `Shift` and `Alt` modifiers
- Hold `Alt` → padding/margin visualization with correct numbers
- Right-click → full menu, correct disabled states with reasons, shortcuts shown
- `Cmd+P` → status bar shows motion paused

Performance, 200 nodes with 10 selected:
- Render counter on the canvas root; pan for five seconds. **Zero increments.** Overlays must follow
  the nodes correctly the whole time. Report the number.
- Check the Layers panel in DevTools: overlay layer count should be 1, not 10. Report the count.

## Done when

- [ ] All overlays in one promoted layer driven by one `rAF` loop
- [ ] Line weights constant across the full zoom range, verified visually
- [ ] Selection outline is a sibling, never a wrapper, with the reasoning commented
- [ ] Name chip edge-flipping works
- [ ] Handles keyboard-operable with labels, `Shift`/`Alt` modifiers, hidden below 40 %
- [ ] Spacing overlay reads resolved props
- [ ] Context menu complete with disabled reasons and shortcuts
- [ ] Zero canvas re-renders while panning with 10 nodes selected
- [ ] Overlay compositing layer count is 1; reported
- [ ] M3 complete: the canvas is fully usable with placeholder nodes
