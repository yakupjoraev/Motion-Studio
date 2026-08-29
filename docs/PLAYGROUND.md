# PLAYGROUND

`/playground` is a live CSS laboratory: write a value, see it applied, send it to the canvas.
It exists because the properties that make modern UI interesting — `clip-path`, `mask-image`,
`backdrop-filter`, layered `box-shadow`, mesh `radial-gradient` stacks — are impossible to author
without instant feedback and tedious to author in devtools.

## Layout

```
┌───────────────┬──────────────────────────────┬──────────────────┐
│ Properties    │                              │  Presets         │
│               │        Live target           │                  │
│ ● background  │                              │  Aurora          │
│ ○ box-shadow  │        ┌──────────┐          │  Sunset          │
│ ○ filter      │        │          │          │  Mesh 4-point    │
│ ○ backdrop    │        │  preview │          │  Conic ring      │
│ ○ mask-image  │        │          │          │  Noise gradient  │
│ ○ clip-path   │        └──────────┘          │                  │
│ ○ transform   │                              │  [ Copy CSS ]    │
│ ○ transition  │  [surface ▾] [size ▾] [☑ bg] │  [ Send to node ]│
├───────────────┴──────────────────────────────┴──────────────────┤
│ background:                                                     │
│   radial-gradient(60% 60% at 30% 20%, oklch(62% .19 285), …),    │
│   radial-gradient(50% 50% at 75% 40%, oklch(70% .15 210), …);    │
│                                                    ⚠ line 2: …  │
└─────────────────────────────────────────────────────────────────┘
```

Editor at the bottom, target in the middle, property list left, presets right. The target is
resizable by dragging its edges — a `clip-path` polygon that looks right at 400 × 300 and wrong
at 800 × 200 is exactly the bug this tool should surface.

## Property sandboxes

Each property gets a purpose-built environment, because a generic "type CSS here" box is not
useful.

| Property | Target | Extra tools |
| --- | --- | --- |
| `background` | Full-bleed rectangle | Gradient stop track, angle dial, colour picker, mesh point handles |
| `box-shadow` | Card on a mid-tone surface | Layer stack editor, per-layer x/y/blur/spread/colour/inset, reorder |
| `filter` | Image + text + gradient | Function chain builder with per-function sliders |
| `backdrop-filter` | Glass panel over a busy photo | Backdrop swatch picker (photo / gradient / pattern) |
| `mask-image` | Image with a visible checkerboard | Mask preview toggle (show mask / show result / show both) |
| `clip-path` | Coloured block with a grid overlay | **Draggable vertex handles**, shape presets, percentage/pixel toggle |
| `transform` | Card in a perspective container | Per-axis sliders, origin picker, perspective control |
| `transition` / `animation` | Two-state element | Play/pause, scrub, loop, easing curve editor with a draggable bezier |

The `clip-path` vertex editor and the bezier curve editor are the two features that make this a
tool rather than a textarea. Both are pure geometry over pointer events, both write CSS variables
directly, and neither goes through React state during a drag.

## Editor

**CodeMirror 6**, dynamically imported. ~110 kB gzip for the CSS setup, which is why it is never
in the studio's initial chunk.

Configuration:
- CSS language mode with autocomplete for property values and colour functions
- Inline colour swatches that open a picker on click
- Our theme, generated from the same tokens
- Error diagnostics as inline underlines with a gutter marker
- `Cmd+Enter` applies immediately; otherwise debounced 60 ms
- Bracket matching, auto-close, `Cmd+/` comment, `Cmd+D` multi-cursor

## Parsing and validation

Input is untrusted, and applying it means writing to a live style. So it is parsed, not trusted.

The validator lives in `packages/schema/src/sanitize/css/`, not here. `sanitizeDocument` is the
security boundary for an imported `.motion` file and it must call the same code the playground calls;
a copy in `apps/web` would let the interactive path and the security path drift, and the one that
matters for safety is the one nobody is looking at.

