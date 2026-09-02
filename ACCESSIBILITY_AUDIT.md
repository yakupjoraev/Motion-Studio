# Accessibility audit

**Date** 2026-09-01 · **Target** WCAG 2.2 AA · **Scope** every route, every block, the studio chrome

The checklist in [docs/ACCESSIBILITY.md](docs/ACCESSIBILITY.md) § Testing, run item by item with what
each one found. An item that found nothing says what was tried, because "passed" twelve times is not a
credible audit result.

**Tested with** Chrome 141 (`channel: 'chrome'`), Firefox and WebKit through Playwright 1.48,
axe-core 4.13 via `@axe-core/playwright`, Lighthouse CI 0.15.1, and Chrome's own accessibility tree
over CDP. Production build, `PORT=3100`.

**Not tested with:** a screen reader. See the two items marked *not performed* below — that gap is the
most important line in this document.

## Result

Nine defects found. Six fixed in this pass, one corrected diagnosis, three recorded with a reason.

| # | Finding | Where | Status |
| --- | --- | --- | --- |
| 1 | Light mode was unreachable — `ThemeBoot` overwrote the stored preference, so half the contrast surface had never been scanned | `apps/web/app/theme-boot.tsx` | Fixed, ADR-322 |
| 2 | `foreground-subtle` failed AA as text: 4.10–4.30:1 in light mode, in 111 places | `packages/tokens`, `packages/theme` | Fixed, ADR-323 |
| 3 | **No focus indicator at all in forced colours** — the ring is a `box-shadow`, which the mode drops, and `outline: none` stayed | `apps/web/app/globals.css` | Fixed, ADR-324 |
| 4 | **Every dialog dropped focus on `body`** when closed — all five File dialogs, the export dialog and the command palette | `packages/ui/src/dialog` | Fixed, ADR-325 |
| 5 | Selection made in the layers tree announced nothing, and no command announced its result | `packages/canvas`, `apps/web` | Fixed, ADR-326 |
| 6 | The canvas had `role="application"` and no `aria-describedby`, so nothing told a reader which keys it takes — including the way out | `packages/canvas/src/canvas.tsx` | Fixed, ADR-328 |
| 7 | A keyboard drag in the **layers tree** never leaves the position it started at | `packages/dnd/src/sensors` | Recorded, ADR-327 |
| 8 | Dragging a node **on the canvas** does not exist for any input device | `packages/dnd`, `packages/canvas` | Recorded, ADR-327 |
| 9 | The a11y suite ran on one engine, and every finding above is engine behaviour | `e2e/playwright.config.ts` | Fixed, ADR-329 |

## Automated

| Layer | Tool | Result |
| --- | --- | --- |
| Routes × colour modes | `@axe-core/playwright` | **0 violations** — six routes plus the studio, in light and dark |
| Every block | Same, over each block's own detail page | **72 blocks scanned, 0 with violations** |
| Blocks, per component | `jest-axe` in Vitest | **156 assertions** across data, forms, navigation, interactive |
| `ui` components | `jest-axe` in each component's own test | **51 of 51** test files in the package run it |
| Routes | Lighthouse accessibility | **100 / 100 / 100 / 100** on `/`, `/blocks`, `/blocks/section`, `/docs`; no failed audit on any |
| Tokens | Contrast unit tests | All text pairs ≥ 4.5:1 and UI pairs ≥ 3:1, both modes, ten presets, every neutral family |
| E2E | `pnpm test:e2e:a11y`, three browsers | **255 passed, 18 skipped, 0 failed** in 10.3 minutes |

The 18 skips are stated, not silent: `forced-colors` on WebKit (no such mode), the two tab-order specs
on WebKit (Safari leaves links out of the tab order until the user turns full keyboard access on), the
all-blocks sweep on the two non-Chromium engines, and the four drag operations that do not exist or do
not work (ADR-327).

## The manual checklist

### 1. Flow A — grab an effect, keyboard only ✅ found nothing

Walked `/blocks/aurora-background` with `Tab` alone. The order starts at the skip link and follows the
visual order: `Skip to content → Motion Studio → Studio → Playground → Blocks → Docs → Open the studio
→ ← All blocks`. The source region (`tabindex="0"`, `role="region"`, labelled) and the copy
button beside it are both reached inside the walk. Nothing needed a pointer.

### 2. Flow B — compose a page, keyboard only ✅ found nothing

