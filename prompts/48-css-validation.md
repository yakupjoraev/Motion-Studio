# 48 — CSS validation and safety

**Milestone** M10 · **Depends on** 47 · **Commit** `feat(web): add layered css validation for the playground`

## Read first

- `docs/PLAYGROUND.md` — § Parsing and validation
- `docs/FILE_FORMAT.md` — § Security (the CSS escape-hatch rules)
- `docs/CODE_STANDARDS.md` — § Errors (Result type)

## Goal

User-supplied CSS is untrusted input applied to a live document. This prompt makes accepting it safe,
and makes rejecting it useful — an error that says "unexpected `)` at column 24" is worth ten times
one that says "invalid CSS".

## Deliverables

**Location is decided: this lives in `packages/schema`, not in `apps/web`.** The criterion is that
`sanitizeDocument` is the security boundary for untrusted `.motion` files, it lives in `schema`, and
it must call the same validator the playground uses. A copy in `apps/web` would mean the
security-critical path and the interactive path could diverge — and the one that matters for safety
is the one nobody is looking at.

```
packages/schema/src/sanitize/css/
├── validate-css.ts           composes all five layers; the only public entry
├── structural.ts             layers 1–2: delimiters, length, blocklist. Pure, no DOM.
├── blocklist.ts              the dangerous constructs
├── native.ts                 layers 3–4: CSS.supports + feature detect. DOM-guarded.
├── normalize.ts              layer 5: canonical re-serialisation. Pure.
├── css.types.ts              CssValidation, CssError, CssFeature
├── __fixtures__/
│   ├── valid.ts              50+ real-world values across all eight properties
│   └── malicious.ts          every injection vector
└── *.test.ts
```

`native.ts` must run in `node`, where `CSS` does not exist. **Decided:** when `CSS.supports` is
unavailable it returns `{ ok: true, unverified: true }` and `validateCss` propagates that flag —
layers 1, 2 and 5 still ran, so the security-relevant checks are complete; only validity is unknown.
It must never return `ok: false` for a missing API, because that would make every document import
fail in a `node` test, and it must never silently claim verification it did not perform.

Prompt 12 created a structural-only stub for `sanitizeDocument` to call. Complete it in place —
same module, same exported name. Do not add a parallel implementation.

## Constraints

### The five layers, in order

**1. Structural** — balanced parens, brackets, and quotes; no `;` outside a declaration list; length
cap 8 kB. Runs **immediately** on every keystroke (not debounced) so bracket feedback is instant. Must
report the line and column of the first imbalance.

**2. Blocklist** — reject outright:
- `url(` unless it is a `data:image/*` URL that passes the asset sanitizer
- `@import`
- `expression(`
- `behavior:`
- `-moz-binding`
- `element(`

There is no legitimate use for any of these in this context, and each is a documented injection
vector. Every one gets a fixture and a test.

**3. Native** — `CSS.supports(property, value)`. The browser is the authority on validity and it is
free. Do not write a CSS value grammar.

**4. Feature detection** — which modern features the value uses, surfaced as a compat note:
`oklch()` → "Safari 15.4+", `color-mix()` → "Chrome 111+", `@supports`-worthy properties flagged. This
turns the playground into something that teaches rather than just previews.

**5. Normalize** — re-serialise to a canonical form: consistent spacing, lowercase keywords, preserved
colour notation (do not convert `oklch` to `rgb` — the user chose that notation deliberately).

`normalize(normalize(x)) === normalize(x)` — idempotency, and there is a property test for it.

### Return shape

```ts
export type CssValidation =
  | { ok: true; normalized: string; features: CssFeature[] }
  | { ok: false; errors: CssError[] }

export interface CssError {
  message: string      // "Unexpected ')' — 3 open parens, 4 closing"
  line: number
  column: number
  severity: 'error' | 'warning'
  layer: 'structural' | 'blocklist' | 'native' | 'feature'
}
```

Errors are actionable: they say what, where, and imply what to do. The messages in the doc are the
standard to match.

### One validator, three consumers

`validateCss` is called by all three, with no wrapper logic of its own in any of them:

1. `sanitizeDocument` — on `.motion` import (the security path)
2. `css-field` in the inspector — on user entry
3. The playground — on every keystroke

A second implementation anywhere is a defect. A test asserts all three call sites resolve to the same
module.

### `Result`, not exceptions

`validateCss` never throws. It returns a `Result`-shaped union. Parsing user input is an expected
failure, not a programmer error — that distinction is the rule from `CODE_STANDARDS.md` § Errors.

## Verify

```bash
pnpm test
```

Required assertions:
- All 50+ valid fixtures pass, across all eight properties
- Every malicious fixture rejected, with the correct `layer` and a specific message:
  - `url(javascript:alert(1))`
  - `url(data:text/html,<script>...)`
  - `@import url(evil.css)`
  - `expression(alert(1))`
  - `behavior: url(x.htc)`
  - `-moz-binding: url(x.xml)`
  - An 8 kB+ value
  - Unbalanced parens, brackets, quotes — each reporting the right line/column
  - A `data:image/png;base64,...` URL → **allowed** (the one url() exception)
- `CSS.supports` rejection for a genuinely invalid value (`box-shadow: banana`)
- Feature detection identifies `oklch`, `color-mix`, `backdrop-filter`, `clip-path` with the right
  compat notes
- Idempotency property test over the valid fixtures
- `sanitizeDocument` delegates to `validateCss` (assert with a spy or by shared-fixture behaviour)
- `validateCss` never throws, over the full malicious fixture set plus 1000 fuzzed strings

Manual, and report:
- In the playground, type each malicious payload → rejected with a readable reason, nothing applied
- Type a value with an unbalanced paren mid-edit → the error appears immediately (not after the
  debounce), and the preview keeps the last valid state
- Type `oklch(62% 0.19 285)` → applies, and the compat note appears
- Use the `css` escape hatch on a block with a blocklisted value → rejected the same way
- Import a `.motion` file containing a malicious `css` prop → sanitised and reported

## Done when

- [ ] Five layers implemented in order; structural runs undebounced
- [ ] Every blocklist entry has a fixture and a test with the correct layer attribution
- [ ] `data:image/*` URL allowed as the sole `url()` exception
- [ ] `CSS.supports` used rather than a hand-written grammar
- [ ] Feature detection with compat notes
- [ ] Normalization idempotent, proven by property test
- [ ] `sanitizeDocument` delegates to this validator — one implementation, not two
- [ ] `validateCss` never throws, over malicious plus 1000 fuzzed inputs
- [ ] Every payload manually verified in both the playground and the document escape hatch