```ts
export function validateCssValue(property: string, value: string): CssValidation

/** A `css` escape-hatch prop and the inspector's field: `property: value;` lines. */
export function validateCssDeclarations(input: string, options?: DeclarationOptions): CssValidation

export type CssValidation =
  | { ok: true; normalized: string; features: CssFeature[]; unverified: boolean }
  | { ok: false; errors: CssError[] }

export interface CssError {
  message: string        // "Unexpected ')' — 3 open parens, 4 closing"
  line: number           // 1-based
  column: number         // 1-based
  severity: 'error' | 'warning'
  layer: 'structural' | 'blocklist' | 'native' | 'feature'
}
```

Layered approach:

1. **Structural check** — balanced parens, brackets, quotes; no `;` outside a declaration list;
   length cap 8 kB. Runs **undebounced** on every keystroke, so bracket feedback is instant, and
   reports the line and column of the first imbalance.
2. **Blocklist** — `url(` (unless a data URL that passes the asset sanitizer), `@import`,
   `expression(`, `behavior:`, `-moz-binding`, `element(`. These are the CSS injection vectors and
   there is no legitimate use for them here.
3. **Native validation** — `CSS.supports(property, value)`. The browser is the authority on
   whether a value is valid, and it is free. Where there is no `CSS` — a `node` test run, an import
   on the server — the result carries `unverified: true` rather than failing: layers 1, 2 and 5 are
   the security-relevant ones and they still ran.
4. **Feature detection** — which modern features the value uses (`oklch`, `color-mix`,
   `@supports`-worthy properties), surfaced as a compatibility note: "`oklch()` — Safari 15.4+".
   A value this browser rejects that uses one of them is attributed to the `feature` layer, so the
   message names the feature rather than blaming the value.
5. **Normalize** — re-serialised to one spelling: collapsed whitespace, one space after a comma,
   lowercase function names and hex. Colour notation is preserved; `oklch` chosen by the author stays
   `oklch`. `normalize(normalize(x)) === normalize(x)`.

**Apply** — the normalized value is set on the target element only, never on a stylesheet, never
`innerHTML`.

On failure: **the last valid value stays rendered**, the error underlines in the editor, and the
target gets a subtle red outline. Blanking the preview on a typo is hostile — you lose the thing
you were comparing against.

## Presets

Right panel, per property, each a starting point rather than a finished answer.

| Property | Presets |
| --- | --- |
| `background` | Aurora, Sunset, Ocean, Ember, Mint, Mesh 4-point, Conic ring, Noise gradient, Grid lines, Dot grid, Radial spotlight |
| `box-shadow` | Soft lift, Sharp editorial, Layered depth, Inner well, Neon glow, Long shadow, Neumorphic |
| `filter` | Duotone, Vintage, High contrast, Frosted, Bloom, Chromatic edge |
| `backdrop-filter` | Subtle glass, Frosted glass, Heavy blur, Saturated glass, Vibrancy |
| `mask-image` | Fade bottom, Radial vignette, Text mask, Stripe reveal, Feathered edges |
| `clip-path` | Hexagon, Blob, Arrow, Chevron, Diagonal, Circle, Inset rounded, Star |
| `transform` | Tilt card, Isometric, Flip, Perspective stack, Skew |
| `transition` | Snappy, Smooth, Springy, Bounce, Overshoot, Anticipate |

Clicking a preset replaces the editor content. `Alt+click` appends as an additional layer where
the property is layerable (`background`, `box-shadow`, `mask-image`, `filter`).

## Send to selection

```
Playground → validate → wrap as a CSS escape-hatch prop → setProp command → canvas
```

- Enabled only when the studio has a selection. The playground does **not** import the editor store:
  the studio publishes a five-field summary of the selection over a port and reads the write back from
  it, so the page does not carry the block registry to find out whether something is selected
  (ADR-279). The studio's top bar reaches the playground through a client-side link, which is what
  keeps the selection alive across the route.
- The value lands on the selected node's `css` prop for that property, applied by `buildElement` and
  by the canvas rather than by each block (ADR-274). `capabilities.escapeHatch` says which properties
  a block accepts; absent means the eight sandboxes, every one of them paint-only, so a value cannot
  break a block's layout contract. A glass block drops `backdrop-filter`, because it paints its own,
  and the refusal is shown with its reason (ADR-275).
