# EDITOR_ENGINE

`packages/editor` is the brain: the document model, the command system, history, selection
algebra, and clipboard. **It contains no React components and no DOM code.** It is a pure
TypeScript library, testable in `node`, and that is deliberate — the hardest logic in the project
should not require a browser to test.

## Document model

```ts
// packages/schema/src/document/document.types.ts
export interface MotionDocument {
  readonly $schema?: string            // the published schema URL, optional
  readonly version: number             // schema version, for migrations
  readonly meta: DocumentMeta
  readonly theme: ThemeConfig
  readonly rootId: NodeId
  readonly nodes: Readonly<Record<NodeId, Node>>
  readonly assets: Readonly<Record<AssetId, Asset>>
}

// The document's own id is `meta.id`, not a top-level field: FILE_FORMAT.md § Structure is the
// authority on the file's shape, and it keeps the id beside the name and the timestamps.

export interface Node {
  readonly id: NodeId
  readonly blockId: BlockId
  readonly name: string                // user-editable; defaults to the block name
  readonly parentId: NodeId | null
  readonly children: readonly NodeId[]
  readonly slot: string                // which parent slot this child occupies
  readonly props: Readonly<Record<string, unknown>>       // validated by the block's schema
  readonly responsive: Readonly<Partial<Record<BreakpointId, Record<string, unknown>>>>
  readonly motion: Readonly<Partial<Record<MotionChannel, MotionSpec>>>
  readonly effects: readonly EffectInstance[]
  readonly locked: boolean
  readonly hidden: boolean
}
```

### Why normalized

A nested tree makes every operation worse:

| Operation | Nested | Normalized |
| --- | --- | --- |
| Read a node by id | O(n) traversal | O(1) |
| Update one prop | Clone the path to root | One entry |
| Undo patch size | Path-shaped, large | `/nodes/id/props/x` |
| Layer virtualization | Flatten every render | Flatten once, memoised |
| Cycle detection | Implicit | Explicit, testable |

`parentId` is redundant with `children` and is kept in sync by the commands. It buys O(1)
ancestor walks, which selection, hit testing, and drop validation all need. Every structural
command asserts the invariant, and there is a `validateDocument()` used in tests and on import.

### Invariants

Checked by `validateDocument(doc, options?): Result<void, DocumentError[]>`. Invariants 6, 7 and 8
are questions about blocks, so they run only when `options.registry` is supplied — which is what lets
the editor assert structure in a `node` test with no block package loaded:

1. `rootId` exists in `nodes`.
2. Root's `parentId` is `null`; every other node's `parentId` exists.
3. `nodes[p].children` contains `c` ⟺ `nodes[c].parentId === p`.
4. No cycles; every node is reachable from root.
5. No orphans — `Object.keys(nodes)` equals the set reachable from root.
6. Every `blockId` exists in the registry.
7. Every node's `props` parse against its block's schema.
8. Every child's `slot` is declared by its parent block.
9. `children` contains no duplicates.

Run on import, after migration, and in a dev-mode assertion after every command. Production
skips the walk.

## Commands

```ts
export interface Command<T = unknown> {
  readonly type: string
  readonly label: string               // user-visible: "Set background"
  readonly payload: T
  readonly coalesceKey?: string
  apply(draft: MotionDocument, ctx: CommandContext): void
}
```

Commands are factories returning this object. Nothing else mutates the document.

```ts
// packages/editor/src/commands/set-prop.ts
export function setProp(payload: SetPropPayload): Command<SetPropPayload> {
  return {
    type: 'setProp',
    label: `Set ${humanize(payload.path)}`,
    payload,
    coalesceKey: `setProp:${payload.nodeId}:${payload.path}`,
    apply(draft) {
      const node = draft.nodes[payload.nodeId]
      if (!node) throw new NodeNotFoundError(payload.nodeId)
      setPath(node.props, payload.path, payload.value)
    },
  }
}
```

### Structural commands and their guards

**`insertNode({ blockId, parentId, index, slot, props? })`**
1. Parent exists and is not locked.
2. The parent block declares `slot`, and the slot accepts `blockId` (`accepts` list or predicate).
3. The slot's `maxChildren` is not exceeded.
4. Props default from `BlockDefinition.defaults`, merged with any override, then validated.
5. New node inserted at `index` (clamped), `parentId` set.
6. Returns the new id via `ctx` so the caller can select it.

**`moveNodes({ ids, parentId, index })`**
1. Reject if `parentId` is any moved node or a descendant of one — the classic tree bug. Checked
   with `isDescendant(doc, candidate, ancestor)`.
2. Reject if the target slot does not accept the block.
3. Remove from old parents first, then insert — index adjustment matters when moving within the
   same parent to a later index, and there is a test for exactly that off-by-one.
4. Multi-move preserves relative document order.

**`removeNodes({ ids })`**
1. Never remove the root.
2. Remove whole subtrees; collect all descendant ids first.
3. Drop from the parent's `children`.
4. Delete every collected node from `nodes` — no orphans.
5. Release assets referenced only by removed nodes.

**`duplicateNodes({ ids })`**
1. Deep-clone each subtree with fresh ids, remapping internal references
   (`layoutId`, slot targets, asset references).
2. Insert after the original.
3. Name becomes `"<name> copy"`, then `"copy 2"`, … using existing sibling names.

**`wrapInContainer({ ids, blockId })`**
1. All ids must share a parent (otherwise reject with a readable error).
2. Insert the container at the first id's index.
3. Move the ids into it, preserving order.
4. One transaction, one undo step.

Full list in [STATE_MANAGEMENT.md](STATE_MANAGEMENT.md) § Command catalogue.

### Transactions

```ts
store.beginTransaction('Paste 5 blocks')
for (const node of subtree) store.dispatch(insertNode(node))
store.endTransaction()
```

