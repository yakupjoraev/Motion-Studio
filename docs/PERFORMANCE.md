---
group: Quality
order: 1
summary: Budgets, measurement, render strategy, virtualization, bundle policy
---

# PERFORMANCE

Performance is a feature of this product specifically. It is a tool about motion — a dropped
frame is a domain bug, not a nit.

## Budgets

Enforced in CI. A regression fails the build.

**Every byte number in this document is gzipped KiB** — 1024 bytes — which is what
`pnpm measure:routes` prints first and what every number recorded here was taken in. `next build` and
`size-limit` print decimal kB, 2.4 % larger for the same bytes, so `.size-limit.js` carries its limits
in bytes where they cannot be read two ways (ADR-314).

The **Measured** column is the state of the current build, not a target. A budget with no measurement
beside it is aspirational; these are the numbers `pnpm size-limit` and `pnpm measure:routes` reproduce.

### Public pages

Lighthouse numbers are the median of three runs per route on `lighthouserc.cjs`, both presets, with
the browser really throttled rather than a fast run extrapolated — ADR-319 has why that distinction
cost an afternoon. Taken 2026-09-01.

| Metric | Budget | Mobile | Desktop |
| --- | --- | --- | --- |
| Lighthouse Performance | ≥ 95 | 99 (`/`), 100 (`/blocks`), 99 (`/blocks/section`), 99 (`/docs`) | 100 on all four |
| Lighthouse Accessibility | ≥ 95 (target 100) | 100 | 100 |
| Lighthouse Best Practices | ≥ 95 | 100 (`/`, `/docs`), 96 (`/blocks`, `/blocks/section`) | 100 |
| Lighthouse SEO | ≥ 95 | 100 | 100 |
| LCP | ≤ 2.0 s | **1638 ms** (`/`), 1448 (`/blocks`), 1459 (`/blocks/section`), 1639 (`/docs`) | 178 / 69 / 64 / 92 ms |
| CLS | ≤ 0.02 | 0 (`/`, `/docs`), 0.0007, 0.0010 | 0–0.0022 |
| INP | ≤ 200 ms | **32 ms** worst interaction (`/`, `/blocks`), 24 ms (`/docs`) | — |
| TBT | ≤ 200 ms | 3 ms (`/`), 22, 101, 48 | 0 ms |
| First-load JS | ≤ 120 kB gzip | **106.6 KiB** (`/`) | — |

The figures above are the development machine's. The same run on a CI runner reads 90 / 78 / 155 / 71 ms
of TBT, because `devtools` throttling multiplies whatever the host is by four and the runner's
`benchmarkIndex` is 2431–3088 where the development machine's is 4500. ADR-332 has the comparison and
what to check in the uploaded report before treating a red mobile leg as a regression.

INP is the worst interaction latency Chrome's own Event Timing API reported over a scripted pass
through each route's controls — `e2e/perf/public-inp.spec.ts`. Lighthouse does not measure it: it is a
field metric, and a lab reading of it needs interactions, which a page load has none of.

### Studio

| Metric | Budget | Measured | Kept by |
| --- | --- | --- | --- |
| First-load JS | ≤ 250 kB gzip | **249.6 KiB** — ADR-312 and ADR-313 took it there from 369.7 | `size-limit` |
| Time to interactive canvas | ≤ 1.2 s on a mid-range laptop | **499 ms** on the 200-node fixture | `studio-latency` |
| Pan | 60 fps with 200 nodes | p95 **16.8 ms**, 0 long tasks | `canvas-200-nodes` |
| Zoom | 60 fps with 200 nodes | p95 **16.8 ms**, worst 31.6 | `canvas-200-nodes` |
| Node drag | 60 fps with 200 nodes | p95 **16.8 ms**, worst 33.3 | `canvas-200-nodes` |
| Marquee over 200 nodes | 60 fps | p95 **16.7 ms**, 0 long tasks | `canvas-200-nodes` |
| Inspector scrub | 60 fps; **zero** canvas re-renders | **0** renders over 200 px of drag | `scrub-no-rerender` |
| Theme switch | ≤ 16 ms; **zero** React re-renders | **0** at the canvas and **0** at the shell | `theme-no-rerender` |
| Layers tree with 500 nodes | 60 fps scroll | virtualized at 26 px rows; not separately timed |  |
| Undo of a 50-node paste | ≤ 32 ms | **0.7 ms** applied, 16.7 ms to the next frame | `studio-latency` |
| Export of a 60-node document | ≤ 800 ms including formatting | **197 ms** React, 197 Next, 96 HTML, 24 tokens, 2 JSON | `pnpm measure:export` |
| Memory after 30 min of editing | ≤ 250 MB, no upward trend | **11.43 → 11.67 MB** over 500 passes, +452 B per pass | `memory-leak` |
| Compositing layers, glass fixture | < 40 | **8** settled, **36** peak | `glass-layers` |
| Canvas re-renders during a drag | 0 | **0** — was 32 before ADR-316 | `drag-no-rerender` |
| Canvas re-renders during a marquee | 0 | **0**, sweep and commit alike | `marquee-no-rerender` |

