---
group: Quality
order: 3
summary: What to test, where, with what, and the coverage contract
---

# TESTING

## Strategy

The architecture was arranged so the hard logic tests without a browser. That is the whole
strategy: put the difficulty in pure functions, test those exhaustively and fast, and use the
browser only for what genuinely needs one.

```
                    ┌─────────────────┐
                    │   E2E  ~40      │  Playwright, 3 browsers, real flows
                    ├─────────────────┤
                    │ Component ~180  │  Vitest + jsdom + Testing Library
                    ├─────────────────┤
                    │   Unit  ~700    │  Vitest, node, pure functions
                    └─────────────────┘
```

Inverted from the usual advice about integration tests, and correctly so: this app's complexity
lives in geometry, tree algebra, patch handling, and code generation — all pure. An integration
test of `computeSnap` tells you less than forty unit tests of it.

## Coverage contract

Enforced per package, not globally. A global number lets a well-tested `utils` hide an untested
`codegen`.

| Package | Lines | Branches | Why |
| --- | --- | --- | --- |
| `editor` | 90 % | 85 % | Commands, history, selection — a bug here loses work |
| `schema` | 90 % | 85 % | Validation and migrations — a bug here corrupts files |
| `codegen` | 85 % | 80 % | Output quality is the product's credibility |
| `canvas` | 85 % | 80 % | Coordinate maths, snapping |
| `motion` | 85 % | 80 % | Preset resolution, reduced-motion mapping |
| `utils` | 95 % | 90 % | Trivially testable, so no excuse |
| `dnd` | 80 % | 75 % | The pure resolver; the rest is E2E |
| `theme` | 80 % | 75 % | Palette generation, contrast repair |
| `blocks` | 70 % | 60 % | Mostly markup; meta-tests carry the weight |
| `ui` | 70 % | 60 % | Radix-backed; test our behaviour, not theirs |

Coverage is a floor, not a goal. 100 % coverage of the wrong assertions is worthless — the
property-based tests and the golden files matter more than the percentage.

## Unit tests

Vitest, `node` environment, colocated as `<name>.test.ts`.

### What belongs here

| Package | Subject |
| --- | --- |
| `editor` | Every command (happy path + each guard), history (undo/redo/coalesce/transaction/cap/selection pruning), selection algebra (four modes, normalization, ordering, isolation), clipboard round-trip and id remapping |
| `schema` | Every validation rule, every invariant, every repair, every sanitizer rule, migration fixtures, byte-stable serialization |
| `canvas` | `screenToCanvas`/`canvasToScreen` round-trip, `zoomAt` anchor stability and drift, `computeSnap` (all candidate kinds, priorities, thresholds at multiple zooms), `fitToRect`, marquee intersection |
| `codegen` | `toComponentName` (30 cases), `generateClasses` (order, redundancy, arbitrary fallback), import merge, subtree dedupe, motion hoisting, asset handling, plus the golden files |
| `motion` | Preset resolution shape, reduced-motion mapping per channel, `motionScale` maths, `composeMotion` conflict detection, `simulateSpring` |
| `theme` | `generateRamp` (gamut clamping, hue drift), contrast repair, variable-set completeness |
| `dnd` | `resolveDropTarget` — every layout orientation, every rejection reason, isolation scoping |
| `utils` | Everything |
| `hooks` | `normalizeKeys` both platforms, registry conflict detection, fuzzy-match scoring |

### Property-based tests

The highest-value tests in the project. `fast-check`.

```ts
test('undo of any command sequence restores the original document', () => {
  fc.assert(
    fc.property(fc.array(arbitraryCommand(), { minLength: 1, maxLength: 40 }), (commands) => {
      const store = createTestStore()
      const before = structuredClone(store.getState().document)

      for (const c of commands) store.getState().dispatch(c)
      for (let i = 0; i < commands.length; i++) store.getState().undo()

      expect(store.getState().document).toEqual(before)
    }),
  )
})

test('document invariants hold after any command sequence', () => {
  fc.assert(
    fc.property(fc.array(arbitraryCommand(), { maxLength: 60 }), (commands) => {
      const store = createTestStore()
      for (const c of commands) store.getState().dispatch(c)
      expect(validateDocument(store.getState().document)).toEqual({ ok: true })
    }),
  )
})

test('screen↔canvas conversion round-trips', () => {
  fc.assert(
    fc.property(arbitraryPoint(), arbitraryTransform(), (p, t) => {
      const back = canvasToScreen(screenToCanvas(p, t, RECT), t, RECT)
      expect(back.x).toBeCloseTo(p.x, 3)
      expect(back.y).toBeCloseTo(p.y, 3)
    }),
  )
})
```