`F2 F2` to the left panel, three tabs to the palette's search box, typing `section`, tabs to the grid,
then `Enter` / arrows to insert four blocks. The document went from 4 nodes to 8, and each insert was
announced: "Add Section. 5 blocks." → "Add Tabs. 6 blocks." → … The inspector is reachable from the
canvas with `F2 F2` and a scrub field responds to `ArrowUp` with a new `aria-valuetext`.

Now asserted by `e2e/a11y/keyboard-only-compose.spec.ts`, which is the only reason this item is cheap
to repeat.

### 3. Flow B with VoiceOver + Safari ❌ **not performed**

VoiceOver requires macOS; this pass ran on Windows 11. Nothing was tested with it and nothing about it
is claimed.

### 4. Flow B with NVDA + Firefox ❌ **not performed**

NVDA is not installed on the machine (`C:\Program Files\NVDA` absent), and installing a screen reader
onto the owner's desktop was not mine to do. Windows Narrator is present but has no speech log, so a
session with it would produce no evidence to put in this document.

**What was done instead**, and what it is worth: Chrome's own accessibility tree and every live region
were captured over CDP for the three interactions prompt 55 names. That is the text a screen reader
would be handed — it is not proof that a reader speaks it in a usable order, at a usable moment, or
without talking over itself. Two of the nine findings above (4 and 6) are exactly the kind of thing the
tree shows; announcement *timing* is exactly the kind of thing it does not.

**The owner's decision, 2026-09-02: the gap stays open and recorded.** NVDA is not to be installed on
this machine, so flow B under a screen reader is not going to be run here and this document is where
that is written down rather than quietly missing. The two checklist lines in
[ACCESSIBILITY.md](docs/ACCESSIBILITY.md) § Manual checks stay unticked, because they are.

What that leaves unproven is stated once, plainly: whether a reader speaks the studio's announcements
in a usable order and at a usable moment. Everything structural about them is covered — the tree, the
regions, the roles, `axe` on every route and all seventy-two blocks — and none of it is a substitute.

### 5. All four drag operations by keyboard ⚠️ two work, two do not exist

| Operation | By keyboard |
| --- | --- |
| 1. Palette card → canvas | **Works.** Pick up, move, drop: "Dropped Section, layout block into Grid at position 4", node count 4 → 5 |
| 2. Canvas node → canvas | Does not exist for any device — no draggable node on the canvas |
| 3. Layers row → layers row | Picks up and announces, then **never leaves position 1**: eight `ArrowDown` presses, same target, and the drop commits where it began (ADR-327). The keyboard path to the same function is `Mod+↑`/`↓`, which reorders and announces |
| 4. Layers row ↔ canvas | Does not exist for any device |

### 6. Every route at 200 % zoom ✅ found nothing

200 % of a 1280 px window is a 640 px viewport. Six routes, no horizontal scrolling, nothing clipped:
the filter rows and the wide tables scroll inside themselves, which is how 1.4.10 is met. The studio's
sub-1024 notice is legible at that width and its link to the gallery works.

One measurement subtlety worth keeping: the first version of the check flagged seven elements per route
because it counted anything past the viewport, including children of a scroller. Engines disagree on
whether such a scroller computes to `auto`, `scroll`, `hidden` or `clip`; all four contain their
children, and the criterion is about the **document** scrolling.

### 7. Public routes at 320 px ✅ found nothing

Same five public routes at a 320 px viewport. No horizontal scrolling on any.

### 8. `prefers-reduced-motion: reduce` on every route ✅ found nothing

Five routes with the media feature emulated, each walked to the bottom so every island and scroll
reveal woke: **zero** transform, translate or scale keyframes, and no heading, paragraph, list item,
caption or table cell left unreadable. The studio is operable and announces the same sentences.

The controls that rest at opacity 0 — the docs' heading anchors — appear when focused, which is
`group-hover:` paired with `focus-visible:` and now measured rather than read off a class list. Two
attempts to measure it failed first: `element.focus()` does not match `:focus-visible` in Chrome, and
`CSS.forcePseudoState` over CDP did not either. A real `Tab` does.

### 9. Windows High Contrast Mode ⚠️ emulated, not the real mode

Playwright's `forcedColors: 'active'` was used, on Chromium and Firefox. It flips the media feature and
repaints backgrounds with system colours, which is enough to find finding 3 and to prove the panel
borders survive — and it is not the same as switching the OS into a high-contrast theme. The real mode
was not entered, because that changes the desktop this pass was run from.

