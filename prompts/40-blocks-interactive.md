# 40 — Blocks: interactive

**Milestone** M8 · **Depends on** 39 · **Commit** `feat(blocks): add interactive blocks`

## Read first

- `docs/COMPONENT_LIBRARY.md` — § Catalogue (Interactive), § Writing a block (local state rule)
- `docs/ACCESSIBILITY.md` — § Dialogs
- `docs/EXPORT_ENGINE.md` — § React (the `'use client'` rule)

## Goal

Nine interactive blocks. The distinguishing constraint: these carry **local UI state**, which is
allowed and necessary — the exported component needs it too — but they still must not know about the
editor.

They are also the blocks whose export must emit `'use client'`, which makes them the test case for
that part of codegen.

## Deliverables

```
packages/blocks/src/interactive/
├── button/                    variants, sizes, icon slots, loading state, motion presets
├── button-group/              segmented or joined, single or multi select
├── tabs/                      Radix Tabs, animated indicator, orientation
├── accordion/                 Radix Accordion, distinct from faq-accordion (generic content slots)
├── carousel/                  scroll-snap based, arrows, dots, autoplay option
├── modal-trigger/             button + Radix Dialog with a content slot
├── tooltip-target/            any child + tooltip content
├── command-menu-preview/      a styled non-functional command palette, for landing pages
├── theme-toggle/              light/dark/system switch, wired to the theme engine
└── index.ts
```

## Constraints

### Local state is fine; editor state is not

```tsx
// ✓ the exported component needs this
const [active, setActive] = useState(defaultTab)

// ✗ never
const selection = useEditorStore((s) => s.selection)
```

In the canvas, a block's local state persists across re-renders and resets when its props change
identity. Verify tabs keep their active index while you edit an unrelated prop — a block that resets
on every keystroke is unusable in an editor.

### `carousel`

- **CSS `scroll-snap`**, not a JS carousel library. Native scrolling means it works with touch,
  trackpad, keyboard, and screen readers for free, and it exports as ~20 lines of CSS.
- Arrows scroll by one item; dots jump; both are real buttons with labels ("Next slide", "Go to slide
  3")
- `role="region"` with `aria-roledescription="carousel"`, and each slide `role="group"` with
  `aria-label="3 of 7"`
- Autoplay: **off by default**, disabled entirely under reduced motion, pauses on hover and on focus
  within, and provides a visible pause control whenever it is on. Autoplay without a pause control is
  a WCAG failure.

### `modal-trigger`

Radix Dialog. Focus trapped, `Esc` closes, focus restored, background `aria-hidden` — but the
announcer region must stay reachable (the note from `ACCESSIBILITY.md` § Dialogs). Content is a slot
accepting `*`.

In the canvas, a modal cannot actually cover the canvas, so it renders **inline in a preview frame**
with a label ("Dialog preview"). Say so in a comment: the canvas shows the modal's content, and the
export emits the real dialog.

### `command-menu-preview`

Deliberately non-functional — it is a visual element for landing pages showing off a command palette.
It must be `aria-hidden` with a text alternative, because a fake interactive widget that a screen
reader announces as real is worse than a picture. State that reasoning in a comment.

### `theme-toggle`

The one block that legitimately touches app state: it calls the theme engine's `setColorMode`. In an
export it emits a self-contained implementation using `localStorage` + a `data-color-mode` attribute,
matching what the theme engine's inline script expects — so an exported page's toggle actually works.
That end-to-end correctness is worth the extra care.

### `button`

- Variants and sizes matching `packages/ui`'s Button conceptually, but **a separate implementation** —
  `ui/button` is studio chrome, `blocks/button` is user content that gets exported. Do not share the
  component; do share the token vocabulary. State why in a comment, because this looks like
  duplication and is not.
- Loading state with an accessible busy announcement
- Motion presets: `lift`, `scale-hover`, `magnetic`, `shine`, `glow-hover` — selectable, not hard-coded

### Export implications

Every block here needs `'use client'` in its React export **except** `button` and
`command-menu-preview` when they have no interactive props set. The codegen descriptor declares the
condition; prompt 42 consumes it. Get the declaration right now.

## Verify

```bash
pnpm --filter @motion-studio/blocks test
pnpm dev:storybook
pnpm dev
```

Tests: meta-tests plus
- `tabs`: keyboard navigation, `aria-selected`, indicator animation, and **state survives an unrelated
  prop change**
- `accordion`: single and multiple modes, keyboard
- `carousel`: arrow and dot navigation, slide ARIA labels, autoplay off by default, no autoplay under
  reduced motion, pause control present when autoplay is on
- `modal-trigger`: focus trap, restore, `Esc`; the announcer is not `aria-hidden`
- `command-menu-preview`: `aria-hidden` with a text alternative
- `theme-toggle`: calls `setColorMode`; the codegen descriptor emits a self-contained version
- Codegen descriptors declare `'use client'` correctly per block and condition

Manual, and report:
- In the studio: switch a `tabs` block to tab 3, then edit its title prop → **tab 3 stays active**
- Every block keyboard-only
- `carousel` with touch (or trackpad two-finger) → native scroll-snap works
- `modal-trigger` in the canvas → inline preview frame; the export → a real dialog
- `theme-toggle` in an exported page → actually toggles (test this after prompt 43 if export is not
  ready; note it as deferred if so)
- Reduced motion across all nine

## Done when

- [ ] Nine interactive blocks, nine files each
- [ ] Local state survives unrelated prop edits, verified in the studio
- [ ] `carousel` is CSS scroll-snap with full ARIA and safe autoplay defaults
- [ ] `modal-trigger` previews inline in the canvas with the reasoning commented
- [ ] `command-menu-preview` is `aria-hidden` with a text alternative
- [ ] `theme-toggle` emits a working self-contained export
- [ ] `blocks/button` separate from `ui/button` with the reasoning commented
- [ ] `'use client'` conditions declared per block in the codegen descriptors
- [ ] Meta-tests pass; axe clean; full keyboard pass