The four canvas gestures over the 200-node fixture, at full speed and at a quarter of a processor.
Chrome, 1440 × 900, instrumented production build (ADR-315), taken 2026-09-01:

| Gesture | Median | p95 | Worst | Long tasks | TBT |
| --- | --- | --- | --- | --- | --- |
| Pan | 16.7 ms | 16.8 ms | 16.8 ms | 0 | 0 ms |
| Zoom | 16.7 ms | 16.8 ms | 31.6 ms | 0 | 0 ms |
| Marquee | 16.7 ms | 16.7 ms | 16.8 ms | 0 | 0 ms |
| Node drag | 16.7 ms | 16.8 ms | 33.3 ms | 1 | 2 ms |
| Pan, 4× | 16.7 ms | 33.4–50.1 ms | 66.7 ms | 1–4 | 15–29 ms |
| Zoom, 4× | 16.7 ms | 33.2 ms | 66.8 ms | 2 | 13 ms |
| Marquee, 4× | 16.7 ms | 16.7 ms | 16.7 ms | 0 | 0 ms |
| Node drag, 4× | 16.7 ms | 33.3 ms | 150.0 ms | 2 | 96 ms |

The full-speed numbers are the stable ones: seven consecutive runs put every gesture at p95
16.7–16.8 ms with no long task at all. The 4× numbers are not, and the spread above is the honest
range rather than a best run — across those seven the throttled figures moved between p95 33 and 100
ms, 0 and 30 long tasks, and 0 and 774 ms of blocking, with the drop commit of a node drag accounting
for most of the worst of it.

So the thresholds in `canvas-200-nodes.spec.ts` sit above that spread — p95 < 150 ms, fewer than 40
long tasks, under 1500 ms of blocking — and are meant to stay there. At a quarter of a processor the
scene rasterizes over the frame budget by definition; what is left to catch is a regression of kind,
which lands an order of magnitude past those numbers. The exact guard is the render count beside each
full-speed gesture, and two earlier drafts of these thresholds — 50 ms, then 80 ms and 300 ms — each
failed on a healthy run before the spread was measured.

## Bundle policy

### Route budgets (`size-limit`)

`.size-limit.js` in the repository root, generated from `.next/app-build-manifest.json` so each entry
is the exact file list its route loads. `pnpm size-limit` after `pnpm --filter web build`.

Two metrics, because these four budgets were written as two different things (ADR-314):

| Entry | Metric | Budget | Measured |
| --- | --- | --- | --- |
| `landing first-load JS` | every chunk `/` loads | 120 KiB | 106.9 KiB |
| `studio first-load JS` | every chunk `/studio` loads | 250 KiB | 249.6 KiB |
| `playground route chunk` | the chunks only `/playground` loads | 90 KiB | 44.9 KiB |
| `blocks route chunk` | the chunks only `/blocks` loads | 140 KiB | 10.6 KiB |

The measured column is a CI run — the one the gate prints, taken on 2026-09-04. A local build reads
0.3–0.6 KiB lower on the two first-load entries; the budget is the same either way, and the run that
decides is the runner's.

`/blocks/[slug]` (154.4 KiB) and `/docs` (106.9 KiB) are reported by `pnpm measure:routes` and gated by
neither, because no document gives them a number.

### Mandatory dynamic imports

