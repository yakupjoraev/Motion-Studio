# 39 — Blocks: navigation

**Milestone** M8 · **Depends on** 38 · **Commit** `feat(blocks): add navigation blocks`

## Read first

- `docs/COMPONENT_LIBRARY.md` — § Catalogue (Navigation)
- `docs/ACCESSIBILITY.md` — non-negotiables, § Landing, gallery, docs
- `docs/ANIMATION_SYSTEM.md` — hover and continuous presets

## Goal

Six navigation blocks. Navigation is where accessibility failures hurt most — a broken mobile menu or
an unlabelled landmark makes a whole page unusable — so these get stricter requirements than the rest
of the registry.

## Deliverables

```
packages/blocks/src/navigation/
├── navbar/              logo + links + actions, sticky option, mobile drawer
├── navbar-floating/     detached pill navbar, glass, scroll-shrink behaviour
├── sidebar-nav/         vertical sections with groups, collapsible, active state
├── footer/              column groups + legal row + socials + newsletter slot
├── breadcrumbs/         with overflow collapsing and JSON-LD option
├── dock/                macOS-style magnifying dock
└── index.ts
```

## Constraints

### `navbar`

- `<nav>` with an `aria-label`
- Links are a `list` prop with label, href, and optional children (one level of dropdown)
- Dropdowns are Radix `NavigationMenu` — keyboard-operable, correct `aria-expanded`, closes on `Esc`
  and on outside click
- **Mobile drawer** below `md`: a Radix `Dialog` with focus trap, `Esc` to close, focus restored to the
  trigger, and the trigger labelled ("Open menu" / "Close menu" with `aria-expanded`)
- Sticky option uses `position: sticky` with a `backdrop-filter` that only applies once scrolled (a
  glass navbar over the top of a hero looks wrong at scroll position 0)
- Skip-link target: the navbar declares itself the first landmark, so the exported page's skip link
  jumps past it

### `navbar-floating`

- Detached pill, `glass` treatment, `requiresBackdrop: true` — the inspector warns on a flat parent
- Scroll-shrink: reduces padding and gains a stronger backdrop past ~80 px of scroll, via the shared
  scroll bus, writing CSS variables. No React state.
- Reduced motion: no shrink animation, but the scrolled state still applies instantly

### `sidebar-nav`

- `<nav>` with grouped sections; groups are `role="group"` with an `aria-labelledby` heading
- Active item via `aria-current="page"` — **not** colour alone
- Collapsible groups with `aria-expanded`
- Collapsed rail mode showing icons only, with accessible names preserved and a tooltip

### `footer`

- `<footer>` with column groups, each a labelled `<nav>` when it contains links
- Legal row, socials (icon links with real accessible names — "Motion Studio on GitHub", not "GitHub"),
  and a slot for a newsletter block
- The most commonly botched detail: social icon links with no accessible name. Test for it.

### `breadcrumbs`

- `<nav aria-label="Breadcrumb">` with an ordered list, last item `aria-current="page"`
- Overflow collapsing: beyond N items, collapse the middle into a "…" menu that is keyboard-operable
- Optional `BreadcrumbList` JSON-LD, emitted in codegen only

### `dock`

- The magnifying hover effect scales neighbours by distance from the cursor. Uses the pointer bus and
  CSS variables — zero React renders on cursor move. Test it.
- Each item is a labelled `<button>` or `<a>`; the magnification is decorative
- Keyboard: arrow navigation with focus visibly scaling the focused item, so keyboard users get the
  same affordance
- Reduced motion: no magnification, but hover and focus states still change

### Universal — stricter than elsewhere

- Every block is a real landmark with a label
- Every interactive element keyboard-reachable, in visual order
- Every icon-only control has an accessible name that says what it does, not what it looks like
- No hover-only disclosure — everything reachable by focus
- Mobile behaviours (drawer, rail) are tested, not assumed
- `axe` clean, plus a manual keyboard pass per block

## Verify

```bash
pnpm --filter @motion-studio/blocks test
pnpm dev:storybook
```

Tests: meta-tests plus
- Every block renders exactly one landmark with a label
- `navbar` dropdown: `aria-expanded`, `Esc` closes, arrow navigation
- `navbar` drawer: focus trapped, `Esc` closes, focus restored to the trigger
- `sidebar-nav`: `aria-current` on the active item; groups labelled
- `footer`: every social link has a descriptive accessible name (iterate and assert)
- `breadcrumbs`: overflow menu keyboard-operable; last item `aria-current`
- `dock`: pointer move produces zero React renders (render counter)
- All: reduced motion removes transforms but keeps state changes

Manual, and report:
- Each block at 360, 768, 1440
- `navbar` mobile drawer with keyboard only: open, navigate, close, focus returns
- `sidebar-nav` collapsed rail with a screen reader — report what it announces
- `dock` with keyboard: focus scales the focused item
- `navbar-floating` over a hero: at scroll 0 it looks right; scrolled, the glass strengthens
- With a screen reader, tab through `footer` → report every social link's announced name
- Reduced motion on all six

## Done when

- [ ] Six navigation blocks, nine files each
- [ ] Every block a labelled landmark
- [ ] `navbar` dropdowns and drawer fully keyboard-operable with focus restore
- [ ] `sidebar-nav` uses `aria-current`, not colour alone
- [ ] Every social/icon link has a descriptive accessible name, asserted in a test
- [ ] `dock` magnification causes zero React renders; reported
- [ ] All reduced-motion variants keep state changes while dropping transforms
- [ ] Screen-reader passes performed and announcements reported
- [ ] Meta-tests pass; axe clean
