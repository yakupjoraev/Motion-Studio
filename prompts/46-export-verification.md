# 46 — Export verification

**Milestone** M9 · **Depends on** 45 · **Commit** `ci: add export compilation and smoke tests`

## Read first

- `docs/EXPORT_ENGINE.md` — § Testing
- `docs/DEVOPS.md` — § Export smoke test
- `docs/TESTING.md` — § Golden files

## Goal

Turn "the export works" into a proven, automated fact. Two CI jobs: one that type-checks every golden
output, and one that scaffolds a real project from an export, builds it, and Lighthouses it.

No new features. This prompt makes the export's central claim testable, which is what makes it
believable.

## Deliverables

```
scripts/
├── generate-export-fixture.mjs      CLI: document + target + options → a directory
└── verify-export-compile.mjs        writes goldens into fixture projects, runs tsc

e2e/fixtures/compile/
├── react/          package.json + tsconfig for a bare React+Tailwind+motion project
└── next/           a minimal Next 15 project shell

.github/workflows/
├── ci.yml                            add the compile-exports job
└── export-smoke.yml                  weekly + on codegen changes

docs/EXPORT_ENGINE.md                 updated with the measured results
```

## Constraints

### `verify-export-compile.mjs`

For every golden React and Next output:

1. Copy it into the matching fixture project
2. `pnpm install` in the fixture (cached in CI)
3. `tsc --noEmit`
4. Report every error with the golden file it came from

**Every golden output must type-check.** A failure here is a real bug — it means the export claim is
false for that block or preset combination.

This job runs on every PR, because a codegen change can break compilation without breaking any golden
comparison (the output changes *and* the golden updates, but the result no longer compiles).

### `export-smoke.yml`

Weekly, and on any change under `packages/codegen`:

```yaml
- run: pnpm generate:export-fixture --document full-landing --target next --out /tmp/exported
- run: cd /tmp/exported && npm install
- run: cd /tmp/exported && npm run build
- run: cd /tmp/exported && npm start &
- run: npx wait-on http://localhost:3000
- run: npx lighthouse http://localhost:3000 --output=json --output-path=./lh.json
- run: node scripts/assert-lighthouse.mjs ./lh.json --performance 90 --accessibility 95
- run: npx playwright test e2e/export-smoke/    # axe + reduced motion on the exported page
```

The exported page must score **≥ 90 Performance** and **≥ 95 Accessibility** on its own. Our generator
producing a slow or inaccessible page would be a deeper failure than a compile error — it would mean
the product actively makes its users' work worse.

Use `npm`, not `pnpm`, in the exported project. Most users are on npm and the export must work there.

### Additional smoke assertions

Beyond scores, the exported page must:

- Render every section (assert one element per source node's section)
- Run its entrance animations (assert `getAnimations()` is non-empty)
- Have zero axe violations
- Be coherent under `prefers-reduced-motion: reduce` — every section visible, nothing stuck at
  opacity 0
- Have a working theme toggle that persists across reload
- Produce zero console errors or warnings

That last one matters: a React key warning in exported code is exactly the kind of detail a reviewer
notices.

### Golden coverage audit

Before finishing, audit that the golden set actually covers the surface:

- [ ] Every one of the 62 blocks appears in at least one golden document
- [ ] Every one of the 40+ presets appears in at least one golden document
- [ ] Every effect appears in at least one
- [ ] Both `'use client'` branches covered
- [ ] Responsive overrides, repeated subtrees, assets, custom CSS each covered
- [ ] Every export option combination that changes output shape has a golden

Write the audit as a **test**, not a checklist — iterate the registry and assert each id appears in
some golden document. Then a block added later without golden coverage fails CI.

### Documentation

Update `docs/EXPORT_ENGINE.md` § Testing with the measured results: how many goldens, compile time,
smoke-test scores. Numbers, not adjectives.

## Verify

```bash
pnpm test:codegen
pnpm test:compile        # every golden type-checks
```

Then run the smoke test locally end to end:

```bash
pnpm generate:export-fixture --document full-landing --target next --out /tmp/exported
cd /tmp/exported && npm install && npm run build && npm start
```

Report:
- Did `npm install` succeed with the generated `package.json`?
- Did `npm run build` succeed with zero errors and zero warnings?
- Lighthouse: all four scores
- axe: violation count
- Console: error and warning count
- Reduced motion: fully coherent?
- Theme toggle: works and persists?
- Visual: does it match the canvas? Screenshot both and compare by eye; report any difference.

Then push and confirm both CI jobs pass.

## Done when

- [ ] `verify-export-compile` runs over every golden; all type-check
- [ ] `compile-exports` job in CI, running on every PR
- [ ] `export-smoke` workflow: install, build, Lighthouse, axe, reduced motion, console-clean
- [ ] Exported page scores ≥ 90 Performance and ≥ 95 Accessibility; actual scores reported
- [ ] Zero console errors or warnings in the exported page
- [ ] Exported page visually matches the canvas; any differences reported
- [ ] Golden coverage audit written as a test covering all blocks, presets, and effects
- [ ] `docs/EXPORT_ENGINE.md` updated with measured numbers
- [ ] Both CI jobs green on a real push
- [ ] M9 complete
