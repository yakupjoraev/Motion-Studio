# 54 — Performance hardening

**Milestone** M13 · **Depends on** 53 · **Commit** `perf: enforce budgets across all routes`

## Read first

- `docs/PERFORMANCE.md` — **all of it**. Every budget in it is now a gate.
- `docs/ARCHITECTURE.md` — § Code splitting boundaries
- `docs/TESTING.md` — § Performance specs

## Goal

Every budget in `PERFORMANCE.md` measured, met, and enforced in CI. This prompt finds and fixes what
five months of feature work accumulated.

No new features. Measure, fix the cause, gate it.

## Deliverables

```
.size-limit.js                     per-route byte budgets
lighthouserc.js                    desktop + mobile configurations
.github/workflows/lighthouse.yml
e2e/perf/
├── canvas-200-nodes.spec.ts
├── scrub-no-rerender.spec.ts
├── theme-no-rerender.spec.ts
├── drag-no-rerender.spec.ts
├── marquee-no-rerender.spec.ts
└── memory-leak.spec.ts
apps/web/src/lib/dev/
├── render-counter.tsx             dev-only, exposed on window for E2E
└── fps-meter.tsx                  already exists; wire the prod toggle
docs/PERFORMANCE.md                updated with every measured number
```

## Constraints

### Audit the bundle first

```bash
pnpm build
pnpm analyze
```

Verify from the treemap that **every** module in `PERFORMANCE.md` § Mandatory dynamic imports is in its
own chunk and absent from the initial chunks:

`codegen`, `prettier`, `gsap`, CodeMirror, colour picker, `jszip`, `particles`, `mesh-gradient`,
`chart-preview`, the syntax highlighter.

For each: state the chunk name and gzip size. Any that leaked into an initial chunk is a bug — find the
static import causing it (usually a type-only import that was not `import type`, or a barrel
re-export).

### Route budgets

```js
module.exports = [
  { name: 'landing',    path: '.next/static/chunks/**/page-*.js', limit: '120 kB' },
  { name: 'studio',     path: '.next/static/chunks/app/studio/**', limit: '250 kB' },
  { name: 'playground', path: '.next/static/chunks/app/playground/**', limit: '90 kB' },
  { name: 'blocks',     path: '.next/static/chunks/app/blocks/**', limit: '140 kB' },
]
```

Report the actual size against each limit. If one is over, fix it — do not raise the limit. The usual
causes: an eager block import, a barrel pulling in siblings, or a `ui` component importing something
heavy.

### The render-count specs

These are the highest-value performance tests because they are **exact**, unlike timing assertions on
CI hardware.

```ts
test('scrubbing does not re-render the canvas', async ({ page }) => {
  const before = await page.evaluate(() => window.__renderCounts['canvas-root'])
  await studio.scrubControl('Opacity', { pixels: 200 })
  const after = await page.evaluate(() => window.__renderCounts['canvas-root'])
  expect(after - before).toBe(0)
})
```

Five of them: scrub, theme change, pan/zoom, drag, marquee. Each asserts **exactly zero** canvas
re-renders. If any fails, something bypassed the transient-state pattern.

`render-counter.tsx` is dev-only and writes to `window.__renderCounts`. Stripped from production
builds — verify by grepping the production bundle for `__renderCounts`.

### Memory

```ts
test('30 minutes of editing does not leak', async ({ page }) => {
  // scripted: insert, edit, delete, undo, switch theme, switch breakpoint, × 500
  // sample performance.measureUserAgentSpecificMemory() every 50 iterations
  // assert the trend is flat, not the absolute number
})
```

Assert the **trend**, not the absolute value — absolute memory varies by browser build. A rising trend
means an unreleased observer, an uncancelled `rAF`, or a growing history/cache.

Run the long version manually (30 real minutes) once and report the numbers; the CI version is a
compressed 500-iteration script.

### Canvas at 200 nodes

Under 4× CPU throttle, for pan, zoom, drag, and marquee: report long-task count and p95 frame time.
The thresholds in the spec are generous (catching regressions of kind, not policing milliseconds) —
state that in a comment so nobody tightens them into flakiness.

### Layer audit

Open DevTools Layers on the studio with the glass stress fixture. Report the compositing layer count.
Budget: **under 40**. If over, the causes are a permanent `will-change` or too many
`backdrop-filter` surfaces past the cap.

### Lighthouse CI

Both presets, three runs each, median taken, asserting the budgets from `PERFORMANCE.md`. Wire the
workflow and confirm it fails on a deliberate regression (temporarily add a 200 kB eager import to the
landing, watch it fail, revert).

### Update the doc

Replace every budget in `PERFORMANCE.md` with the budget **plus the measured actual**. A budget with a
measured baseline beside it is enforceable; one without is aspirational.

## Verify

Run everything and report every number:

```bash
pnpm build && pnpm analyze
pnpm size-limit
pnpm test:e2e:perf
pnpm exec lighthouse <each of 4 routes> × { desktop, mobile }
```

Report table:

| Metric | Budget | Actual |
| --- | --- | --- |
| landing first-load JS | 120 kB | ? |
| studio first-load JS | 250 kB | ? |
| playground first-load JS | 90 kB | ? |
| blocks first-load JS | 140 kB | ? |
| Lighthouse / (mobile) × 4 | 95 | ? |
| Lighthouse /blocks (mobile) × 4 | 95 | ? |
| Lighthouse /docs (mobile) × 4 | 95 | ? |
| LCP / mobile | 2.0 s | ? |
| CLS | 0.02 | ? |
| INP | 200 ms | ? |
| Canvas pan p95 frame, 200 nodes, 4× | 20 ms | ? |
| Canvas renders during scrub | 0 | ? |
| Canvas renders during theme change | 0 | ? |
| Canvas renders during pan | 0 | ? |
| Canvas renders during drag | 0 | ? |
| Canvas renders during marquee | 1 | ? |
| Compositing layers, glass fixture | < 40 | ? |
| Memory trend over 500 iterations | flat | ? |
| Export time, 60 nodes | 800 ms | ? |

## Done when

- [ ] Every mandatory dynamic import verified as a separate chunk; names and sizes reported
- [ ] All four route budgets met and enforced by `size-limit` in CI
- [ ] All five render-count specs asserting exactly zero (one for marquee)
- [ ] `render-counter` stripped from production, verified by grep
- [ ] Memory trend flat over 500 iterations, and over a real 30-minute manual session
- [ ] Layer count under 40 on the glass fixture; reported
- [ ] Lighthouse CI wired, both presets, and demonstrated to fail on a deliberate regression
- [ ] Every row of the table above filled with a real measured number
- [ ] Every miss fixed at the cause; no budget was raised
- [ ] `PERFORMANCE.md` updated with actuals beside budgets
