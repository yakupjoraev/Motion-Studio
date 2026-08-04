# 35 — Responsive engine

**Milestone** M7 · **Depends on** 34 · **Commit** `feat(web): add responsive breakpoint editing`

## Read first

- `docs/RESPONSIVE_ENGINE.md` — **all of it**
- `docs/PRODUCT.md` — § 4. Inspector (Responsive)
- `docs/UI_GUIDELINES.md` — § Control rows

## Goal

Breakpoint switching, per-breakpoint editing with unmistakable feedback, and the guardrail that stops
users filling a document with accidental overrides.

`resolveResponsiveProps` already exists from prompt 12. This prompt is the editing experience around
it.

## Deliverables

```
apps/web/src/components/studio/
├── top-bar/breakpoint-switcher.tsx    six segments, active state, shortcut hints
├── canvas-area/
│   ├── artboard-resize.tsx            animated width transition
│   └── multi-frame-view.tsx           optional side-by-side comparison
├── inspector/
│   ├── responsive-header.tsx          "Editing md and up" reminder
│   ├── override-indicator.tsx         • overridden here  · inherited from X
│   ├── responsive-hint.tsx            the editing-scope guardrail
│   └── use-responsive-edit.ts         routes edits to props vs responsive[bp]
└── *.test.tsx
```

## Constraints

### Edit routing

```
active breakpoint === 'base'  → setProp        (affects everything without an override)
active breakpoint !== 'base'  → setResponsiveProp  (affects that breakpoint and up)
```

The coalesce key includes the breakpoint, so scrubbing at `md` and then at `lg` produces two history
entries, not one merged mess.

### The three indicator states

Per `RESPONSIVE_ENGINE.md`:

- `•` accent dot — **overridden at the active breakpoint**. Reset removes the override key.
- `·` muted dot — **inherited from a smaller breakpoint**, with a tooltip naming which one ("from md").
- No marker — the base value.

Colour is not the only signal: each dot has a `title` and contributes to the control's
`aria-describedby`. A screen-reader user must be able to tell an override from an inherited value.

**Reset removes the key**, it does not write the base value. A stale key emits a dead Tailwind class
on export. There is a test for this in prompt 12; add the UI-level test here.

### The guardrail

The specific failure mode: a user switches to `md` to check something, keeps editing, and creates
thirty accidental overrides without noticing.

Implementation: if the active breakpoint is not `base` and the user has dispatched ≥ 3 responsive-prop
commands within 30 seconds, show a one-line hint above the inspector — "You're editing `md` and up.
Switch to base to change all sizes." Dismissible, shown at most once per session.

This is a small feature that prevents an hour of confusion. Do not skip it, and do not make it a modal.

### Artboard

- Width = the active breakpoint's `frame`
- Switching animates the width over 200 ms with `standard` easing, so reflow is legible. Disabled
  under reduced motion.
- `base` is **375 px** — a real phone width, not a shrunken desktop
- Frame outline shows the breakpoint name and pixel width
- After switching, if the frame no longer fits the viewport, run `fitToRect`

### Multi-frame mode

`Mod+Shift+M` renders `base`, `md`, and `xl` side by side, read-only. Selection syncs across frames;
editing happens in the active frame only. **Off by default** — three live frames triples render cost,
and this is a comparison tool, not a working mode. Say so in a comment.

### Container queries

Wire the `capabilities.containerQuery` opt-in from `RESPONSIVE_ENGINE.md` for the four blocks listed
there. Emit `@container` with a `container-type: inline-size` wrapper.

Note in a comment: container queries inside a transform-scaled canvas behave subtly differently from a
real page, which is why this is opt-in rather than default. A user should be able to trust the preview.

## Verify

```bash
pnpm test
pnpm test:e2e
pnpm dev
```

Tests:
- Edit at `base` writes `props`; edit at `md` writes `responsive.md`
- Coalesce keys differ across breakpoints
- Reset removes the key (assert the key is absent, not equal to base)
- Indicator states: overridden, inherited-from-X, base
- Guardrail: fires after 3 responsive edits in 30 s; not before; once per session
- Multi-frame: selection syncs, editing routes to the active frame only

E2E `e2e/editor/responsive.spec.ts`:
1. Set `columns=1` at base → switch to `md` → value inherited, `·` shown
2. Override at `md` → `•` shown → switch to base → base value unchanged
3. Reset the override → `responsive.md` no longer contains the key
4. Export → the emitted className contains no dead class for the reset property

Manual, and report:
- Switch breakpoints → width animates legibly, frame label correct
- `base` renders at 375 px and every block is usable there
- Edit at `md`, then check `sm` → unaffected; check `lg` → inherited
- Guardrail appears at the right moment and is dismissible
- Multi-frame comparison: selection syncs, only the active frame is editable
- A container-query block inside a resized bento cell responds to the cell, not the viewport

## Done when

- [ ] Edits route by active breakpoint, with breakpoint-scoped coalescing
- [ ] All three indicator states present and not colour-only
- [ ] Reset removes the key, verified through to the export output
- [ ] Guardrail hint implemented with the documented trigger
- [ ] Artboard animates; `base` is 375 px
- [ ] Multi-frame mode works and is off by default, with the cost reasoning commented
- [ ] Container-query opt-in wired for the four declared blocks, with the caveat commented
- [ ] E2E responsive spec passing on three browsers
