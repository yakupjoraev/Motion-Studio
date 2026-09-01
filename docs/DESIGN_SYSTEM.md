---
group: Design
order: 1
summary: Tokens: colour, type, space, radius, elevation, blur, glass, noise
---

# DESIGN_SYSTEM

Tokens are the source of truth. `packages/tokens` exports typed objects; a build step emits a
Tailwind v4 `@theme` block and a runtime CSS-variable sheet from the same data. Nothing is
declared twice.

```
packages/tokens/src/
├── primitives/      raw scales — no meaning attached
│   ├── color.ts
│   ├── space.ts
│   ├── type.ts
│   ├── radius.ts
│   ├── shadow.ts
│   ├── blur.ts
│   └── duration.ts
├── semantic/        meaning — what a thing is for
│   ├── light.ts
│   ├── dark.ts
│   └── semantic.types.ts
├── build/           generators
│   ├── to-css.ts
│   └── to-tailwind.ts
└── index.ts
```

Three layers: **primitive → semantic → component**. A component never references a primitive.
`bg-surface-2` is legal; `bg-slate-800` is not.

The values in this document are calibrated against
[impeccable.style](https://impeccable.style), the product's primary design reference — the surface
value relationships, the elevation character, the glass recipes, the gradient presets and the
typographic scale are all set to reach that bar. See
[DESIGN_REFERENCES.md](DESIGN_REFERENCES.md) before changing any of them: a token that drifts
downward in quality degrades all 62 blocks at once.

## Colour

### Primitive palette

Twelve steps per hue, generated in OKLCH so perceptual lightness is even and dark mode is a
lightness inversion rather than a hand-tuned second palette.

```ts
// primitives/color.ts
export const NEUTRAL = {
  50: 'oklch(98.5% 0.002 265)',
  100: 'oklch(96.5% 0.004 265)',
  200: 'oklch(92.5% 0.006 265)',
  300: 'oklch(86.0% 0.008 265)',
  400: 'oklch(70.0% 0.012 265)',
  500: 'oklch(58.0% 0.014 265)',
  600: 'oklch(46.5% 0.014 265)',
  700: 'oklch(37.0% 0.014 265)',
  800: 'oklch(27.0% 0.012 265)',
  900: 'oklch(19.5% 0.010 265)',
  950: 'oklch(14.0% 0.008 265)',
  1000: 'oklch(9.5% 0.006 265)',
} as const
```

Hues shipped: `neutral` (265), `violet` (285), `blue` (255), `cyan` (210), `emerald` (160),
`amber` (75), `rose` (15). Each is the same lightness ladder with a different hue and a chroma
curve that peaks around step 500.

**Why OKLCH:** the theme engine generates a full palette from one user-picked accent by holding
lightness and chroma curves and rotating hue. That is only reliable in a perceptual space.

### The three curves

Exported from `primitives/color.ts` because the theme engine generates user palettes from them.

```ts
// The lightness of each step, 0–1. Read straight off the NEUTRAL ramp above.
export const LIGHTNESS_LADDER = [
  0.985, 0.965, 0.925, 0.86, 0.7, 0.58, 0.465, 0.37, 0.27, 0.195, 0.14, 0.095,
] as const

// NEUTRAL's own chroma curve, normalised to its peak. Multipliers, not chroma.
export const CHROMA_CURVE = [
  0.143, 0.286, 0.429, 0.571, 0.857, 1, 1, 1, 0.857, 0.714, 0.571, 0.429,
] as const

// Hue drift per step, multiplied by the theme's accentHueShift (−30..30 degrees).
export const HUE_SHIFT_CURVE = [
  1, 0.8, 0.6, 0.4, 0.2, 0, 0, -0.2, -0.4, -0.6, -0.8, -1,
] as const

// Peak chroma per hue: 95 % of the sRGB gamut boundary at step 500's lightness.
export const REFERENCE_CHROMA = {
  neutral: 0.014, violet: 0.229, blue: 0.182, cyan: 0.096,
  emerald: 0.125, amber: 0.117, rose: 0.221,
} as const
```

**How every non-neutral step is derived**, and the reason it is a derivation rather than a
hand-picked table:

```
chroma[i] = min( REFERENCE_CHROMA[hue] × CHROMA_CURVE[i],
                 0.95 × maxInGamutChroma(LIGHTNESS_LADDER[i], hue) )
```

The per-step clamp is not optional. The sRGB gamut collapses at the lightness extremes far faster
than the curve tapers — at 98.5 % lightness the widest violet is chroma 0.007 — so scaling one curve
by a single factor that keeps every step in gamut would crush the mid steps to grey. Clamping each
step against its own boundary is the same operation `generateRamp` applies at runtime
([THEME_ENGINE.md](THEME_ENGINE.md) § Palette generation), which is why the shipped ramps and a
generated palette have the same character.

The 0.95 inset keeps every step off the gamut boundary, so no channel sits where the browser's own
8-bit rounding could push it outside. A unit test asserts every shipped step is in gamut.

`HUE_SHIFT_CURVE` applies to **generated** palettes only. The shipped ramps are hue-constant, as the
`NEUTRAL` table above is. Positive `accentHueShift` rotates the light end toward a higher hue angle
and the dark end toward a lower one, which is how pigment behaves and why a few degrees of drift
reads as designed rather than as a flat tint.

### The six chromatic ramps

Derived by the rule above, not chosen. Regenerating them from the curves must reproduce these bytes.

```ts
export const VIOLET = {
  50: 'oklch(98.5% 0.007 285)',  100: 'oklch(96.5% 0.016 285)', 200: 'oklch(92.5% 0.036 285)',
  300: 'oklch(86.0% 0.068 285)', 400: 'oklch(70.0% 0.156 285)', 500: 'oklch(58.0% 0.229 285)',
  600: 'oklch(46.5% 0.229 285)', 700: 'oklch(37.0% 0.207 285)', 800: 'oklch(27.0% 0.153 285)',
  900: 'oklch(19.5% 0.114 285)', 950: 'oklch(14.0% 0.089 285)', 1000: 'oklch(9.5% 0.075 285)',
} as const

export const BLUE = {
  50: 'oklch(98.5% 0.007 255)',  100: 'oklch(96.5% 0.016 255)', 200: 'oklch(92.5% 0.035 255)',
  300: 'oklch(86.0% 0.067 255)', 400: 'oklch(70.0% 0.152 255)', 500: 'oklch(58.0% 0.182 255)',
  600: 'oklch(46.5% 0.147 255)', 700: 'oklch(37.0% 0.118 255)', 800: 'oklch(27.0% 0.089 255)',
  900: 'oklch(19.5% 0.070 255)', 950: 'oklch(14.0% 0.065 255)', 1000: 'oklch(9.5% 0.078 255)',
} as const

export const CYAN = {
  50: 'oklch(98.5% 0.013 210)',  100: 'oklch(96.5% 0.027 210)', 200: 'oklch(92.5% 0.041 210)',
  300: 'oklch(86.0% 0.055 210)', 400: 'oklch(70.0% 0.082 210)', 500: 'oklch(58.0% 0.096 210)',
  600: 'oklch(46.5% 0.077 210)', 700: 'oklch(37.0% 0.062 210)', 800: 'oklch(27.0% 0.046 210)',
  900: 'oklch(19.5% 0.036 210)', 950: 'oklch(14.0% 0.030 210)', 1000: 'oklch(9.5% 0.033 210)',
} as const

export const EMERALD = {
  50: 'oklch(98.5% 0.018 160)',  100: 'oklch(96.5% 0.036 160)', 200: 'oklch(92.5% 0.054 160)',
  300: 'oklch(86.0% 0.071 160)', 400: 'oklch(70.0% 0.107 160)', 500: 'oklch(58.0% 0.125 160)',
  600: 'oklch(46.5% 0.101 160)', 700: 'oklch(37.0% 0.081 160)', 800: 'oklch(27.0% 0.060 160)',
  900: 'oklch(19.5% 0.047 160)', 950: 'oklch(14.0% 0.039 160)', 1000: 'oklch(9.5% 0.041 160)',
} as const

export const AMBER = {
  50: 'oklch(98.5% 0.012 75)',   100: 'oklch(96.5% 0.027 75)',  200: 'oklch(92.5% 0.050 75)',
  300: 'oklch(86.0% 0.067 75)',  400: 'oklch(70.0% 0.100 75)',  500: 'oklch(58.0% 0.117 75)',
  600: 'oklch(46.5% 0.094 75)',  700: 'oklch(37.0% 0.076 75)',  800: 'oklch(27.0% 0.057 75)',
  900: 'oklch(19.5% 0.045 75)',  950: 'oklch(14.0% 0.042 75)',  1000: 'oklch(9.5% 0.050 75)',
} as const

export const ROSE = {
  50: 'oklch(98.5% 0.007 15)',   100: 'oklch(96.5% 0.017 15)',  200: 'oklch(92.5% 0.037 15)',
  300: 'oklch(86.0% 0.073 15)',  400: 'oklch(70.0% 0.184 15)',  500: 'oklch(58.0% 0.221 15)',
  600: 'oklch(46.5% 0.178 15)',  700: 'oklch(37.0% 0.142 15)',  800: 'oklch(27.0% 0.106 15)',
  900: 'oklch(19.5% 0.081 15)',  950: 'oklch(14.0% 0.066 15)',  1000: 'oklch(9.5% 0.063 15)',
} as const
```

One consequence to know before reaching for a hue: a shared lightness ladder means `amber` and
`cyan` are far less chromatic at step 500 than `violet` or `rose`, because sRGB has much less room
for them at 58 % lightness. `amber.500` reads closer to bronze than to yellow. That is the cost of
an even perceptual ladder, and it is the right trade — a per-hue ladder would break the theme
engine's ability to substitute one hue for another.

### Semantic tokens

```ts
export interface SemanticColors {
  // surfaces, ascending elevation
  'surface-0': string        // app background
  'surface-1': string        // panels
  'surface-2': string        // cards, inputs
  'surface-3': string        // popovers, menus
  'surface-inset': string    // wells, code blocks

  // text
  'foreground': string       // primary
  'foreground-muted': string // secondary
  'foreground-subtle': string// tertiary, placeholders
  'foreground-onAccent': string

  // lines
  'border': string
  'border-strong': string
  'border-subtle': string

  // accent
  'accent': string
  'accent-hover': string
  'accent-active': string
  'accent-muted': string     // tinted background
  'accent-ring': string      // focus ring

  // status
  'success': string; 'success-muted': string
  'warning': string; 'warning-muted': string
  'danger': string;  'danger-muted': string
  'info': string;    'info-muted': string

  // canvas-specific
  'canvas-bg': string
  'canvas-grid': string
  'canvas-guide': string
  'canvas-selection': string
  'canvas-hover': string
  'canvas-snap': string
}
```

Both modes are declared explicitly, not derived at runtime. Every mapping below is a ramp reference,
never a literal — the ramp is the only place a colour value is written.

| Token | Light | Dark | Why this step |
| --- | --- | --- | --- |
| `surface-0` | `neutral.50` | `neutral.1000` | App background |
| `surface-1` | `white` | `neutral.950` | Panels. Light elevates toward white, dark toward lighter grey |
| `surface-2` | `neutral.100` | `neutral.900` | Cards and inputs read as a tint inside a panel |
| `surface-3` | `white` | `neutral.800` | Popovers, menus — separated by shadow in light, by lightness in dark |
| `surface-inset` | `neutral.200` | `neutral.1000` | One step past `surface-2` away from the mode's elevation direction |
| `foreground` | `neutral.950` | `neutral.50` | 19.9 : 1 on `surface-1` |
| `foreground-muted` | `neutral.600` | `neutral.400` | 6.98 : 1 / 7.45 : 1 on `surface-1` |
| `foreground-subtle` | `neutral.600` | `neutral.400` | The same step as `foreground-muted`: no step between them clears 4.5 : 1, and it paints text in 78 files — ADR-323 |
| `foreground-onAccent` | `white` | `neutral.1000` | Each mode's accent ladder climbs away from that mode's surfaces, so the readable foreground is the far end of the neutral ramp: 7.81 light, 7.41 dark |
| `border` | `neutral.200` | `neutral.800` | Hairline. Decorative — see the exemption below |
| `border-strong` | `neutral.300` | `neutral.700` | Input and control boundaries |
| `border-subtle` | `neutral.100` | `neutral.900` | One step inside `border`, for dividers inside a card |
| `accent` | `violet.600` | `violet.400` | Fill token. `foreground-onAccent` on it measures 7.81 / 7.41 |
| `accent-hover` | `violet.700` | `violet.300` | One ramp step further from the mode's surfaces in lightness |
| `accent-active` | `violet.800` | `violet.200` | Two steps in the same direction |
| `accent-muted` | `violet.100` | `violet.900` | The violet step at `surface-2`'s lightness, so a tint reads as the same elevation |
| `accent-ring` | `violet.600` | `violet.400` | Highest minimum across all five surfaces: 6.26 / 5.41. Coincides with `accent` in both modes; the two are separate tokens because only this one carries a guarantee |
| `success` | `emerald.600` | `emerald.400` | Clears 4.5 : 1 on `surface-1` *and* on its own muted background |
| `success-muted` | `emerald.100` | `emerald.900` | Same lightness rule as `accent-muted` |
| `warning` | `amber.600` | `amber.400` | As `success` |
| `warning-muted` | `amber.100` | `amber.900` | |
| `danger` | `rose.600` | `rose.400` | As `success`. `rose.500` measures 4.13 on dark `surface-1` and does not qualify |
| `danger-muted` | `rose.100` | `rose.900` | |
| `info` | `blue.600` | `blue.400` | As `success` |
| `info-muted` | `blue.100` | `blue.900` | |
| `canvas-bg` | `neutral.100` | `neutral.1000` | Distinct from `surface-0` so the artboard reads as sitting *on* the app |
| `canvas-grid` | `neutral.200` | `neutral.900` | Texture. Decorative — see the exemption below |
| `canvas-guide` | `cyan.500` | `cyan.400` | A hue distinct from selection and snap: 3.72 / 7.97 on `canvas-bg` |
| `canvas-selection` | `violet.600` | `violet.400` | The accent, so selection always reads as ours: 7.06 / 7.41 on `canvas-bg` |
| `canvas-hover` | `violet.600 / 50 %` | `violet.400 / 50 %` | The 50 % from UI_GUIDELINES § Canvas is baked in, not applied at call sites |
| `canvas-snap` | `rose.500` | `rose.400` | A third hue: transient measurement feedback must never be mistaken for a guide |

Four rules travel with this table:

1. **`accent` is a fill token.** Text or an icon that must read as accent on a surface uses
   `accent-ring`, which is measured to clear 4.5 : 1 against every surface in its mode. `accent`
   itself is only guaranteed against `foreground-onAccent`. The two hold the same ramp step today,
   but a generated palette places `accent` from the seed's own lightness
   ([THEME_ENGINE.md](THEME_ENGINE.md) § Palette generation), and a seed landing on `violet.500`
   gives 4.23 : 1 on dark `surface-1` — fine as a button fill, not as body text. `accent-ring` is
   the token contrast repair is allowed to move; `accent` is the one the user picked.
2. **The accent ladder moves away from the mode's surfaces, and `foreground-onAccent` follows the
   other end.** Light surfaces are pale, so light `accent` → `accent-hover` → `accent-active`
   descends 600 → 700 → 800 and carries `white`. Dark surfaces are near-black, so the dark ladder
   ascends 400 → 300 → 200 and carries `neutral.1000`. Measured on the three fills: 7.81 / 11.59 /
   15.99 light, 7.41 / 13.33 / 16.46 dark, and each fill clears 3 : 1 against all five of its own
   surfaces (worst case 5.41). A ladder that moved *toward* the mode's surfaces would keep `white`
   in both modes at the cost of a hovered fill measuring 1.93 : 1 against `surface-3` — a pressed
   button disappearing into the popover under it.
3. **Status colours take the step that clears 4.5 : 1 twice**: on the mode's `surface-1` and on the
   status's own `-muted` background. Measured, that is step 600 in light and step 400 in dark. Using
   500 in dark fails on the muted background for every hue (3.87–4.49 : 1).
4. **Tertiary text meets 4.5 : 1 like every other text**, which currently costs the tier its own
   step: `foreground-subtle` resolves to the same ramp step as `foreground-muted`, because the ramp
   has none between them and WCAG 1.4.3 exempts large text, incidental text and inactive controls —
   not duplicated metadata (ADR-323). The duplication rule stays as a rule about hierarchy: a value
   rendered in `foreground-subtle` is repeated somewhere at `foreground-muted` or above, and a value
   that is the only carrier of its information is not tertiary. Separating the two tiers again needs a
   ramp step, not a threshold.

### Contrast contract

- Body text on its surface: **≥ 4.5:1**
- Large text (≥ 24 px or ≥ 19 px bold): **≥ 3:1**
- Tertiary text and placeholders: **≥ 4.5:1** — they are text (ADR-323)
- Non-text graphics that carry information: **≥ 3:1**
- Focus ring against both the element and its surroundings: **≥ 3:1**

`contrast.test.ts` walks two explicit lists in both modes and fails the build on a violation. The
lists are the pairs that actually occur in the product, not the cross-product of the token set — a
cross-product test asserts things like "the accent button fill against the popover it is not on" and
gets disabled the first time it blocks a legitimate change.

```ts
const TEXT_PAIRS = [
  ['foreground', 'surface-0'], ['foreground', 'surface-1'],
  ['foreground', 'surface-2'], ['foreground', 'surface-3'],
  ['foreground', 'surface-inset'],
  ['foreground-muted', 'surface-0'], ['foreground-muted', 'surface-1'],
  ['foreground-muted', 'surface-2'], ['foreground-muted', 'surface-3'],
  ['foreground-onAccent', 'accent'],
  ['foreground-onAccent', 'accent-hover'], ['foreground-onAccent', 'accent-active'],
  ['accent-ring', 'surface-1'], ['accent-ring', 'surface-2'], ['accent-ring', 'surface-3'],
  ['success', 'surface-1'], ['success', 'success-muted'],
  ['warning', 'surface-1'], ['warning', 'warning-muted'],
  ['danger',  'surface-1'], ['danger',  'danger-muted'],
  ['info',    'surface-1'], ['info',    'info-muted'],
  ['foreground', 'accent-muted'], ['foreground', 'success-muted'],
  ['foreground', 'warning-muted'], ['foreground', 'danger-muted'],
  ['foreground', 'info-muted'],
  ['foreground-subtle', 'surface-0'], ['foreground-subtle', 'surface-1'],
  ['foreground-subtle', 'surface-2'], ['foreground-subtle', 'surface-3'],
] as const   // ≥ 4.5:1

const UI_PAIRS = [
  ['accent-ring', 'surface-0'], ['accent-ring', 'surface-inset'],
  ['canvas-selection', 'canvas-bg'],
  ['canvas-guide', 'canvas-bg'],
  ['canvas-snap', 'canvas-bg'],
] as const   // ≥ 3:1
```

### What is deliberately exempt, and what pays for it

`border`, `border-subtle`, `border-strong`, `canvas-grid`, and the step between adjacent surfaces are
**texture, not information**, and they are not in either list. The measured values say why an
exemption is needed rather than a stricter ramp: light `border` on `surface-1` is 1.25 : 1,
`border-strong` is 1.53 : 1, and `surface-2` on `surface-1` is 1.11 : 1. Reaching 3 : 1 on a hairline
against white needs roughly `neutral.500`, which is a mid-grey rule, not a hairline — the whole
surface language this document is calibrated to would go with it.

WCAG 1.4.11 asks for 3 : 1 on graphics *required to identify* a component. So the exemption is paid
for by a rule, not by hoping:

- **No control is identified by its border alone.** Every input has a visible label, every panel a
  heading, every interactive surface a hover state and a focus ring.
- **The focus ring is the identification of last resort**, and it is in `UI_PAIRS` against every
  surface with margin — 6.26 : 1 light, 5.41 : 1 dark at its worst surface.
- **Canvas feedback is information**, so selection, guides, and snap lines are in `UI_PAIRS`. The
  grid is texture and is not.

If a future component *does* depend on its border to be identifiable, that component uses
`border-strong` plus a fill difference, and it gets its own pair in `UI_PAIRS`.

Theme presets go through the same two lists. User-generated palettes are checked at runtime and show
a warning chip in the theme builder — never silently ship inaccessible output.

## Typography

### Families

| Role | Stack | Use |
| --- | --- | --- |
| `sans` | Geist Sans → `system-ui` | UI, body |
| `display` | Geist Sans, tighter tracking | Headlines |
| `mono` | Geist Mono → `ui-monospace` | Code, numeric fields |

Loaded with `next/font` (self-hosted, `display: swap`, subset `latin` + `latin-ext`). Blocks may
offer additional pairings from the theme's `fontPairing` token; those are also self-hosted.

### Scale

Modular, ratio 1.2 for UI and 1.25 for display, clamped for fluid display sizes.

| Token | Size | Line height | Tracking | Use |
| --- | --- | --- | --- | --- |
| `2xs` | 10px | 14px | +0.04em | Badges, ruler labels |
| `xs` | 11px | 16px | +0.02em | Inspector labels, chips |
| `sm` | 12px | 18px | +0.005em | Panel body, table cells |
| `base` | 14px | 21px | 0 | Studio default |
| `md` | 16px | 24px | 0 | Page body |
| `lg` | 18px | 27px | −0.005em | Lead paragraph |
| `xl` | 22px | 30px | −0.01em | Card titles |
| `2xl` | 28px | 36px | −0.015em | Section headings |
| `3xl` | 36px | 42px | −0.02em | |
| `4xl` | 48px | 54px | −0.025em | |
| `5xl` | 64px | 68px | −0.03em | Hero |
| `6xl` | 80px | 82px | −0.035em | Display hero |
| `display-1` | `clamp(2.5rem, 6vw, 5rem)` | 1.05 | −0.03em | Fluid hero |
| `display-2` | `clamp(2rem, 4.5vw, 3.5rem)` | 1.1 | −0.02em | Fluid section |

**Studio base is 14 px, not 16 px.** Professional tools are dense. Content pages use 16 px.

Weights: 400, 500, 600, 700. No 300 — it fails contrast at small sizes on dark surfaces.

## Space

4 px base. Only these values exist.

```
0  1(4)  2(8)  3(12)  4(16)  5(20)  6(24)  8(32)  10(40)  12(48)
16(64)  20(80)  24(96)  32(128)  40(160)  48(192)  64(256)
```

Studio chrome uses `1`–`4` almost exclusively. Blocks use `6`–`32` for section rhythm.
Section vertical padding: `py-16` mobile → `py-24` tablet → `py-32` desktop.

## Radius

| Token | Value | Use |
| --- | --- | --- |
| `none` | 0 | |
| `xs` | 4px | Chips, small inputs |
| `sm` | 6px | Inputs, small buttons |
| `md` | 8px | Buttons, panels |
| `lg` | 12px | Cards |
| `xl` | 16px | Large cards, dialogs |
| `2xl` | 24px | Hero surfaces |
| `3xl` | 32px | Feature panels |
| `full` | 9999px | Pills, avatars |

The theme's `radiusScale` multiplier (0 / 0.5 / 1 / 1.5 / 2) scales every token at once, which
is how one control changes the whole document's feel from sharp to soft.

**Nested radius rule:** an inner radius equals the outer radius minus the gap between them.
A card at `lg` (12) with `p-2` (8) gives its child `xs` (4). `packages/utils` exports
`innerRadius(outer, gap)` and blocks use it rather than eyeballing.

## Elevation

Shadows are layered — a tight contact shadow plus a diffuse ambient one — and they are
mode-specific because a black shadow on a dark surface is invisible. Dark mode adds a top
inner highlight instead of a stronger shadow.

| Token | Light | Dark |
| --- | --- | --- |
| `xs` | `0 1px 2px oklch(0% 0 0/.05)` | `inset 0 1px 0 oklch(100% 0 0/.04)` |
| `sm` | `0 1px 2px /.06, 0 1px 3px /.10` | `0 1px 2px /.40, inset 0 1px 0 /.05` |
| `md` | `0 2px 4px /.06, 0 4px 8px /.10` | `0 2px 6px /.45, inset 0 1px 0 /.06` |
| `lg` | `0 4px 8px /.06, 0 12px 24px /.12` | `0 8px 20px /.50, inset 0 1px 0 /.07` |
| `xl` | `0 8px 16px /.06, 0 24px 48px /.14` | `0 16px 40px /.55, inset 0 1px 0 /.08` |
| `2xl` | `0 16px 32px /.08, 0 40px 80px /.16` | `0 32px 64px /.60, inset 0 1px 0 /.09` |
| `focus` | `0 0 0 2px surface-0, 0 0 0 4px accent-ring` | same |
| `glow-accent` | `0 0 24px accent/.35, 0 0 64px accent/.15` | same |

The table above is the `soft` elevation style — the default. In the shorthand, a drop layer's colour
is `oklch(0% 0 0 / a)` and an `inset` layer's is `oklch(100% 0 0 / a)`; the generator writes them out
in full.

### The four elevation styles

`theme.elevationStyle` selects one set. `focus` and `glow-accent` are not elevation levels and are
identical in all four — a focus ring that changed with the elevation style would be a focus ring that
sometimes disappears.

Each style is a stated transform of `soft`, so a change to `soft` carries through instead of leaving
three tables to update by hand.

| Style | Transform of `soft` | Character |
| --- | --- | --- |
| `flat` | every level → `none` | Depth carried by `border` alone. For dense data surfaces and for users who find shadows noisy |
| `soft` | — | Layered contact plus diffuse ambient. The default |
| `sharp` | drop the ambient layer, halve the contact blur, double its opacity | A hard, close shadow. Reads as precise and slightly retro |
| `glow` | `soft`, plus an accent-tinted outer glow from `md` upward | For dark, showcase-oriented documents |

Written out, so transcription has nothing to infer:

```ts
// sharp — light
xs: '0 1px 1px oklch(0% 0 0 / 0.10)'
sm: '0 1px 1px oklch(0% 0 0 / 0.12)'
md: '0 2px 2px oklch(0% 0 0 / 0.12)'
lg: '0 4px 4px oklch(0% 0 0 / 0.12)'
xl: '0 8px 8px oklch(0% 0 0 / 0.12)'
'2xl': '0 16px 16px oklch(0% 0 0 / 0.16)'

// sharp — dark. The inset highlight goes: it belongs to a soft, layered look.
xs: '0 1px 1px oklch(0% 0 0 / 0.50)'
sm: '0 1px 1px oklch(0% 0 0 / 0.55)'
md: '0 2px 3px oklch(0% 0 0 / 0.60)'
lg: '0 8px 10px oklch(0% 0 0 / 0.65)'
xl: '0 16px 20px oklch(0% 0 0 / 0.70)'
'2xl': '0 32px 32px oklch(0% 0 0 / 0.75)'

// glow — both modes: soft's value for the level, then the glow. xs and sm are soft unchanged;
// a glow under 8px of elevation reads as a rendering artefact rather than as light.
md:    `${soft.md}, 0 0 16px var(--ms-color-accent) / 0.10`
lg:    `${soft.lg}, 0 0 24px var(--ms-color-accent) / 0.14`
xl:    `${soft.xl}, 0 0 40px var(--ms-color-accent) / 0.18`
'2xl': `${soft['2xl']}, 0 0 64px var(--ms-color-accent) / 0.22`
```

`glow` is the one style whose shadows reference a semantic colour. That is deliberate and it is why
the generator emits shadows as variables rather than inlining them: changing the accent must change
the glow in the same frame, with no re-render.

## Blur and glass

```ts
export const BLUR = { none: '0px', xs: '2px', sm: '4px', md: '8px', lg: '16px', xl: '24px', '2xl': '40px', '3xl': '64px' }
```

Glass is a composed recipe, not a single value:

```ts
export const GLASS = {
  subtle: { backdropFilter: 'blur(8px) saturate(140%)',  background: 'oklch(100% 0 0/.04)', border: 'oklch(100% 0 0/.06)' },
  medium: { backdropFilter: 'blur(16px) saturate(160%)', background: 'oklch(100% 0 0/.07)', border: 'oklch(100% 0 0/.10)' },
  strong: { backdropFilter: 'blur(32px) saturate(180%)', background: 'oklch(100% 0 0/.11)', border: 'oklch(100% 0 0/.14)' },
  frosted:{ backdropFilter: 'blur(48px) saturate(120%) brightness(110%)', background: 'oklch(100% 0 0/.14)', border: 'oklch(100% 0 0/.18)' },
}
```

Rules:
1. Glass requires something behind it. On a flat surface it looks like a mistake — blocks using
   glass declare `requiresBackdrop: true` and the inspector warns when the parent is flat.
2. `backdrop-filter` is expensive. Cap: **4 simultaneous glass surfaces in the viewport**. The
   canvas counts them and warns past the cap.
3. Always pair with a hairline border, or the edge disappears.
4. Provide a fallback: `@supports not (backdrop-filter: blur(1px))` → opaque `surface-2`.

## Noise and grain

Noise is a base64 SVG `feTurbulence` — one asset, no network request, tiled by the browser.

```ts
export const NOISE = {
  none: 0, subtle: 0.015, light: 0.03, medium: 0.06, heavy: 0.10,
}
```

Applied as a `::after` overlay with `mix-blend-mode: overlay` and `pointer-events: none`.
Amounts above `medium` on light surfaces read as dirt — the inspector caps light-mode noise at
`light` unless overridden.

The asset, 342 bytes as a data URL:

```ts
export const NOISE_TEXTURE =
  'data:image/svg+xml;base64,' +
  'PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMjAiIGhlaWdodD0iMTIwIj48' +
  'ZmlsdGVyIGlkPSJuIj48ZmVUdXJidWxlbmNlIHR5cGU9ImZyYWN0YWxOb2lzZSIgYmFzZUZyZXF1ZW5jeT0iLjg1' +
  'IiBudW1PY3RhdmVzPSIzIiBzdGl0Y2hUaWxlcz0ic3RpdGNoIi8+PC9maWx0ZXI+PHJlY3Qgd2lkdGg9IjEyMCIg' +
  'aGVpZ2h0PSIxMjAiIGZpbHRlcj0idXJsKCNuKSIvPjwvc3ZnPg=='
```

Decoded, and the reason for each parameter:

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120">
  <filter id="n">
    <feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="3" stitchTiles="stitch"/>
  </filter>
  <rect width="120" height="120" filter="url(#n)"/>
</svg>
```

- `fractalNoise`, not `turbulence`: `turbulence` takes the absolute value of the noise field, which
  produces visible dark veins instead of even grain.
- `baseFrequency=".85"` puts the grain near one cycle per pixel at 1× — fine enough to read as film
  grain rather than as a pattern, coarse enough to survive a JPEG-quality screenshot.
- `numOctaves="3"`: two reads as regular, four costs render time for a difference nobody can see at
  these opacities.
- `stitchTiles="stitch"` is what makes the 120 px tile seamless. Without it every tile edge is a
  visible seam once the browser repeats the image.
- 120 px, not 64: a smaller tile repeats often enough that the eye finds the period.

## Gradients

Four kinds, all data-driven so the inspector and codegen share one representation.

```ts
type Gradient =
  | { kind: 'linear'; angle: number; stops: ColorStop[] }
  | { kind: 'radial'; shape: 'circle' | 'ellipse'; at: Position; stops: ColorStop[] }
  | { kind: 'conic'; from: number; at: Position; stops: ColorStop[] }
  | { kind: 'mesh'; points: MeshPoint[]; blur: number }

interface ColorStop { color: string; position: number }   // position 0–100
interface MeshPoint { color: string; x: number; y: number; radius: number }
```

Mesh gradients render as stacked `radial-gradient`s plus a blur — no WebGL, no canvas, and they
export as plain CSS.

### The ten presets

Every stop is a ramp reference, so a gradient inherits the palette rather than pinning its own
colours. Each preset declares whether text may sit directly on it:

- **`readable: <token>`** — that `foreground` token clears 4.5 : 1 against *every* stop. The test
  asserts the declared value, so a preset cannot claim readability it does not have.
- **`readable: null`** — a display gradient. It spans too much of the lightness ladder for any single
  foreground to work, and a block that puts text over it must add a scrim first.

| Preset | Kind | Stops | `readable` |
| --- | --- | --- | --- |
| `aurora` | mesh, blur 80 | `violet.500` (20,25 r 55) · `cyan.400` (75,20 r 50) · `emerald.400` (60,80 r 45) · `neutral.1000` (10,90 r 60) | `null` |
| `sunset` | linear 135° | `amber.400` 0 · `rose.500` 55 · `violet.600` 100 | `null` |
| `ember` | linear 120° | `rose.700` 0 · `rose.500` 40 · `amber.400` 100 | `null` |
| `cyber` | conic from 220° | `violet.500` 0 · `cyan.400` 35 · `violet.500` 70 · `rose.500` 100 | `null` |
| `ocean` | linear 160° | `blue.800` 0 · `blue.700` 45 · `cyan.600` 100 | `neutral.50` (min 6.47) |
| `violet-haze` | linear 180° | `violet.900` 0 · `violet.800` 60 · `violet.700` 100 | `neutral.50` (min 11.10) |
| `midnight` | linear 200° | `neutral.1000` 0 · `blue.900` 55 · `violet.800` 100 | `neutral.50` (min 15.31) |
| `nordic` | linear 170° | `blue.800` 0 · `neutral.700` 50 · `cyan.700` 100 | `neutral.50` (min 9.75) |
| `mint` | linear 145° | `emerald.200` 0 · `emerald.300` 50 · `cyan.200` 100 | `neutral.950` (min 13.38) |
| `peach` | linear 130° | `amber.200` 0 · `rose.300` 55 · `rose.200` 100 | `neutral.950` (min 12.64) |

Mesh positions are `(x, y, radius)` as percentages of the box.

**Why the split is four to six, and why it is not a failure.** Measured against every ramp step, a
gradient that runs from step 400 to step 700 has no foreground that clears 4.5 : 1 at both ends —
light text fails at the light end, dark text at the dark end. The four display presets are the vivid
ones, and pulling their stops into one half of the ladder to win the test would have made them
ordinary. So they keep their range and lose the right to carry text directly, which is what a scrim
under a headline already does in practice.

The six readable presets sit inside one half of the ladder on purpose. Four are dark and take
`neutral.50`; `mint` and `peach` are light and take `neutral.950` — a preset set where every entry
needs light text only works on one kind of page.

The scrim for a display preset is `oklch(0% 0 0 / 0.45)` over a dark-text region or
`oklch(100% 0 0 / 0.55)` over a light-text one, and the block that adds it verifies the composite.
That verification belongs to the block, not to this table, because it depends on where the text sits.

Two of the ten are mesh or conic rather than linear because their character depends on it: `aurora` is
an interference pattern between overlapping fields, and `cyber` needs a hue to return to where it
started, which only a conic sweep does. The other eight are linear — the one form that exports to CSS
with no fallback and costs nothing to composite.

## Motion tokens

Durations and easings live here because they are design decisions; the *mechanics* are in
[ANIMATION_SYSTEM.md](ANIMATION_SYSTEM.md).

```ts
export const DURATION = {
  instant: 0, fast: 120, quick: 180, base: 240, slow: 360, slower: 520, slowest: 800,
}

export const EASING = {
  linear:     [0, 0, 1, 1],
  standard:   [0.2, 0, 0, 1],      // most UI transitions
  decelerate: [0, 0, 0.2, 1],      // entrances
  accelerate: [0.4, 0, 1, 1],      // exits
  emphasized: [0.2, 0, 0, 1],
  spring:     [0.34, 1.56, 0.64, 1],  // subtle overshoot
  bounce:     [0.68, -0.55, 0.27, 1.55],
  anticipate: [0.38, -0.4, 0.2, 1.4],
}
```

`theme.motionScale` (0 / 0.5 / 1 / 1.5) multiplies every duration globally. `0` is the
reduced-motion equivalent and is what the studio's reduced-motion preview sets.

## Z-index

Named, centralized, no magic numbers anywhere in the codebase.

```ts
export const Z = {
  canvasContent: 0,
  canvasOverlay: 10,      // selection, hover, guides
  canvasHandles: 20,      // resize handles
  panel: 100,
  topBar: 110,
  dragGhost: 200,
  dropdown: 300,
  popover: 400,
  dialog: 500,
  tooltip: 600,
  toast: 700,
  commandPalette: 800,
}
```

## Iconography

`packages/icons` — 20 × 20 grid, 1.5 px stroke, `currentColor`, `round` caps and joins. Each
icon is a React component with `size` and `strokeWidth` props. No icon font, no sprite sheet, no
runtime SVG fetching.

The geometry is **data**, not JSX: `geometry.ts` holds every glyph as a list of shapes and the stroke
contract above as one constant, `createIcon` builds the components from it, and the export engine reads
the same table to print an inline `<svg>` into a page that has no icon package — ADR-250. `IconName` is
derived from that table, so a glyph nobody drew and a component nobody registered both fail to compile.

## Generated output

```ts
// build/to-tailwind.ts → apps/web/src/styles/theme.css
@theme {
  --color-surface-0: var(--ms-color-surface-0);
  --color-accent:    var(--ms-color-accent);
  --radius-lg:       var(--ms-radius-lg);
  --font-sans:       var(--ms-font-sans);
  /* ... */
}
```

Tailwind utilities point at the runtime variables, so a theme change is a variable write and
**zero classes change and zero components re-render**. That is the whole design of the theme
engine — see [THEME_ENGINE.md](THEME_ENGINE.md).
