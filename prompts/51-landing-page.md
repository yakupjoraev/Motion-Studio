# 51 — Landing page

**Milestone** M12 · **Depends on** 50 · **Commit** `feat(web): add landing page`

## Read first

- `docs/PRODUCT.md` — § 9. Landing page
- `docs/VISION.md` — § The problem, § The product (this is the page's argument)
- `docs/PERFORMANCE.md` — § Public pages, § Images, § Fonts
- `docs/ARCHITECTURE.md` — § Rendering strategy

## Goal

The landing page is a product surface, not a formality. It is the first thing a reader sees, and it
must **demonstrate the thing it describes** — built with our own blocks, animated with our own presets,
themed with our own tokens.

Hard constraint: Lighthouse ≥ 95 on all four categories, mobile, with LCP ≤ 2.0 s. A landing page for a
performance-conscious tool that scores 78 is an argument against the product.

## Deliverables

```
apps/web/
├── app/
│   ├── page.tsx                      RSC, streamed
│   └── opengraph-image.tsx           generated OG image
└── src/components/landing/
    ├── hero/
    │   ├── hero.tsx                  static text LCP + a live interactive demo island
    │   └── hero-demo.tsx             'use client' — a real draggable canvas node
    ├── problem.tsx                   the gap between design tools and component libraries
    ├── effect-grid.tsx               live effects, staggered reveal
    ├── inspector-walkthrough.tsx     scroll-driven: a value changes, the preview follows
    ├── export-reveal.tsx             the code that comes out, typed in on scroll
    ├── architecture.tsx              the diagram, animated on reveal
    ├── stack.tsx                     the stack, honestly
    ├── cta.tsx
    └── landing-nav.tsx
```

## Constraints

### Rendering

- **Server Components by default.** Client islands only where interaction requires them: `hero-demo`,
  `effect-grid` (hover), `inspector-walkthrough` (scroll).
- Streamed with `Suspense` boundaries around the heavier islands.
- Each island's JS is measured. Report the per-island size.

### The LCP element is static text

The `<h1>` is server-rendered text with no animation gating its paint. The hero demo, the aurora
background, and every effect load **after**. Everything else in this prompt is negotiable; this is not.

### The interactive hero demo

A real canvas node the visitor can drag. It uses the actual `canvas` package with one node and a
reduced feature set — not a video, not a GIF. That authenticity is the entire point: the visitor
experiences the product in the first five seconds.

Constraints on it: under 40 kB of JS, mounts after the text paints, and degrades to a static rendered
node when JS is unavailable or reduced motion is on (with a caption saying "Interactive demo — open the
studio").

### The inspector walkthrough

Scroll-driven: as the visitor scrolls, a value in a mock inspector changes and the preview beside it
responds. Uses `scroll-timeline`-class motion via the shared scheduler.

Under reduced motion, this becomes a **static before/after pair** with a caption. Not a broken
half-state — a designed alternative. Check it.

### The export reveal

Show real generated code, generated at build time from a real `.motion` fixture by running our own
codegen. Highlighted with Shiki at build time (zero runtime cost).

Generating it at build time means the landing page cannot show code the exporter would not actually
produce. That honesty is worth the build step.

### The architecture diagram

The diagram from `README.md`, as SVG or styled HTML, animating in on reveal. Fully readable static, and
labelled for screen readers with a text alternative describing the structure.

### The stack section

List the stack honestly, with the reason for each choice in one line — a condensed version of
`TECH_STACK.md`. Engineers read this section and judge the project by whether the reasons are real.

### Reduced motion

The **entire page** must be coherent with zero animation:
- No content revealed only by a scroll trigger
- Nothing at opacity 0 waiting for an entrance
- The walkthrough becomes a static comparison
- The effect grid shows static states
- The export reveal shows the finished code

Check it by loading the page with the media feature emulated and reading it top to bottom.

### Images and fonts

- `next/image` everywhere, AVIF/WebP, explicit dimensions, real `sizes`
- Only the sans 400 and 600 weights preloaded
- `adjustFontFallback` so the font swap does not shift layout — most of a CLS budget goes here
- OG image generated with `next/og`

## Verify

```bash
pnpm build      # report first-load JS for /
pnpm start
pnpm exec lighthouse http://localhost:3000 --preset=desktop
pnpm exec lighthouse http://localhost:3000 --form-factor=mobile
```

Report **all eight scores** (four categories × two form factors), plus LCP, CLS, INP, TBT, and
first-load JS.

If Performance is under 95, fix the cause. The usual suspects, in order: an image or animation as the
LCP element, an oversized client island, a font shift, or an unnecessary client component.

Then:
```bash
pnpm test:e2e:a11y      # axe on /
```

Manual, and report:
- Read the whole page. Does it make the argument in `VISION.md` clearly?
- Drag the hero demo → does it feel like the real product?
- With reduced motion emulated: read the page top to bottom. Is anything missing or stuck invisible?
- With JS disabled: is the page still readable and complete?
- At 320 px width: no horizontal scroll, everything legible
- At 200 % browser zoom: nothing clips
- Tab through the whole page: skip link first, logical order, visible focus throughout
- With a screen reader: report what the architecture diagram announces

## Done when

- [ ] All eight Lighthouse scores ≥ 95; every metric reported
- [ ] LCP ≤ 2.0 s mobile, and the LCP element is confirmed to be the `<h1>` text
- [ ] CLS ≤ 0.02
- [ ] First-load JS ≤ 120 kB; per-island sizes reported
- [ ] Hero demo is the real canvas, under 40 kB, degrades gracefully
- [ ] Export reveal generated at build time by our own codegen
- [ ] Entire page coherent with zero animation — verified by reading it under reduced motion
- [ ] Readable with JS disabled
- [ ] Zero axe violations; full keyboard pass; screen-reader diagram alternative verified
- [ ] The page makes the product's argument — judged and reported
