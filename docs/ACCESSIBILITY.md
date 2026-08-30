# ACCESSIBILITY

Target: **WCAG 2.2 AA**, verified. Not "we care about a11y" — a list of requirements per surface,
each with a test.

A motion tool has a specific obligation: the thing it produces can hurt people. Reduced motion is
therefore not a checkbox, it is a parallel design.

## Non-negotiables

1. Every interactive element is reachable and operable with a keyboard.
2. Every interactive element has an accessible name.
3. Focus is always visible, and `:focus-visible` never removed without a replacement.
4. Colour is never the only carrier of meaning.
5. `prefers-reduced-motion` is honoured in the studio **and in every export**.
6. Zero axe violations on every route, enforced in CI.
7. Every dialog traps focus and restores it on close.
8. Live regions announce state changes that are only visible.
9. Text contrast ≥ 4.5:1, non-text ≥ 3:1, verified by a token test.
10. Nothing depends on hover alone.

## Per surface

### Canvas

The hardest surface, and the one most tools give up on.

```html
<div
  role="application"
  aria-label="Design canvas"
  aria-describedby="canvas-help"
  tabindex="0"
  data-shortcut-scope="canvas"
>
```

`role="application"` is deliberate and unusual: it tells a screen reader to pass keys through
rather than intercept them for its own navigation, which a spatial editor requires. It is only
correct because we then provide **complete** keyboard operation — using it without that would be
worse than not using it.

| Requirement | Implementation |
| --- | --- |
| Reach the canvas | Single tab stop in the page order |
| Understand the content | The layers tree is the accessible structure — a real `role="tree"` |
| Navigate | `Tab`/`Shift+Tab` siblings, `Enter`/`Esc` in/out, arrows nudge |
| Select | `Shift+Click` adds, `Mod+Click` toggles, `Mod+A` takes the level; the tree is the keyboard multi-select path — ADR-081 |
| Move nodes | Keyboard drag via dnd-kit |
| Know what is selected | Polite live region on every change |
| Know the result of an action | Announced: "Duplicated Hero. 7 blocks." |
| Escape | `Esc` clears; `F2` moves to the next panel |

```html
<div id="canvas-announcer" role="status" aria-live="polite" aria-atomic="true" class="sr-only">
  Hero selected. 2 of 6 in Page.
</div>
```

Announcements are debounced 150 ms so arrow-key navigation does not flood the queue.

The canvas visual is decorative duplication of the layers tree. Screen-reader users work in the
tree; the canvas is for sighted users. Both are complete paths to the same operations — that is
the design, stated explicitly so nobody "fixes" the canvas by making it a giant list.

### Layers tree

```html
<div role="tree" aria-label="Layers" aria-multiselectable="true">
  <div role="treeitem" aria-level="1" aria-expanded="true" aria-selected="false" tabindex="-1">
    <span>Page</span>
    <button aria-label="Hide Page" aria-pressed="false">…</button>
    <button aria-label="Lock Page" aria-pressed="false">…</button>
  </div>
</div>
```

- Roving tabindex: one tab stop, arrows navigate.
- `aria-level`, `aria-expanded`, `aria-selected`, `aria-multiselectable` all correct.
- Virtualized, which means `aria-setsize` and `aria-posinset` are required — a virtual tree
  without them tells the screen reader there are 12 items when there are 400.
- Rename is an inline `input` with a label, `Enter` commits, `Esc` cancels.
- Drag is keyboard-operable with announcements.

### Inspector

- Sections are `Collapsible` with `aria-expanded` on the trigger and `aria-controls`.
- Every control has a `<label>` linked by `htmlFor`, not a `placeholder` doing double duty.
- Scrub fields are `role="spinbutton"` with `aria-valuenow`, `aria-valuemin`, `aria-valuemax`,
  `aria-valuetext` (including the unit: "16 pixels"). The role is written directly rather than taken
  from React Aria's `useNumberField`, which filters every keystroke through a number parser and so
  cannot accept the typed expressions the field requires — ADR-037.
- Colour controls announce the value as a name where possible: "Accent, oklch 58% 0.18 285".
  The contrast indicator is announced: "Contrast 4.8 to 1, passes AA".
- Override indicators are not colour-only: the dot has `title` and the control's
  `aria-describedby` names the source breakpoint.
