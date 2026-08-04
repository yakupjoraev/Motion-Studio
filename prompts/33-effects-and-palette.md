# 33 — Effects, motion panel, command palette

**Milestone** M6 · **Depends on** 32 · **Commit** `feat(web): add effects, motion panel, and command palette`

## Read first

- `docs/DESIGN_REFERENCES.md` — **all of it.** This is the prompt that sets the visual bar for the
  whole effects category, and the prompt that runs the licence check for the first time.
- `docs/COMPONENT_LIBRARY.md` — § Catalogue (Effects), the `EffectInstance` shape
- `docs/PRODUCT.md` — § 2. Left panel, § 4. Inspector (Motion), § 8. Command palette
- `docs/SHORTCUTS.md` — § Implementation (the registry), § Command palette

## Goal

Three things that complete the motion story: the 13 surface effects, the motion inspector panel with
live curve editors, and the shortcut registry + command palette that makes all of it discoverable.

## Deliverables

```
packages/blocks/src/effects/
├── aurora-background/  mesh-gradient/  noise-overlay/  grain-overlay/
├── dot-grid/  grid-lines/  spotlight/  beams/  glow/
├── border-beam/  shine/  particles/  scanlines/
└── index.ts

apps/web/src/components/studio/
├── left-panel/
│   ├── motion-tab.tsx           preset catalogue grouped by channel, hover preview
│   ├── effects-tab.tsx          effect catalogue
│   └── preset-card.tsx          memo'd, hover-previews the animation
├── inspector/motion-section.tsx  picker + params + curve editors + conflict chips
├── inspector/effects-section.tsx stack editor: add, reorder, tune, toggle, remove
└── command-palette/
    ├── command-palette.tsx      combobox + virtualized listbox
    ├── use-palette-items.ts     assembles items from all sources
    └── fuzzy-match.ts           scoring

packages/hooks/src/shortcuts/
├── registry.ts                  Shortcut, ShortcutScope, the registry + conflict assertion
├── use-shortcuts.ts             resolution order per SHORTCUTS.md
├── normalize-keys.ts            platform normalization
├── format-keys.ts               platform display strings
├── shortcut-sheet.tsx           Mod+/ reference, generated from the registry
└── *.test.ts
```

## Constraints

### Before writing any effect: the licence check

This is the first prompt that adapts from a visual reference, so it owns the check.

1. Verify impeccable.style's current terms yourself — repository, site footer, any terms page.
2. Create `packages/blocks/LICENSES.md` recording, for every reference in
   `DESIGN_REFERENCES.md`: the name, the URL, the licence as you actually found it, and today's date.
3. **If the terms are unclear, absent, or restrictive: do not adapt any code.** Implement each
   technique from your own understanding of how the effect works. CSS techniques are not
   copyrightable; specific source is. Note in each block's doc comment that it was built from
   technique rather than source.
4. Report in your session summary what you found. Do not assume any answer — including any summary
   written in our own docs, which were authored before this check happened.

Add a `## Design references` section to the root `README.md` crediting the influences openly.

### Effects — the visual bar

This category **is** the reference's vocabulary, so it applies at full strength. Before building
each effect: open impeccable.style, find the closest treatment, and study the technique — which
layers, which properties, which timing, what makes it read as expensive rather than as a CSS demo.

Then write the technique down in the block's doc comment (see the template in
`DESIGN_REFERENCES.md` § Attribution) and implement it against our constraints.

Our version must additionally be all eight things from `DESIGN_REFERENCES.md` § What we are aiming
for: schema-parameterised, live-tunable, reduced-motion correct, within the scheduler caps,
exportable as readable source, contrast-checked, correct in light *and* dark, and accessible.

The last two are where reference implementations usually fail. Most effect libraries are dark-only
and never consider whether the effect destroys text contrast. Check every effect on a light surface
and over real text.

### Effects — mechanics

An effect is an absolutely-positioned layer inside its target with `pointer-events: none`, ordered by
`layer` (`behind`/`front`) and composited with `blendMode` and `opacity`.

- `particles` and `mesh-gradient` are lazy-loaded (`costClass: 'heavy'`)
- Everything else is CSS-only and exports as CSS
- Every effect: `aria-hidden`, respects reduced motion (static variant), and declares a cost class
- `spotlight` reads from the pointer bus — no listener of its own
- `border-beam` uses a conic gradient with a mask, not four animated elements
- The `backdrop-filter` cap from `DESIGN_SYSTEM.md` (4 simultaneous) is enforced by the canvas with a
  warning; wire the counter here

### Motion panel

