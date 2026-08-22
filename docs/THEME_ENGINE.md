# THEME_ENGINE

The theme engine turns a small config object into a full set of CSS custom properties, applied
in one write, with **zero component re-renders**.

## Why it works that way

Tailwind utilities are generated to reference runtime variables:

```css
@theme {
  --color-surface-1: var(--ms-color-surface-1);
  --color-accent:    var(--ms-color-accent);
  --radius-lg:       var(--ms-radius-lg);
}
```

So `class="bg-surface-1 rounded-lg"` resolves through `--ms-*`. Change `--ms-color-surface-1` on
the root and every element using it repaints — React is never involved. A theme change is a
`style.setProperty` loop, not a state update.

## ThemeConfig

```ts
// packages/theme/src/theme.types.ts
export interface ThemeConfig {
  id: string
  name: string
  colorMode: 'light' | 'dark' | 'system'

  palette: {
    accent: string            // OKLCH or hex; the seed
    neutral: NeutralHue       // 'slate' | 'zinc' | 'stone' | 'gray' | 'warm' | 'cool'
    accentHueShift: number    // -30..30, shifts generated ramp hue
    saturation: number        // 0.5..1.5, chroma multiplier
    repairContrast: boolean   // false = the user kept a failing accent; see § Contrast repair
  }

  radiusScale: 0 | 0.5 | 1 | 1.5 | 2
  spacingScale: 0.875 | 1 | 1.125
  motionScale: 0 | 0.5 | 1 | 1.5
  elevationStyle: 'flat' | 'soft' | 'sharp' | 'glow'

  typography: {
    pairing: FontPairingId    // 'geist' | 'inter-mono' | 'satoshi-jet' | ...
    baseSize: 14 | 15 | 16
    scaleRatio: 1.2 | 1.25 | 1.333
  }

  surface: {
    glassLevel: 'none' | 'subtle' | 'medium' | 'strong'
    noiseLevel: 'none' | 'subtle' | 'light' | 'medium'
    borderStyle: 'hairline' | 'solid' | 'none'
  }
}
```

That is the entire user-facing surface of theming. Everything else is derived.

## Palette generation

From one accent colour, generate a twelve-step ramp by holding the lightness ladder and the
chroma curve from `packages/tokens` and substituting the seed's hue.

```ts
export function generateRamp(seed: string, options: RampOptions): ColorRamp {
  const { l, c, h } = parseOklch(seed)

  return LIGHTNESS_LADDER.map((targetL, i) => {
    const chroma = CHROMA_CURVE[i] * options.saturation * (c / REFERENCE_CHROMA)
    const hue = h + options.hueShift * HUE_SHIFT_CURVE[i]
    return formatOklch(targetL, clampChroma(chroma, targetL, hue), hue)
  })
}
```

Three details that matter:

1. **`clampChroma`** pulls chroma back into sRGB gamut per lightness — otherwise mid-tones of
   saturated hues clip to flat blocks in browsers without wide-gamut output.
2. **`HUE_SHIFT_CURVE`** applies a small hue rotation toward the light and dark ends. Pure
   hue-constant ramps look synthetic; a few degrees of drift reads as designed.
3. The seed's own lightness is ignored for the ramp but used to pick which step becomes
   `accent` — a user picking a pale colour gets step 400 as their accent, not 600.

### Contrast repair

After generating, the engine verifies every semantic pairing. On a failure it walks the ramp to
the next step that passes, and records the substitution:

```ts
export interface ThemeResolution {
  variables: Record<string, string>
  repairs: ContrastRepair[]        // applied, and shown in the theme builder as warnings
  overrides: ContrastRepair[]      // declined by the user, and shown the same way
  warnings: string[]
}
```

The theme builder shows repairs inline: "Accent on surface-1 was 3.2:1 — using violet-700
instead." The user can override, and the export includes a comment noting the ratio. We never
silently ship failing contrast, and we never silently override the user either.

**"Keep mine" is `palette.repairContrast: false`.** The choice belongs in the config because it
travels with the document: the same accent has to come back unrepaired after a reload, on another
machine, and in every export target. With it off, the engine still runs the check and still reports
the failing pair — as `overrides` rather than `repairs` — so the warning stays on screen and the
export can emit the measured ratio as a comment. The field defaults to `true`, so a config that
predates it, or one written by hand, is repaired.

## Application

