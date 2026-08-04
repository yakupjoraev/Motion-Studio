# 56 — Test completion

**Milestone** M13 · **Depends on** 55 · **Commit** `test: reach coverage floors and complete e2e suite`

## Read first

- `docs/TESTING.md` — **all of it**, especially § Coverage contract and § E2E tests
- `docs/PRODUCT.md` — § User flows (the four flows must all be specs)

## Goal

Every package at its coverage floor, every flow as an E2E spec, and the gaps that accumulated during
feature work closed.

The goal is not the percentage. It is that the tests you would want when refactoring this code in six
months actually exist.

## Deliverables

- Per-package coverage at the floors in `docs/TESTING.md`
- All four flow specs complete
- The full `e2e/` structure from `TESTING.md` § E2E tests
- Page objects for every surface
- A gap report: what is deliberately untested and why

```
e2e/
├── flows/          grab-effect, compose-page, tune-motion, live-css
├── editor/         selection, undo-redo, clipboard, dnd-mouse, dnd-keyboard,
│                   responsive, theme, persistence
├── export/         react, next, html, json-roundtrip
├── a11y/           (from prompt 55)
├── perf/           (from prompt 54)
└── fixtures/
    ├── documents/
    └── pages/      StudioPage, GalleryPage, PlaygroundPage, DocsPage
```

## Constraints

### Close the coverage gaps intelligently

```bash
pnpm test:coverage
```

Read the per-file report, not just the summary. For each file below its floor, ask which of these it is:

1. **A real gap** — an untested branch that could break. Write the test.
2. **Untestable glue** — a thin wrapper with no logic. Add it to the coverage exclusion list **with a
   comment saying why**.
3. **Dead code** — nothing calls it. Delete it.

Category 3 is more common than expected after five months of building. Look for it.

Do not write tests that assert implementation details to raise a number. A test asserting that a
function was called with specific arguments, when the behaviour is what matters, is worse than no test —
it fails on every refactor and catches nothing.

### The four flow specs

Each one is a real user journey, end to end, from `PRODUCT.md` § User flows:

**Flow A — grab an effect** (exists from prompt 52). Verify it still passes.

**Flow B — compose a page**:
```ts
test('composes and exports a landing page', async ({ page }) => {
  const studio = new StudioPage(page)
  await studio.open()
  for (const block of ['navbar', 'hero-aurora', 'bento-grid', 'pricing-table', 'faq-accordion', 'footer'])
    await studio.insertBlock(block)

  await studio.openTheme()
  await studio.setThemePreset('midnight')
  await studio.setRadiusScale(1.5)

  await studio.selectNode('Hero')
  await studio.setControl('Title', 'Ship faster')
  await studio.applyMotionPreset('reveal')

  await studio.setBreakpoint('md')
  await studio.expectNoOverflow()

  const files = await studio.export('next')
  expect(files).toContain('app/page.tsx')
  expect(files.length).toBeGreaterThan(6)
})
```

**Flow C — tune motion**: select, pick `magnetic`, drag spring stiffness, copy React, assert the
clipboard contains the spring config.

**Flow D — live CSS** (exists from prompt 49). Verify.

Each flow also runs in a **keyboard-only** variant. Flow B keyboard-only is the single most valuable
test in the suite — it is the one that proves the app is genuinely operable.

### Page objects, no raw selectors in specs

Every spec goes through a page object. A chrome change then costs one file instead of forty. Audit the
existing specs and refactor any raw selectors out.

Page objects expose intent (`selectNode('Hero')`), not mechanics (`click('[data-testid=layer-3]')`).

### Determinism audit

Go through every existing spec and remove:
- Every `waitForTimeout` → replace with a state assertion or an event wait
- Every dependency on test ordering
- Every reliance on animation timing → use `emulateMedia({ reducedMotion: 'reduce' })` unless the spec
  is about motion, in which case use Playwright's clock control
- Every hard-coded coordinate that assumes a viewport size → fix the viewport in the config

Then run the full suite **five times** and report the flake count. **Target: zero.** A suite with one
flaky test in twenty runs trains people to re-run instead of investigate, and then it protects nothing.

If retries in CI are currently 2, and the suite is genuinely stable, consider whether they are still
needed. Report your recommendation.

### The gap report

Write, in the session report:
- Which files are excluded from coverage and why
- Which behaviours are deliberately untested and why
- What you deleted as dead code
- Where you think the suite is still weak

That last one is the most useful thing in the report. Every suite has weak spots; naming them is what
lets the next person strengthen them.

## Verify

```bash
pnpm test:coverage       # every package at its floor
pnpm test:e2e            # all browsers
pnpm test:e2e --repeat-each=5    # flake check
```

Report:

| Package | Floor (lines/branches) | Actual |
| --- | --- | --- |
| editor | 90 / 85 | ? |
| schema | 90 / 85 | ? |
| codegen | 85 / 80 | ? |
| canvas | 85 / 80 | ? |
| motion | 85 / 80 | ? |
| utils | 95 / 90 | ? |
| dnd | 80 / 75 | ? |
| theme | 80 / 75 | ? |
| blocks | 70 / 60 | ? |
| ui | 70 / 60 | ? |

Plus: total unit test count, total E2E count, full suite wall-clock time, flake count over five runs.

## Done when

- [ ] Every package at or above its floor; the table filled with actuals
- [ ] Coverage exclusions each justified in a comment
- [ ] Dead code deleted, and what was deleted is reported
- [ ] All four flows as E2E specs, each with a keyboard-only variant
- [ ] Flow B keyboard-only passing on all three browsers
- [ ] Zero raw selectors in specs; everything through page objects
- [ ] Zero `waitForTimeout` in the suite
- [ ] Five consecutive full runs with **zero flakes**; retry recommendation given
- [ ] Suite wall-clock under 8 minutes with sharding
- [ ] Gap report written, including where the suite is still weak
