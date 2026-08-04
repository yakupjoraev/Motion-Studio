# 55 — Accessibility hardening

**Milestone** M13 · **Depends on** 54 · **Commit** `fix(a11y): complete wcag 2.2 aa compliance pass`

## Read first

- `docs/ACCESSIBILITY.md` — **all of it**. The manual checklist in § Testing is this prompt's script.
- `docs/SHORTCUTS.md` — § Accessibility notes
- `docs/UI_GUIDELINES.md` — § Accessibility in chrome

## Goal

Run the full accessibility checklist with real assistive technology, fix everything found, and gate it.
Automated tools catch about 40 % of real issues — this prompt covers the other 60 %.

No new features. Find, fix, gate, and report honestly.

## Deliverables

```
e2e/a11y/
├── axe-all-routes.spec.ts          both colour modes, every route
├── keyboard-only-compose.spec.ts   build a 4-section page, no mouse
├── keyboard-drag.spec.ts           exists from prompt 29; extend to all four operations
├── focus-restore.spec.ts           every dialog restores focus to its trigger
├── live-regions.spec.ts            selection, drag, command results announced
├── reduced-motion.spec.ts          exists; extend to all routes
├── zoom-200.spec.ts                no horizontal overflow at 200%
└── forced-colors.spec.ts           borders and focus survive

docs/ACCESSIBILITY.md               known limitations updated with what you actually found
ACCESSIBILITY_AUDIT.md              the signed-off manual checklist for this release
```

## Constraints

### Automated first, to clear the noise

```bash
pnpm test:e2e:a11y
```

Zero axe violations on every route, in **both colour modes**. Fix everything before starting the manual
pass — otherwise you spend screen-reader time on things a tool would have told you.

Also run the registry-wide axe test over all 62 blocks and every `ui` component.

### Then the manual checklist — actually do it

Every item from `ACCESSIBILITY.md` § Manual, per release. This is not a formality; each line is a real
session:

- [ ] Flow A (grab an effect), keyboard only
- [ ] Flow B (compose a page), keyboard only
- [ ] Flow B with **VoiceOver + Safari**
- [ ] Flow B with **NVDA + Firefox**
- [ ] All four drag operations by keyboard
- [ ] Every route at 200 % browser zoom
- [ ] Public routes at 320 px width
- [ ] `prefers-reduced-motion: reduce` on every route
- [ ] Windows High Contrast Mode
- [ ] Forced colours: borders and focus survive
- [ ] Tab through every route: no traps, no invisible focus, order matches visuals
- [ ] Every export target verified for reduced-motion handling

**Report what you found**, per item. "Passed" for twelve items with no findings is not a credible audit
result — a real pass on an app this size finds things. If it genuinely found nothing on an item, say so
explicitly and say what you tried.

### The findings that usually appear

Expect and look specifically for:

| Likely issue | Where |
| --- | --- |
| Virtualized list announces the wrong count | Layers tree, palette, command palette — check `aria-setsize` |
| Focus lost after a delete | Should move to the next sibling, not to `<body>` |
| Announcer silenced by a dialog's `aria-hidden` | The note in `ACCESSIBILITY.md` § Dialogs |
| Scrub field announces a number with no unit | `aria-valuetext` |
| Override dot conveys meaning by colour only | Needs `title` + `aria-describedby` |
| Icon button labelled with its icon name | "Chevron" instead of "Collapse panel" |
| Content stuck at opacity 0 under reduced motion | The classic reduced-motion bug |
| Focus ring invisible in forced-colours mode | Needs a `forced-color-adjust` or a border fallback |
| Tooltip content not reachable by keyboard | Should appear on focus, not just hover |
| Drag rejection announced as "invalid" without a reason | Should name the reason |

### Forced colours

```css
@media (forced-colors: active) {
  /* focus ring must survive; borders must not vanish */
}
```

The studio uses value contrast rather than borders in places, and forced-colours mode removes value
distinctions. Add explicit borders where the layout becomes ambiguous. Check the panels, the canvas
chrome, and the selection outline.

### 200 % zoom

WCAG 1.4.10 requires reflow without horizontal scrolling at 320 px equivalent. For the public routes,
that is absolute. For the studio, the sub-1024 px notice covers it — but verify the notice itself is
readable at 200 % and that the gallery link works.

### `ACCESSIBILITY_AUDIT.md`

A dated, signed-off record: every checklist item, what was tested with, what was found, and what was
fixed. This is the artifact that makes the accessibility claim credible to a reader — and it is also
what makes the next release's audit fast.

Include the things you could not fix, with a reason.

### Update known limitations

`ACCESSIBILITY.md` § Known limitations currently lists three. Update it with what you actually found. If
something cannot be fixed in v1, it belongs there with a roadmap reference — an honest limitation is
better than a hidden one.

## Verify

```bash
pnpm test:e2e:a11y
pnpm test              # registry-wide axe over 62 blocks + all ui components
pnpm exec lighthouse <every route> --only-categories=accessibility
```

Report: axe violation count per route (must be 0), Lighthouse a11y score per route (target 100), and
the full manual checklist with findings.

Then, specifically, report the transcript of these three screen-reader interactions verbatim:
1. Selecting a node on the canvas
2. Keyboard-dragging a block from the palette into a section
3. Submitting an invalid `contact-form`

Those three are the hardest interactions in the app and their announcements are the clearest evidence
the work was real.

## Done when

- [ ] Zero axe violations on every route, both colour modes, in CI
- [ ] Zero axe violations across all 62 blocks and all `ui` components
- [ ] Lighthouse accessibility 100 on every public route; scores reported
- [ ] All eight a11y E2E specs passing on three browsers
- [ ] Full manual checklist executed with **findings reported per item**
- [ ] VoiceOver and NVDA sessions actually performed; three transcripts reported verbatim
- [ ] Forced-colours and 200 % zoom issues fixed
- [ ] `ACCESSIBILITY_AUDIT.md` written and dated
- [ ] `ACCESSIBILITY.md` known limitations updated with real findings
- [ ] Everything found is either fixed or documented with a reason
