# ARCHITECTURE

## Shape of the thing

Motion Studio is a **pure client application with a static shell**. There is no server state, no
database, no auth. Every interesting problem is a client architecture problem: a document model,
a command system, a render pipeline, and a code generator.

The monorepo exists for one reason: **enforced boundaries**. A package cannot import what it
does not declare, so the dependency graph stays a DAG and the editor cannot quietly couple
itself to a block implementation.

## Monorepo topology

```
motion-studio/
├── apps/
│   ├── web/                    Next.js 15 — the only deployable
│   └── storybook/              Storybook host (consumes ui + blocks)
├── packages/
│   ├── config/                 tsconfig / biome / tailwind / vitest presets
│   ├── utils/                  pure helpers, zero deps
│   ├── tokens/                 design tokens → TS objects + CSS variables
│   ├── icons/                  icon components
│   ├── schema/                 zod schemas, document model types, .motion format
│   ├── theme/                  runtime theme engine
│   ├── motion/                 curves, springs, presets, motion primitives
│   ├── hooks/                  shared React hooks
│   ├── ui/                     studio chrome primitives (shadcn-derived)
│   ├── blocks/                 the component registry
│   ├── editor/                 document store, commands, history, selection
│   ├── canvas/                 viewport, zoom/pan, snap, guides, hit testing
│   ├── dnd/                    drag & drop layer over dnd-kit
│   └── codegen/                IR + printers + formatter
├── e2e/                        Playwright project
├── docs/                       this
├── prompts/                    build plan
└── .github/workflows/          CI
```

## Dependency graph

Arrows point from consumer to dependency. This graph is a **DAG and must stay one** — CI runs a
cycle check.

```
                            ┌──────────┐
                            │  config  │   (dev-only, everything extends)
                            └──────────┘

  ┌───────┐   ┌────────┐   ┌───────┐
  │ utils │   │ tokens │   │ icons │        leaf packages, no internal deps
  └───┬───┘   └───┬────┘   └───┬───┘
      │           │            │
      ├───────────┼────────────┤
      │           │            │
  ┌───▼───────────▼──┐    ┌────▼────┐
  │     schema       │    │  theme  │
  └───┬──────────────┘    └────┬────┘
      │                        │
      │      ┌─────────────────┤
      │      │                 │
  ┌───▼──────▼───┐        ┌────▼──────┐
  │    motion    │        │   hooks   │
  └───┬──────────┘        └────┬──────┘
      │                        │
      │   ┌────────────────────┤
      │   │                    │
  ┌───▼───▼────┐          ┌────▼────┐
  │     ui     │          │ editor  │──── depends on: schema, utils, hooks
  └───┬────────┘          └────┬────┘
      │                        │
  ┌───▼────────┐    ┌──────────▼──┐    ┌─────────┐
  │   blocks   │    │   canvas    │    │   dnd   │
  └───┬────────┘    └──────┬──────┘    └────┬────┘
      │                    │                │
      │            ┌───────▼────────┐       │
      │            │    codegen     │       │
      │            └───────┬────────┘       │
      └────────────────────┼────────────────┘
                           │
                     ┌─────▼──────┐
                     │  apps/web  │
                     └────────────┘
```

### Rules

1. **`editor` must never import `blocks`.** The editor manipulates `Node` records described by
   `schema`. It learns about block capabilities through a registry *interface*, injected by
   `apps/web` at startup. This is the single most important boundary in the codebase — it is
   what makes the editor testable in `node` with zero React.

2. **`blocks` must never import `editor`.** A block is a pure presentational component of its
   props. It does not know it is in an editor. That is what makes export possible: the same
   component renders in the canvas and in a user's app.

3. **`codegen` depends on `schema` only.** It walks a document and consults the registry
   interface for each node's codegen descriptor. It never imports a block's React code.

4. **`canvas` does not know what it renders.** It receives a render function. It owns viewport
   maths, hit testing, overlays, snapping — geometry, not content.

