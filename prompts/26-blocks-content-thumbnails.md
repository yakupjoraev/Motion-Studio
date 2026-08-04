# 26 — Blocks: content + thumbnail generation

**Milestone** M4 · **Depends on** 25 · **Commit** `feat(blocks): add content blocks and thumbnail generation`

## Read first

- `docs/COMPONENT_LIBRARY.md` — § Catalogue (Content), § Thumbnails
- `docs/DESIGN_SYSTEM.md` — § Typography
- `docs/PERFORMANCE.md` — § Images

## Goal

The nine content blocks, plus the thumbnail generator that makes the block palette usable — and which
becomes a CI gate so no block can be added without one.

## Deliverables

```
packages/blocks/src/content/
├── heading/        extend from prompt 22: gradient text, balance, anchor id
├── text/           paragraph: size, measure, muted, columns, drop cap
├── rich-text/      restricted formatting: bold, italic, link, code, list
├── image/          next/image wrapper: aspect, fit, radius, caption, alt (required)
├── video/          embed or file: poster, controls, captions track, aspect
├── code-block/     syntax-highlighted, line numbers, filename, copy button, highlight lines
├── quote/          blockquote with attribution, avatar, large-quote-mark variant
├── stat/           value + label + delta + optional sparkline
├── badge/          pill: variant, icon, dot, size
└── index.ts

scripts/
└── generate-thumbnails.mjs      Playwright render + screenshot + WebP + WebM hover clip
```

## Constraints

### `text`

- `measure` prop controls `max-w-*` in ch units — 60–75 characters is the readable range and the
  default must be inside it. A full-width paragraph at 1440 px is the most common design error in
  generated pages.
- `columns` uses CSS multi-column with `column-gap`; responsive.
- Drop cap via `::first-letter`, off by default.

### `rich-text`

The editing surface is `contenteditable` with a **restricted** model: bold, italic, link, inline code,
and unordered/ordered lists. Nothing else. Paste is intercepted and converted to that restricted AST,
dropping everything else. The stored value is the AST, not HTML — see `docs/FILE_FORMAT.md` §
Security. This is the single most likely XSS vector in the product, so the AST boundary is not
optional.

### `image`

- `alt` is a **required** schema field. Empty string is allowed (decorative) but must be an explicit
  choice, and the inspector shows a warning chip when it is empty.
- `next/image` with explicit `width`/`height` and a real `sizes` value derived from the parent's
  layout where determinable, defaulting to `100vw`.
- The codegen descriptor supports both `next/image` and plain `img` output.

### `code-block`

- Highlighting via `shiki` at build time for known content, and a lightweight runtime highlighter for
  user-entered code. The runtime highlighter is dynamically imported.
- Copy button with the 1.2 s checkmark, labelled.
- `filename`, `showLineNumbers`, `highlightLines` (a range string like `2-4,7`).
- Keyboard-scrollable with `tabindex="0"` and `role="region"` + label, per `ACCESSIBILITY.md`.

### `stat`

The sparkline is inline SVG generated from a numeric array prop — no chart library. ~30 lines of path
generation. `costClass: 'cheap'`.

### The thumbnail generator

```bash
pnpm generate:thumbnails
pnpm generate:thumbnails --block hero-aurora     # single block
```

Per block:
1. Render `previewProps` in a Playwright page at `1280 × 800`, inside `ThemeScope` with
   `studio-dark`, then again with `studio-light`
2. Screenshot, downscale to `320 × 200`, encode WebP quality 82
3. Generate a `blurDataURL` (4 × 3 pixels, base64, under 200 bytes)
4. For blocks with `defaultMotion` or a `continuous` effect, record a 2-second WebM (VP9) hover clip
5. Write to `apps/web/public/thumbnails/<blockId>-{dark,light}.webp` and `.webm`
6. Write a manifest `thumbnails.json` with dimensions and blur data

Determinism: freeze animations at a fixed timestamp, disable the caret, use a fixed device scale
factor. Two runs must produce byte-identical output — otherwise every run churns the repo. Test it.

Then enable the previously-skipped thumbnail assertion in the meta-tests and add
`pnpm check:registry` to CI (it already exists from prompt 05; extend it to check thumbnails).

## Verify

```bash
pnpm --filter @motion-studio/blocks test
pnpm generate:thumbnails
pnpm generate:thumbnails            # run twice
git status                          # second run must produce no diff
pnpm check:registry
```

Tests:
- Meta-tests including the now-enabled thumbnail assertion, over all 22 blocks
- `rich-text`: paste of `<script>`, `<iframe>`, `onclick`, and a `javascript:` link → all stripped;
  bold/italic/link/code/list preserved. One test per payload.
- `image`: empty `alt` parses but flags a warning; missing `alt` fails the schema
- `text`: default measure is within 60–75ch
- `code-block`: `highlightLines` range parsing, including invalid input
- `stat`: sparkline path generation for known inputs

Manual, and report:
- Open the studio; the block palette shows thumbnails for all 22 blocks in both modes
- Hover an animated block → the WebM plays; with reduced motion → it does not
- Each content block dropped with defaults looks intentional
- `text` at 1440 px does not run full width
- `code-block` is keyboard-scrollable and the copy button is labelled

## Done when

- [ ] Nine content blocks, nine files each
- [ ] `rich-text` stores a restricted AST; all four XSS payloads stripped and tested
- [ ] `image.alt` required in the schema, empty allowed with a warning
- [ ] `text` default measure inside the readable range
- [ ] Thumbnail generator deterministic — two runs, zero diff, proven
- [ ] Thumbnail assertion enabled in the meta-tests, all 22 blocks pass
- [ ] `check:registry` extended and in CI
- [ ] Palette shows thumbnails; hover clips respect reduced motion
- [ ] M4 complete: 22 blocks, generated inspector, working canvas