- Multi-selection `Mixed` state uses `aria-valuetext="Mixed"`, not an empty value.
- Segmented controls are `role="radiogroup"` with arrow navigation.
- Shadow and gradient stack editors are `role="list"` with per-item reorder buttons that have
  real labels ("Move shadow 2 up"), because drag-only reordering is not accessible.

### Block palette

- `role="grid"` with `role="gridcell"` cards, arrow navigation in two dimensions.
- Each card is a `button` with `aria-roledescription="draggable block"` and an accessible name
  that includes the category: "Pricing table, marketing block".
- Search is `role="searchbox"` with `aria-controls` pointing at the grid and a live result count:
  "8 blocks match".
- Hover animations are decorative: `aria-hidden` on the video, and it does not play under reduced
  motion.
- `Enter` inserts into the current selection's parent — the non-drag path, which is the primary
  path for keyboard users.

### Dialogs

Radix handles most of it. Requirements we still verify:

- `aria-labelledby` and `aria-describedby` set.
- Focus moves to the first focusable element, or the dialog itself when there is nothing sensible.
- Focus is trapped and restored to the trigger on close.
- `Esc` closes, and the close button has a real label.
- Background content is `aria-hidden`, **except** the live-region announcer, which must stay
  reachable — an announcer inside an `aria-hidden` subtree goes silent, which is a subtle bug
  worth stating.
- The export dialog's code blocks are `tabindex="0"` with `role="region"` and a label, so they are
  scrollable by keyboard.

### Command palette

- `role="combobox"` with `aria-expanded`, `aria-controls`, `aria-activedescendant`.
- Results are `role="listbox"` / `role="option"`, virtualized with `aria-setsize`/`aria-posinset`.
- The active option is announced as focus moves.
- Group headers are `role="presentation"` so they do not read as options.
- Shortcut hints are in the option's accessible name: "Undo, Command Z".

### Playground

- CodeMirror is screen-reader operable out of the box; we add an `aria-label` on the editor.
- Diagnostics in a polite live region, debounced 500 ms so live typing is not narrated
  character-by-character.
- `clip-path` vertex handles are focusable buttons: arrows move by 1 % (`Shift` 5 %), and each
  announces "Vertex 3, 40 percent 60 percent".
- The bezier editor's control points behave the same, announcing the four values.
- Every preset is a labelled button; swatches are `aria-hidden`.

### Landing, gallery, docs

Ordinary content-page rules, held strictly:

- One `h1` **of the page's own**, then a correct heading order with no skipped levels.
- Landmarks: `header`, `nav`, `main`, `footer`, each labelled when there is more than one.
- Skip link to `#main` as the first focusable element.
- Every image has meaningful `alt`, or `alt=""` when decorative — and the decision is explicit.
- Video has captions or is marked decorative and muted with no audio track.
- Links are descriptive: never "click here", never "learn more" alone.
- Every live demo has a non-interactive fallback description.
- Docs code blocks are keyboard-scrollable and have a labelled copy button.

**A live preview brings its own headings, and that is not a violation.** `/blocks/hero-centered`
renders the real `hero-centered`, which contains a real `h1`, so the page has two — one describing
the page and one belonging to the thing on it. The rule is about the page's structure and a preview
is not part of it. What the preview owes instead:

- a labelled `region`, so a screen reader announces entering and leaving the demonstration rather
  than dropping the reader into a second document with no warning;
- everything inside it reachable, since the point of the surface is that the component is real.

The alternative is an `iframe` per preview, which does scope the outline. It is rejected in ADR-303
with the measurement: a document per card, a theme that no longer cascades in, and a resize observer
where a container query now does the work.

## Reduced motion

Two independent signals, both honoured:

```
prefers-reduced-motion: reduce  ──┐
                                  ├──► motionScale = 0
studio "preview reduced" toggle ──┘
```

Because both converge on the same CSS variable, there is one code path. See
[ANIMATION_SYSTEM.md](ANIMATION_SYSTEM.md) § Reduced motion for the per-channel policy.

Additional rules:

| Rule | Detail |
| --- | --- |
| The studio itself | Chrome transitions drop to 0 ms; the canvas is fully usable |
| Canvas previews | Blocks render their reduced variant, so the user sees what their visitors see |
| The preview toggle | Prominent in the status bar, not buried in settings |
| Export | Always emits reduced-motion handling. A user cannot accidentally ship an inaccessible animation |
| Landing page | Fully coherent with zero animation — no content revealed only by a scroll trigger |
| Auto-playing anything | Nothing auto-plays with sound. Nothing auto-plays at all under reduced motion |
| Parallax, pinning, scroll-scrub | Disabled entirely, not slowed |
| Flashing | Nothing flashes more than 3 times per second, ever, in any preset |