Patches accumulate; one history entry is written on `endTransaction`. Nested transactions are
flattened by a depth counter — only the outermost commits. `endTransaction` with zero patches
writes nothing.

## History

```ts
export interface HistoryEntry {
  id: string
  label: string
  patches: Patch[]
  inversePatches: Patch[]
  selectionBefore: readonly NodeId[]
  coalesceKey: string | null
  timestamp: number
}
```

### Undo

```ts
function undo() {
  const entry = past.at(-1)
  if (!entry) return
  document = applyPatches(document, entry.inversePatches)
  past.pop()
  future.push(entry)
  selection = pruneSelection(entry.selectionBefore, document)   // ids may no longer exist
  version += 1
}
```

`pruneSelection` matters: undoing a paste removes nodes that may still be selected. Selecting a
nonexistent node crashes the inspector, so selection is always filtered against the new
document.

### Coalescing

```ts
export function shouldCoalesce(top: HistoryEntry | undefined, incoming: IncomingEntry): boolean {
  if (!top || !incoming.coalesceKey) return false
  if (top.coalesceKey !== incoming.coalesceKey) return false
  return incoming.timestamp - top.timestamp <= COALESCE_WINDOW_MS   // 400
}
```

On coalesce: keep `top.inversePatches` (the oldest state is the one to return to), replace
`top.patches`, update `timestamp`. The window means a pause mid-drag starts a new entry, which
is what users expect.

Tested cases:
- 200 scrub events on one property → 1 entry
- Two properties interleaved → 2 entries
- Same property after a 500 ms pause → 2 entries
- Undo after coalescing restores the value from before the whole drag

### Limits

`past` is capped at 200 entries; the oldest is dropped. Safe because entries are independent
inverse patch sets, not a snapshot chain. `future` clears on any new command.

## Selection

```ts
export interface SelectionState {
  ids: readonly NodeId[]        // always in document order
  anchorId: NodeId | null
  editingId: NodeId | null
  hoverId: NodeId | null
  isolationId: NodeId | null
}
```

### Modes

| Mode | Behaviour |
| --- | --- |
| `replace` | `ids = [id]`, anchor = id |
| `add` | Union, then sort by document order |
| `toggle` | Symmetric difference |
| `range` | All siblings between `anchorId` and `id` inclusive |

Sorting by document order is required so that "align left" and "distribute" behave predictably,
and so that copy/paste preserves visual order. `documentOrderIndex(doc, id)` is memoised on
`version`.

### Normalization

Selecting a node and its descendant is ambiguous — moving both would move the child twice.
`normalizeSelection` drops any node that has an ancestor in the set. This runs on every
selection change and is the reason multi-drag is not full of edge cases.

### Isolation

`enterNode(id)` sets `isolationId`. While isolated, hit testing prefers descendants of that
node, so clicking inside a container selects the child rather than the container. `Esc` walks
back up one level. This is Figma's group-entering behaviour and users expect it.

### Keyboard navigation

| Key | Action |
| --- | --- |
| `Tab` | Next sibling; wraps |
| `Shift+Tab` | Previous sibling |
| `Enter` | Enter (isolate + select first child) |
| `Esc` | Exit isolation, or clear selection |
| `↑ ↓ ← →` | Nudge 1 px (`Shift` = 10) |
| `Cmd+A` | All siblings of the current isolation level |

## Clipboard

```ts
export interface SerializedSubtree {
  version: number
  rootIds: readonly NodeId[]
  nodes: Record<NodeId, Node>
  assets: Record<AssetId, Asset>
  theme?: Pick<ThemeConfig, 'palette'>    // for cross-document paste fidelity
}
```

- `copy` serialises the normalized selection with all descendants and referenced assets.
- Writes to the system clipboard as `text/plain` JSON prefixed with a
  `/* motion-studio:v1 */` marker, so paste can recognise its own payload and paste into a
  code editor still yields readable JSON.
- `paste` prefers the system clipboard, falls back to the store, remaps every id, and inserts
  into: the current selection's parent at the selection index + 1, or the isolation container, or
  root. One transaction.
- `pasteStyle` copies only the style-category props (defined by each block's schema metadata),
  not content or structure.
- Paste of an unknown `blockId` is rejected per node with a readable report — a partial paste is
  better than a failed one, and the report says what was dropped.

## Public API

```ts
// packages/editor/src/index.ts
export { createEditorStore, useEditorStore } from './store'
export type { EditorState, EditorStore } from './store'
export * as commands from './commands'
export * as selectors from './selectors'
export { validateDocument, createEmptyDocument } from './document'
export type { Command, CommandContext, HistoryEntry } from './types'
```

`packages/editor` depends on: `schema`, `utils`, `immer`, `zustand`. **Not** on React DOM, not on
`blocks`, not on `canvas`. It talks to blocks only through the `BlockRegistry` interface passed
in `CommandContext`.

## Testing

```ts
const registry = createFakeRegistry({
  section: { slots: [{ name: 'children', accepts: '*' }] },
  text: { slots: [] },
})

const store = createEditorStore({ registry, generateId: counterIds(), now: () => 0 })
```

Deterministic ids and a frozen clock make every assertion exact. Required coverage:

- Every command: happy path, each guard, and the resulting patch shape.
- History: undo/redo/coalesce/transaction/cap/selection pruning.
- Selection: all four modes, normalization, document ordering, isolation.
- Clipboard: round-trip, id remapping, cross-document paste, unknown-block rejection.
- Invariants: `validateDocument` catches each of the nine violations.
- Property-based: apply N random valid commands, assert invariants hold; then undo all, assert
  the document deep-equals the original. This one test has caught more bugs than the rest
  combined.

Coverage floor for this package: **90 %**.
