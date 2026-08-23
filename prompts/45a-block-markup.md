# 45a — Block markup: the mechanism

**Milestone** M9 · **Depends on** 45 · **Commit** `feat(blocks): produce block markup as IR`

## Read first

- `docs/DECISIONS.md` — ADR-249, which is this prompt's design and its reasoning
- `docs/EXPORT_ENGINE.md` — § buildIR, § The IR
- `docs/ARCHITECTURE.md` — § Dependency graph
- `docs/COMPONENT_LIBRARY.md` — § Registry contract

## Goal

A block stops exporting as an empty root element. The mechanism lands, the test that keeps it honest
lands with it, and the seven `layout` blocks prove both — they are the simplest in the catalogue and
they are the ones that carry slots.

Measured before this prompt, on `export-landing` (60 nodes, the real catalogue): 17 components,
19 files, **0** classes, 42 `unsupported` warnings, and `hero-split` printing as `<motion.section />`.

## Deliverables

```
packages/schema/src/registry/
├── markup.types.ts            MarkupNode, MarkupChild, MarkupSlot, MarkupProducer, MarkupInput
└── markup.ts                  el, txt, ref, slot — the authoring helpers, pure functions

packages/codegen/src/ir/
├── ir.types.ts                re-exports the moved types; no consumer changes an import
└── build-element.ts           calls the producer, resolves slots, normalises classes over the subtree

packages/blocks/src/
├── markup-registry.ts         blockId → producer, with a parity assertion against DEFINITIONS
├── test/render-markup.tsx     a MarkupNode tree as React elements, for the parity test
├── test/markup-parity.ts      the normaliser: strips test ids, stabilises generated ids
├── test/registry.markup.test.tsx   the parity test, driven by the registry
└── layout/*/**.markup.ts      seven producers

docs/EXPORT_ENGINE.md          pass 0 documented
docs/ARCHITECTURE.md           why the markup types sit in schema
```

## Constraints

### The producer

```ts
export type MarkupProducer<P = UnknownProps> = (input: MarkupInput<P>) => MarkupNode
```

`MarkupInput` carries the resolved props and nothing else the block does not need. It carries no
export option: a producer that branched on `extractProps` would be producing two outputs, and pass 6
is where that choice belongs.

The producer **imports the block's own `.styles.ts`** and calls the same `cva` the component calls.
Anything else is a second source of truth for the same class list. `.styles.ts` is React-free in every
block — verified — so this keeps the producer node-safe.

### Slots

`slot('children')` marks where the document's children go. `buildElement` replaces it with the
elements it builds for that slot, and a producer that omits the slot is a block whose children would
vanish — the parity test catches it, because the component renders them.

### Classes

The producer emits raw class strings. `buildElement` runs `mergeAndSort` over the whole returned
subtree, because ADR-224's ordering is a property of the output and not of any one block.

### The parity test

For every block with a producer: render the real component with `previewProps`, render the producer's
output with the same props, compare normalised DOM.

Normalisation, and nothing beyond it:

- `data-testid` removed — a canvas affordance, not markup
- generated ids (`useId`) replaced by stable tokens in document order, so linkage is still asserted
- whitespace between tags collapsed
- attributes sorted

**No per-block exception list.** A block that cannot match is a block whose producer is wrong or whose
component is doing something the export cannot carry; either way the answer is a fix or an ADR, not an
entry in a skip list.

### What stays as it is

Motion, assets, structured data and notes are attached to the root by `buildElement` exactly as they
are today. The producer does not know about them.

## Verify

```bash
pnpm --filter @motion-studio/blocks test
pnpm --filter @motion-studio/codegen test
pnpm test:codegen && pnpm test:compile
pnpm lint && pnpm typecheck
```

Then measure the change and report it:

```bash
pnpm measure:export                       # the pipeline is still under the ADR-244 threshold
```

- Count the elements, classes and `unsupported` warnings the export produces for `export-landing`
  before and after, and report both.
- Export `export-landing × next` to a directory, `npm install && npm run build`, and open it. The
  seven layout blocks must render as real boxes rather than as empty tags.

## Done when

- [ ] The markup types live in `schema` and `codegen` re-exports them
- [ ] `buildElement` calls the producer, resolves slots, and sorts classes over the subtree
- [ ] Seven `layout` producers, each calling its own `cva`
- [ ] Parity test green with **zero** exceptions
- [ ] Element and class counts for `export-landing` reported before and after
- [ ] Blocks with no producer still export as they did — `main` is green at every commit
