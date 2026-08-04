# 42 — Codegen IR

**Milestone** M9 · **Depends on** 41 · **Commit** `feat(codegen): add intermediate representation`

## Read first

- `docs/EXPORT_ENGINE.md` — § Pipeline, § The IR, § buildIR (all six passes)
- `docs/RESPONSIVE_ENGINE.md` — § Codegen
- `docs/ANIMATION_SYSTEM.md` — § Codegen
- `docs/ARCHITECTURE.md` — § Export pipeline

## Goal

`buildIR` — where all the thinking happens. Component boundaries, naming, class generation, motion
hoisting, import collection, asset handling. Six passes, each independently testable.

No printers yet. This prompt produces the IR and proves it is correct, so prompt 43's printers can be
dumb.

## Deliverables

```
packages/codegen/src/
├── ir/
│   ├── ir.types.ts              CodegenIR, IRComponent, IRElement, IRValue, IRWarning
│   ├── build-ir.ts              orchestrates the six passes
│   ├── passes/
│   │   ├── detect-components.ts   boundaries + repeated-subtree extraction
│   │   ├── name-components.ts     toComponentName + uniqueness + stability
│   │   ├── generate-classes.ts    props + responsive → ordered Tailwind classes
│   │   ├── collect-motion.ts      fragments, dedupe, hoisting
│   │   ├── collect-imports.ts     merge, dedupe, sort, type-only
│   │   └── handle-assets.ts       reference | inline | bundle
│   └── *.test.ts
├── options.types.ts             ExportOptions
├── warnings.ts                  the warning catalogue
└── index.ts
```

`packages/codegen` depends on `schema`, `utils`, `motion` (for fragment types), `tokens`. **Not** on
`blocks` and **not** on React — verified by `check-deps` and by a `node`-environment test.

## Constraints

### Pass 1 — component boundaries

The four rules from `EXPORT_ENGINE.md`:
1. Root → entry component
2. Section-category direct children of root → own component, own file
3. **Subtrees repeated ≥ 2 times with identical structure, differing only in leaf values → one
   component with props.** This is the pass that turns three pricing cards into
   `<PlanCard plan={...} />`. Structural comparison by a shape hash ignoring leaf literals.
4. Everything else inlines

`singleFile: true` collapses all of it.

Test the dedupe carefully: three identical cards → one component + three usages; three cards where one
has an extra child → no extraction (structures differ); two cards differing only in text → extracted
with a text prop.

### Pass 2 — naming

`toComponentName` must be: a valid JS identifier, PascalCase, unique within the export, and **stable**
— the same document always produces the same names, so re-exporting gives a clean diff.

The 30 cases from the doc's table plus: reserved words, leading digits, empty names, names colliding
after normalisation, unicode, and very long names (truncate at 40 chars with a stable suffix).

### Pass 3 — class generation

```ts
export function generateClasses(node: Node, def: BlockDefinition, theme: IRTheme): string[]
```

- **Ordering matches Tailwind's official group order**, then breakpoint order within each group. The
  output should look like it went through the Tailwind class sorter, because a reviewer will notice if
  it does not.
- **Redundant overrides dropped**: an override equal to the inherited value emits nothing.
- Values with no Tailwind equivalent → a CSS variable plus a stylesheet rule, **not** an arbitrary-value
  soup. `[calc(100%-2.375rem)]` appears only if the user literally typed it.
- Conflicting classes resolved with `tailwind-merge` semantics **at build time**, so the output needs no
  runtime `cn()`.

### Pass 4 — motion collection

- Collect fragments, dedupe by content hash
- **Hoist shared variants and transitions to module constants.** Eight `fade-up` sections must emit
  **one** `const fadeUp = {...}`. Test with exactly that document.
- Collect GSAP imports only when a GSAP preset is present
- Emit reduced-motion handling: a `useReducedMotion()` call and conditional variants for the Motion
  engine, or a `@media (prefers-reduced-motion: reduce)` block for CSS presets. **Always.** An export
  without reduced-motion handling is not shipping.

### Pass 5 — import collection

Merged per file, deduped, sorted (builtin → external → workspace → relative), `import type` where
type-only. Imports are collected **from actual usage**, so an unused import is structurally impossible
— test that adding a prop that removes a motion usage also removes its import.

`dependencies` accumulates real semver ranges (`"motion": "^11.0.0"`), so the emitted `package.json`
installs and runs.

### Pass 6 — assets

Three modes per the doc. `next/image` gets `width`, `height`, `alt`, `sizes`, and
`placeholder="blur"` with the stored `blurDataURL`. Plain `img` gets `loading="lazy"` and
`decoding="async"`.

**An asset with no `alt` produces a warning**, never a silent empty string.

### Warnings

The seven categories from the doc. Each warning has a `code`, a `message`, an optional `nodeId`, and a
`docsLink`. Warnings never block.

## Verify

```bash
pnpm --filter @motion-studio/codegen test --coverage
node scripts/check-deps.mjs
```

Required assertions:
- Component detection: all four rules, plus the three dedupe scenarios above
- `toComponentName`: all 30 documented cases; stability across two runs on the same document
- `generateClasses`: group ordering matches a reference sorted string; redundant override dropped;
  arbitrary fallback becomes a variable + rule; conflicting classes merged
- Motion: 8 identical presets → 1 hoisted constant; reduced-motion handling always present
- Imports: merged, sorted, `import type` correct, none unused
- Assets: all three modes; missing `alt` warns
- `buildIR` on the full-landing fixture: snapshot the IR **structure** (not the printed code) and
  assert component count, name list, and dependency map
- A `node`-environment test importing `buildIR` without React

Coverage: **≥ 85 % / ≥ 80 %**.

Then, by inspection: run `buildIR` on the full-landing fixture, dump the IR as JSON, and read it. Are
the component boundaries where you would have put them? Is the dedupe finding what you would extract by
hand? Report your judgement — this is the pass where a wrong answer produces plausible-looking but bad
output.

## Done when

- [ ] All six passes implemented and independently tested
- [ ] Repeated-subtree extraction works and does not over-extract
- [ ] Naming stable across runs; all 30 cases pass
- [ ] Class ordering matches Tailwind's sort; redundant overrides dropped
- [ ] Motion hoisting proven with an 8-instance document
- [ ] Reduced-motion handling emitted unconditionally
- [ ] No unused imports possible by construction
- [ ] Missing `alt` warns
- [ ] `codegen` has no React and no `blocks` dependency, verified
- [ ] IR for the full-landing fixture read and judged; judgement reported