5. **Nothing imports `apps/*`.**

6. **No deep imports.** `@motion-studio/ui` yes; `@motion-studio/ui/src/button/button` no.
   Enforced by `exports` maps and a Biome rule.

7. **`dnd` depends on `editor`.** A drop ends in a command, and the guards that decide whether a
   slot accepts a block live with the commands that enforce them — so the drag layer uses `editor`'s
   predicates rather than its own copies of them (ADR-131). The arrow runs one way and the graph stays
   a DAG.

8. **`dnd` must not import `canvas`.** The drag layer needs the rect cache and the zoom, and both
   arrive as props on `DndProvider`. Keeping the arrow out means the drag layer is testable with a
   three-entry fake cache, and it is what lets the same layer serve the layers tree, whose rows are
   not canvas nodes at all. `check:deps` enforces it.

## The registry seam

The seam between `editor`/`canvas`/`codegen` and `blocks` is a single interface in `schema`:

```ts
// packages/schema/src/registry/registry.types.ts
export interface BlockDefinition<P = UnknownProps> {
  readonly id: BlockId
  readonly name: string
  readonly category: BlockCategory
  readonly propsSchema: ZodType<P>
  readonly defaults: P
  readonly slots: readonly SlotDefinition[]
  readonly capabilities: BlockCapabilities
  readonly codegen: CodegenDescriptor
}

export interface BlockRegistry {
  get(id: BlockId): BlockDefinition | undefined
  require(id: BlockId): BlockDefinition
  list(): readonly BlockDefinition[]
  byCategory(category: BlockCategory): readonly BlockDefinition[]
}
```

`packages/blocks` additionally exports a `RenderRegistry` mapping `BlockId → React component`.
The canvas takes that map as a prop. `apps/web` is the only place both halves meet.

Consequence: `editor`, `canvas` and `codegen` are all unit-testable with a three-entry fake
registry and no React tree.

## Data flow

```
User gesture (pointer / key)
        │
        ▼
Interaction layer  ── canvas overlays, dnd sensors, inspector controls
        │
        │  builds a Command
        ▼
useEditorStore.dispatch(command)
        │
        ├─ Immer produceWithPatches(document, command.apply)
        │        │
        │        ├─ next document  ──► store state
        │        └─ patches + inverse  ──► history slice (coalesced)
        │
        ▼
Selector subscriptions fire
        │
        ├─ Canvas: node subtree re-renders (memoised per node id)
        ├─ Layers: affected rows re-render (virtualized)
        └─ Inspector: control values re-read
```

**Transient gestures do not enter this pipeline.** A pan, a zoom, or an in-progress scrub writes
to a ref and a CSS custom property, drives an `rAF` loop, and dispatches a single command on
release. See [STATE_MANAGEMENT.md](STATE_MANAGEMENT.md) § Transient state.

## Render pipeline (canvas)

```
document.nodes  (normalized map)
        │
        ▼
resolveTree(rootId)               O(n) walk, memoised per document version
        │
        ▼
for each node:
  ┌────────────────────────────────────────────────────────┐
  │ resolveResponsiveProps(node, activeBreakpoint)          │  RESPONSIVE_ENGINE
  │ resolveThemeTokens(props, theme)                        │  THEME_ENGINE
  │ resolveMotion(node.motion, motionScale, reducedMotion)  │  ANIMATION_SYSTEM
  └────────────────────────────────────────────────────────┘
        │
        ▼
<NodeRenderer id> ── memo(props by reference)
        │
        ├─ RenderRegistry[node.blockId]  → the real block component
        └─ <SelectionOverlay> siblings (position: absolute, not children)
```

Overlays are **siblings, not wrappers**. A selection outline never becomes a parent of the node
it outlines, because that would break the block's own layout and change what export emits.

## Export pipeline