Anything here appearing in an initial chunk is a CI failure. `pnpm analyze` produces the treemap
that proves it, in `apps/web/.next/analyze/client.html`, and `pnpm measure:routes --markers` answers
the same question in two seconds by probing the built chunks for a string only that module produces.

**Verified 2026-09-01, after ADR-312, ADR-313 and ADR-320: none of the ten is in any route's first
load**, with one deliberate exception — the tokeniser is in `/blocks/[slug]`'s own chunk (0.9 KiB),
because that page highlights the source it prints at runtime (ADR-245, prompt 52).

The studio's first load, attributed, replaces ADR-292's table:

| | gzip |
| --- | --- |
| framework and shared runtime | 105.4 KiB |
| `app/studio` — shell, panels, store, commands | 47.0 KiB |
| `@dnd-kit` + toast + `immer` | 24.3 KiB |
| Radix primitives the chrome renders | 29.6 KiB |
| `zod` | 12.6 KiB |
| `packages/theme` + `packages/tokens` | 7.0 KiB |
| `tailwind-merge` | 6.5 KiB |
| everything else | 13.8 KiB |

The block definitions (69.4 KiB) and `motion` (34.7 KiB) are no longer in it.

| Module | ~Size gzip | Loads when |
| --- | --- | --- |
| `@motion-studio/codegen` | 45 kB | Export dialog opens |
| `prettier` standalone + plugins | 180 kB | Export with formatting |
| `gsap` + `ScrollTrigger` | 60 kB | A GSAP-backed preset renders |
| CodeMirror 6 (CSS setup) | 110 kB | Playground or the code panel |
| Colour picker | 18 kB | A colour control opens |
| `jszip` | 28 kB | Zip download |
| `particles` effect | 22 kB | The block renders |
| `mesh-gradient` WebGL path | 16 kB | The block renders |
| `chart-preview` | 34 kB | The block renders |
| `@motion-studio/blocks/highlight` | 4 kB | Generated code is displayed (ADR-245) |

### Landing islands, measured

`prompts/51` budgets the hero demo at 40 kB. The measurement is every chunk the page requests that is
not in `/page`'s entry in `app-build-manifest.json`, gzipped from disk — ADR-300.

| Island | Own chunks | Everything it pulls | Loads when |
| --- | --- | --- | --- |
| Hero demo | 2.8 kB | **2.8 kB** | Idle callback, after the `<h1>` paints |
| Effect grid | 4.3 kB | — | Half a viewport before the section |
| Inspector walkthrough | 2.9 kB | — | Half a viewport before the section |
| All three, with what they share | | **27.9 kB** | |

### Gallery, measured

`/blocks` renders 72 cards and `/blocks/[slug]` is 72 static pages. Three mobile runs each, real
throttling, on an idle machine — ADR-304, which also records what the same measurement said on a
machine that was building at the time, and why that number was worthless.

| | `/blocks` | `/blocks/[slug]` |
| --- | --- | --- |
| Performance | 100 | 98–99 |
| A11y / Best practices / SEO | 100 / 100 / 100 | 100 / 100 / 100 |
| LCP | 1.4–1.5 s | 1.4–1.6 s |
| CLS | 0.0007 | 0.0005 |
| TBT | 0–6 ms | 0–30 ms |
| First-load JS | 116.2 KiB | 154.4 KiB (was 199, ADR-320) |

The detail page was 199 kB, of which 36.4 kB was `motion` that nothing on the page animates.
`block-source.ts` took `presetRegistry` from the `@motion-studio/motion` barrel, which also exports
the framer-motion applier — one import, one module deep, found by reproducing the chain rather than
reasoning about it. It now imports `@motion-studio/motion/presets`, and the route is **154.4 KiB**
(ADR-320). `motion` is in no route's first load; `pnpm measure:routes --markers` is the check.

### Tree-shaking discipline

- Named exports only from packages. A default export of an object graph defeats shaking.
- `"sideEffects": false` in every package's `package.json` except those with CSS imports, which
  list the CSS files explicitly. `packages/config` is the one exemption: its presets are read as
  files rather than imported as modules, so there is no graph to shake. Without the declaration a
  barrel that re-exports a `'use client'` module cannot be shaken at all, and one import of two pure
  functions drags the whole package in — ADR-300 has the 46 kB it cost the landing page.