```ts
// packages/theme/src/apply.ts
export function applyTheme(config: ThemeConfig, root: HTMLElement = document.documentElement) {
  const resolved = resolveTheme(config)

  // one batched write inside a single frame
  const style = root.style
  for (const [name, value] of Object.entries(resolved.variables)) {
    style.setProperty(name, value)
  }

  root.dataset.colorMode = resolveColorMode(config.colorMode)
  root.dataset.elevation = config.elevationStyle
  root.dataset.glass = config.surface.glassLevel

  return resolved
}
```

- ~120 variables. The loop is sub-millisecond.
- `resolveTheme` is memoised on a hash of the config, so dragging a hue slider does not
  regenerate identical output.
- During a slider drag the engine writes **only the affected variables**, not the whole set.

### Variable groups

| Prefix | Count | Source |
| --- | --- | --- |
| `--ms-color-*` | ~48 | Semantic colours for the active mode |
| `--ms-radius-*` | 9 | Radius tokens × `radiusScale` |
| `--ms-space-*` | 18 | Space tokens × `spacingScale` |
| `--ms-font-*` | 6 | Family + size base + ratio |
| `--ms-text-*` | 14 | Computed size/line-height pairs |
| `--ms-shadow-*` | 8 | Elevation set for mode + `elevationStyle` |
| `--ms-blur-*` | 8 | Blur scale |
| `--ms-duration-*` | 7 | Base durations, each a `calc()` over the two motion factors |
| `--ms-motion-scale` | 1 | `motionScale`. The environment's `--ms-reduced-motion` is not written here |
| `--ms-ease-*` | 8 | Easing curves |
| `--ms-glass-*` | 3 | Backdrop-filter, background, border for the level |
| `--ms-noise-opacity` | 1 | |

## Colour mode

```ts
const mode = config.colorMode === 'system'
  ? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
  : config.colorMode
```

- `data-color-mode` on `<html>`; CSS selects the mode's variable block.
- **`setColorMode(preference)`** is the one way to switch it. It writes the attribute and the stored
  preference for `light` and `dark`, and clears both for `system` — because no attribute is what lets the
  stylesheet's `prefers-color-scheme` block decide (ADR-026). It returns the mode now in effect, so a
  caller drawing the state does not resolve `system` a second time. `blocks/theme-toggle` is its caller,
  and the export emits the same twelve statements as a local module (ADR-200, ADR-201).
- A blocking inline script in `<head>` reads the stored preference and sets the attribute before
  first paint. This is the one place a blocking script is correct — the alternative is a flash.
- The `system` listener is a single `matchMedia` change handler that calls `applyTheme`.
- Mode switching animates: a 180 ms `background-color`/`color` transition on the root, disabled
  under reduced motion and disabled during the initial paint (a `data-theme-ready` attribute
  gates the transition so page load never animates).

## Elevation styles

`elevationStyle` swaps the shadow set wholesale:

| Style | Character |
| --- | --- |
| `flat` | No shadows. Borders only. |
| `soft` | Default. Layered diffuse shadows. |
| `sharp` | Tight, high-contrast, small offset. Editorial. |
| `glow` | Coloured shadows derived from the accent. Neon. |

`glow` derives from the accent ramp, so it re-generates when the palette changes.

## Motion scale

Every duration is a product of its base and **two** independent factors, so reduced motion is the
same code path as `motionScale: 0` rather than a separate branch:

```css
:root {
  --ms-motion-scale: 1;    /* the theme's, written by applyTheme */
  --ms-reduced-motion: 1;  /* the environment's */
  --ms-duration-base: calc(240ms * var(--ms-motion-scale) * var(--ms-reduced-motion));
}

@media (prefers-reduced-motion: reduce) {
  :root { --ms-reduced-motion: 0; }
}
```

**The two factors cannot be one variable.** `applyTheme` writes through `style.setProperty`, which
is an inline declaration, and an inline declaration outranks every author rule including one inside a
media query. Measured in Chrome with reduced motion forced on: with a single shared variable, the
theme's inline `--ms-motion-scale: 1` resolved `calc(240ms * 1)` — the media query had no effect at
all, so applying any theme silently switched a reduced-motion user back to full animation. With the
factors separated, the same write resolved `calc(240ms * 1 * 0)`. See ADR-021.

`motionScale: 0` therefore zeroes durations by the theme's own factor, and the media query zeroes
them by the environment's; either is sufficient, which is what "not a separate branch" means.

The studio's "preview reduced motion" toggle writes `--ms-reduced-motion: 0` inline, letting a
designer check the reduced experience without changing OS settings. Writing `1` there is the one way
to override the OS preference, and it is deliberate: only the preview toggle does it, and only while
the designer is looking.

