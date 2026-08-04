# 36 — Theme builder panel

**Milestone** M7 · **Depends on** 35 · **Commit** `feat(web): add theme builder panel`

## Read first

- `docs/THEME_ENGINE.md` — § Theme builder UI, § Contrast repair, § Theme in export
- `docs/PRODUCT.md` — § 2. Left panel (Theme)
- `docs/ACCESSIBILITY.md` — § Contrast

## Goal

The Theme tab: every control from `THEME_ENGINE.md`, applying live, undoable, with contrast repairs
surfaced rather than hidden.

One control changing the whole document's feel — radius from 0 to 2, elevation from flat to glow — is
one of the product's most convincing demos, so the feedback has to be instant.

## Deliverables

```
apps/web/src/components/studio/left-panel/theme/
├── theme-tab.tsx              the panel
├── mode-toggle.tsx            light / dark / system
├── preset-picker.tsx          10 presets with live swatch previews
├── palette-controls.tsx       accent, neutral, hue shift, saturation
├── scale-controls.tsx         radius, spacing, motion, elevation
├── typography-controls.tsx    pairing, base size, ratio
├── surface-controls.tsx       glass, noise, borders
├── contrast-report.tsx        repairs list with before/after ratios
├── export-tokens-dialog.tsx   CSS vars / Tailwind config / JSON / Figma Tokens
├── use-theme-edit.ts          variable write + coalesced command
└── *.test.tsx
```

## Constraints

### The two-write pattern

Every theme control does two things on interaction:

1. **Immediately** write the affected CSS variables via `applyThemePartial` — instant visual feedback,
   zero React renders
2. **On commit** dispatch a coalesced `setThemeToken` command — so it undoes and persists

Dragging the hue slider must repaint the whole document at 60 fps with **zero** React renders. That is
the test.

### Contrast repair, surfaced

When `resolveTheme` returns repairs, `contrast-report.tsx` shows them inline:

```
⚠ 1 contrast repair
  Accent on surface-1 was 3.2:1 (needs 4.5:1)
  Using violet-700 instead                    [ keep mine ]  [ details ]
```

- "keep mine" overrides the repair and records the choice in the config, so export can emit a comment
  noting the ratio
- Never silently ship a failing pair; never silently override the user. Both halves.
- The warning count appears on the Theme tab label so it is visible from other tabs

### Preset picker

Each preset renders a live swatch strip (accent ramp + surfaces) plus a miniature card in that theme,
built with `ThemeScope`. Applying is one command with `applyThemePreset`, so it is one undo step
regardless of how many tokens change.

### Export tokens

Four formats. Each generated from the same resolved theme, so they cannot disagree:

- **CSS variables** — the `:root` blocks for both modes
- **Tailwind config** — a `tailwind.config.ts` with the theme extension (for people not on v4)
- **JSON** — the `ThemeConfig` plus the resolved values
- **Figma Tokens** — the W3C-ish design-tokens format that the Figma Tokens plugin reads

Each with a copy button and a download.

### Custom presets

"Save as preset" stores the current config in `localStorage` and adds it to the picker with a
distinguishing label. Saved presets can be renamed and deleted. They are not part of the document —
they are a user-level convenience, which is why `localStorage` rather than the document is correct.

### Accessibility

- Every slider is a labelled `role="slider"` with `aria-valuetext` including the unit
- The contrast readout is announced when it changes, debounced
- Colour swatches have accessible names ("Accent, violet 600")
- Segmented scale controls are `role="radiogroup"` with arrow navigation
- The repair warning is in a `role="status"` region

## Verify

```bash
pnpm test
pnpm dev
```

Tests:
- A theme control writes variables synchronously and dispatches a coalesced command
- Dragging one control 100 times → one history entry
- `applyThemePreset` is one command
- Repair shown when a config fails; "keep mine" recorded in the config
- All four export formats generated from one resolved theme, containing the same accent value
- Custom preset save/rename/delete round-trip through `localStorage`
- Zero React renders on a theme change (render counter on the canvas root)

E2E `e2e/editor/theme.spec.ts`:
1. Change the accent → the canvas visibly updates
2. `Cmd+Z` → reverts in one step
3. Set radius scale to 0 → every block is square
4. Apply `brutal` → one undo returns to the previous theme entirely
5. Pick an accent that fails contrast → the repair notice appears
6. Export tokens → all four formats present with matching values

Manual, and report:
- Drag the hue slider continuously → the whole document recolours at 60 fps; report the render count
  (must be 0) and whether you observed any jank
- Radius 0 → 2 → the document's whole character changes; it should feel like a different product
- Elevation `flat` → `glow` → shadows derive from the accent
- Glass `none` → `strong` on a document with a photo background
- Both colour modes, and `system` following an OS change
- With a screen reader: change the accent and confirm the contrast readout is announced

## Done when

- [ ] Every control from `THEME_ENGINE.md` § Theme builder UI present
- [ ] Two-write pattern: instant variables, coalesced command
- [ ] Zero React renders on theme change; reported
- [ ] Continuous drag → one history entry
- [ ] Contrast repairs surfaced with a "keep mine" escape that is recorded
- [ ] Warning count visible on the tab label
- [ ] Four token export formats, generated from one resolution
- [ ] Custom presets persist and are manageable
- [ ] Full a11y pass on the panel; contrast announcement verified with a screen reader
- [ ] E2E theme spec passing