- No barrel file that re-exports an entire subtree if a consumer only needs one entry —
  `packages/blocks` exports the registry and the lazy component map, not 62 eager imports.
- Icons are individual components, never a single `icons.tsx` with 200 exports.

## Rendering

### The core rule

**High-frequency values never pass through React.** The pattern, applied everywhere:

```
gesture → ref mutation → rAF → CSS custom property write → GPU composite
                                          │
                                    (gesture end)
                                          ▼
                                  one command → one render
```

Applied to: pan, zoom, drag position, scrub values, colour drags, marquee, resize handles,
cursor-following effects, overlay positions.

### Memoisation map

| Component | Strategy |
| --- | --- |
| `NodeRenderer` | `memo` on `id`; subscribes only to its own node |
| `LayerRow` | `memo`; virtualized |
| `BlockCard` | `memo`; static thumbnail |
| `InspectorControl` | `memo` on `(path, value)` |
| Overlays | Not memoised — they update via refs, never props |
| Canvas root | Subscribes to `rootId` and `version` only |

`memo` is applied where it was measured to help. A `memo` on a component with a fresh-object prop
is worse than none.

### Selector discipline

Every subscription is a narrow selector. The specific failure to avoid:

```tsx
// ✗ every store change re-renders every node
const { nodes } = useEditorStore()
const node = nodes[id]

// ✓ only this node's changes re-render this node
const node = useEditorStore(useCallback((s) => s.document.nodes[id], [id]))
```

### Concurrent rendering

- `startTransition` for selection changes and breakpoint switches, so the gesture stays responsive
  while the tree reconciles.
- `useDeferredValue` for the block search query — typing never waits on filtering.
- No `Suspense` boundary inside the canvas node tree: a suspending node would unmount its
  siblings' DOM on every re-suspend. Lazy blocks get their own boundary at the node level with a
  fixed-size skeleton.

## Canvas specifics

| Technique | Effect |
| --- | --- |
| Scene transform via CSS variables on one element | Pan/zoom is a GPU composite, zero layout |
| Overlays outside the transform, in screen space | Constant line weights, no re-layout on zoom |
| Rect cache fed by one `ResizeObserver` | No `getBoundingClientRect` in loops |
| Snap candidates computed at drag start | O(n) once instead of per frame |
| `content-visibility: auto` on off-screen sections | Skips layout, paint, and style for them |
| `contain: layout paint` on node wrappers | Bounds invalidation to the subtree |
| Grid as a CSS `background-image` | Zero render cost, zero elements |
| Drag ghost as an outline, not a live copy | No rendering a blurred aurora at cursor rate |
| `will-change` added on gesture start, removed on end | Layer promotion without permanent memory cost |

### Layer count

Every `will-change`, `transform: translateZ(0)`, and `backdrop-filter` creates a compositing
layer. Fifty layers is a memory problem and can be *slower* than none.

Rules:
- `will-change` only during an active gesture, and **never in a stylesheet**. A looping effect does
  not need it: the browser promotes an element for as long as its transform or opacity is animating,
  and a permanent declaration keeps the layer after the animation stops. Seven of the thirteen
  surface effects declared one until prompt 34 measured what they cost.
- An effect that is off screen holds still — `EffectLayer` writes `data-effect-offscreen` from the
  scheduler's pooled observer and `effects.css` pauses on it. A paused animation is not a layer, so
  the layer count follows the viewport rather than the document.
- `backdrop-filter` capped at 4 simultaneous instances in the viewport; the canvas counts and
  warns.
- The overlay layer is one promoted element, not one per overlay.
- Chrome's layer count is checked in a dev-mode assertion when it exceeds 40.

## Motion performance

Detailed in [ANIMATION_SYSTEM.md](ANIMATION_SYSTEM.md) § GPU discipline. The load-bearing rules:

1. Animate only `transform`, `opacity`, `filter`, `clip-path`.
2. One shared `IntersectionObserver` per threshold, one shared scroll listener, one shared
   `pointermove`, one shared `rAF` loop — via the motion scheduler.
3. Continuous animations pause off-screen and on tab hide.
4. `gpuHeavy` presets capped at 3 simultaneous instances.
5. Blur animations: max 12 px, entrance only, max 6 elements.
6. Reduced motion disables continuous and cursor channels entirely.

