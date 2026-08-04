# 34 — Motion integration and performance pass

**Milestone** M6 · **Depends on** 33 · **Commit** `perf(motion): verify scheduler under load and wire block defaults`

## Read first

- `docs/ANIMATION_SYSTEM.md` — § GPU discipline, § Composition
- `docs/PERFORMANCE.md` — § Motion performance, § Layer count
- `docs/ACCESSIBILITY.md` — § Reduced motion

## Goal

Motion is now built; this prompt proves it holds up. Wire every existing block's `defaultMotion`,
build a stress fixture, measure, and fix what the measurement finds.

No new features. This is the prompt that catches the difference between "the presets work" and "the
product is smooth".

## Deliverables

```
apps/web/src/components/studio/canvas-area/
└── node-motion.tsx              applies composed motion per node, consuming the scheduler

e2e/fixtures/documents/
├── stress-200-nodes.motion.json
├── stress-motion-heavy.motion.json      20 animated sections, 6 continuous effects
└── stress-glass.motion.json             8 glass surfaces

e2e/perf/
├── motion-heavy.spec.ts
├── scroll-fps.spec.ts
└── reduced-motion-off.spec.ts

docs/PERFORMANCE.md                       updated with the measured numbers
```

Plus: every block from prompts 24–26 gets its `defaultMotion` filled in with a real spec.

## Constraints

### `defaultMotion` for existing blocks

| Block group | Entrance | Hover |
| --- | --- | --- |
| Layout (`section`) | `fade-up`, stagger children 60 ms | — |
| Layout (others) | — | — |
| Heroes | `fade-up`, stagger 80 ms | — |
| `heading`, `text` | `fade-up` distance 16 | — |
| `image` | `blur-in` | — |
| `quote`, `stat` | `fade-up` | — |
| `badge` | `scale-in` | — |
| `code-block` | `fade` | — |

Sparse on purpose. A document where every block animates is worse than one where the sections do — and
the default should be the tasteful choice, because most users will not change it.

### The measurement pass

For each stress fixture, with **4× CPU throttling**, measure and record:

1. Frame timing while scrolling the full document (median, p95, worst)
2. Long-task count and total blocking time
3. Compositing layer count (DevTools Layers panel)
4. Listener counts for `scroll`, `pointermove`, `resize` (should be 1, 1, 1)
5. `IntersectionObserver` instance count (should be ≤ 6)
6. Memory after 5 minutes of scrolling and editing
7. CPU while the tab is hidden (should be near zero)

Record actual numbers in the report **and** in `docs/PERFORMANCE.md`. A budget without a measured
baseline is a wish.

### What to do with what you find

If a target is missed, fix the cause, do not lower the target:

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| Frames over 16 ms while scrolling | Layout-triggering animation | Move to `transform`/`opacity` |
| Long tasks on scroll | Per-subscriber work in the event handler | Batch in the frame loop |
| Layer count over 40 | Permanent `will-change` or too many `backdrop-filter` | Lifecycle `will-change`; enforce the glass cap |
| Multiple scroll listeners | A component bypassing the scroll bus | Route it through the scheduler |
| Memory climbing | Unreleased observers or an uncancelled `rAF` | Audit cleanups |
| CPU while hidden | Frame loop not stopping | Fix the `visibilitychange` handler |

### E2E performance specs

```ts
test('scrolling a motion-heavy document holds the frame budget', async ({ page }) => {
  await page.goto('/studio?fixture=stress-motion-heavy')
  const client = await page.context().newCDPSession(page)
  await client.send('Emulation.setCPUThrottlingRate', { rate: 4 })

  const trace = await recordScroll(page, { duration: 5000 })

  expect(trace.longTasks.length).toBeLessThan(5)
  expect(trace.p95FrameTime).toBeLessThan(20)
})
```

Frame timings on CI runners are noisy, so these assertions use generous thresholds and exist to catch
**regressions of kind**, not to police milliseconds. State that in a comment so nobody tightens them
into flakiness.

### Reduced-motion spec

```ts
test('reduced motion disables transform animations', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/studio?fixture=stress-motion-heavy')

  const animations = await page.evaluate(() =>
    document.getAnimations().map((a) => (a.effect as KeyframeEffect)?.getKeyframes?.() ?? []))

  const transformAnimations = animations.flat().filter((k) => 'transform' in k)
  expect(transformAnimations).toHaveLength(0)
})
```

Plus: assert the page is still fully coherent — every section visible, no element left at opacity 0.
That second assertion matters more than the first; the classic reduced-motion bug is content that
never appears because its reveal animation was disabled.

## Verify

```bash
pnpm test
pnpm test:e2e:perf
pnpm dev
```

Then perform the seven measurements above on all three fixtures and report every number.

Manual:
- Scroll `stress-motion-heavy` on the slowest machine available. Report honestly whether it feels
  smooth.
- Toggle reduced motion → the same document is coherent and complete
- Switch tabs for 30 seconds → CPU near zero
- Open the studio, apply motion to 20 nodes by hand, and check the canvas still responds instantly to
  selection and panning

## Done when

- [ ] `defaultMotion` set for all 22 existing blocks, sparse and tasteful
- [ ] Three stress fixtures committed
- [ ] All seven measurements taken on all three fixtures, numbers reported and written into
      `docs/PERFORMANCE.md`
- [ ] 1 scroll listener, 1 pointer listener, ≤ 6 observers — verified in the browser
- [ ] Layer count under 40 on the glass fixture
- [ ] CPU near zero while hidden
- [ ] No memory growth over 5 minutes
- [ ] Reduced motion: zero transform animations **and** a fully coherent page
- [ ] Every missed target fixed at the cause, not by lowering the target
- [ ] M6 complete