Note that undo-restores-original requires coalescing to be disabled in the test store, since a
coalesced sequence is intentionally fewer undo steps than commands. That subtlety is itself worth
a comment in the test.

### Determinism

```ts
export function createTestStore(overrides?: Partial<TestStoreOptions>) {
  return createEditorStore({
    registry: createFakeRegistry(FAKE_BLOCKS),
    generateId: counterIds(),      // node_1, node_2, ...
    now: () => 1_700_000_000_000,  // frozen
    coalesceWindow: 0,             // off unless testing coalescing
    ...overrides,
  })
}
```

No `Date.now()`, no `Math.random()`, no `crypto.randomUUID()` in any tested code path — all three
are injected. This is why the golden files are stable and the property tests reproduce.

## Component tests

Vitest, `jsdom`, Testing Library. `<name>.test.tsx`.

### Rules

- **Query by role**, then by label, then by text. `getByTestId` is a last resort and needs a
  comment saying why the accessible query was impossible.
- **Test behaviour, not implementation.** No assertions on class names, internal state, or how
  many times something rendered — except in the explicit render-count perf tests.
- **`userEvent`, not `fireEvent`.** It dispatches the real event sequence, including focus.
- **No mocking of our own modules.** If a component needs a store, give it a real test store. If
  it needs a registry, give it the fake one. Mocking our own code tests the mock.
- **Every interactive component gets an axe assertion.**

```tsx
describe('ScrubField', () => {
  it('increments by step on arrow up', async () => {
    const onCommit = vi.fn()
    render(<ScrubField value={16} step={1} onChange={noop} onCommit={onCommit} />)

    await userEvent.click(screen.getByRole('spinbutton', { name: 'Gap' }))
    await userEvent.keyboard('{ArrowUp}')

    expect(onCommit).toHaveBeenCalledWith(17)
  })

  it('multiplies the step by ten with shift', async () => { /* ... */ })
  it('reverts to the focus-time value on escape', async () => { /* ... */ })
  it('evaluates typed expressions', async () => { /* 16*2 → 32 */ })
  it('has no axe violations', async () => { /* ... */ })
})
```

### Registry meta-tests

Run over **every** block definition. These are worth more than the per-block tests because they
make an incomplete block impossible to merge.

```ts
describe.each(blockRegistry.list())('$name', (def) => {
  it('defaults satisfy its schema', () => {
    expect(def.propsSchema.safeParse(def.defaults).success).toBe(true)
  })

  it('previewProps satisfy its schema', () => { /* ... */ })

  it('every control path exists in the schema', () => {
    for (const group of def.controls)
      for (const control of group.controls)
        expect(schemaHasPath(def.propsSchema, control.path)).toBe(true)
  })

  it('every slot accepts real block ids', () => { /* ... */ })
  it('defaultMotion references real presets in supported channels', () => { /* ... */ })
  it('renders with defaults without throwing', () => { /* ... */ })
  it('has no axe violations with defaults', async () => { /* ... */ })
  it('has a thumbnail', () => { /* ... */ })
  it('has non-empty a11y notes', () => { /* ... */ })
  it('matches its codegen golden file', () => { /* ... */ })
})
```

The same pattern for every motion preset:

```ts
describe.each(motionPresets)('$name', (preset) => {
  it('resolves to a valid config with defaults', () => { /* ... */ })
  it('provides a reduced variant that removes transforms', () => { /* ... */ })
  it('produces codegen matching its golden file', () => { /* ... */ })
  it('declares a cost class', () => { /* ... */ })
})
```

## Golden files

`packages/codegen/src/__golden__/` — see [EXPORT_ENGINE.md](EXPORT_ENGINE.md).

Rules:

1. Updating a golden file requires reading the diff. `-u` without reading defeats the purpose.
2. A golden diff in a PR must be explained in the PR body.
3. Every golden React/Next output additionally goes through `tsc --noEmit` in a fixture project.
   **"Compiles with zero edits" is a test, not a claim.**
