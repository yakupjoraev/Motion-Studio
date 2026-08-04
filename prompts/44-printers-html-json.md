# 44 — Printers: HTML, JSON, tokens

**Milestone** M9 · **Depends on** 43 · **Commit** `feat(codegen): add html, json, and token printers`

## Read first

- `docs/EXPORT_ENGINE.md` — § Printers (HTML, JSON, Tokens), § Warnings
- `docs/FILE_FORMAT.md` — § Export
- `docs/THEME_ENGINE.md` — § Theme in export

## Goal

Three more targets. HTML is the interesting one: a single self-contained file with no build step,
which means every Motion-engine animation must be honestly approximated or honestly omitted.

## Deliverables

```
packages/codegen/src/printers/
├── html/
│   ├── print-html.ts           single self-contained document
│   ├── print-css.ts            reset + theme variables + generated rules + keyframes
│   ├── print-scripts.ts        vanilla JS for interactions
│   ├── approximate-motion.ts   Motion/GSAP → CSS, with warnings
│   └── *.test.ts
├── json/
│   ├── print-json.ts           delegates to schema's serializeDocument
│   └── print-json.test.ts
├── tokens/
│   ├── print-css-vars.ts
│   ├── print-tailwind-config.ts
│   ├── print-json-tokens.ts
│   ├── print-figma-tokens.ts
│   └── *.test.ts
└── index.ts
```

## Constraints

### HTML

One file. Opens from the filesystem. No build step, no framework, no CDN link.

Structure:
```html
<!doctype html>
<html lang="en" data-color-mode="dark">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>…</title>
  <style>/* reset + variables + rules + keyframes */</style>
</head>
<body>
  <!-- semantic markup -->
  <script>/* interactions */</script>
</body>
</html>
```

- Classes become real CSS rules. Do **not** ship Tailwind's CDN build — that is a 3 MB dependency and
  a network request in a file that is supposed to be self-contained. Generate only the rules actually
  used, from the IR's `usedClasses`.
- Theme variables inlined in `:root` for both modes, with the colour-mode script.
- Fonts: `@font-face` pointing at the Google Fonts CSS URL, or system fallbacks if the user chose
  `assets: 'inline'`. Say which in a comment in the output.

### Vanilla JS interactions

Only what the document actually needs, per feature:

| Feature | Implementation |
| --- | --- |
| Entrance animations | `IntersectionObserver` adding a class |
| Accordion / tabs | Event delegation on a container, `aria-expanded`/`aria-selected` maintained |
| Carousel | Native scroll-snap; arrows call `scrollBy` |
| Hover effects | Pure CSS |
| Cursor effects | One `pointermove` listener writing CSS variables |
| Marquee | Pure CSS animation |
| Theme toggle | `localStorage` + `data-color-mode` |
| Mobile menu | Class toggle + `aria-expanded` + focus trap (~20 lines) |

All of it inside `if (!matchMedia('(prefers-reduced-motion: reduce)').matches)` where it is
animation, and **outside** that guard where it is functional. Accordion must work under reduced
motion; parallax must not.

Total script size target: **under 3 kB** for a typical landing page. If it grows past that, something
is being reimplemented that should be CSS.

### Motion approximation

`approximate-motion.ts` maps each preset to its closest CSS equivalent and **emits a warning naming
the approximation**:

| Preset | CSS approximation | Warning |
| --- | --- | --- |
| `fade-up` | transition + `IntersectionObserver` class | none needed — faithful |
| `magnetic` | `transform` on hover | "approximated: no cursor tracking" |
| `spring` transitions | cubic-bezier overshoot | "approximated: spring physics → bezier" |
| `sticky-stack` | `position: sticky` + scroll-linked class | "approximated: no scale interpolation" |
| `particles` | omitted | "omitted: requires WebGL" |
| `scroll-timeline` | omitted or single-keyframe | "omitted: requires a scroll timeline" |

An honest downgrade with a named reason beats a silent one. Every approximation and omission appears
in the export warnings.

### Tokens

Four formats, all generated from **one** resolved theme so they cannot disagree:

- CSS variables — both mode blocks
- Tailwind config — a `tailwind.config.ts` theme extension, for v3 users
- JSON — `ThemeConfig` plus resolved values
- Figma Tokens — the plugin's expected shape, with `$type` and `$value`

Test that the accent colour is byte-identical across all four outputs.

### JSON

Delegate to `serializeDocument` from `schema`. Do not reimplement — a second serialiser would drift
from the byte-stability guarantee. Assert the delegation with a test.

## Verify

```bash
pnpm test:codegen
pnpm --filter @motion-studio/codegen test --coverage
```

Assertions:
- HTML: only used classes emitted (assert the rule count against `usedClasses`)
- HTML: script under 3 kB for the full-landing fixture; report the actual size
- HTML: reduced-motion guard wraps animation but not function — test that accordion JS runs under
  reduced motion
- Every approximation emits its warning; every omission emits its warning
- Tokens: accent identical across all four formats
- JSON: delegates to `serializeDocument`; byte-stable

Then the manual proof, and report each:

```bash
pnpm generate:export-fixture --document full-landing --target html --out /tmp/html
open /tmp/html/index.html
```

- Opens from the filesystem with **no server** and looks right
- No network requests except fonts (check the Network panel)
- Accordion, tabs, carousel, mobile menu all work
- Theme toggle works and persists across reload
- Entrance animations fire on scroll
- With reduced motion: animations off, interactions still work
- Validate the HTML (W3C validator or `html-validate`) → zero errors
- Run axe on the file → zero violations
- Lighthouse on the file → report all four scores

## Done when

- [ ] HTML is one self-contained file that opens from the filesystem
- [ ] Only used CSS rules emitted; no Tailwind CDN
- [ ] Vanilla JS under 3 kB for the full landing; size reported
- [ ] Reduced-motion guard wraps animation only, not function — tested
- [ ] Every approximation and omission warned with a reason
- [ ] Four token formats agree byte-for-byte on shared values
- [ ] JSON printer delegates rather than reimplements
- [ ] HTML validates with zero errors; axe clean; Lighthouse scores reported
- [ ] Every interaction verified manually in the exported file
