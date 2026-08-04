# 57 — Visual regression

**Milestone** M13 · **Depends on** 56 · **Commit** `test: add visual regression suite`

## Read first

- `docs/TESTING.md` — § Visual regression
- `docs/DEVOPS.md` — § CI

## Goal

Screenshot tests, scoped narrowly. Visual tests are the flakiest thing in any suite, so the scope is
deliberately small and the determinism controls are strict.

The value: a token change that accidentally breaks 40 blocks becomes one failing CI job instead of a
discovery three weeks later.

## Deliverables

```
e2e/visual/
├── blocks.spec.ts            every block with previewProps, light + dark
├── studio-chrome.spec.ts     empty, with selection, with a dialog open
├── themes.spec.ts            all 10 presets on one reference block
├── export-dialog.spec.ts
├── controls.spec.ts          every inspector control kind
└── snapshots/                committed baselines, per platform

.github/workflows/visual.yml   main branch + a labelled PR job
scripts/update-baselines.mjs   CI-only baseline regeneration
```

## Constraints

### Scope — what is in and what is out

**In:**
- Each of the 62 blocks with `previewProps`, light and dark
- Studio chrome: empty canvas, with a selection, with the export dialog open
- All 10 theme presets on one reference block
- Every inspector control kind in its default and active states

**Out, deliberately:**
- Full pages (too much surface, changes constantly)
- Anything mid-animation
- Anything with a date, a random value, or third-party content
- The landing page (its whole point is motion)

State this scope in a comment at the top of the suite so nobody expands it into unreliability.

### Determinism — all six controls

1. `emulateMedia({ reducedMotion: 'reduce' })` — no animation in any screenshot
2. Fonts preloaded and awaited: `document.fonts.ready` before every shot
3. Fixed viewport per spec, fixed `deviceScaleFactor: 1`
4. All content from fixtures — no dates, no random, no network
5. `animations: 'disabled'` in the screenshot options
6. `maxDiffPixelRatio: 0.01` — tolerant of antialiasing, intolerant of real change

Additionally: mask any element that legitimately varies (the FPS meter, timestamps) with Playwright's
`mask` option rather than excluding the whole shot.

### Baselines are generated in CI, never locally

Local font rendering differs across machines and OSes, so a locally-generated baseline churns on every
contributor's machine.

```bash
# never: pnpm test:visual -u
# instead: trigger the labelled CI job, which regenerates and commits
```

`update-baselines.mjs` runs only in CI, in the same container image as the test job, and commits the
result. Document this in `CONTRIBUTING.md` — it is exactly the kind of thing someone will get wrong
once and then be confused by.

Baselines are committed per platform (`linux-chromium` only, since CI is Linux; the suite does not run
on Firefox or WebKit because three browsers × 124 block shots is not worth the maintenance).

### CI wiring

- Runs on pushes to `main`
- On PRs, runs only when the `visual` label is applied, because most PRs do not touch visuals and the
  job takes two minutes
- On failure, uploads a diff report as an artifact with side-by-side images
- Never blocks a merge on its own — it **informs**. A legitimate visual change should not require
  arguing with CI, it requires regenerating the baseline.

State that reasoning in the workflow file. A blocking visual test is how teams end up ignoring visual
tests.

### The first run

Generate all baselines, then **look at every single one**. This is the actual value of this prompt:
124 block screenshots in one place is the first time anyone has seen the whole registry side by side.

Report what you find. Expect: inconsistent internal spacing between similar blocks, one block with the
wrong heading size, a dark-mode surface that is too close to its neighbour, an effect that looks wrong
on light backgrounds. These are real bugs that only appear in aggregate.

Fix them before committing the baselines — a baseline that captures a bug makes the bug permanent.

## Verify

```bash
pnpm test:visual                # after CI generates baselines
```

Report:
- Total screenshot count
- Suite wall-clock time
- How many baselines needed regeneration on a second run (must be zero — that is the determinism check)

Then deliberately break something and confirm the suite catches it:
- Change `--ms-radius-lg` from 12 to 16 → report how many block shots failed (should be many)
- Revert

Then a false-positive check: run the suite three times with no changes. Report the failure count. **Must
be zero.** If not, the determinism controls are incomplete — find which one and fix it rather than
raising `maxDiffPixelRatio`.

## Done when

- [ ] Suite scoped to blocks, chrome, themes, and controls — with the exclusions commented
- [ ] All six determinism controls in place
- [ ] Baselines generated in CI only; the local path documented in `CONTRIBUTING.md`
- [ ] Three consecutive runs with zero false positives; count reported
- [ ] A deliberate token change caught by the suite; count of affected shots reported
- [ ] **Every baseline reviewed by eye**, and the inconsistencies found are reported and fixed
- [ ] CI job wired: main + labelled PRs, non-blocking, with a diff artifact
- [ ] Reasoning for non-blocking stated in the workflow
