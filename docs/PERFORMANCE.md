# PERFORMANCE

Performance is a feature of this product specifically. It is a tool about motion — a dropped
frame is a domain bug, not a nit.

## Budgets

Enforced in CI. A regression fails the build.

### Public pages

| Metric | Budget | Measured on |
| --- | --- | --- |
| Lighthouse Performance | ≥ 95 | `/`, `/blocks`, `/docs`, mobile emulation |
| Lighthouse Accessibility | ≥ 95 (target 100) | all routes |
| Lighthouse Best Practices | ≥ 95 | all routes |
| Lighthouse SEO | ≥ 95 | `/`, `/blocks`, `/docs` |
| LCP | ≤ 2.0 s | `/`, mobile 4G throttled |
| CLS | ≤ 0.02 | all routes |
| INP | ≤ 200 ms | all routes |
| TBT | ≤ 200 ms | `/` |
| First-load JS | ≤ 120 kB gzip | `/` |

### Studio

| Metric | Budget |
| --- | --- |
| First-load JS | ≤ 250 kB gzip |
| Time to interactive canvas | ≤ 1.2 s on a mid-range laptop |
| Pan / zoom | 60 fps with 200 nodes |
| Node drag | 60 fps with 200 nodes |
| Marquee over 200 nodes | 60 fps |
| Inspector scrub | 60 fps; **zero** canvas re-renders |
| Theme switch | ≤ 16 ms; **zero** React re-renders |
| Layers tree with 500 nodes | 60 fps scroll |
| Undo of a 50-node paste | ≤ 32 ms |
| Export of a 60-node document | ≤ 800 ms including formatting |
| Memory after 30 min of editing | ≤ 250 MB, no upward trend |

## Bundle policy

### Route budgets (`size-limit`)

```js
module.exports = [
  { name: 'landing',    path: '.next/static/chunks/pages/index-*.js',      limit: '120 kB' },
  { name: 'studio',     path: '.next/static/chunks/app/studio/page-*.js',  limit: '250 kB' },
  { name: 'playground', path: '.next/static/chunks/app/playground/page-*.js', limit: '90 kB' },
  { name: 'blocks',     path: '.next/static/chunks/app/blocks/page-*.js',  limit: '140 kB' },
]
```

### Mandatory dynamic imports

Anything here appearing in an initial chunk is a CI failure. `pnpm analyze` produces the treemap
that proves it.

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
| Syntax highlighter (runtime) | 24 kB | Generated code is displayed |

### Tree-shaking discipline

- Named exports only from packages. A default export of an object graph defeats shaking.
- `"sideEffects": false` in every package's `package.json` except those with CSS imports, which
  list the CSS files explicitly.
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
- `will-change` only during an active gesture.
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
<FpsMeter />        // status bar, dev + optional in prod
<RenderCounter id="canvas-root" />   // dev only
```

`RenderCounter` is how the "zero re-renders" budgets are asserted rather than assumed.

### In CI

```yaml
- Lighthouse CI on /, /blocks, /docs (mobile + desktop), asserted against budgets
- size-limit on every route entry
- Playwright performance traces:
    - pan 200 nodes → long-task count and frame timings
    - drag a node → same
    - scrub a slider → assert canvas render count === 0
    - switch theme → assert React render count === 0
- Bundle treemap uploaded as an artifact on every PR
```

The render-count assertions are the most valuable of these. Frame timings on CI hardware are
noisy; a render count is exact.

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
| `motion` | ~34 kB | Core to the product; used on every surface including the landing |
| `@dnd-kit/core` + `sortable` | ~26 kB | Required for the studio's primary interaction; accessibility is not retrofittable |
| `zustand` + `immer` | ~14 kB | The state architecture |
| `zod` | ~14 kB (tree-shaken) | Schema is the contract; drives validation and the inspector |

Nothing else. Every other dependency above 20 kB is dynamically imported.
