---
group: Engineering foundations
order: 6
summary: Store shape, slices, selectors, commands, transient state
---

# STATE_MANAGEMENT

## Principles

1. **One store.** `useEditorStore`. Multiple stores mean synchronisation bugs.
2. **Normalized document.** A flat `Record<NodeId, Node>` with explicit `children` arrays.
   Nested trees make every update a deep clone and every selector a traversal.
3. **All mutation through commands.** A component never calls `set()`. It dispatches.
4. **Patches are the history unit.** Immer's `produceWithPatches` gives forward and inverse
   patches; those *are* the undo stack.
5. **High-frequency values never touch React.** Pan, zoom, drag delta, in-flight scrub → refs,
   CSS variables, `rAF`. One command on release.
6. **Selectors, always.** A component subscribes to the narrowest slice it needs.

## Store shape

```ts
// packages/editor/src/store/store.types.ts
export type EditorState = DocumentSlice &
  SelectionSlice &
  ViewportSlice &
  HistorySlice &
  ClipboardSlice &
  UiSlice &
  ThemeSlice
```

The slices merge **flat**, so `state.document` is the document and `state.dispatch` is a method on
the store root. The keys below (`document`, `selection`, `viewport`, …) are fields *inside* their
slices, not namespaces holding them: a component subscribing with `(s) => s.selection.ids` reads the
selection slice's own state, and `(s) => s.dispatch` reads the document slice's method.

Each slice is created by a factory and merged in `createEditorStore`:

```ts
export const useEditorStore = create<EditorStore>()(
  subscribeWithSelector(
    devtools((...a) => ({
      ...createDocumentSlice(...a),
      ...createSelectionSlice(...a),
      ...createViewportSlice(...a),
      ...createHistorySlice(...a),
      ...createClipboardSlice(...a),
      ...createUiSlice(...a),
      ...createThemeSlice(...a),
    }), { name: 'motion-studio', enabled: process.env.NODE_ENV === 'development' }),
  ),
)
```

`devtools` is dev-only; `persist` is **not** used — persistence is explicit and debounced to
IndexedDB, because writing the whole document to storage on every keystroke is a jank source.

### document

```ts
interface DocumentSlice {
  document: MotionDocument          // see FILE_FORMAT.md
  version: number                   // bumped on every committed mutation
  dirty: boolean
  dispatch(command: Command): void
  dispatchBatch(commands: Command[], label: string): void
  replaceDocument(next: MotionDocument): void
}
```

`replaceDocument` is the load path — New, Open, Import, a repaired file. It clears history rather
than recording a whole-document entry, which is why it takes no label: ADR-054 has the measurement.

`version` is a monotonic integer. Memoised derivations (resolved tree, layer list, codegen IR)
key off it, so a cache is one integer comparison rather than a deep equality check.

### selection

```ts
interface SelectionSlice {
  selection: {
    ids: readonly NodeId[]          // ordered by document order
    anchorId: NodeId | null         // for shift-range
    editingId: NodeId | null        // inline text editing
    hoverId: NodeId | null          // transient, but cheap enough for React
    isolationId: NodeId | null      // "entered" container
  }
  select(ids: NodeId[], mode?: 'replace' | 'add' | 'toggle' | 'range'): void
  selectAll(): void
  clearSelection(): void
  enterNode(id: NodeId): void
  exitNode(): void
  setHover(id: NodeId | null): void
  setEditing(id: NodeId | null): void
}
```

`hoverId` is written by hit testing and `editingId` by the inline text editor, so both need a
setter; a field of this state with no way to write it would be permanently `null`.

Selection is **not** part of the document and **not** undoable. Undo restores structure, not
what you happened to have clicked. Exception: a command may set selection as a side effect
(inserting a node selects it), and undoing that command restores the previous selection — stored
alongside the history entry, not in the patches.

### viewport

```ts
interface ViewportSlice {
  viewport: {
    zoom: number                    // 0.1 – 4
    pan: { x: number; y: number }   // committed values only
    breakpoint: BreakpointId
    grid: { enabled: boolean; size: number }
    guides: { enabled: boolean; snapThreshold: number }
    rulers: boolean
    motionPaused: boolean
    previewReducedMotion: boolean
    multiFrame: boolean             // base / md / xl side by side — ADR-162
  }
  // committed setters — call on gesture end, not during
  setZoom(zoom: number, origin?: Point): void
  setPan(pan: Point): void
  setBreakpoint(id: BreakpointId): void
  toggleGrid(): void
  toggleMultiFrame(): void
}
```