The last one is a hard constraint on the preset catalogue: a preset that could flash faster than
3 Hz at any parameter value has its range clamped.

## Focus

```css
:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px var(--ms-color-surface-0), 0 0 0 4px var(--ms-color-accent-ring);
}
```

- 2 px offset ring so it is visible against both the element and its surroundings.
- Contrast ≥ 3:1 against both, verified for every theme preset.
- `:focus-visible` only — no ring on mouse click.
- Never `outline: none` without a replacement. A lint rule catches it.
- Roving tabindex in: toolbar, tab strips, layers tree, block grid, segmented controls, shadow
  stack. One tab stop per group.
- Focus order follows visual order. No positive `tabindex` anywhere.
- Focus is restored after: dialog close, panel collapse, undo of a deletion (to the restored
  node's row), and route change.

## Contrast

Verified programmatically, not by eye:

```ts
// packages/tokens/src/semantic/contrast.test.ts
describe.each(['light', 'dark'] as const)('%s mode', (mode) => {
  it.each(TEXT_PAIRS)('%s on %s meets AA', (fg, bg) => {
    expect(contrastRatio(tokens[mode][fg], tokens[mode][bg])).toBeGreaterThanOrEqual(4.5)
  })

  it.each(UI_PAIRS)('%s on %s meets 3:1', (fg, bg) => {
    expect(contrastRatio(tokens[mode][fg], tokens[mode][bg])).toBeGreaterThanOrEqual(3)
  })
})
```

Runs over every semantic pair in both modes, and over all ten theme presets. User-generated
palettes are checked at runtime by the theme engine's contrast repair — see
[THEME_ENGINE.md](THEME_ENGINE.md).

## Testing

### Automated

| Layer | Tool | Gate |
| --- | --- | --- |
| Component | `jest-axe` in Vitest | Zero violations per component |
| Every block | Registry-wide axe test | Zero violations, all 62 |
| Route | `@axe-core/playwright` | Zero violations on every route |
| Route | Lighthouse a11y | ≥ 95, target 100 |
| Tokens | Contrast unit test | All pairs, both modes, all presets |
| Storybook | `@storybook/addon-a11y` | Visible in review |

Automated tools catch roughly 40 % of real issues. The gate is necessary, not sufficient.

### Manual, per release

A checklist run before every release, recorded in the release notes:

- [ ] Complete flow A (grab an effect) with keyboard only
- [ ] Complete flow B (compose a page) with keyboard only
- [ ] Complete flow B with VoiceOver + Safari
- [ ] Complete flow B with NVDA + Firefox
- [ ] All four drag operations by keyboard
- [ ] Every route at 200 % browser zoom — no clipping, no horizontal scroll
- [ ] Every route at 320 px width (the public routes)
- [ ] `prefers-reduced-motion: reduce` — every route coherent
- [ ] Windows High Contrast Mode — chrome still legible, focus visible
- [ ] Forced colours: borders and focus survive (`forced-color-adjust` where needed)
- [ ] Tab through every route: no traps, no invisible focus, order matches visuals
- [ ] Every exported target verified for reduced-motion handling

### E2E specs

Dedicated `e2e/a11y/`:

1. `keyboard-only-compose.spec.ts` — build a 4-section page without a mouse.
2. `keyboard-drag.spec.ts` — all four drag operations.
3. `focus-restore.spec.ts` — every dialog restores focus to its trigger.
4. `live-regions.spec.ts` — selection, drag, and command results are announced.
5. `reduced-motion.spec.ts` — with the media feature emulated, assert no transform animations run
   and every route is usable.
6. `axe-all-routes.spec.ts` — zero violations, both colour modes.
7. `zoom-200.spec.ts` — no horizontal overflow at 200 % on public routes.

## Known limitations

Stated honestly rather than hidden:

- **The studio requires ≥ 1024 px.** Below that it directs to the gallery. A spatial canvas editor
  on a phone is not a solvable problem within v1's scope, and pretending otherwise would be worse
  than saying so.
- **The canvas is a visual surface.** Screen-reader users are given a complete alternative path
  through the layers tree and inspector, not a spatial description of the canvas.
- **HTML export approximates some motion presets.** Each approximation is listed in the export
  warnings.

Each limitation has a matching item in [ROADMAP.md](ROADMAP.md) if it is addressable later.