```
MotionDocument
      │
      ▼
buildIR(document, registry, options)          codegen/src/ir
      │   flattens theme, resolves responsive into class variants,
      │   collects imports, hoists shared motion configs,
      │   names components, dedupes identical subtrees
      ▼
CodegenIR  { components[], imports[], theme, assets, warnings[] }
      │
      ├──► printReact(ir)   → { "Hero.tsx": string, ... }
      ├──► printNext(ir)    → app/page.tsx + components/* + config
      ├──► printHtml(ir)    → index.html (inlined CSS + vanilla JS)
      └──► printJson(ir)    → .motion
      │
      ▼
format(files)   Prettier standalone, lazily imported
      │
      ▼
Export dialog  → copy | download | zip
```

The IR exists so printers stay dumb. All decisions — naming, hoisting, dedupe, import
collection — happen once, in `buildIR`. A printer only serialises. See
[EXPORT_ENGINE.md](EXPORT_ENGINE.md).

## Rendering strategy in `apps/web`

| Route | Strategy | Why |
| --- | --- | --- |
| `/` | RSC, streamed, client islands for the interactive hero | Content page; must hit LCP ≤ 2 s |
| `/blocks` | RSC list + client preview islands | Registry metadata is static; previews need JS |
| `/blocks/[slug]` | RSC shell + client controls island | Same |
| `/docs/[...slug]` | Static (MDX at build time) | Pure content |
| `/studio` | Prerendered shell + `dynamic(ssr: false)` editor | Canvas needs `window`; shell paints instantly |
| `/playground` | Prerendered shell + lazy CodeMirror | Editor is 100+ kB, load on demand |

The studio shell renders the chrome skeleton on the server so the first paint is layout, not a
spinner. The editor mounts into it.

### Code splitting boundaries

Dynamic imports, non-negotiable:

- `packages/codegen` — only on export
- `prettier` standalone — only on export
- GSAP + ScrollTrigger — only when a GSAP-backed preset is used
- CodeMirror — only in the playground and the code panel
- Colour picker — only when a colour control opens
- `jszip` — only on "download as zip"
- Heavy WebGL effects — per-effect, on first render

## Folder conventions inside a package

```
packages/<name>/
├── package.json          name, exports, scripts
├── tsconfig.json         extends @motion-studio/config/tsconfig/react.json
├── src/
│   ├── index.ts          the only public surface
│   ├── <concept>/
│   │   ├── <concept>.ts
│   │   ├── <concept>.types.ts
│   │   ├── <concept>.test.ts
│   │   └── index.ts
│   └── internal/         not exported; changing it is not a breaking change
└── README.md             what it owns, in five lines
```

## Error boundaries

| Boundary | Fallback |
| --- | --- |
| Per canvas node | Inline error card naming the block, keeps the rest of the canvas alive |
| Canvas root | "Something broke" panel with a "reset viewport" and "download document" action |
| Inspector section | Section collapses with an error chip; other sections keep working |
| Export dialog | Error with the IR warning list and a "copy JSON instead" escape hatch |
| Route | Next.js `error.tsx` with a link to download the autosaved document |

The rule behind all of them: **a crash must never lose the user's document.** Every boundary
offers a way to get the JSON out.

## Testing seams (by design)

The architecture is arranged so the hard parts test without a browser:

| Package | Environment | What is tested |
| --- | --- | --- |
| `editor` | node | Commands, history, patches, coalescing, selection algebra |
| `schema` | node | Validation, migrations, round-trip |
| `codegen` | node | IR construction, printer golden files |
| `motion` | node | Preset resolution, reduced-motion mapping, scale maths |
| `canvas` | node | Viewport maths, snapping, hit testing (pure functions) |
| `utils` | node | Everything |
| `ui`, `blocks` | jsdom | Render, roles, keyboard behaviour |
| `apps/web` | Playwright | Flows |

Anything that needs a real browser is geometry-free. Anything that needs geometry is a pure
function. That split is intentional.