During a pan or pinch, the canvas mutates a ref and writes `--ms-viewport-x/y/zoom`. React never
renders mid-gesture. On `pointerup`, `setPan`/`setZoom` commits. Viewport is not undoable.

### history

```ts
interface HistoryEntry {
  id: string
  label: string                     // shown in the undo tooltip: "Set background"
  patches: Patch[]
  inversePatches: Patch[]
  selectionBefore: readonly NodeId[]
  coalesceKey: string | null        // e.g. "set-prop:node_7:background"
  timestamp: number
}

interface HistorySlice {
  history: {
    past: HistoryEntry[]            // capped at 200
    future: HistoryEntry[]
  }
  // The open transaction, or null. In the store rather than in a closure so a test and the devtools
  // timeline can both see a transaction that was left open — which is the failure it exists to catch.
  transaction: OpenTransaction | null
  undo(): void
  redo(): void
  canUndo: boolean
  canRedo: boolean
  clearHistory(): void
  beginTransaction(label: string): void
  endTransaction(): void
}
```

**Coalescing.** If the incoming command's `coalesceKey` matches the top of `past` and the two
are within 400 ms, merge: keep the older entry's `inversePatches`, replace its `patches` with
the new ones, refresh the timestamp. A 400-step slider drag becomes one undo.

**Transactions.** For multi-command operations that must undo as one (paste of five nodes,
"apply theme to all", drag that both reparents and repositions). `beginTransaction` collects
patches until `endTransaction` writes a single entry.

**Cap.** 200 entries. Patches are small; 200 is generous and bounds memory. Dropping the oldest
entry is safe because entries are independent inverse patches, not a snapshot chain.

### clipboard

```ts
interface ClipboardSlice {
  clipboard: {
    nodes: SerializedSubtree | null
    style: StyleClipboard | null    // for "paste style"
  }
  copy(ids: NodeId[]): Promise<void>
  cut(ids: NodeId[]): Promise<void>
  paste(target?: PasteTarget): Promise<Result<PasteReport, MotionStudioError>>
  pasteInPlace(): Promise<Result<PasteReport, MotionStudioError>>
  copyStyle(id: NodeId): void
  pasteStyle(ids: NodeId[]): void
}
```

Copy writes both to the store and to the system clipboard, as `text/plain` JSON prefixed with the
`/* motion-studio:v1 */` marker of [EDITOR_ENGINE.md](EDITOR_ENGINE.md) § Clipboard — that document
owns the payload format. Paste reads the system clipboard first and falls back to the store.

The three async signatures are forced by `navigator.clipboard.readText`, and the `Result` is what
carries the partial-paste report — ADR-067. `copyStyle` and `pasteStyle` are synchronous because the
style payload never leaves the store: no document defines a cross-tab format for it.

### ui

```ts
interface UiSlice {
  ui: {
    leftPanel: { tab: LeftTab; width: number; collapsed: boolean }
    rightPanel: { width: number; collapsed: boolean; openSections: Record<string, boolean> }
    commandPaletteOpen: boolean
    exportDialogOpen: boolean
    activeDialog: DialogId | null
    fpsVisible: boolean
  }
  // ...setters
}
```

Persisted to `localStorage`, debounced 500 ms. Not undoable.

### theme

```ts
interface ThemeSlice {
  setThemeToken(path: string, value: unknown): void
  setColorMode(mode: ColorModePreference): void
  applyThemePreset(id: PresetId): void
}
```

Theme *is* part of the document (it exports with it) so theme edits go through commands and are
undoable, and the config itself lives at `document.theme`. The slice therefore holds **no state of
its own** — a second copy beside the document would be derived data in the store, which § Anti-patterns
bans, and the two would drift the first time a patch was applied without going through a setter.
Reads go through `selectTheme`.

`value` is `unknown` rather than `string` because the config holds numbers and enums as well
(`radiusScale: 1.5`, `colorMode: 'system'`); the command validates the whole config against
`themeConfigSchema` after the write, so an unwritable path or a wrong type throws instead of
producing a config the theme engine cannot resolve.