- It is a command, so it is undoable, and it appears in the inspector's Effects section as a
  `Custom CSS` chip with an edit action that reopens the playground with the value loaded.
- Codegen emits it as an inline `style` on the node's root element. Where the node also carries a
  breakpoint override, the responsive pass moves the declarations into a generated rule, which is the
  same path a responsive `cssVars` already takes.

## Compare mode

Split the target down the middle: left half renders value A, right half value B. The editor gets
a second tab. This is how you actually choose between two shadow stacks — side by side, same
surface, same size. A/B swap is `Cmd+Shift+S`.

## Sharing

- **Copy CSS** — the normalized value, ready to paste.
- **Copy as Tailwind** — the arbitrary-value class where one exists (`shadow-[...]`), or a note
  that the value needs a config entry.
- **Copy as CSS variable** — `--custom: <value>;` plus the usage line.
- **Permalink** — the state is encoded in the URL hash (`#p=background&v=<base64>`), so a
  playground state is shareable without a backend. Capped at 4 kB; longer values show "too long
  to link" and offer the clipboard instead.

## Performance

| Concern | Handling |
| --- | --- |
| Re-parsing on every keystroke | 60 ms debounce; structural check runs immediately for bracket feedback |
| CodeMirror bundle | Dynamic import with a skeleton at the exact final height |
| Vertex and bezier editors | Dynamic import, loaded with the sandbox that owns them — ADR-281 |
| Colour picker | Dynamic import, loaded when a swatch is clicked |
| Expensive previews (`backdrop-filter`, big blurs) | One target element only; `contain: paint` |
| Continuous animation previews | Paused when the tab is hidden or the target is off-screen |
| Reduced motion | Animation sandboxes show static start/end states with a manual scrub |

Measured on this repository, 2026-08-30, production build, Chrome:

| | |
| --- | --- |
| `/playground` first-load JS | **184 kB** (route 17.4 kB) — CodeMirror, the colour picker, the vertex editor and the bezier editor are not in it (ADR-281) |
| Lighthouse (mobile) | Performance **95**, Accessibility **100**, Best Practices 96, SEO 100 |
| LCP / TBT | 2.6 s / 160 ms — the two sandbox editors no longer land in the first chunk |
| CLS | **0.02**, at the budget. Nothing is attributed to an element; the skeleton still reserves the editor's exact height |
| FCP / Speed Index | 1.1 s / 1.2 s |

## Accessibility

- The editor is a real CodeMirror instance, which is screen-reader operable; the property list is
  a `role="radiogroup"` with arrow navigation.
- Vertex handles in the `clip-path` editor are focusable buttons; arrows move a vertex by 1 %
  (`Shift` = 5 %), `Enter` opens exact fields, `Delete` removes down to a minimum of three, and each
  announces its coordinates.
- Every edge has its own button too, so splitting one is a tab stop rather than a click on a `div`.
- The bezier editor's control points are focusable with the same arrow behaviour, announcing the
  four bezier values.
- Errors are in an `aria-live="polite"` region, debounced so a live-typing user is not spammed.
- Every preset is a button with an accessible name; the visual swatch is `aria-hidden`.
- Compare mode announces which half is active.

## Testing

**Unit** — `validateCssValue`: balanced-delimiter cases, every blocklist entry, `CSS.supports`
pass/fail, normalization stability (`validate(validate(x)) === validate(x)`), the 8 kB cap. It never
throws, over the malicious fixtures and 1000 fuzzed strings.

**Unit** — permalink encode/decode round-trip, including the length cap.

**Unit** — `clip-path` vertex model: parse `polygon(...)` → vertices → serialise, round-trip
exact; drag maths.

**E2E**
1. Open playground → pick `clip-path` → drag a vertex → the value updates and the preview matches.
2. Type invalid CSS → error shows, preview keeps the last valid state.
3. Apply a preset → editor and preview update.
4. Select a node in the studio → send from playground → the inspector shows the custom CSS chip →
   undo removes it.
5. Permalink round-trip in a fresh tab.
6. Blocklisted input (`url(javascript:...)`) → rejected with a reason, never applied.
