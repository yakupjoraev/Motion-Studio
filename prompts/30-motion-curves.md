# 30 — Motion curves and model

**Milestone** M6 · **Depends on** 12 · **Commit** `feat(motion): add curve vocabulary and preset model`

## Read first

- `docs/ANIMATION_SYSTEM.md` — § The model, § Preset definition, § Curves, § Composition
- `docs/DESIGN_SYSTEM.md` — § Motion tokens

## Goal

`packages/motion`'s foundation: the shared easing and spring vocabulary, spring simulation, the
`MotionPreset` contract, resolution, and composition with conflict detection.

No presets yet (prompt 32) and no React yet — the model and the maths, testable in `node`.

## Deliverables

```
packages/motion/src/
├── curves/
│   ├── easings.ts          the 12 named curves
│   ├── springs.ts          the 7 named springs
│   ├── simulate.ts         simulateSpring(config, dt, steps) → number[]
│   ├── bezier.ts           cubicBezier evaluation + toCssString
│   └── *.test.ts
├── model/
│   ├── preset.types.ts     MotionPreset, ResolvedMotion, ResolveContext, PresetParams
│   ├── define-preset.ts    the typed helper
│   ├── resolve.ts          spec + context → ResolvedMotion, memoised
│   ├── compose.ts          multi-channel composition + conflict detection
│   ├── scale.ts            motionScale application
│   └── *.test.ts
├── reduced/
│   ├── policy.ts           the per-channel reduce table
│   ├── use-reduced-motion.ts   ONE matchMedia subscription for the whole app
│   └── *.test.ts
├── codegen/
│   └── fragment.types.ts   MotionCodegenFragment
└── index.ts
```

## Constraints

### `simulateSpring`

```ts
export function simulateSpring(config: SpringConfig, dt: number, steps: number): number[]
```

Numerically integrate a damped harmonic oscillator (semi-implicit Euler is sufficient and stable at
`dt = 1/60`). Returns the position over time, normalised so 0 is the start and 1 is the target.

This drives the spring curve editor's visual, so it must be *right*, not approximately right:
- `damping` at critical value → no overshoot
- Under-damped → overshoot then settle
- Over-damped → slow approach, no overshoot
- Always converges to 1 within `steps` for every named spring (assert the last value is within 0.001)

Three tests, one per damping regime, plus the convergence assertion over all seven named springs.

### `resolve`

```ts
export function resolveMotion(spec: MotionSpec, ctx: ResolveContext): ResolvedMotion
```

Pure. Memoised on `(presetId, hash(params), reduced, scale)`. Returns the engine-agnostic shape:

```ts
interface ResolvedMotion {
  engine: 'css' | 'motion' | 'gsap'
  variants?: Record<string, TargetProperties>
  transition?: TransitionConfig
  listeners?: ListenerSpec[]
  cssVars?: Record<string, string>
  className?: string
  keyframes?: string
}
```

### `compose`

```ts
export function composeMotion(specs: Partial<Record<MotionChannel, MotionSpec>>, ctx: ResolveContext):
  { resolved: ResolvedMotion; conflicts: MotionConflict[] }
```

The composition rules from `ANIMATION_SYSTEM.md`:
- One spec per channel, max
- `entrance` + `hover` compose freely (different lifecycle phases)
- `scroll` + `entrance` conflict on `transform` → `scroll` wins, conflict reported
- `cursor` presets only write CSS variables → compose with everything
- `continuous` + `hover` compose if they touch different properties → check the property sets

Conflict detection compares the **property sets** each resolved spec touches, not the channel names.
That is what makes it correct for future presets nobody has written yet. Test with a deliberate
`transform` collision and a deliberate non-collision.

### Reduced motion

`policy.ts` implements the per-channel table verbatim. `cursor` and `continuous` are **disabled
entirely**, not slowed — that distinction is a requirement, not a preference.

`use-reduced-motion.ts` holds **exactly one** `matchMedia` subscription for the whole application,
with a module-level subscriber set. Grep the codebase afterwards and confirm there is no second
`prefers-reduced-motion` query anywhere. Report the grep result.

### `motionScale`

Multiplies every duration. `scale: 0` produces `0` for every duration, which is precisely the
reduced-motion result — so the two mechanisms converge on one code path. Assert that
`resolve(spec, { scale: 0 })` and `resolve(spec, { reduced: true })` produce equivalent timing for a
sample of specs.

## Verify

```bash
pnpm --filter @motion-studio/motion test --coverage
rg 'prefers-reduced-motion' --type ts   # expect exactly one implementation site
```

Required assertions:
- `simulateSpring`: three damping regimes, convergence for all seven named springs
- `cubicBezier`: known values (`easeInOut` at t=0.5 ≈ 0.5), `toCssString` round-trip
- `resolveMotion` memoisation: same inputs → identical reference
- Reduced policy: per channel, the documented transformation; `cursor`/`continuous` produce a disabled
  result
- `scale: 0` ≡ `reduced: true` for timing
- `composeMotion`: transform collision detected with a reason; non-collision composes cleanly;
  `cursor` composes with everything
- Exactly one `matchMedia` subscription (test with a mock and assert the call count is 1 after ten
  `useReducedMotion` consumers mount)

Coverage: **≥ 85 % / ≥ 80 %**.

## Done when

- [ ] 12 easings, 7 springs, spring simulation correct across all three damping regimes
- [ ] `MotionPreset` contract matches the doc, with `resolveReduced` and `codegen` required by the type
- [ ] Resolution pure and memoised
- [ ] Composition detects conflicts by property set, not channel name
- [ ] Reduced policy exact; `cursor` and `continuous` fully disabled
- [ ] `scale: 0` ≡ `reduced: true`, proven
- [ ] Exactly one `prefers-reduced-motion` subscription in the codebase; grep result reported
- [ ] No React, no DOM in this prompt's output
- [ ] Coverage floors met