Measured: a landing page with 8 animated sections and 3 continuous effects holds 60 fps on a
2019 MacBook Air. If it does not, the effect budget is wrong, not the hardware.

### Measured — the three stress fixtures

Production build, Chrome, 1440 × 900, five seconds of wheel scrolling that reverses direction so it
stays over the document. Fixtures in `e2e/fixtures/documents`; the specs that keep these honest are
`e2e/perf`. Taken 2026-08-16.

| | 200 nodes | Motion heavy (101) | Glass (33) |
| --- | --- | --- | --- |
| Median frame | 16.7 ms | 16.7 ms | 16.7 ms |
| p95 frame | 16.8 ms | 16.8 ms | 16.8 ms |
| Worst frame | 16.8 ms | 16.8 ms | 16.8 ms |
| Long tasks | 0 | 0 | 0 |
| Compositing layers, settled | 8 | 8 | 8 |
| Compositing layers, peak | 45 | 63 | 40 |
| `scroll` / `pointermove` / `resize` listeners | 0 / 0 / 1 | 0 / 0 / 1 | 0 / 0 / 1 |
| `IntersectionObserver` instances | 2 | 3 | 3 |
| JS heap, before → after the leak run | 11.28 → 11.78 MB | 9.60 → 9.42 MB | 8.60 → 8.94 MB |
| Main-thread seconds over 5 s hidden | 0.02 | 0.01 | 0.01 |

The same three under **4× CPU throttling**, which is the profile a five-year-old laptop approximates:

| | 200 nodes | Motion heavy | Glass |
| --- | --- | --- | --- |
| Median frame | 16.7 ms | 16.7 ms | 16.7 ms |
| p95 frame | 66.7 ms | 50.0 ms | 16.8 ms |
| Worst frame | 116.7 ms | 83.4 ms | 33.4 ms |
| Long tasks | 14 | 12 | 0 |
| Total blocking time | 227 ms | 89 ms | 0 ms |

Read those two tables together. At full speed every fixture holds 60 fps with no long task at all —
that is the budget in ENGINEERING_CONTRACT.md § 6, and it is met. At a quarter of a processor the
frame time doubles on the two large fixtures, and the control run says why: the **same 200-node
document with reduced motion forced** — the canvas alone, no entrances — measures p95 33.3 ms, worst
50.0 ms, zero long tasks. So half of the throttled cost is the scene and half is the motion over it.
ADR-160 is the threshold that follows from it.

Two notes on reading the numbers:

- `scroll` and `pointermove` are **zero**, not one. The buses exist and idle: no preset in these
  fixtures subscribes to either, and the scheduler only attaches a listener when something does.
- The settled layer count is 8 on all three. The peaks are what the effects cost while they are on
  screen and animating — see ADR-159 for the 63.

## Virtualization

| List | Threshold | Implementation |
| --- | --- | --- |
| Layers tree | > 50 rows | `@tanstack/react-virtual`, fixed 26 px rows |
| Block palette | > 40 cards | Virtual grid |
| Command palette | > 60 items | Virtual list |
| Export file list | > 30 files | Virtual list |
| Motion preset grid | > 40 items | Virtual grid |

Fixed row heights everywhere. Variable heights need measurement, measurement causes layout
thrash, and none of these lists need variable heights.

## Images

- `next/image` everywhere, with explicit `width`/`height` and a real `sizes`.
- AVIF then WebP, quality 82.
- Block thumbnails: WebP at exactly `320 × 200`, with a `blurDataURL` so there is no shift.
- Hover animations are WebM (VP9), `preload="none"`, loaded on first hover, skipped entirely under
  reduced motion.
- The landing hero's LCP element is **static text**, never an image or an animation. That single
  decision is worth more to the LCP number than every other optimisation combined.
- Everything below the fold is `loading="lazy"`.

## Fonts

- `next/font` with self-hosted Geist Sans and Geist Mono.
- `display: swap`, `preload` the sans 400 and 600 weights only.
- Subset `latin` + `latin-ext`.
- Fallback metrics adjusted (`adjustFontFallback`) so the swap does not shift layout — this is
  where most of a CLS budget goes if you skip it.
- Additional theme font pairings are self-hosted and loaded only when a theme selects them.

## Measurement

### In development