The CSS-variable half of "instant feedback" belongs to the caller, not to this slice: `packages/editor`
has no DOM. The theme builder writes the variables with `applyThemePartial` and dispatches the
coalesced command — THEME_ENGINE.md § Theme builder UI.

## Commands

A command is data plus a pure mutation. That is the whole abstraction.

```ts
// packages/editor/src/commands/command.types.ts
export interface Command<T = unknown> {
  readonly type: string
  readonly label: string
  readonly payload: T
  readonly coalesceKey?: string
  apply(draft: MotionDocument, ctx: CommandContext): void
}

export interface CommandContext {
  registry: BlockRegistry
  generateId: () => NodeId
  now: () => number
}
```

`CommandContext` is injected, which is why commands are deterministic in tests: pass a counter
as `generateId` and a fixed `now`.

### Command catalogue

| Command | Coalesce | Notes |
| --- | --- | --- |
| `insertNode` | no | One node. Validates parent accepts child via registry `slots` |
| `insertBlock` | no | The block **and** its slots' `defaultChildren`, as one subtree — ADR-062 |
| `removeNodes` | no | Removes subtrees; repairs `children` arrays; releases orphaned assets |
| `moveNodes` | no | Reparent + reindex; rejects moving a node into its own descendant |
| `reorderNode` | no | Sibling index change |
| `duplicateNodes` | no | Deep clone with fresh ids; assets are shared, not copied — ADR-060 |
| `setProp` | `set-prop:{id}:{path}` | Base-breakpoint prop write |
| `setResponsiveProp` | `set-rprop:{id}:{bp}:{path}` | Breakpoint override; top-level keys only — ADR-058 |
| `clearResponsiveProp` | no | Deletes the key, never writes the base value back |
| `setMotion` | `set-motion:{id}` | Assign or edit a preset; the block must declare the channel |
| `clearMotion` | no | |
| `setEffect` | `set-effect:{id}:{instanceId}` | Tunes one instance in the stack — ADR-059 |
| `addEffect` | no | Appends an instance; the stack holds 8 |
| `removeEffect` | no | |
| `reorderEffect` | no | Stack index change; paint order |
| `renameNode` | `rename:{id}` | |
| `setVisibility` | no | |
| `setLocked` | no | |
| `wrapInContainer` | no | Creates a parent, moves selection into it |
| `unwrap` | no | Hoists children, deletes the wrapper |
| `setThemeToken` | `theme:{path}` | |
| `applyThemePreset` | no | |
| `setDocumentMeta` | `meta:{path}` | Name and canvas; the id and the timestamps are not editable |
| `pasteNodes` | no | Transaction |
| `alignNodes` | no | Writes `align`/`justify` on the shared parent — ADR-057 |
| `distributeNodes` | no | Writes `justify: 'between'` on the shared parent — ADR-057 |

Every command lives in `packages/editor/src/commands/<name>.ts` with its test beside it.
A command with a branch and no test does not merge.

### Dispatch

```ts
function dispatch(command: Command): void {
  const state = get()
  const [next, patches, inversePatches] = produceWithPatches(
    state.document,
    (draft) => command.apply(draft, commandContext),
  )

  if (patches.length === 0) return              // no-op commands do not pollute history

  set((s) => {
    s.document = next
    s.version += 1
    s.dirty = true
  })

  recordHistory({
    label: command.label,
    patches,
    inversePatches,
    coalesceKey: command.coalesceKey ?? null,
    selectionBefore: state.selection.ids,
  })
}
```

A command producing zero patches is silently dropped. This matters: clicking the already-active
alignment button should not create an undo step.

## Selectors

All in `packages/editor/src/selectors/`. Components import selectors; they never write inline
traversals.

```ts
// stable, no allocation
export const selectSelectionIds = (s: EditorState) => s.selection.ids
export const selectNode = (id: NodeId) => (s: EditorState) => s.document.nodes[id]
export const selectChildren = (id: NodeId) => (s: EditorState) => s.document.nodes[id]?.children

// derived — recomputed when the document object changes, which is once per committed mutation
export const selectFlatLayers = createVersionedSelector(
  (s) => [s.document],
  (s) => buildLayerRows(s.document),
)

export const selectResolvedNode = (id: NodeId) =>
  createVersionedSelector(
    (s) => [s.document, s.viewport.breakpoint],
    (s) => resolveNode(s.document.nodes[id], s.viewport.breakpoint, s.document.theme),
  )
```

