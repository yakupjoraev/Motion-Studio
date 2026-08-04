# 25 — Blocks: hero

**Milestone** M4 · **Depends on** 24 · **Commit** `feat(blocks): add hero blocks`

## Read first

- `docs/DESIGN_REFERENCES.md` — § Applying it per surface. Heroes are **maximum loudness**: this is
  the surface where the reference applies at full strength.
- `docs/COMPONENT_LIBRARY.md` — § Writing a block, § Catalogue (Hero)
- `docs/DESIGN_SYSTEM.md` — § Typography, § Gradients, § Blur and glass
- `docs/VISION.md` — § Design principles (specifically: beautiful by default)
- `docs/PERFORMANCE.md` — § Images (the LCP rule)

## Goal

Six hero blocks that look intentional with zero configuration. This is the prompt where "beautiful by
default" gets tested — a hero dropped with defaults is the first thing a user sees, and if it looks
like a bootstrap template the product has failed its premise.

## Deliverables

```
packages/blocks/src/hero/
├── hero-centered/       centred stack: eyebrow, h1, subtitle, CTA pair, optional trust row
├── hero-split/          text left, media right; reversible; media = image | video | code | custom slot
├── hero-aurora/         centred with an animated aurora background + noise
├── hero-video/          full-bleed muted looping video with an overlay scrim
├── hero-terminal/       text + an animated terminal window (typing, prompt, output lines)
├── hero-app-preview/    text + a perspective-tilted app screenshot with a glow
└── index.ts
```

## Constraints

### Typography is the whole game

- Headline uses `display-1` (`clamp(2.5rem, 6vw, 5rem)`), `font-semibold`, `tracking-tight`,
  `text-balance`.
- Subtitle at `text-lg`/`text-xl`, `foreground-muted`, `max-w-2xl`, `text-pretty`.
- Eyebrow at `text-xs`, `uppercase`, `tracking-[0.12em]`, muted or in an accent pill.
- Vertical rhythm: eyebrow → 24 px → headline → 24 px → subtitle → 40 px → CTAs.

A hero that looks generic is almost always a typography failure, not a colour one. Spend the effort
here.

### The LCP rule

**The LCP element must be static text.** No hero's largest contentful paint may be an image, a video,
or an animated element. Concretely:

- `hero-aurora`'s background is decorative, `aria-hidden`, and rendered *after* the text in DOM order
- `hero-video`'s video has `poster`, `preload="metadata"`, and never blocks text paint
- `hero-app-preview`'s screenshot is `priority` but the headline is still the larger element

Write this as a comment in each block. It is the single highest-leverage performance decision on the
landing page.

### `hero-aurora`

- Two or three stacked `radial-gradient`s, blurred, slowly drifting
- Pure CSS animation (`background-position` or `transform` on the gradient layers) — **not** WebGL,
  **not** canvas. It must export as plain CSS.
- `costClass: 'moderate'`; `capabilities.requiresBackdrop: false` (it *is* the backdrop)
- Drift disabled entirely under reduced motion, leaving the static gradient — which must look good on
  its own. Check it.
- Noise overlay at `subtle`, `mix-blend-mode: overlay`, `pointer-events: none`

### `hero-video`

- `muted`, `loop`, `playsInline`, `preload="metadata"`, with a `poster`
- Does not autoplay under reduced motion — shows the poster, and the poster must carry the design
- Overlay scrim as a gradient so text contrast holds regardless of the video content; the block
  validates nothing, so the scrim must be strong enough by default
- `capabilities.costClass: 'heavy'`
- Requires a `captions` track or declares itself decorative; the export warns when neither

### `hero-terminal`

- The typing animation is a motion preset reference (`typewriter`), not hand-coded — that is the rule
  in `ANIMATION_SYSTEM.md`. Stub the spec now.
- Terminal content is a `list` prop of lines, each with a kind (`prompt` | `output` | `error`)
- Monospace, correct line height, a real window chrome (traffic lights or a title bar, themed)
- Fully readable with animation disabled

### `hero-app-preview`

- `rotateX`/`rotateY` in a perspective container, values as props
- Accent glow behind the image, derived from the theme accent
- `next/image` with `priority`, explicit dimensions, and `sizes`
- The tilt is static by default; `tilt-3d` on `hover` is opt-in

### Universal

- Every hero: `<section>`, one `<h1>`, CTAs as `<a>` or `<button>` correctly by role
- Slots: `hero-split` has a `media` slot accepting `*` so a user can put any block there
- All geometric props responsive; `align` responsive
- Usable and good-looking at 360 px — check every one, not just the centred variant
- `axe` clean; decorative layers `aria-hidden`
- `defaultMotion`: `fade-up` entrance with a child stagger

## Verify

```bash
pnpm --filter @motion-studio/blocks test
pnpm dev:storybook
```

Tests: meta-tests plus
- Exactly one `<h1>` per hero
- Decorative layers are `aria-hidden`
- `hero-video` renders the poster and does not autoplay when reduced motion is emulated
- `hero-aurora` static variant renders when reduced motion is emulated

Manual — this is the important part, and report your judgement honestly:
- Open impeccable.style beside your work. For each hero, drop it with **defaults only** and compare.
  The question is not "is this acceptable" — it is **"does this hold up next to the reference?"** If
  not, fix the defaults, not the props, and say what you changed.
- A hero that is merely tidy is not done. The difference is usually one of: gradient quality, depth
  and layering, typographic tracking at display sizes, or the timing of the entrance.
- Each hero at 360, 768, and 1440 px
- Both colour modes; three theme presets (`studio-dark`, `paper`, `brutal`)
- Reduced motion on: every hero still looks finished, not broken
- Lighthouse on a temporary page containing only `hero-aurora`: report LCP and confirm the LCP
  element is the headline text, not the background

## Done when

- [ ] Six heroes, nine files each
- [ ] LCP element is static text in every hero, commented in each
- [ ] `hero-aurora` is pure CSS and exports as CSS
- [ ] Reduced-motion variant of every hero looks finished
- [ ] Each hero compared side by side with impeccable.style and judged against it — reported honestly
- [ ] Each hero's doc comment names its design reference and explains its technique
- [ ] Every hero checked at 360/768/1440 and in three themes
- [ ] LCP verified on an aurora-only page; element confirmed to be text
- [ ] Meta-tests pass; axe clean
