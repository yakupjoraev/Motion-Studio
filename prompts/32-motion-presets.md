# 32 — Motion presets

**Milestone** M6 · **Depends on** 31 · **Commit** `feat(motion): add preset catalogue`

## Read first

- `docs/ANIMATION_SYSTEM.md` — § Preset catalogue (the full tables), § Adding a preset, § Codegen
- `docs/DESIGN_SYSTEM.md` — § Motion tokens

## Goal

All 40+ presets from the catalogue, across five channels. Each with parameters, a reduced variant, a
codegen fragment, inspector control metadata, and a cost class.

This is a volume prompt. If context runs short, stop at a channel boundary and report which channels
remain — the meta-tests will keep the finished ones honest.

## Deliverables

```
packages/motion/src/presets/
├── entrance/     fade, fade-up, fade-down, fade-left, fade-right, scale-in, blur-in,
│                 clip-reveal, text-reveal, flip-in, stagger-children, draw-line, counter
├── scroll/       parallax, scroll-fade, scroll-scale, scroll-rotate, sticky-stack,
│                 progress-bar, horizontal-scroll, scroll-timeline, marquee
├── hover/        lift, scale-hover, magnetic, tilt-3d, liquid, glow-hover, border-beam,
│                 shine, underline-grow, icon-swap, text-scramble
├── cursor/       spotlight, cursor-follow, cursor-glow, gradient-follow, mask-reveal
├── continuous/   float, pulse, aurora, gradient-shift, orbit, noise-shift, beam, typewriter
├── exit/         fade-out, scale-out, slide-out, blur-out, collapse
├── index.ts      the preset registry
└── presets.meta.test.ts   the gate over every preset
```

## Constraints

### Four things per preset, all required by the type

```ts
export const fadeUp = definePreset({
  id: 'fade-up',
  channel: 'entrance',
  engine: 'motion',
  paramsSchema: z.object({
    distance: z.number().min(0).max(200).default(24),
    duration: z.number().min(0).max(3000).default(600),
    delay: z.number().min(0).max(3000).default(0),
    easing: easingNameSchema.default('expoOut'),
  }),
  controls: [
    { path: 'distance', kind: 'slider', label: 'Distance', min: 0, max: 200, unit: 'px' },
    { path: 'duration', kind: 'slider', label: 'Duration', min: 0, max: 3000, unit: 'ms' },
    { path: 'easing', kind: 'select', label: 'Easing', options: EASING_OPTIONS },
  ],
  capabilities: { composableWith: ['hover', 'cursor'], costClass: 'cheap' },
  resolve: (p, ctx) => ({ /* ... */ }),
  resolveReduced: (p) => ({ /* opacity only, 120ms */ }),
  codegen: (p, ctx) => ({ /* imports, hoisted consts, wrapper */ }),
})
```

`resolveReduced` and `codegen` are **required by the type**, so a preset cannot ship without them.
Verify the type enforces it — try omitting one and confirm a compile error.

### Engine selection per preset

Use the table in `ANIMATION_SYSTEM.md` § Engine selection:
- `css` for hover, press, and simple continuous effects — cheapest, no JS on the interaction path
- `motion` for entrance, exit, layout, springs, in-view triggers
- `gsap` **only** for `horizontal-scroll`, `scroll-timeline`, and `text-reveal`'s character splitting

Every `gsap` preset needs a comment naming what Motion could not do. If you cannot write that
sentence honestly, use Motion.

### The ones with real substance

**`magnetic`** — element leans toward the cursor within a radius, spring-returned. Reads from the
pointer bus, writes CSS variables. Zero React renders. Radius and strength as params.

**`tilt-3d`** — `rotateX`/`rotateY` from cursor position within the element, with an optional glare
layer. Perspective on the parent, transform on the child — a single-element implementation looks
wrong and this is the usual mistake.

**`marquee`** — infinite loop via duplicated content and a CSS translate animation. Must be seamless
(no visible jump), pause on hover, and handle content narrower than the container. Test the seam.

**`sticky-stack`** — cards pin and scale as they scroll past. GSAP-free if possible using
`position: sticky` plus a scroll-driven scale; if you need GSAP, say why.

**`text-reveal`** — split by line, word, or char with a mask reveal. Splitting must preserve
accessibility: the original text stays in an `aria-label` or an `sr-only` copy, because a screen
reader reading 40 individual `<span>`s letter by letter is a serious regression. This is required.

**`counter`** — count-up with an `Intl.NumberFormat` format param. Under reduced motion, shows the
final value immediately.

**`aurora`** — the continuous drift used by `hero-aurora`. Pure CSS. `costClass: 'moderate'`,
`gpuHeavy: true`.

**`spotlight` / `cursor-glow` / `gradient-follow` / `mask-reveal`** — all four write only CSS
variables from the pointer bus, which is why they compose with everything.

### Reduced variants

Per-channel policy from `ANIMATION_SYSTEM.md`. Specifically:
- Every `entrance` reduced variant is opacity-only at 120 ms
- Every `scroll` reduced variant is the static end state
- Every `cursor` and `continuous` reduced variant is **disabled**, returning an empty resolved motion
- No preset may flash faster than 3 Hz at **any** parameter value — clamp the ranges so it is
  impossible, not merely unlikely. Check every `duration`/`speed` minimum.

### The meta-test

```ts
describe.each(Object.values(presets))('$id', (preset) => {
  it('resolves with defaults', () => { /* ... */ })
  it('defaults satisfy paramsSchema', () => { /* ... */ })
  it('every control path exists in paramsSchema', () => { /* ... */ })
  it('reduced variant removes transforms', () => { /* ... */ })
  it('cursor and continuous reduce to disabled', () => { /* channel-conditional */ })
  it('declares a cost class', () => { /* ... */ })
  it('codegen matches its golden file', () => { /* ... */ })
  it('cannot flash faster than 3Hz at any param extreme', () => { /* ... */ })
})
```

## Verify

```bash
pnpm --filter @motion-studio/motion test --coverage
pnpm dev:storybook       # motion.mdx gallery
```

Beyond the meta-tests:
- `marquee` seam: assert the duplicated-content offset math produces no gap
- `text-reveal`: the accessible text is present as a single readable string
- `counter`: reduced variant shows the final value
- `magnetic` and `tilt-3d`: given a pointer position, the computed CSS variable values are correct
- All `gsap` presets: exactly three, each with a justification comment (grep and count)

Manual, in Storybook:
- Every preset, live, with its controls. Drag each parameter to its extremes and confirm nothing
  breaks or flashes.
- Toggle reduced motion → every preset degrades to something coherent, nothing disappears
  unexpectedly
- `magnetic`, `tilt-3d`, and the four cursor presets: add a render counter to the story and confirm
  **zero renders** while moving the cursor. Report the numbers.
- `text-reveal` with a screen reader → report what it reads

## Done when

- [ ] 40+ presets across six channels, all four required fields present
- [ ] The type enforces `resolveReduced` and `codegen` (verified by attempting to omit one)
- [ ] Exactly three GSAP presets, each justified in a comment
- [ ] `marquee` seamless; `text-reveal` accessible; `tilt-3d` uses parent perspective
- [ ] Cursor and continuous presets cause zero renders on pointer move; reported
- [ ] Every preset flash-safe at every parameter extreme, tested
- [ ] All meta-tests pass, including codegen golden files
- [ ] Storybook gallery reviewed at parameter extremes and under reduced motion