`createVersionedSelector` is a small helper: a cache of size one, whose key is a short list of
values compared with `Object.is`. No deep equality, no proxy tracking.

The key is that list rather than `version` alone because the cache lives in the module, not in the
store: two stores that happen to share a version — which is every pair of test stores — would
otherwise read each other's rows. The document reference changes on exactly the same commits as
`version` and cannot collide, so it is the cheaper of the two identities as well as the safer one —
ADR-055.

### Component subscription rules

```ts
// ✗ re-renders on every store change
const store = useEditorStore()

// ✗ new array every render
const ids = useEditorStore((s) => s.selection.ids.filter(Boolean))

// ✓ reference-stable slice
const ids = useEditorStore(selectSelectionIds)

// ✓ multiple values, shallow-compared
const { zoom, pan } = useEditorStore(
  useShallow((s) => ({ zoom: s.viewport.zoom, pan: s.viewport.pan })),
)

// ✓ per-node subscription — the canvas pattern
const node = useEditorStore(useCallback((s) => s.document.nodes[id], [id]))
```

A selector must not allocate. If it returns an object or array, it needs `useShallow` or
memoisation, or every store change re-renders the component.

## Transient state

The class of values that must never enter the store during a gesture:

| Value | Where it lives during the gesture | Commit |
| --- | --- | --- |
| Pan offset | `viewportRef.current` + `--ms-vp-x/y` | `setPan` on pointerup |
| Zoom | `viewportRef.current` + `--ms-vp-zoom` | `setZoom` on gesture end |
| Drag ghost position | `transform` on a portal element via `rAF` | `moveNodes` on drop |
| Scrub field value | local `useState` in the field + CSS var on the target | coalesced `setProp` |
| Colour picker drag | local state + CSS var | coalesced `setProp` |
| Marquee rect | ref + a single absolutely-positioned div | `select` on pointerup |
| Resize handle delta | ref + CSS var | `setProp` on pointerup |

Pattern:

```ts
export function useTransientNumber(nodeId: NodeId, path: string, cssVar: string) {
  const commit = useEditorStore((s) => s.dispatch)
  const target = useRef<HTMLElement | null>(null)

  const onDrag = useCallback((value: number) => {
    target.current?.style.setProperty(cssVar, String(value))   // no React
  }, [cssVar])

  const onCommit = useCallback((value: number) => {
    commit(setProp({ nodeId, path, value }))                    // one history entry
  }, [commit, nodeId, path])

  return { target, onDrag, onCommit }
}
```

The test for this is mechanical: attach a render counter to the canvas root, drag a slider 200
px, assert the counter incremented **once**.

## Persistence

```
change → mark dirty → debounce 2000 ms → serialize → IndexedDB.put
                                       ↘ visibilitychange: flush immediately
                                       ↘ beforeunload: flush synchronously
```

- IndexedDB (`idb-keyval`-style thin wrapper, hand-rolled, ~40 lines) stores documents by id.
- `localStorage` stores the document index, last-open id, and UI preferences.
- `beforeunload` cannot await, so its flush writes one serialised document to a `localStorage` lane
  and the next load migrates it into IndexedDB, losing to a newer record — ADR-285.
- Serialization is `documentSchema.parse` on the way in, plain `JSON.stringify` on the way out.
- A failed write shows a **persistent** toast with a "download document" action. Never silent.

## Anti-patterns

| Do not | Instead |
| --- | --- |
| `useEditorStore()` with no selector | Subscribe to the narrowest slice |
| `set()` from a component | Dispatch a command |
| Storing derived data in the store | A versioned selector |
| Nested document tree | Normalized map + `children` |
| Full-document snapshots for undo | Immer patches |
| Putting pan/zoom in React state during a gesture | Ref + CSS variable + `rAF` |
| `JSON.parse(JSON.stringify(node))` to clone | `structuredClone`, or a typed clone in `utils` |
| Selection inside the document | A separate, non-undoable slice |
| A second Zustand store "just for X" | A slice |