4. Golden documents cover: single block, full landing, deep nesting, every motion preset,
   responsive overrides, repeated subtrees (dedupe), assets, custom CSS.

## E2E tests

Playwright. Chromium, Firefox, WebKit. `e2e/`.

The three engines run the **flows**, whose subject is behaviour. The performance and export-smoke
specs run in Chrome alone: their subject is a number, the budgets in PERFORMANCE.md were measured
there, and a budget is only comparable to itself — ADR-280.

```
e2e/
├── flows/
│   ├── grab-effect.spec.ts          flow A
│   ├── compose-page.spec.ts         flow B
│   ├── tune-motion.spec.ts          flow C
│   └── live-css.spec.ts             flow D
├── editor/
│   ├── selection.spec.ts
│   ├── undo-redo.spec.ts
│   ├── clipboard.spec.ts
│   ├── dnd-mouse.spec.ts
│   ├── dnd-keyboard.spec.ts
│   ├── responsive.spec.ts
│   ├── theme.spec.ts
│   └── persistence.spec.ts
├── playground/
│   └── validation.spec.ts        the layers that need a real `CSS.supports`
├── export/
│   ├── react.spec.ts
│   ├── next.spec.ts
│   ├── html.spec.ts
│   └── json-roundtrip.spec.ts
├── a11y/
│   ├── axe-all-routes.spec.ts
│   ├── keyboard-only-compose.spec.ts
│   ├── keyboard-drag.spec.ts
│   ├── focus-restore.spec.ts
│   ├── live-regions.spec.ts
│   ├── reduced-motion.spec.ts
│   └── zoom-200.spec.ts
├── perf/
│   ├── canvas-200-nodes.spec.ts
│   ├── scrub-no-rerender.spec.ts
│   └── theme-no-rerender.spec.ts
└── fixtures/
    ├── documents/*.motion.json
    ├── studio-page.ts            the shell: open, shortcuts, panel tabs, viewport gestures
    ├── studio-palette.ts         the block palette and its three insertion paths
    ├── studio-layers.ts          the layers tree: selection, focus, reorder, drag
    ├── studio-canvas.ts          the artboard, the overlays, and what is painted on it
    ├── studio-theme-panel.ts     presets, scales, accent, and the variables they write
    ├── studio-contrast-report.ts the repairs the theme surfaces, and the way to decline one
    ├── studio-token-export.ts    the four token formats, and what each tab prints
    ├── studio-inspector.ts       generated controls, breakpoints, overrides, overflow
    ├── studio-motion-panel.ts    preset cards and a preset's own parameters
    ├── studio-file-menu.ts       File → New, File → Import, and the template picker
    ├── studio-import-dialog.ts   a file's two outcomes: repaired and reported, or refused
    ├── export-page.ts            the export dialog
    ├── gallery-page.ts           the catalogue and one block's detail page
    ├── playground-page.ts        the playground
    ├── settle.ts                 "the page has finished arriving", as an event
    └── measure.ts                the CDP readings the performance specs take
```

### Page objects

One per surface, composed onto `StudioPage` rather than gathered into it — ADR-333. A spec that
inserts blocks says so in the palette's own words:

```ts
const studio = new StudioPage(page)

await studio.openEmpty()
await studio.palette.insert('hero-aurora')
await studio.selectNode('aurora')
await studio.inspector.setControl('Headline', 'Ship faster')
await studio.theme.choosePreset('midnight')
await studio.motion.applyPreset('Clip reveal')
```

`StudioPage` itself owns what belongs to no panel: `open` / `openEmpty`, `press` with the modifier the
shortcut registry is listening for, the panel tabs, the viewport gestures — pan, zoom, marquee — and
the render counts the performance specs read. Everything a spec addresses by name lives on a surface:
`studio.layers`, `studio.canvas`, `studio.file`, `studio.theme.contrast`, `studio.theme.tokens`.

Every spec goes through a page object. No raw selectors in specs — a chrome change then costs one
file, not forty. Three things a page object is responsible for knowing, because each one cost a
browser session to find out:

- the layers tree and the block palette are **virtual windows**, so a row or a card nobody has
  filtered down to is absent from the DOM rather than scrolled off it
- the artboard **transitions** to a breakpoint's frame, so a measurement taken on the switch is of a
  page still on its way
