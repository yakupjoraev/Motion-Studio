# 15 — History

**Milestone** M2 · **Depends on** 14 · **Commit** `feat(editor): add patch-based history with coalescing`

## Read first

- `docs/EDITOR_ENGINE.md` — § History (all of it)
- `docs/STATE_MANAGEMENT.md` — § history
- `docs/TESTING.md` — § Property-based tests

## Goal

Undo/redo that behaves the way users expect: a 400-event slider drag is **one** undo step, a paste of
five blocks is **one** undo step, and undoing a deletion restores the selection.

The mechanism is Immer patches, not snapshots. Get this right and the memory cost of 200 history
entries is trivial.

## Deliverables

```
packages/editor/src/history/
├── history.types.ts        HistoryEntry, IncomingEntry
├── record-history.ts       the entry-writing path called by dispatch
├── coalesce.ts             shouldCoalesce + mergeEntries
├── transaction.ts          beginTransaction / endTransaction with depth counting
├── undo-redo.ts            undo, redo, canUndo, canRedo, clearHistory
├── prune-selection.ts
└── *.test.ts
```

Then replace the stub `history-slice.ts` from prompt 13 with the real implementation.

## Constraints

### Coalescing

```ts
const COALESCE_WINDOW_MS = 400

export function shouldCoalesce(top: HistoryEntry | undefined, incoming: IncomingEntry): boolean
```

On coalesce: keep `top.inversePatches` (the state to return to is the *oldest* one), replace
`top.patches` with the new forward patches, refresh `timestamp`. Getting the inverse-patch side
backwards produces an undo that only reverts the last frame of the drag — a bug that feels like
"undo is broken" and is hard to diagnose. Test it explicitly:

```ts
it('undo after a coalesced drag restores the pre-drag value', () => {
  const store = createTestStore({ coalesceWindow: 400 })
  // opacity starts at 1
  for (let v = 99; v >= 40; v--) store.dispatch(setProp({ nodeId, path: 'opacity', value: v / 100 }))
  expect(store.history.past).toHaveLength(1)
  store.undo()
  expect(getProp(store, nodeId, 'opacity')).toBe(1)      // not 0.99
})
```

### Transactions

Depth-counted. Nested transactions flatten — only the outermost commits. `endTransaction` with zero
accumulated patches writes nothing. A transaction left open on an error must not swallow subsequent
commands into it forever, so `endTransaction` is called in a `finally` by every caller, and there is
a dev-mode warning if a transaction stays open across a macrotask.

### Undo

```ts
document = applyPatches(document, entry.inversePatches)
selection = pruneSelection(entry.selectionBefore, document)
version += 1
```

`pruneSelection` is required: undoing a paste removes nodes that may still be selected, and a
selected nonexistent node crashes the inspector. Test it.

### Cap

`past` capped at 200; drop the oldest. `future` clears on any new command. Both tested.

### The property test

The highest-value test in the project:

```ts
it('undoing every command restores the original document', () => {
  fc.assert(fc.property(fc.array(arbitraryValidCommand(), { minLength: 1, maxLength: 40 }), (commands) => {
    const store = createTestStore({ coalesceWindow: 0 })   // coalescing off: N commands = N entries
    const before = structuredClone(store.getState().document)

    for (const c of commands) store.getState().dispatch(c)
    while (store.getState().canUndo) store.getState().undo()

    expect(store.getState().document).toEqual(before)
  }))
})
```

Note the `coalesceWindow: 0` — with coalescing on, N commands intentionally produce fewer than N
entries, so the invariant is different. Write a comment saying so; someone will otherwise "fix" the
test by turning coalescing on.

Add the mirror test: undo everything, then redo everything, and assert the document equals the
post-command state.

## Verify

```bash
pnpm --filter @motion-studio/editor test --coverage
```

Required assertions:
- 200 same-key events within the window → 1 entry
- Two interleaved keys → 2 entries
- Same key after a 500 ms gap → 2 entries
- Undo after coalescing restores the pre-drag value
- Transaction: 5 commands → 1 entry; nested → 1 entry; empty → 0 entries
- Undo restores `selectionBefore`, pruned against the new document
- Cap at 200; oldest dropped
- New command clears `future`
- Property test: undo-all restores original, over 40-command sequences
- Property test: redo-all restores the post-command state

Coverage for `packages/editor` still **≥ 90 % / ≥ 85 %**.

Also measure and report: memory of 200 history entries for a 60-node document. Rough is fine — the
number should be in kilobytes, not megabytes. If it is megabytes, something is snapshotting.

## Done when

- [ ] Coalescing correct, including the inverse-patch direction
- [ ] Transactions depth-counted, flattening, empty-safe
- [ ] `pruneSelection` on undo
- [ ] Cap and future-clearing tested
- [ ] Both property tests pass
- [ ] History memory measured and reported in kilobytes
- [ ] The `coalesceWindow: 0` reasoning is commented in the test
- [ ] Coverage floors met
