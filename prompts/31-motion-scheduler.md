# 31 — Motion scheduler

**Milestone** M6 · **Depends on** 30 · **Commit** `feat(motion): add shared observer and frame scheduler`

## Read first

- `docs/ANIMATION_SYSTEM.md` — § The scheduler, § GPU discipline
- `docs/PERFORMANCE.md` — § Motion performance, § Layer count

## Goal

One `IntersectionObserver` per threshold bucket. One scroll listener. One `pointermove` listener. One
`rAF` loop. Shared by every animated node in the document.

The naive alternative — one observer and one listener per node — is the difference between 60 fps and
22 fps on a page with 40 animated elements. This prompt is small in code and large in consequence.

## Deliverables

```
packages/motion/src/scheduler/
├── scheduler.types.ts        MotionScheduler, ScrollProgress, VisibilityCallback
├── create-scheduler.ts       the implementation
├── intersection-pool.ts      one observer per threshold bucket
├── scroll-bus.ts             one passive listener, rAF-batched distribution
├── pointer-bus.ts            one document pointermove, rAF-throttled
├── frame-loop.ts             one rAF loop; skips off-screen; stops when empty
├── caps.ts                   gpuHeavy and continuous instance caps
├── scheduler-context.tsx     provider + useScheduler
└── *.test.ts
```

Plus the apply layer that consumes it:

```
packages/motion/src/apply/
├── motion-node.tsx           <MotionNode spec>: routes to the right engine
├── css-motion.tsx
├── framer-motion.tsx
├── gsap-motion.tsx           dynamically imports gsap
├── use-resolved-motion.ts
├── use-will-change.ts        adds on gesture start, removes on end
└── *.test.tsx
```

## Constraints

### `intersection-pool.ts`

Consumers ask for a threshold; the pool buckets to the nearest of a fixed set
(`[0, 0.1, 0.25, 0.5, 0.75, 1]`) and keeps **one observer per bucket**. Rounding thresholds is
acceptable — a preset asking for 0.3 gets 0.25, and nobody can perceive the difference. Unbounded
distinct thresholds would defeat the whole point.

Test: 50 consumers across 6 thresholds → exactly 6 observers created.

### `scroll-bus.ts`

One `{ passive: true }` scroll listener on the scroll container. On event, set a dirty flag; in the
`rAF` loop, compute progress **once** and distribute to all subscribers. Never compute per subscriber
inside the event handler.

Test: 100 subscribers, 10 scroll events in one frame → progress computed once, distributed 100 times,
one `rAF` scheduled.

### `pointer-bus.ts`

One document-level `pointermove`, `rAF`-throttled. Cursor presets read the coordinates and **write CSS
variables directly** — no React, no store. That is why the cursor channel composes with everything and
costs nothing.

### `frame-loop.ts`

- One `rAF` loop ticking registered callbacks
- **Skips callbacks whose element is off-screen** (using the intersection pool's data)
- **Stops entirely** when no callbacks are registered
- **Stops on `visibilitychange`** to hidden, resumes on visible
- Passes `dt` so animations are frame-rate independent

Test: register, tick, unregister all → the loop cancels its `rAF`. Assert with a mocked `rAF` that no
further frames are requested.

### `caps.ts`

- `gpuHeavy` presets capped at **3** simultaneous instances
- `continuous` presets capped at **6** in the viewport
- Beyond the cap, new instances render their **static end state** — not a degraded animation, not
  nothing. A missing background is a visual bug; a static background is a design.
- The cap is per viewport, so scrolling changes which instances animate. Recompute on visibility
  change, not on every frame.

Test each cap with N+2 instances and assert the excess are static.

### `use-will-change`

```ts
export function useWillChange(ref: RefObject<HTMLElement>, properties: string[]): { start(): void; stop() : void }
```

Adds `will-change` on gesture/animation start, **removes it on end**. A permanent `will-change` on 40
elements is a memory problem and can be slower than none. Test that it is removed.

### GSAP

`gsap-motion.tsx` dynamically imports `gsap` and `ScrollTrigger` on first use. Every GSAP usage needs
a comment naming what Motion could not do — that is the rule from `TECH_STACK.md`.

**One engine owns an element.** The resolver already detects conflicts; here, throw in development if
a node's resolved motion would have two engines touching `transform`.

### Motion pause

Consume the `viewport.motionPaused` flag wired in prompt 21: pause the frame loop, freeze Motion
animations, and pause GSAP timelines. `Cmd+Shift+P` replays entrances by remounting the animated
subtree with a fresh key — say so in a comment, because it looks like a hack and it is the correct
approach.

## Verify

```bash
pnpm --filter @motion-studio/motion test --coverage
pnpm dev
```

Required assertions:
- 50 consumers, 6 thresholds → 6 observers
- 100 scroll subscribers, 10 events in a frame → 1 progress computation, 1 `rAF`
- Frame loop stops when empty and on `visibilitychange`
- Off-screen callbacks skipped
- `gpuHeavy` cap at 3: the 4th and 5th instances are static
- `continuous` cap at 6: same
- `will-change` removed after the animation ends
- Two engines on one element → throws in development

Manual, with a fixture page containing 20 animated sections and 4 continuous effects:
- Open DevTools Performance with 4× CPU throttle, scroll through the page, and report: long-task
  count, frame timing, and whether it held ~60 fps
- Check the Event Listeners panel: report the count of `scroll` and `pointermove` listeners. It should
  be 1 each, not 20.
- Switch to another tab for 10 seconds, come back → report whether CPU dropped (Task Manager) while
  hidden
- `Cmd+P` in the studio → all motion freezes; `Cmd+Shift+P` → entrances replay

## Done when

- [ ] One observer per threshold bucket, tested with 50 consumers
- [ ] One scroll listener, one pointer listener, one frame loop — verified in the browser's listener
      panel and reported
- [ ] Frame loop stops when empty and while the tab is hidden; CPU drop confirmed
- [ ] Off-screen callbacks skipped
- [ ] Both caps enforced with static fallback, tested
- [ ] `will-change` lifecycle correct
- [ ] GSAP dynamically imported, with justification comments
- [ ] Motion pause and entrance replay working
- [ ] 20 animated sections hold 60 fps under 4× throttle; numbers reported
