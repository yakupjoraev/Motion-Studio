# 14 — Command catalogue

**Milestone** M2 · **Depends on** 13 · **Commit** `feat(editor): add command catalogue with guards`

## Read first

- `docs/EDITOR_ENGINE.md` — § Commands, § Structural commands and their guards
- `docs/STATE_MANAGEMENT.md` — § Command catalogue (the table)
- `docs/RESPONSIVE_ENGINE.md` — § Editing semantics

## Goal

Every document mutation, as a tested command. This is the prompt where the editor becomes capable of
doing things, and it is the one where a missing guard becomes a corrupted document three months
later — so the guards get as much attention as the happy paths.

## Deliverables

One file per command in `packages/editor/src/commands/`, each with its test beside it:

```
insert-node.ts            insert-block.ts         remove-nodes.ts
move-nodes.ts             reorder-node.ts         duplicate-nodes.ts
set-prop.ts               set-responsive-prop.ts  clear-responsive-prop.ts
set-motion.ts             clear-motion.ts         set-effect.ts
add-effect.ts             remove-effect.ts        reorder-effect.ts
rename-node.ts            set-visibility.ts       set-locked.ts
wrap-in-container.ts      unwrap.ts               align-nodes.ts
distribute-nodes.ts       set-theme-token.ts      apply-theme-preset.ts
set-document-meta.ts      index.ts                (barrel)
```

Plus `packages/editor/src/commands/guards.ts` — shared validation helpers used by several commands.

## Constraints

### Every command

- A factory returning `Command<Payload>`, with a `label` that reads correctly in an undo tooltip
  ("Set background", not "setProp").
- `coalesceKey` exactly as in the table — present for continuous edits, absent for structural ones.
- `apply(draft, ctx)` is a pure mutation. No side effects, no store access, no clock, no id
  generation except through `ctx.generateId`.
- Throws a typed error from `packages/utils/errors` on an invalid operation. The caller decides
  whether to surface it; the command does not swallow.

### The guards that matter most

**`moveNodes`** — rejecting a move into the node's own descendant is the classic tree-corruption
bug. Use `isDescendant` from `schema/traverse`. Test: move A into A, move A into a child of A, move
A into a grandchild of A. All three rejected.

**`moveNodes` index adjustment** — moving a node within the same parent to a later index is off by
one if you insert before removing. Remove first, then insert. Write the test that catches it:
`[a,b,c,d]`, move `a` to index 2, expect `[b,c,a,d]` — not `[b,a,c,d]`.

**`insertNode`** — the slot must exist on the parent block and must accept the child's `blockId`;
`maxChildren` must not be exceeded; parent must not be locked. Four separate tests.

**`removeNodes`** — collect all descendants first, then delete. Assert zero orphans afterwards with
`validateDocument`. Never remove the root.

**`duplicateNodes`** — fresh ids for the whole subtree, with internal references remapped
(`layoutId`, asset refs, slot targets). A duplicate whose children still point at the original's ids
is a subtle disaster; test that no id in the copy appears in the original.

**`wrapInContainer`** — all ids must share a parent. Reject with a readable error otherwise. One
transaction.

**`setResponsiveProp`** — writes to `responsive[bp][path]`. `clearResponsiveProp` **deletes the
key**, not sets it to the base value. A stale key emits a dead Tailwind class on export, so this
distinction has a test.

**`setProp`** — validates the new props against the block's schema via `ctx.registry`. An invalid
value throws rather than corrupting the node. Test with a value outside a schema's `min`.

**`alignNodes` / `distributeNodes`** — operate on the selection's bounding box, one transaction, and
are no-ops (zero patches) when the nodes are already aligned.

### Determinism

Every test uses `createTestStore()`. Assert exact patch shapes where the shape matters:

```ts
it('produces a minimal patch for a prop change', () => {
  const store = createTestStore()
  const patches = capturePatches(store, setProp({ nodeId, path: 'title', value: 'x' }))
  expect(patches).toEqual([{ op: 'replace', path: ['nodes', nodeId, 'props', 'title'], value: 'x' }])
})
```

A minimal patch matters — it is the undo unit and it is what keeps 200 history entries cheap.

## Verify

```bash
pnpm --filter @motion-studio/editor test --coverage
```

Every command needs: one happy-path test, one test per guard, and one patch-shape assertion where
relevant. Then the property test:

```ts
it('invariants hold after any sequence of valid commands', () => {
  fc.assert(fc.property(fc.array(arbitraryCommand(), { maxLength: 60 }), (commands) => {
    const store = createTestStore()
    for (const c of commands) { try { store.getState().dispatch(c) } catch { /* rejected is fine */ } }
    expect(validateDocument(store.getState().document)).toEqual({ ok: true })
  }))
})
```

`arbitraryCommand()` generates commands with both valid and invalid payloads. A rejected command is
an acceptable outcome; a corrupted document is not.

Coverage must be **≥ 90 % lines, ≥ 85 % branches** for `packages/editor`.

## Done when

- [ ] All 25 commands implemented with the guards from `EDITOR_ENGINE.md`
- [ ] Move-into-descendant rejected in all three shapes
- [ ] Same-parent reorder index off-by-one test passes
- [ ] `removeNodes` leaves zero orphans, verified with `validateDocument`
- [ ] `duplicateNodes` remaps all internal references, tested
- [ ] `clearResponsiveProp` deletes the key, tested
- [ ] Align/distribute produce zero patches when already aligned
- [ ] Property test passes over 60-command sequences
- [ ] Coverage floors met
