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

```ts
export function validateCssValue(property: string, value: string): CssValidation

export type CssValidation =
  | { ok: true; normalized: string; usedFeatures: CssFeature[] }
  | { ok: false; errors: CssError[] }

export interface CssError {
  message: string        // "Unexpected ')' — 3 open parens, 4 closing"
  line: number
  column: number
  severity: 'error' | 'warning'
}
```

Layered approach:

1. **Structural check** — balanced parens, brackets, quotes; no `;` outside a declaration list;
   length cap 8 kB.
2. **Blocklist** — `url(` (unless a data URL that passes the asset sanitizer), `@import`,
   `expression(`, `behavior:`, `-moz-binding`. These are the CSS injection vectors and there is no
   legitimate use for them here.
3. **Native validation** — `CSS.supports(property, value)`. The browser is the authority on
   whether a value is valid, and it is free.
4. **Feature detection** — which modern features the value uses (`oklch`, `color-mix`,
   `@supports`-worthy properties), surfaced as a compatibility note: "`oklch()` — Safari 15.4+".
5. **Apply** — set the property on the target element only, never on a stylesheet, never
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

- Enabled only when the studio has a selection (the playground reads the same store).
- The value lands on the selected node's `css` prop for that property. Blocks declare which
  properties accept an escape hatch, so a value cannot break a block's layout contract.
- It is a command, so it is undoable, and it appears in the inspector's Effects section as a
  `Custom CSS` chip with an edit action that reopens the playground with the value loaded.
- Codegen emits it as an inline `style` for one-off values or a CSS variable plus a rule when the
  value is shared — the export never contains an unexplained magic string.

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
| Colour picker | Dynamic import, loaded when a swatch is clicked |
| Expensive previews (`backdrop-filter`, big blurs) | One target element only; `contain: paint` |
| Continuous animation previews | Paused when the tab is hidden or the target is off-screen |
| Reduced motion | Animation sandboxes show static start/end states with a manual scrub |

Measured on this repository, 2026-08-29, production build, Chrome:

| | |
| --- | --- |
| `/playground` first-load JS | **175 kB** (route 14.2 kB) — CodeMirror and the colour picker are not in it |
| Lighthouse | Performance **90**, Accessibility **100**, Best Practices 96, SEO 100 |
| CLS | **0** — the skeleton reserves the editor's exact height |
| FCP / Speed Index | 1.1 s / 1.2 s |

## Accessibility

- The editor is a real CodeMirror instance, which is screen-reader operable; the property list is
  a `role="radiogroup"` with arrow navigation.
- Vertex handles in the `clip-path` editor are focusable buttons; arrows move a vertex by 1 %
  (`Shift` = 5 %), and each announces its coordinates.
- The bezier editor's control points are focusable with the same arrow behaviour, announcing the
  four bezier values.
- Errors are in an `aria-live="polite"` region, debounced so a live-typing user is not spammed.
- Every preset is a button with an accessible name; the visual swatch is `aria-hidden`.
- Compare mode announces which half is active.

## Testing

**Unit** — `validateCssValue`: balanced-delimiter cases, every blocklist entry, `CSS.supports`
pass/fail, normalization stability (`validate(validate(x)) === validate(x)`), the 8 kB cap.

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
