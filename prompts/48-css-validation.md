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

```
apps/web/src/lib/css/
├── validate-css.ts           the five-layer pipeline
├── structural-check.ts       delimiters, length, statement shape
├── blocklist.ts              the dangerous constructs
├── native-check.ts           CSS.supports
├── feature-detect.ts         which modern features are used → compat notes
├── normalize.ts              re-serialise to a canonical form
├── css.types.ts              CssValidation, CssError, CssFeature
├── __fixtures__/
│   ├── valid.ts              50+ real-world values across all eight properties
│   └── malicious.ts          every injection vector
└── *.test.ts
```

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

### Reuse in the document escape hatch

The `css` prop on blocks (`css-field` from prompt 09, `sanitizeDocument` from prompt 12) must use
**this same validator**. Two CSS validators would drift, and the one in the document path is the one
that matters for security.

Refactor `sanitizeDocument`'s CSS rules to call `validateCss`, and say so in the commit. If the shapes
do not line up, adjust the schema-side helper to delegate — the validator lives here, the sanitizer
calls it.

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
