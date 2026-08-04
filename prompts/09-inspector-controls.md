# 09 — Inspector controls

**Milestone** M1 · **Depends on** 08 · **Commit** `feat(ui): add value-editing controls for the inspector`

## Read first

- `docs/UI_GUIDELINES.md` — § Control rows, § Multi-selection
- `docs/COMPONENT_LIBRARY.md` — § Control kinds (the full table)
- `docs/ACCESSIBILITY.md` — § Inspector
- `docs/STATE_MANAGEMENT.md` — § Transient state
- `docs/PERFORMANCE.md` — § The core rule

## Goal

The 22 control kinds that the generated inspector is built from. These are the components users
touch most, so they get the most care: scrubbable numbers, a real colour picker, a gradient track, a
shadow stack, a spring curve editor.

Every one of them follows the transient-state pattern: continuous interaction writes a CSS variable
and calls `onChange`; release calls `onCommit`. The consumer turns `onCommit` into a coalesced
command. No control ever dispatches directly.

## Deliverables

```
packages/ui/src/controls/
├── control-row/         label + control layout, override dot, reset affordance, mixed state
├── scrub-field/         the most important one — see below
├── slider-field/        slider + linked number
├── stepper-field/
├── text-field/
├── textarea-field/
├── rich-text-field/     bold/italic/link only, contenteditable with a restricted paste
├── select-field/
├── segmented-field/
├── switch-field/
├── color-field/         swatch → picker popover
├── color-picker/        React Aria useColorArea/useColorSlider; eyedropper; alpha; token presets; contrast readout
├── gradient-field/      stop track: add, drag, delete, colour per stop; angle dial; kind switch
├── shadow-field/        layer stack: add, reorder (buttons + drag), per-layer editing, inset toggle
├── spacing-field/       4-side box with a link toggle
├── radius-field/        4-corner with a link toggle
├── align-field/         3×3 grid
├── font-field/          family/size/weight/tracking group
├── image-field/         URL, upload, aspect preview, alt text (required, warns if empty)
├── icon-field/          searchable icon picker over the icons registry
├── link-field/          URL + target + rel, with scheme validation
├── list-field/          repeatable items: add, remove, reorder, per-item sub-controls, collapse
├── css-field/           raw CSS escape hatch with validation feedback
├── curve-editor/        draggable cubic-bezier with a live preview dot
├── spring-editor/       mass/stiffness/damping sliders + numerically integrated response curve
└── index.ts
```

## Constraints

### `ScrubField` — the details that make it feel right

- Horizontal drag changes the value; `cursor: ew-resize` while dragging.
- `Shift` × 10, `Alt` × 0.1, applied live mid-drag (not only at drag start).
- Pointer lock is **not** used — it breaks on some Linux setups. Use `setPointerCapture` and
  accumulate `movementX`.
- Arrow keys step; `Shift`/`Alt` modify the same way.
- Typing accepts expressions: `16*2`, `100/3`, `8+4`. Evaluate with a tiny arithmetic parser
  (~40 lines, four operators and parens) — **never** `eval` or `new Function`.
- `Esc` reverts to the value at focus time.
- `Enter` commits and keeps focus.
- Unit suffix rendered inside the field, not as separate text.
- `role="spinbutton"` with `aria-valuenow`, `aria-valuemin`, `aria-valuemax`, and `aria-valuetext`
  including the unit ("16 pixels").
- During a drag, `onChange` fires per frame and `onCommit` fires once on release.

### `ColorPicker`

- React Aria `useColorArea` + `useColorSlider` for hue and alpha — do not hand-roll the pointer maths
  and ARIA for these.
- Eyedropper via `EyeDropper` API when available, hidden when not (no broken button).
- Theme tokens as a preset row; picking one stores the token reference, not the resolved value, so
  the colour follows theme changes. That distinction matters and needs a test.
- Live contrast readout against the resolved parent background, with the pass/fail state announced.
- Recent swatches, capped at 12, stored by the consumer.

### `SpringEditor`

Sliders for mass, stiffness, damping, plus a canvas-drawn response curve from `simulateSpring`.
`packages/motion` owns `simulateSpring` — if prompt 30 has not run yet, define the function locally
in `ui` with a comment saying it moves to `motion` in prompt 30, and move it there then. Say which
you did.

### `ControlRow`

Owns the three states from `UI_GUIDELINES.md`: overridden-at-breakpoint (accent dot + reset),
differs-from-default (reset), mixed across a multi-selection (`Mixed` placeholder, editing applies
to all). Every one of the three is a test.

### Universal

- No control imports the store. All of them are controlled components with `value`, `onChange`,
  `onCommit`.
- No control over 200 lines.
- Every control has a `label` and links it with `htmlFor` — never a placeholder standing in for a
  label.
- `axe` clean, keyboard-complete, `memo`ised on `(value, path)`.

## Verify

```bash
pnpm --filter @motion-studio/ui test
pnpm dev:storybook
```

Required tests:
- ScrubField: drag distance → value delta (all three modifier states), arrow steps, expression
  evaluation, `Esc` revert, one `onCommit` per drag, `aria-valuetext` includes the unit
- Expression parser: valid expressions, invalid input rejected without throwing, no code execution
  (assert `1+1` works and `constructor` does nothing)
- ColorPicker: token selection stores the reference; contrast readout matches `contrastRatio`
- GradientField: add/move/delete a stop, round-trip to a CSS string
- ShadowField: reorder by button changes order; reorder is keyboard-operable
- ListField: add/remove/reorder, and reordering does not lose per-item state
- ControlRow: all three indicator states
- CurveEditor and SpringEditor: keyboard-operable control points announcing values

In Storybook: drag every numeric control and watch for jitter. Confirm one commit per drag by
logging in the story. Check both colour modes and reduced motion.

## Done when

- [ ] All 22 control kinds plus the three editors implemented
- [ ] ScrubField behaviour complete, including safe expression evaluation
- [ ] Transient pattern honoured everywhere: `onChange` per frame, `onCommit` once
- [ ] No control touches the store
- [ ] Every control: labelled, keyboard-complete, axe clean, memoised, tested
- [ ] Storybook drag-feel check performed
- [ ] Verification clean