- the inspector and the export dialog are **chunks**, so a query fired at the moment a node is
  selected races an import

### Determinism

- Load a fixture document rather than building state by clicking. Faster and less flaky.
- Freeze animations: `page.emulateMedia({ reducedMotion: 'reduce' })` unless the spec is about
  motion, in which case use Playwright's clock control.
- Fixed viewport `1440 × 900` for studio specs.
- No `waitForTimeout` as a **wait**. `settled(page)` — network quiet, then two animation frames — is
  what "the page has finished arriving" means here; anything narrower is a state assertion. A fixed
  duration is admissible only when the duration is the **measurement**, and those four places say so
  in a comment: compositing settles over a window, a scroll has a cadence, and "a hidden tab burns no
  frames for three seconds" is three seconds by construction. ADR-334.
- `trace: 'retain-on-failure'`, `video: 'retain-on-failure'`, `screenshot: 'only-on-failure'`.
- Retries: 2 in CI, 0 locally. A test needing retries locally is a broken test — fix it, do not
  raise the retry count.

### Performance specs

```ts
test('does not re-render the canvas', async ({ page }) => {
  const studio = new StudioPage(page)

  await studio.open('stress-200-nodes')
  await studio.selectLayer('node_f009')

  const before = await studio.renderCount('canvas-root')

  await studio.scrubControl('Duration', { pixels: 200 })

  expect(await studio.renderCount('canvas-root')).toBe(before)
})
```

Exact assertions on render counts rather than fuzzy timing assertions. Frame timings on CI runners
are noisy; a render count is not.

`pnpm test:e2e:perf` builds with `pnpm build:instrumented` first — a production build that keeps the
counters and the `window.studio` handle, which an ordinary build strips (ADR-315). A spec that finds
`window.__renderCounts` absent says so rather than reading zero and passing.

Every spec that produces a number prints it as well as annotating it, because the `list` reporter does
not print annotations. `e2e/perf` and `e2e/a11y` are where `noConsole` is off, for that reason — the
same exemption `scripts/**` has.

## Visual regression

Playwright screenshots, but narrowly scoped — visual tests are the flakiest thing in any suite.

| What | Not what |
| --- | --- |
| Each block with `previewProps`, light and dark | Full pages |
| Studio chrome, empty and with a selection | Anything with a running animation |
| Every theme preset on one reference block | Anything with a `data:` random or a date |
| Export dialog | Anything with third-party content |

Rules: reduced motion forced, fonts preloaded and awaited, fixed viewport, `maxDiffPixelRatio:
0.01`, deterministic content only. Baselines are committed per platform and regenerated only via
a labelled CI job, never locally — local font rendering differs and would churn the baselines.

## Commands

```bash
pnpm test                 # unit + component, watch off
pnpm test:watch
pnpm test:ui              # Vitest UI
pnpm test:coverage        # per-package thresholds enforced
pnpm test:unit            # node environment only — fast, ~8 s
pnpm test:codegen         # golden files
pnpm test:codegen -u      # update golden files (read the diff)
pnpm test:compile         # tsc over generated output
pnpm test:e2e
pnpm test:e2e --ui
pnpm test:e2e:a11y
pnpm test:e2e:perf
pnpm test:visual
pnpm test:visual -u       # CI-only job
```

## CI ordering

Fail fast, cheapest first:

```
lint (10s) → typecheck (40s) → unit (15s) → component (60s) → build (2m)
    → e2e (4m, sharded ×3) → a11y (2m) → lighthouse (3m) → size-limit (10s)
    → codegen compile (90s) → visual (2m, main only)
```

The whole PR pipeline stays under 8 minutes wall-clock with sharding and Turborepo caching. A
slow pipeline is a pipeline people learn to ignore.

## Definition of done

A change is done when:

- [ ] New behaviour has a test that fails without the change
- [ ] Package coverage thresholds still pass
- [ ] `pnpm lint && pnpm typecheck && pnpm test && pnpm build` green — **output read, not assumed**
- [ ] E2E passes if a flow was touched
- [ ] Golden diffs reviewed and explained
- [ ] Axe clean if UI was touched
- [ ] Keyboard path verified manually if interaction was touched
- [ ] Reduced motion verified if animation was touched
- [ ] No perf budget regression