- Preset cards grouped by channel, each previewing on hover — using the real preset, not a GIF, so the
  preview cannot drift from the implementation. Reduced motion shows a static card.
- Applying is a command, so it undoes.
- Params render through the generated control system, from the preset's `controls`.
- The **spring editor** and **bezier editor** from prompt 09 appear here, live: dragging stiffness
  redraws the curve *and* re-runs the preview animation. That feedback loop is the reason this panel
  exists.
- Conflict chips: when `composeMotion` reports a conflict, show it with the reason and a "resolve"
  action that removes the losing spec.

### Shortcut registry

Exactly the design in `SHORTCUTS.md` § Implementation:

- **The text-input guard first.** In an input/textarea/contenteditable, only `escape`, `mod+enter`,
  `mod+s`, and `mod+z` pass through. This is the rule that stops `Delete` from removing a node while
  the user types. Test it explicitly.
- Scope resolution via `data-shortcut-scope` on the focused subtree, then `global`.
- `when(ctx)` predicates evaluated before running.
- **Conflict assertion at startup in development**: two shortcuts with the same `keys` in overlapping
  scopes → throw. Add a deliberate conflict, observe the throw, revert.
- `normalizeKeys` uses `event.code` for physical keys and `event.key` for characters, so a non-US
  layout does not break arrow navigation. Test with a simulated AZERTY event.

Register every shortcut from `SHORTCUTS.md`. All of them, in this prompt — a half-populated registry
means later prompts add ad-hoc listeners, which is exactly what the registry exists to prevent.

### Command palette

- Sources: shortcuts, blocks ("Insert Hero"), presets ("Apply magnetic"), theme presets, layers
  ("Select Hero"), doc pages.
- `role="combobox"` + `role="listbox"`/`option`, `aria-activedescendant`, virtualized with
  `aria-setsize`/`aria-posinset`.
- Recent items first (last 5, persisted), then fuzzy score.
- Fuzzy scoring rewards consecutive runs and word-boundary matches. Test against a fixture of queries
  with expected orderings — "ins her" should find "Insert Hero" above "Insert Header".
- Opens in **under 50 ms** with the item list memoised on `version`. Measure it and report.
- `Tab` does nothing inside the palette, so focus cannot escape.

### Shortcut sheet

`Mod+/` renders from the registry, grouped, platform-correct, searchable, with currently-unavailable
shortcuts greyed out based on their `when`. This is the only shortcut documentation that cannot go
stale, because it is the source data.

## Verify

```bash
pnpm test
pnpm dev:storybook
pnpm dev
```

Tests:
- Effects meta-tests (they inherit the block meta-tests)
- `normalizeKeys`: both platforms, all modifier combinations, `code` vs `key`, AZERTY arrows
- Registry conflict detection (demonstrate the throw)
- Text-input guard: `Delete` in an input does not delete a node; `Mod+Z` in an input does a native
  field undo
- Fuzzy match ordering against the query fixture
- Palette: `role`/`aria` attributes correct, virtualized attributes reflect the full set

Manual, and report each:
- Apply each of 5 presets from the Motion tab → animation plays on the canvas, undoes cleanly
- Drag spring stiffness → curve redraws and the preview re-runs, smoothly
- Assign conflicting channels (`scroll` + `entrance`) → conflict chip with a reason and a working
  resolve action
- Add 3 effects to one node → stack editor reorders, toggles, removes
- Add 5 glass surfaces → the `backdrop-filter` cap warning appears
- `⌘K` → measure open latency, report the number
- Type "ins her" → "Insert Hero" ranks first
- `Mod+/` → every shortcut listed with platform-correct keys
- Every shortcut in `SHORTCUTS.md` tried at least once — report any that did not work

## Done when

- [ ] Licence check performed and recorded in `packages/blocks/LICENSES.md` with today's date;
      findings reported
- [ ] `README.md` credits the design references
- [ ] Every effect's doc comment explains its technique and its design reference
- [ ] Every effect compared side by side with the reference, and judged — not just shipped
- [ ] Every effect checked on a light surface and over real text for contrast damage
- [ ] 13 effects, CSS-only except the two heavy ones, all with static reduced variants
- [ ] Motion panel with live preset previews and working curve editors
- [ ] Conflict chips with reasons and a resolve action
- [ ] Effects stack editor complete
- [ ] Shortcut registry populated with **every** shortcut from the doc
- [ ] Text-input guard tested; conflict assertion demonstrated
- [ ] Palette opens in under 50 ms; number reported
- [ ] Fuzzy ordering verified against the fixture
- [ ] Shortcut sheet generated from the registry
- [ ] Every documented shortcut manually verified; failures reported
