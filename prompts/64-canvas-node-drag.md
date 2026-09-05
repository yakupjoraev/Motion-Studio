# 64 — Dragging a node on the canvas

**Milestone** M15 · **Depends on** 63 · **Commit** `feat(dnd): make a canvas node a drag source`

## Read first

- `docs/DRAG_AND_DROP.md` — § The four operations, § Sensors, § Drop position resolution
- `docs/CANVAS.md` — § Hit testing, § Overlays
- `packages/dnd/src/use-draggable-node.ts` — written, and used in exactly one place
- `apps/web/src/components/studio/left-panel/layers/layer-row-drag.tsx` — the one place

## Goal

Operations **2** and **4** of `DRAG_AND_DROP.md` — canvas node to canvas, and across the two surfaces.
The document has said "which is the work that follows" since the subsystem was written; the follow has
not happened, and the owner found it in the first minute:

> почему я не могу двигать добавленные секции\блоки\элементы? типо менять местами

Reordering works only in the layers tree. On the canvas a node is a plain `div`: no
`aria-roledescription`, no `touch-action: none`, no drag listeners. Verified by reading the attributes
of every `[data-node-id]` in a live document.

## What makes this hard, and where to be careful

- **The 4 px activation distance is load-bearing.** A canvas click selects; a canvas drag moves. Below
  that threshold selection feels unstable, which is why `DRAG_AND_DROP.md` set it.
- **The scene is CSS-transformed.** Pointer deltas are screen pixels and the document is in canvas
  units; the transform-aware modifier already exists for the palette drag — reuse it, do not write a
  second conversion.
- **Both surfaces register a zone per node.** `DropZone.surface` (ADR-181) exists precisely so the
  canvas and the tree can hold zones under the same node id. Operation 4 is what it was written for.
- **Keyboard drag is not optional.** `ACCESSIBILITY.md` and the keyboard sensor's coordinate getter are
  already in place; a canvas drag that only works with a mouse fails the contract.
- **Nothing about drag state lives in the document until drop.** The drop ends in `moveNodes`, one
  history entry.

## Deliverables

```
packages/dnd/                   the canvas node as a drag source; cross-surface resolution
packages/canvas/                the drop indicator drawn in scene coordinates
apps/web/src/components/studio/canvas-area/   the node wired to the source
e2e/editor/dnd-canvas.spec.ts   mouse and keyboard, both directions across surfaces
docs/DRAG_AND_DROP.md           § The four operations: all four wired
```

## Verification

```bash
pnpm --filter @motion-studio/dnd test
pnpm --filter web test
pnpm --filter e2e exec playwright test editor/dnd --project=chrome
```

By hand, in the studio:

- [ ] Drag a hero above a navbar on the canvas; the order changes and one undo puts it back
- [ ] Drag a node into a container, and out of it again
- [ ] Drag from the canvas into the layers tree, and from the tree onto the canvas
- [ ] Pick up with `Space`, move with arrows, drop with `Space`, cancel with `Esc`
- [ ] A 3 px pointer move still selects rather than moving anything
- [ ] The drop indicator lands where the node lands — check at 50 % and 200 % zoom

Report what the indicator does at both zoom levels: that is where a screen-versus-canvas unit mistake
shows up, and it will not fail a test.
