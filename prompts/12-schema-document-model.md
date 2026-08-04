# 12 — Schema and document model

**Milestone** M2 · **Depends on** 03, 06 · **Commit** `feat(schema): add document model, validation, and invariants`

## Read first

- `docs/FILE_FORMAT.md` — **all of it**
- `docs/EDITOR_ENGINE.md` — § Document model, § Invariants
- `docs/ARCHITECTURE.md` — § The registry seam
- `docs/CODE_STANDARDS.md` — § TypeScript

## Goal

`packages/schema` — the shape of everything. Types, Zod schemas, branded ids, the registry
interface, `validateDocument`, `sanitizeDocument`, `migrateDocument`, and byte-stable serialization.

This package has no React, no DOM, and no dependency on any other internal package except `utils`
and `theme` (for `ThemeConfig`). It is the vocabulary the rest of the codebase speaks.

## Deliverables

```
packages/schema/src/
├── ids/
│   ├── ids.ts                  branded NodeId, BlockId, AssetId, EffectId + schemas + constructors
│   └── ids.test.ts
├── document/
│   ├── document.types.ts       MotionDocument, Node, DocumentMeta, Asset
│   ├── document.schema.ts      zod, per FILE_FORMAT
│   ├── create-empty.ts         createEmptyDocument()
│   ├── validate.ts             validateDocument — the nine invariants
│   ├── repair.ts               repairDocument — the repair/reject table
│   ├── traverse.ts             walk, descendants, ancestors, isDescendant, documentOrderIndex
│   ├── serialize.ts            withStableKeyOrder + serializeDocument
│   └── *.test.ts
├── registry/
│   ├── registry.types.ts       BlockDefinition, BlockRegistry, SlotDefinition, BlockCapabilities,
│   │                            ControlGroup, ControlDescriptor, CodegenDescriptor, RenderRegistry
│   ├── create-registry.ts      createRegistry(definitions) with get/require/list/byCategory
│   └── *.test.ts
├── motion/
│   ├── motion.types.ts         MotionSpec, MotionChannel, MotionTrigger
│   ├── motion.schema.ts
│   └── motion.test.ts
├── effects/
│   ├── effects.types.ts        EffectInstance, EffectId, BlendMode
│   └── effects.schema.ts
├── breakpoints/
│   ├── breakpoints.ts          BREAKPOINTS, CASCADE_ORDER, BreakpointId
│   ├── resolve.ts              resolveResponsiveProps
│   └── *.test.ts
├── sanitize/
│   ├── sanitize.ts             the per-field table from FILE_FORMAT § Security
│   ├── css/
│   │   ├── validate-css.ts     structural + blocklist + normalize only (layers 1, 2, 5)
│   │   ├── structural.ts       delimiters, length, statement shape
│   │   ├── blocklist.ts        url(, @import, expression(, behavior:, -moz-binding, element(
│   │   ├── normalize.ts
│   │   └── *.test.ts           every blocklist entry gets a malicious fixture
│   ├── __fixtures__/malicious.ts
│   └── sanitize.test.ts
├── migrations/
│   ├── index.ts                CURRENT_VERSION, migrations[], migrateDocument
│   ├── __fixtures__/           v1 fixture now; pairs added as migrations land
│   └── migrations.test.ts
├── test/factories.ts           node(), doc(), fakeRegistry() — used by every downstream package
└── index.ts
```

## Constraints

### Branded ids

```ts
export type NodeId = string & { readonly __brand: 'NodeId' }
export function nodeId(value: string): NodeId          // validates the format, throws on bad input
export const nodeIdSchema = z.string().regex(NODE_ID_RE).transform((v) => v as NodeId)
```

A `BlockId` must not be assignable to a `NodeId`. That is the entire point — write a
type-level test (`expectTypeOf`) proving it.

### `validateDocument`

All nine invariants from `EDITOR_ENGINE.md` § Invariants, each with its own error code and each with
a fixture that violates exactly that one. Returns `Result<void, DocumentError[]>` — it reports
**all** violations, not the first, because an import report needs the full picture.

### `repairDocument`

Implements the repair/reject table from `FILE_FORMAT.md` verbatim. Returns
`{ document, repairs: Repair[] }`. Cycles and a missing root are rejections, not repairs — do not
attempt to be clever there.

### `resolveResponsiveProps`

**Cascading, not exact-match.** This is the bug named explicitly in `RESPONSIVE_ENGINE.md`. Write
the "lg inherits from md" test and the "lg override does not leak down to md" test before the
implementation.

### Serialization

Stable key order, 2-space indent, trailing newline. `serialize(parse(serialize(doc)))` must be
byte-identical to `serialize(doc)`. Test it over 20 fixture documents.

### Registry interface

`BlockRegistry` is an interface, and `createRegistry` builds one from an array. **No React types
anywhere in this file** — that separation is what lets `codegen` run in `node`. `RenderRegistry` is
typed as `Record<BlockId, unknown>` here, refined to a component map in `packages/blocks`. State that
choice in a comment.

### `test/factories.ts`

Exported from the package, because every downstream test needs them:

```ts
export function node(overrides?: Partial<Node>): Node
export function doc(nodes?: Node[], overrides?: Partial<MotionDocument>): MotionDocument
export function fakeRegistry(blocks?: Record<string, Partial<BlockDefinition>>): BlockRegistry
```

Deterministic — ids from a counter, timestamps frozen.

### Sanitization

Every rule in the `FILE_FORMAT.md` security table, with a malicious fixture for each:
`javascript:` href, `data:text/html` src, oversized data URL, `url()` in a CSS prop, `@import`,
script-bearing rich text, a 100 kB node name. Each has an assertion that the payload is removed and
listed in the report.

CSS props go through `sanitize/css/validate-css.ts` — the three DOM-free layers (structural,
blocklist, normalize). Prompt 48 completes the same module with the two DOM-dependent layers and
wires the playground and inspector to it. **This is the only CSS validator in the codebase**; the
security path and the interactive path must never be able to disagree, so there is no second
implementation and no app-level copy.

## Verify

```bash
pnpm --filter @motion-studio/schema test --coverage
```

Read the coverage table: **≥ 90 % lines, ≥ 85 % branches.**

Required assertions:
- Each of the nine invariants: one fixture, one specific error code
- Each repair case: input → repaired output + a report entry
- Cycle → rejected, not repaired
- Byte-stable serialization over 20 fixtures
- Responsive cascade: both directions tested
- Every malicious fixture neutralised and reported
- Type-level: `BlockId` not assignable to `NodeId`
- Fuzz: 1000 mutated documents each either parse or return a typed error — never throw

```bash
pnpm lint && pnpm typecheck && node scripts/check-deps.mjs
```

`check-deps` must confirm `schema` depends only on `utils` and `theme`.

## Done when

- [ ] Branded ids with a type-level non-assignability test
- [ ] All nine invariants implemented, each with its own fixture and code
- [ ] Repair table implemented exactly, cycles rejected
- [ ] Responsive cascade correct in both directions
- [ ] Byte-stable serialization proven
- [ ] Every sanitizer rule with a malicious fixture
- [ ] Fuzz test passes with zero throws
- [ ] `test/factories.ts` exported and deterministic
- [ ] ≥ 90 % / ≥ 85 % coverage, confirmed by reading the output
- [ ] No React or DOM types in the package