### 10. Forced colours — borders and focus survive ⚠️ one defect, fixed

Borders survive: 1 px on the left panel, the inspector and the status bar, repainted to `CanvasText`.

Focus did not survive at all — finding 3. Measured on a focused control with the mode active:
`box-shadow: none`, `outline-style: none`. Nothing was painted. Fixed with an unlayered
`@media (forced-colors: active)` rule; measured after: `outline: solid 2px`.

### 11. Tab through every route ✅ found nothing

Every stop, on six routes:

| Route | Stops walked | Without a visible indicator | Scrolled out of view | Repeated stop |
| --- | --- | --- | --- | --- |
| `/` | 13 | 0 | 0 | no |
| `/blocks` | 60+ | 0 | 0 | no |
| `/blocks/aurora-background` | 24 | 0 | 0 | no |
| `/docs` | 60+ | 0 | 0 | no |
| `/docs/accessibility` | 60+ | 0 | 0 | no |
| `/playground` | 24 | 0 | 0 | no |

"60+" is the walk's own cap, not a trap: no stop repeated and none of the walks came back to `body`
early. The studio's canvas is a deliberate `Tab` trap — the surface uses `Tab` to step between blocks —
and `F2` is the way out, which the canvas now says out loud (finding 6).

### 12. Every export target verified for reduced-motion handling ✅ found nothing

Every golden target that emits motion emits its guard: the React and Next targets import
`useReducedMotion` and branch on it, and the HTML and CSS targets carry
`@media (prefers-reduced-motion: reduce)`. The targets with no animation carry no guard, which is
correct rather than missing — `responsive-overrides` and `nested-containers` have no motion in them at
all.

## The three transcripts

Captured from Chrome's accessibility tree and its live regions, verbatim. **Not a screen-reader
session** — see item 4.

### 1. Selecting a node on the canvas

```
canvas, as the tree reads it:
  application "Design canvas"
    · description "Tab and Shift Tab move between blocks at this level. Enter goes into a group,
       Escape comes back out. Arrow keys nudge the selection, Command or Control A takes the whole
       level, and F2 moves to the next panel."

after Tab:
  canvas-announcer (output, aria-live=polite, aria-atomic=true): "Grid selected. 1 of 1 in Container."
```

### 2. Keyboard-dragging a block from the palette into a section

```
card, as the tree reads it:
  button "Section, layout block"
    · description "To pick up a block, press space or enter. Use the arrow keys to move it between
       containers and positions, space or enter to drop it, and escape to cancel."

Space       "Picked up Section, layout block. Use arrow keys to move, space to drop, escape to cancel."
ArrowDown   "Section, layout block over Grid, position 3 of 3."
Space       "Dropped Section, layout block into Grid at position 4."

and through the non-drag path, Enter on the same card:
  command-announcer: "Add Section. 5 blocks."
  canvas-announcer:  "Section selected. 2 of 2 in Container."
```

### 3. Submitting an invalid `contact-form`

```
announced, three regions at once:
  field-error: "Enter your name."
  field-error: "Enter a valid email address."
  field-error: "Write at least a sentence so we know what to reply to."

the first invalid field, as the tree reads it:
  textbox "Your name" · description "Enter your name." · invalid=true
    · describedby → the error element
```

## What this audit does not cover

- **A screen reader.** Items 3 and 4. Everything above is the accessibility tree, not a reader's
  behaviour, and the difference is announcement order and timing.
- **The real Windows High Contrast Mode.** Item 9 used the emulation.
- **Cognitive and content accessibility.** Reading level, plain language and error-recovery wording
  were not assessed. The forms' messages read well; nobody measured that claim.
- **Zoom past 200 %.** 1.4.10 asks for 320 px equivalent and that is what was tested.
- **Assistive input other than a keyboard.** Switch access, voice control and pointer alternatives were
  not exercised.

## Signed off

Every finding is fixed or recorded with a reason, and both are traceable: ADR-322 through ADR-329 in
[docs/DECISIONS.md](docs/DECISIONS.md) carry the measurement behind each. The three findings that were
recorded rather than fixed are in [docs/ACCESSIBILITY.md](docs/ACCESSIBILITY.md) § Known limitations,
where a reader looking for the product's limits will find them.