```tsx
<FpsMeter />                          // status bar, on in dev, toggled in prod
<RenderCounter id="studio-shell" />   // a subtree with no natural call site
countRender('canvas-root')            // inside the canvas's own render path
```

`apps/web/src/lib/dev/render-counter.tsx` is how the "zero re-renders" budgets are asserted rather
than assumed. It writes to `window.__renderCounts`, and an ordinary production build strips it: the
guard is two build-time constants, so the minifier deletes everything behind it and a grep over
`apps/web/.next/static` finds no `__renderCounts`, no `MS_INSTRUMENT` and no `window.studio`.

The budgets are about production React, so `pnpm test:e2e:perf` builds with `pnpm build:instrumented`
first — a production build with the counters and the store handle left in (ADR-315).

### In CI

```yaml
- Lighthouse CI on /, /blocks, /blocks/section, /docs (mobile + desktop), three runs, median,
  asserted against § Public pages — `.github/workflows/lighthouse.yml`
- size-limit on every gated route entry
- Playwright performance specs, `e2e/perf`, against `pnpm build:instrumented`:
    - canvas-200-nodes    pan, zoom, marquee, drag; frame timings at full speed and at 4×
    - scrub-no-rerender   canvas renders === 0
    - theme-no-rerender   canvas and shell renders === 0
    - drag-no-rerender    canvas renders === 0 with the button down
    - marquee-no-rerender canvas renders === 0, sweep and commit
    - glass-layers        compositing layers, settled and peak
    - studio-latency      time to interactive canvas, undo of a 50-node paste
    - public-inp          worst interaction latency on the three public routes
    - memory-leak         heap trend over 500 scripted edits
- Bundle treemap uploaded as an artifact on every PR
```

The render-count assertions are the most valuable of these. Frame timings on CI hardware are
noisy; a render count is exact.

Each gate was watched going red on a deliberate regression, and they do not overlap: 636 KiB of dead
weight in the landing's first load fails `size-limit` by 203 kB while Lighthouse still scores 97,
and 1.5 s of synchronous work at hydration scores 70 and fails two assertions while the byte budget
passes. ADR-321 has the table. `size-limit` is the only gate that sees bytes; Lighthouse is the only
gate that sees the main thread.

### Profiling checklist

When something feels slow, in this order:

1. React DevTools Profiler — what re-rendered, and why (the "why did this render" panel).
2. Performance panel with 4× CPU throttling — long tasks, layout thrash, style recalc.
3. Layers panel — how many compositing layers, how much memory.
4. `performance.measure` around the suspected function, logged in dev.
5. Only then optimise, and record what was measured in a comment next to the fix.

## Anti-patterns

| Pattern | Consequence | Instead |
| --- | --- | --- |
| Store subscription without a selector | Every component re-renders on every change | Narrow selector |
| Gesture value in React state | 60 renders/second | Ref + CSS variable |
| `getBoundingClientRect` in a loop | Forced synchronous layout | Rect cache |
| Animating `width`/`height`/`top`/`left` | Layout on every frame | `transform` |
| Permanent `will-change` | Memory growth, more layers | Add on gesture, remove after |
| One `IntersectionObserver` per node | 40 observers | Shared scheduler |
| Live drag preview | Rendering the whole node at cursor rate | Outline ghost |
| Unvirtualized long list | Thousands of DOM nodes | `react-virtual` |
| Deep-equal selector | Traverses the document every render | Version-keyed memo |
| Eager import of the export engine | 225 kB in the initial chunk | Dynamic import |
| `Suspense` inside the node tree | Sibling DOM unmounts on suspend | Boundary at the node level |

## Exemptions

Documented exceptions to the ≤ 20 kB initial-chunk dependency rule:

| Dependency | Size | Justification |
| --- | --- | --- |
| `motion` | ~34 kB | Core to the product — and **no longer in any route's first load**: ADR-313 took the last two eager consumers off it, so it arrives with the blocks that animate |
| `@dnd-kit/core` + `sortable` | ~26 kB | Required for the studio's primary interaction; accessibility is not retrofittable |
| `zustand` + `immer` | ~14 kB | The state architecture |
| `zod` | ~14 kB (tree-shaken) | Schema is the contract; drives validation and the inspector |

Nothing else. Every other dependency above 20 kB is dynamically imported.
