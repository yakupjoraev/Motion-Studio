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

Both modes are declared explicitly, not derived at runtime:

| Token | Light | Dark |
| --- | --- | --- |
| `surface-0` | `neutral.50` | `neutral.1000` |
| `surface-1` | `white` | `neutral.950` |
| `surface-2` | `neutral.100` | `neutral.900` |
| `surface-3` | `white` | `neutral.800` |
| `foreground` | `neutral.950` | `neutral.50` |
| `foreground-muted` | `neutral.600` | `neutral.400` |
| `foreground-subtle` | `neutral.400` | `neutral.500` |
| `border` | `neutral.200` | `neutral.800` |
| `border-strong` | `neutral.300` | `neutral.700` |
| `accent` | `violet.600` | `violet.500` |
| `canvas-bg` | `neutral.100` | `neutral.1000` |
| `canvas-grid` | `neutral.200` | `neutral.900` |

### Contrast contract

- Body text on its surface: **≥ 4.5:1**
- Large text (≥ 24 px or ≥ 19 px bold): **≥ 3:1**
- Non-text UI (borders, icons, focus rings): **≥ 3:1**
- Focus ring against both the element and its surroundings: **≥ 3:1**

A unit test walks every semantic pair in both modes and fails the build on a violation. Theme
presets go through the same test. User-generated palettes are checked at runtime and show a
warning chip in the theme builder — never silently ship inaccessible output.

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

Presets shipped: `aurora`, `sunset`, `ocean`, `ember`, `mint`, `violet-haze`, `midnight`,
`peach`, `cyber`, `nordic`. Each is checked for text contrast at its darkest and lightest point.

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
