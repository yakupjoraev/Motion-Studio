# 06 — Theme engine

**Milestone** M1 · **Depends on** 04 · **Commit** `feat(theme): add runtime theme engine with palette generation`

## Read first

- `docs/THEME_ENGINE.md` — **all of it**
- `docs/DESIGN_SYSTEM.md` — § Colour, § Generated output
- `docs/ACCESSIBILITY.md` — § Contrast

## Goal

`packages/theme` turns a `ThemeConfig` into ~120 CSS custom properties, applied in one batched
write, with **zero React re-renders**. Plus palette generation from a single accent seed, with
contrast repair.

## Deliverables

```
packages/theme/src/
├── theme.types.ts          ThemeConfig, ThemeResolution, ContrastRepair
├── theme.schema.ts          zod schema (used by FILE_FORMAT later)
├── resolve/
│   ├── resolve-theme.ts     ThemeConfig → variables, memoised on a config hash
│   ├── generate-ramp.ts     seed → 12-step OKLCH ramp
│   ├── repair-contrast.ts   verify + substitute + report
│   └── *.test.ts
├── apply/
│   ├── apply-theme.ts       batched setProperty loop + data attributes
│   ├── theme-scope.tsx      <ThemeScope> for scoped previews
│   ├── use-color-mode.ts    system listener, single matchMedia subscription
│   └── *.test.ts
├── presets/                 10 presets per THEME_ENGINE.md § Presets
│   ├── studio-dark.ts … candy.ts
│   ├── index.ts
│   └── presets.test.ts      contrast gate over all 10
├── script/
│   └── color-mode-script.ts  the blocking inline script string
└── index.ts
```

## Constraints

**`generateRamp`** — the three details in `THEME_ENGINE.md` § Palette generation are the whole
value of this function: `clampChroma` per lightness, `HUE_SHIFT_CURVE` drift, and seed lightness
choosing which step becomes `accent` rather than defining the ramp. Implement all three.

**`resolveTheme`** is pure and memoised on a hash of the config. Dragging a hue slider must not
regenerate identical output 60 times a second.

**`applyTheme`** writes in one loop. During a slider drag, a partial variant writes only the
affected variables:

```ts
export function applyThemePartial(keys: readonly string[], resolved: ThemeResolution, root?: HTMLElement): void
```

**Contrast repair** returns a report; it never silently overrides the user and never silently ships
a failing pair. Both halves of that sentence matter.

**Colour mode** — one `matchMedia` subscription in the whole app, exported as `useColorMode`. The
blocking script string is exported for `apps/web` to inline in `<head>`; it must be under 300 bytes
and must not reference anything outside `document` and `localStorage`.

**Theme transition** — a `data-theme-ready` attribute gates the 180 ms root transition so page load
never animates. Set it in a `requestAnimationFrame` after the first paint.

**The zero-re-render property is a test, not a claim:**

```tsx
it('applying a theme does not re-render subscribers', () => {
  const renders = { count: 0 }
  function Probe() { renders.count += 1; return <div className="bg-surface-1" /> }
  render(<Probe />)
  const before = renders.count
  applyTheme(presets.midnight)
  expect(renders.count).toBe(before)
})
```

## Verify

```bash
pnpm --filter @motion-studio/theme test
```

Assertions that must exist:
- `generateRamp` output is in-gamut at every step for 20 sampled seeds
- Every one of the 10 presets passes the contrast gate for all documented pairs
- `resolveTheme` produces the complete variable set — no key from the token groups is missing
  (assert the count and the key set)
- Calling `resolveTheme` twice with the same config returns the same object reference (memoised)
- `applyTheme` causes zero re-renders
- `repairContrast` on a deliberately failing config returns a non-empty `repairs` array with the
  substituted step named

Then wire it into `apps/web`: apply `studio-dark` on mount, inline the colour-mode script, and add a
temporary mode toggle. Switch modes in the browser. Confirm no flash on reload and no layout shift.
Then remove the temporary toggle.

## Done when

- [ ] `ThemeConfig` matches `THEME_ENGINE.md` exactly
- [ ] Palette generation implements gamut clamping, hue drift, and seed-lightness accent selection
- [ ] Contrast repair reports every substitution
- [ ] All 10 presets pass the contrast gate
- [ ] `applyTheme` is one batched write; partial variant exists for drags
- [ ] Zero-re-render test passes
- [ ] `ThemeScope` works for nested scoped previews (test with two nesting levels)
- [ ] No flash of wrong theme on reload in a real browser
- [ ] Full verification suite clean
