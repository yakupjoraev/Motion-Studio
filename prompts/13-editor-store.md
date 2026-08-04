# 13 — Editor store

**Milestone** M2 · **Depends on** 12 · **Commit** `feat(editor): add sliced store with command dispatch`

## Read first

- `docs/STATE_MANAGEMENT.md` — **all of it**
- `docs/EDITOR_ENGINE.md` — § Commands, § Public API
- `docs/PERFORMANCE.md` — § Selector discipline

## Goal

`packages/editor`'s store: seven slices, command dispatch producing Immer patches, selectors with
versioned memoisation. No commands yet (prompt 14) and no history yet (prompt 15) — the dispatch
pipeline and the slice structure.

Still no React, no DOM. Testable in `node`.

## Deliverables

```
packages/editor/src/
├── store/
│   ├── store.types.ts          EditorState, EditorStore, all seven slice interfaces
│   ├── create-store.ts         createEditorStore(options) — injectable registry, generateId, now
│   ├── use-store.ts            useEditorStore — the app-level singleton
│   ├── slices/
│   │   ├── document-slice.ts   document, version, dirty, dispatch, dispatchBatch, replaceDocument
│   │   ├── selection-slice.ts  the four modes, normalization, isolation, pruning
│   │   ├── viewport-slice.ts   committed setters only
│   │   ├── history-slice.ts    stub: shape + no-op undo/redo (prompt 15 fills it)
│   │   ├── clipboard-slice.ts  stub: shape only (prompt 16)
│   │   ├── ui-slice.ts         panel state, dialogs
│   │   └── theme-slice.ts      theme + token setters
│   └── *.test.ts
├── commands/
│   ├── command.types.ts        Command, CommandContext
│   └── dispatch.ts             the produceWithPatches pipeline
├── selectors/
│   ├── create-versioned-selector.ts
│   ├── document-selectors.ts   selectNode, selectChildren, selectFlatLayers, selectResolvedNode
│   ├── selection-selectors.ts
│   ├── viewport-selectors.ts
│   └── *.test.ts
├── test/create-test-store.ts   deterministic store per TESTING § Determinism
└── index.ts
```

Dependencies added: `zustand`, `immer`.

## Constraints

### Dispatch

Exactly the pipeline in `STATE_MANAGEMENT.md` § Dispatch, including:

- **Zero-patch commands are dropped silently.** Clicking an already-active option must not create a
  history entry. Test it.
- `version += 1` on every committed mutation.
- `dirty = true` on every committed mutation.
- Patches are handed to the history slice through a single `recordHistory` call, so prompt 15 has one
  seam to fill.

### Selection

`normalizeSelection` — drop any node with an ancestor in the set. `selection.ids` always in document
order. `pruneSelection` filters against the current document, because undo can remove selected
nodes.

All four modes (`replace`, `add`, `toggle`, `range`) with tests. `range` needs an anchor and operates
on siblings only.

### Viewport

**Committed setters only.** No per-frame setter exists on the store. Write a comment in
`viewport-slice.ts` explaining that pan/zoom during a gesture live in canvas refs and CSS variables,
and pointing at `docs/PERFORMANCE.md` § The core rule. The absence of a per-frame setter is the
architectural decision; make it explicit so nobody adds one later "for convenience".

### Selectors

`createVersionedSelector(keyFn, computeFn)` — a cache of size 1, keyed on a cheap scalar. No deep
equality, no proxy tracking. It is ~20 lines.

Every selector that returns an object or array must be either version-memoised or documented as
requiring `useShallow` at the call site. Add a comment on each.

### `create-test-store.ts`

```ts
export function createTestStore(overrides?: Partial<TestStoreOptions>) {
  return createEditorStore({
    registry: fakeRegistry(FAKE_BLOCKS),
    generateId: counterIds('node_'),
    now: () => 1_700_000_000_000,
    coalesceWindow: 0,
    ...overrides,
  })
}
```

Every downstream test uses this. Nothing in the store calls `Date.now()` or generates an id without
going through the injected functions — grep for both and confirm zero direct calls.

### Devtools

`devtools` middleware enabled only when `process.env.NODE_ENV === 'development'`. `persist` is **not**
used — say why in a comment (persistence is explicit and debounced; see prompt 50).

## Verify

```bash
pnpm --filter @motion-studio/editor test --coverage
```

Required assertions:
- Dispatch bumps `version` and sets `dirty`
- A zero-patch command changes nothing and records nothing
- `produceWithPatches` output shape: forward and inverse patches present and non-empty for a real
  mutation
- Selection: all four modes, normalization (parent + child → parent only), document ordering after
  `add`, pruning after removing a selected node
- Isolation: enter, exit, and that exiting from the root is a no-op
- `createVersionedSelector`: recomputes when the key changes, returns the identical reference when
  it does not
- `selectFlatLayers` memoises on `version` (assert reference equality across two calls)

```bash
pnpm lint && pnpm typecheck && node scripts/check-deps.mjs
```

`check-deps` must confirm `editor` does **not** depend on `blocks`, `canvas`, or React DOM.

Grep and report:
```bash
rg 'Date\.now|Math\.random|crypto\.randomUUID' packages/editor/src   # expect zero hits
```

## Done when

- [ ] Seven slices with the documented shapes; three are honest stubs
- [ ] Dispatch pipeline exact, including the zero-patch drop
- [ ] Selection algebra complete and tested in all four modes
- [ ] Viewport has no per-frame setter, with the reasoning in a comment
- [ ] `createVersionedSelector` implemented and reference-stability tested
- [ ] `createTestStore` deterministic; zero direct `Date.now`/`random` calls
- [ ] No React, no DOM, no `blocks` dependency
- [ ] Verification clean
