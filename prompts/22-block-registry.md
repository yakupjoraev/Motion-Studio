# 22 — Block registry

**Milestone** M4 · **Depends on** 12, 21 · **Commit** `feat(blocks): add registry contract and defineBlock`

## Read first

- `docs/COMPONENT_LIBRARY.md` — § Anatomy, § BlockDefinition, § Registry construction, § Lazy loading
- `docs/ARCHITECTURE.md` — § The registry seam
- `docs/CANVAS.md` — § Node rendering

## Goal

The contract every block satisfies, the `defineBlock` helper, the split metadata/render registries,
the parity check, and the `NodeRenderer` in `apps/web` that connects the canvas to real components.

Three blocks only in this prompt — `section`, `container`, `heading` — as proof the whole seam works
end to end. Volume comes in prompts 24–26.

## Deliverables

```
packages/blocks/src/
├── define-block.ts             the typed helper
├── define-block.types.ts
├── registry.ts                 blockRegistry + renderRegistry + the parity assertion
├── layout/
│   ├── section/                the nine-file layout
│   ├── container/
│   └── index.ts                definitions + components maps
├── content/
│   ├── heading/
│   └── index.ts
├── test/
│   ├── registry.meta.test.ts   the meta-tests, over every definition
│   └── render-block.tsx        test helper
└── index.ts

apps/web/src/components/studio/canvas-area/
├── node-renderer.tsx           memo'd per-node subscription
├── node-error-boundary.tsx     per-node boundary with an inline error card
└── canvas-host.tsx             wires Canvas + renderNode + the store
```

## Constraints

### `defineBlock`

```ts
export function defineBlock<S extends ZodType>(config: DefineBlockConfig<S>): BlockDefinition<z.infer<S>>
```

Infers the props type from the schema so `defaults`, `previewProps`, and `controls` are all checked
against it. A `controls` entry with a path not in the schema must be a **compile error** where
possible, and a test failure where the type system cannot reach (dot-paths into nested objects). Say
which cases you covered at the type level.

### The registry split

```ts
export const blockRegistry: BlockRegistry            // metadata; zero React imports
export const renderRegistry: RenderRegistry           // BlockId → component
```

Two separate module graphs. `blockRegistry` must be importable in a `node` test without pulling in
React — that is what lets `codegen` and `editor` stay React-free. Prove it with a test that imports
only `blockRegistry` in the `node` environment and passes.

The parity assertion runs at module load in development and as a test always: identical key sets, or
fail.

### `NodeRenderer` in `apps/web`

Exactly the pattern in `CANVAS.md` § Node rendering:

- `memo` on `id`
- Subscribes to **its own node only** via a `useCallback`'d selector
- `data-node-id` on the wrapper
- Children passed through so the block controls its own layout
- Per-node error boundary: an inline card naming the block, with the rest of the canvas alive
- Lazy blocks get a `Suspense` boundary **at the node level** with a fixed-size skeleton — never a
  boundary spanning the tree, because a suspending node would unmount its siblings' DOM

### The three blocks

`section` — a full-width vertical container. Slot `children`, accepts `*`. Props: `maxWidth`,
`padding` (responsive), `background`, `align`, `minHeight`.

`container` — a constrained layout box. Slot `children`, accepts `*`. Props: `direction`, `gap`,
`padding`, `align`, `justify`, `wrap`, `maxWidth` — all responsive.

`heading` — text. No slots. Props: `text`, `level` (1–6), `size`, `weight`, `align`, `balance`,
`gradient`, `tracking`.

All three: semantic HTML, tokens only, responsive by construction, usable at 360 px, `axe` clean.

### The meta-tests

Write them now, over `blockRegistry.list()`, exactly as in `COMPONENT_LIBRARY.md` § Testing. They
will run against three blocks today and 62 later. Every subsequent block prompt inherits this gate,
which is what makes a half-finished block impossible to merge.

Skip only the thumbnail assertion until prompt 26 adds the generator — and leave it in place,
skipped, with a comment naming the prompt.

## Verify

```bash
pnpm --filter @motion-studio/blocks test
pnpm dev    # /studio
```

Tests:
- Meta-tests pass for all three blocks
- `blockRegistry` imports in `node` without React (a dedicated `node`-environment test file)
- Parity assertion catches a deliberately removed component (add, observe the failure, revert)
- Each block: renders with defaults, `axe` clean, defaults parse against its schema

Manual, and report:
- Load a fixture document with a nested section → container → heading; it renders on the canvas
- Select each; the outline is correct at every nesting level
- Edit `heading.text` in a temporary debug control → only that node re-renders (render counters on
  three nodes; report the three numbers)
- Break a block deliberately (throw in render) → the error card appears, the rest of the canvas
  survives, and the document is still downloadable. Then revert.

```bash
node scripts/check-deps.mjs
```

Must confirm: `blocks` does not depend on `editor` or `canvas`.

## Done when

- [ ] `defineBlock` infers types from the schema; type-level coverage stated
- [ ] Registry split proven: metadata imports in `node` without React
- [ ] Parity assertion demonstrated to catch a mismatch
- [ ] `NodeRenderer` re-renders only the edited node, proven with three counters
- [ ] Per-node error boundary keeps the canvas alive and the document retrievable
- [ ] Suspense boundary is per node, with the reasoning commented
- [ ] Three blocks complete with the nine-file layout
- [ ] Meta-tests written and passing (thumbnail assertion skipped with a comment)
- [ ] `blocks` depends on neither `editor` nor `canvas`