## Presets

`packages/theme/src/presets/` — each a `ThemeConfig`, each contrast-tested in CI.

| Preset | Character |
| --- | --- |
| `studio-dark` | Default. Neutral 265, violet accent, soft elevation. |
| `studio-light` | Same palette, light mode. |
| `midnight` | Deep blue-black, cyan accent, glow elevation. |
| `paper` | Warm neutrals, sharp elevation, no glass. Editorial. |
| `brutal` | Zero radius, sharp shadows, high contrast, mono display. |
| `aurora` | Violet→cyan, strong glass, medium noise. |
| `ember` | Warm stone neutrals, amber accent. |
| `nord` | Cool desaturated, blue accent, flat elevation. |
| `mono` | Pure neutral, no accent hue, radius 0.5. |
| `candy` | High chroma, large radius, soft elevation. |

## Theme builder UI

Left panel, `Theme` tab:

```
Mode          [ ☀ ] [ 🌙 ] [ ⚙ ]
Preset        [ studio-dark        ▾ ]

Accent        [■] oklch(58% .18 285)
Neutral       [ slate ▾ ]
Hue shift     [───●────]  0
Saturation    [────●───]  1.0

Radius        [ 0 ][ ½ ][ 1 ][ 1½ ][ 2 ]
Spacing       [ ⅞ ][ 1 ][ 1⅛ ]
Motion        [ 0 ][ ½ ][ 1 ][ 1½ ]
Elevation     [ flat ][ soft ][ sharp ][ glow ]

Font pairing  [ Geist / Geist Mono ▾ ]
Base size     [ 14 ][ 15 ][ 16 ]

Glass         [ none ][ subtle ][ medium ][ strong ]
Noise         [───●────]  0.03
Borders       [ hairline ][ solid ][ none ]

⚠ 1 contrast repair              [ details ]
[ Reset ]  [ Save as preset ]  [ Export tokens ]
```

Every control writes variables immediately and dispatches a coalesced command, so the whole
theming session is one undo step per control.

The three buttons on the last row:

- **Reset** applies the preset the current theme is based on — `config.id` names it, and editing a
  token never changes the id. A theme based on a saved custom preset resets to that preset.
- **Save as preset** stores the current config in `localStorage` under a new id and adds it to the
  picker. Saved presets can be renamed and deleted. They are user-level convenience, not document
  content, which is why they are not in the `.motion` file.
- **Export tokens** opens the four-format dialog below.

## Theme in export

The theme travels with the document and is emitted by every export target:

| Target | Output |
| --- | --- |
| React | A `theme.css` with the resolved `:root` variables + a `@theme` block |
| Next.js | Same, wired into `app/globals.css`, plus `tailwind.config.ts` if requested |
| HTML | Variables inlined in a `<style>` in `<head>` |
| JSON | The `ThemeConfig` verbatim, so re-import reproduces it exactly |

`Export tokens` additionally offers: CSS variables, Tailwind config, JSON, and Figma Tokens
format.

The four generators live in `packages/theme/src/export/` and take one `ThemeExport`, so the formats
cannot disagree with each other or with what the export engine emits. `packages/codegen` restates
none of them: it receives their output on `PrintedTheme`, because an import would put React in the
export engine's runtime graph — ADR-232 for the stylesheet, ADR-236 for the four token formats. Each
is a pure string function: no DOM, no clipboard, no download. The dialog owns those.

## Scoped themes

The block gallery renders many previews, each possibly in a different theme. `applyTheme`
accepts any element, and `<ThemeScope>` applies the variables to a wrapper instead of the root:

```tsx
<ThemeScope theme={preset} className="rounded-xl">
  <BlockPreview id="aurora-card" />
</ThemeScope>
```

Because everything resolves through variables, a scoped theme just works — nested scopes
included. This is also how the canvas can preview a theme change on the selection only.

## Rules

1. **No component reads `ThemeConfig` to style itself.** It uses token classes. The config is
   read only by `resolveTheme` and the theme builder.
2. **No hard-coded colour anywhere outside `packages/tokens`.** Lint rule: hex/rgb/oklch
   literals are errors outside the tokens package and theme presets.
3. **Variables are written in one batch,** never per-property across a render.
4. **Every generated palette is contrast-verified** before it is applied.
5. **A theme change must not trigger a React render.** Test: render counter on the canvas root,
   switch theme, assert zero increments.
