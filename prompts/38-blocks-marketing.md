# 38 — Blocks: marketing

**Milestone** M8 · **Depends on** 37 · **Commit** `feat(blocks): add marketing blocks`

## Read first

- `docs/COMPONENT_LIBRARY.md` — § Catalogue (Marketing), § Writing a block
- `docs/DESIGN_SYSTEM.md` — § Typography, § Elevation, § Radius (nested radius rule)
- `docs/ANIMATION_SYSTEM.md` — § Preset catalogue

## Goal

The twelve marketing blocks — the ones a user actually assembles a landing page from. These carry the
most design weight in the whole registry, because a pricing table that looks generic makes the entire
product look generic.

## Deliverables

```
packages/blocks/src/marketing/
├── feature-grid/          icon + title + text cells, 2–4 columns, optional card treatment
├── feature-split/         alternating text/media rows, reversible per row
├── bento-grid/            asymmetric grid with span controls per cell, container queries
├── pricing-table/         cards | table | compact; interval toggle; highlight; feature lists
├── testimonial-card/      quote, avatar, name, role, company, optional logo
├── testimonial-marquee/   infinite scrolling rows, alternating direction, pause on hover
├── logo-cloud/            grid or marquee, grayscale-to-colour on hover, sizes normalised
├── cta-banner/            full-width band with gradient/glass options
├── cta-split/             text + form or text + buttons
├── faq-accordion/         Radix Accordion, single or multiple open, schema.org markup option
├── comparison-table/      feature matrix with sticky header and first column
├── newsletter-form/       email input + submit, states: idle/loading/success/error
└── index.ts
```

## Constraints

### Nested radius

Every card-in-container uses `innerRadius(outer, gap)` from `utils`. A `lg` (12 px) card with `p-2`
(8 px) gives its child `xs` (4 px). Eyeballing this is why most generated UI looks slightly wrong, and
the helper exists precisely so nobody eyeballs it.

### `pricing-table`

The most-used block in the registry, so it gets the most care:

- Three layouts: `cards` (default), `table` (feature matrix), `compact` (single row)
- Interval toggle with a real state change, animated with a layout transition
- Highlighted plan: raised, accent border, an optional "Most popular" badge — and it must not shift
  the other cards' heights
- Feature lists with per-item `included` booleans rendering check/dash icons, not colour alone
- The `plans` prop is a `list` control with sortable items and per-item sub-controls
- Semantic: each plan is an `<article>` with a heading; the price is not a heading
- At 360 px: cards stack, and the highlighted one comes first

### `bento-grid`

- Per-cell `colSpan`/`rowSpan`, responsive
- Cells are slots accepting `*`, so a user can put anything in them
- **Gapless option** — cells sharing borders instead of gaps, which is the look most bento
  implementations miss
- Cells opt into container queries (`capabilities.containerQuery: true`) so their contents respond to
  cell width, not viewport width

### `testimonial-marquee` and `logo-cloud` marquee mode

Both use the `marquee` preset — **not** a local implementation. If the preset cannot express what the
block needs, extend the preset. Two marquee implementations is exactly the drift this architecture
exists to prevent.

Both must: be seamless, pause on hover, disable entirely under reduced motion (falling back to a
static grid that looks intentional), and handle content narrower than the container.

### `faq-accordion`

Radix Accordion. Options: single or multiple open, default-open index, and an optional `FAQPage`
JSON-LD emission (a real SEO feature, and a differentiator over hand-rolled accordions). The JSON-LD is
generated in codegen, not rendered in the canvas — note that in the codegen descriptor.

### `comparison-table`

Sticky header row and sticky first column, which needs `position: sticky` on both axes and correct
`z-index` layering. Horizontally scrollable inside its own `overflow-x: auto` container so the page
never scrolls sideways. Keyboard-scrollable with `tabindex="0"` + `role="region"` + label.

### `newsletter-form`

Four visual states. The submit handler is a **prop** (`onSubmit`), defaulting to a no-op with a note in
the exported code — the block must not invent a backend, and the export must make it obvious where the
user plugs theirs in. Emit a comment in the generated code saying so.

Validation: HTML `type="email"` plus a real error message tied with `aria-describedby` and
`aria-invalid`.

### Universal

- Semantic HTML, correct heading levels (blocks take a `headingLevel` prop so they nest correctly)
- All geometric props responsive
- `axe` clean; every icon-only element labelled
- `defaultMotion`: `fade-up` entrance with child stagger; `lift` on hover for cards
- Usable at 360 px — check every one
- `costClass`: `cheap` except the two marquees (`moderate`)

## Verify

```bash
pnpm --filter @motion-studio/blocks test
pnpm dev:storybook
```

Tests: meta-tests plus
- `pricing-table`: all three layouts; highlight does not change sibling heights (assert computed
  heights); feature `included` renders an icon, not colour alone
- `bento-grid`: span props produce the expected grid placement; gapless mode
- Marquee blocks use the preset (assert the resolved motion references `marquee`)
- `faq-accordion`: keyboard operation via Radix; JSON-LD emitted only in codegen
- `comparison-table`: sticky offsets; region is keyboard-scrollable
- `newsletter-form`: all four states; `aria-invalid` and `aria-describedby` on error
- `headingLevel` prop produces the right tag

Manual, and report:
- Assemble a full landing page: navbar placeholder → hero → feature-grid → bento → pricing → 
  testimonials → faq → cta. Look at it. Would you ship it? Fix defaults, not props.
- Every block at 360, 768, 1440
- Three themes: `studio-dark`, `paper`, `brutal`
- Reduced motion: both marquees fall back to something that looks intentional
- Keyboard: FAQ, pricing interval toggle, comparison table scroll, newsletter form

## Done when

- [ ] Twelve marketing blocks, nine files each
- [ ] Nested radius via `innerRadius` everywhere a card sits in a container
- [ ] `pricing-table` complete in three layouts with a non-shifting highlight
- [ ] `bento-grid` with spans, gapless mode, and container queries
- [ ] Both marquees use the shared preset; reduced-motion fallbacks look intentional
- [ ] `faq-accordion` JSON-LD in codegen only
- [ ] `comparison-table` sticky on both axes, keyboard-scrollable
- [ ] `newsletter-form` takes a handler prop with an explanatory codegen comment
- [ ] Full-page assembly reviewed and judged; defaults fixed where needed
- [ ] Meta-tests pass; axe clean; usable at 360 px
