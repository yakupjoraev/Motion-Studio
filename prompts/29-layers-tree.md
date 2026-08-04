# 29 — Layers tree

**Milestone** M5 · **Depends on** 28 · **Commit** `feat(web): add virtualized layers tree with keyboard drag`

## Read first

- `docs/PRODUCT.md` — § 2. Left panel (Layers)
- `docs/ACCESSIBILITY.md` — § Layers tree
- `docs/PERFORMANCE.md` — § Virtualization
- `docs/DRAG_AND_DROP.md` — § The four operations

## Goal

The layers tree — which is also the **accessible structure of the canvas**. For a screen-reader user
this panel *is* the document, so it gets a correct `role="tree"` implementation, not a styled list.

Virtualized, so it holds 500 nodes at 60 fps.

## Deliverables

```
apps/web/src/components/studio/left-panel/layers/
├── layers-panel.tsx           search + tree + footer count
├── layers-tree.tsx            role="tree", virtualized, roving tabindex
├── layer-row.tsx              memo'd: disclosure, icon, name, visibility, lock
├── layer-row-drag.tsx         drag source + drop target wiring
├── use-flat-layers.ts         versioned selector → flat rows with depth
├── use-tree-keyboard.ts       the full key map
├── use-layer-rename.ts        inline edit
├── layers-search.tsx          filter with a live result count
└── *.test.tsx
```

Plus the four E2E specs this milestone owes: `e2e/editor/dnd-mouse.spec.ts`,
`e2e/a11y/keyboard-drag.spec.ts`, and the tree specs.

## Constraints

### ARIA — get this exactly right

```html
<div role="tree" aria-label="Layers" aria-multiselectable="true">
  <div role="treeitem"
       aria-level="2"
       aria-expanded="true"
       aria-selected="false"
       aria-setsize="6"
       aria-posinset="2"
       tabindex="-1">
```

`aria-setsize` and `aria-posinset` are **required** because the tree is virtualized. Without them a
screen reader announces "12 items" when there are 400. This is the single most commonly missed detail
in virtualized trees, and it is a correctness bug, not a nicety.

Roving tabindex: exactly one row has `tabindex="0"`.

### Virtualization

`@tanstack/react-virtual`, fixed 26 px rows. `use-flat-layers` is a versioned selector producing
`{ id, depth, hasChildren, expanded }[]` — flattening happens once per document version, not per
render.

Collapsed subtrees are excluded from the flat list, so collapsing is also a perf win.

### Keyboard

The full map from `SHORTCUTS.md` § Layers tree. Specifically:
- `↑`/`↓` move focus; `←`/`→` collapse/expand (and `←` on a collapsed node moves to its parent, which
  is the standard tree behaviour users expect)
- `Shift+↑`/`↓` extend selection
- `Space` toggles selection, `Enter` renames
- `Mod+↑`/`↓` moves the layer among siblings (a command, undoable)
- `Alt+click` a disclosure expands or collapses the whole subtree
- Keyboard drag: `Space` to pick up, arrows to move between positions, `Space` to drop, `Esc` to
  cancel

### Row

- `memo`'d, subscribing to its own node only
- Visibility and lock are `aria-pressed` toggle buttons with labels that name the layer ("Hide Hero")
- The block icon comes from the definition's `icon`
- Depth via padding, with a subtle guide line per level
- Selected state uses background + a left accent bar — not colour alone
- Double-click or `Enter` renames inline: a real `input` with a label, `Enter` commits, `Esc` cancels

### Search

Filters by name and block name. Shows matching nodes **with their ancestors** (a match inside a
collapsed group must be reachable), auto-expanding the path. Live result count in an `aria-live`
region: "3 layers match".

### Sync with the canvas

Selecting in the tree selects on the canvas and scrolls it into view if off-screen; selecting on the
canvas scrolls the tree row into view. Both directions, and neither causes a loop — guard with a
source flag.

## Verify

```bash
pnpm test
pnpm test:e2e
pnpm dev
```

Unit tests:
- `use-flat-layers`: depth correct, collapsed subtrees excluded, memoised on version (reference
  equality)
- Keyboard map: every key produces the expected action
- `aria-setsize`/`aria-posinset` correct for a virtualized window (render 400 nodes, assert the
  attributes on a visible row reflect the *full* set, not the window)
- Search: matches include ancestors and auto-expand
- Rename: commit and cancel

E2E — `e2e/a11y/keyboard-drag.spec.ts`, all four operations from `DRAG_AND_DROP.md`, **by keyboard**:
1. Palette → canvas
2. Canvas node reorder
3. Tree row reparent
4. Tree row → canvas

And the mouse equivalents in `e2e/editor/dnd-mouse.spec.ts`, plus:
5. Drop into own descendant → rejected, reason announced
6. `Esc` mid-drag → no change, no history entry

Manual, and report:
- 500-node fixture → scrolling is smooth; report whether you saw any jank
- Screen reader: navigate the tree, and confirm it announces level, position, expanded state, and
  selection. **Report the announcements verbatim.**
- Keyboard-drag a node to a new parent with the screen reader on — report what you heard
- Tree ↔ canvas selection sync in both directions, with off-screen scroll-into-view
- Search for a name inside a collapsed group → it appears and the path expands

## Done when

- [ ] Correct `role="tree"` with `aria-setsize`/`aria-posinset` for the virtualized case, tested
- [ ] 500 nodes scroll at 60 fps
- [ ] Full keyboard map including `←` on a collapsed node moving to the parent
- [ ] All four drag operations work by mouse **and** keyboard, with E2E specs on three browsers
- [ ] Rejections announced with reasons
- [ ] Search includes ancestors and auto-expands
- [ ] Bidirectional canvas sync with no loop
- [ ] Screen-reader announcements verified and reported verbatim
- [ ] M5 complete
