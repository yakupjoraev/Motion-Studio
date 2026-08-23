# 45c — The rest of the catalogue, and the mechanism it replaces

**Milestone** M9 · **Depends on** 45b · **Commit** `feat(blocks): complete block markup and drop class rules`

## Read first

- `docs/DECISIONS.md` — ADR-249, ADR-225 (the mechanism this prompt deletes), ADR-229
- `docs/EXPORT_ENGINE.md` — § Class generation, which this prompt rewrites

## Goal

Every one of the 72 registry entries produces its own markup. Then the transitional path goes: the
producer becomes required the way `client` is, `codegen.classes` and `generateClasses` are deleted, and
the golden files are regenerated against real interiors.

This is the prompt that makes "the export produces your page" true rather than aspirational.

## Deliverables

```
packages/blocks/src/{content,hero,marketing,navigation,interactive,data,forms,effects}/*/*.markup.ts
                               the remaining producers, by category

packages/schema/src/registry/registry.types.ts
                               codegen.classes and ClassRule deleted

packages/codegen/src/ir/
├── passes/generate-classes.ts  deleted, with its tests
├── build-element.ts            the descriptor-only path deleted; an absent producer now throws
└── test/blocks.ts              the fixture catalogue gets producers too

packages/codegen/src/printers/__golden__/expected/**
                               regenerated, and the diff read rather than accepted

docs/EXPORT_ENGINE.md           § Class generation rewritten around the producer
```

## Constraints

### Order

By category, simplest first, so the parity test's normaliser is exercised on easy markup before it
meets `pricing-table`: `content` (7 leaves), `effects` (13 CSS layers), `hero` (6), `navigation` (6),
`marketing` (12), `interactive` (9), `data` (5), `forms` (5).

### The four blocks that will argue

- `pricing-table` — 53 elements, 23 conditionals, and local state the export keeps. Its producer emits
  the markup for the *stored* interval; the toggle is behaviour, and behaviour is the component's.
- `table` and `chart-preview` — both compute their markup from data. The producer computes the same
  thing from the same helper, which must therefore be extracted where both can call it.
- `carousel` — the scroll-snap strip is markup; the arrows and dots are not, and `whenAnyProp` already
  says so (ADR-243).

Any block that cannot be made to match gets an ADR naming what the export cannot carry, not a skip.

### Deleting the class-rule mechanism

`codegen.classes` was never declared by any block (ADR-225 recorded that on the day it was added). It
is deleted rather than kept as a second way to reach the same classes. The `unsupported` warning
ADR-229 emits for props that reach nothing stays — with producers in place it should fall to zero on
the fixture, and the number is the report.

### The goldens

Every golden output changes, because every golden output currently has empty interiors. Read the diff.
The whole point of a golden file is that somebody looked.

## Verify

```bash
pnpm test && pnpm lint && pnpm typecheck
pnpm test:compile               # every golden still type-checks
pnpm measure:export             # the pipeline against ADR-244's threshold, re-measured
```

Then the claim itself, end to end:

```bash
pnpm generate:export-fixture --document export-landing --target next --out ../exported
cd ../exported && npm install && npm run build && npm start
```

Compare the exported page with the canvas side by side, at 1440 and at 390, and report the verdict
against `docs/DESIGN_REFERENCES.md` — "it renders" is not the standard.

## Done when

- [ ] All 72 entries have a producer, and an absent one throws like an undeclared client boundary
- [ ] `codegen.classes`, `ClassRule` and `generate-classes.ts` are gone
- [ ] Goldens regenerated, diff read, `test:compile` green
- [ ] `unsupported` warnings on `export-landing` reported, before and after
- [ ] Element and class counts reported: 771 elements is the target, 0 classes is the starting point
- [ ] The exported page compared with the canvas, at two widths, with a written verdict
- [ ] Pipeline re-measured against the 100 ms threshold
