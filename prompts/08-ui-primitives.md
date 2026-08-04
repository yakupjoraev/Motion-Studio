# 08 — UI primitives

**Milestone** M1 · **Depends on** 06, 07 · **Commit** `feat(ui): add studio chrome primitives`

## Read first

- `docs/DESIGN_REFERENCES.md` — § Applying it per surface, and § Why the chrome is the exception.
  Chrome is **low loudness, high craft**: take impeccable's surface precision, glass on floating
  panels, and micro-interaction feel — not its gradients or glow.
- `docs/UI_GUIDELINES.md` — **all of it**, especially § Density scale, § Panels, § Interaction feel
- `docs/DESIGN_SYSTEM.md` — § Space, § Radius, § Typography
- `docs/ACCESSIBILITY.md` — § Focus, § Dialogs
- `docs/CODE_STANDARDS.md` — § React, § Styling

## Goal

`packages/ui` — the studio's chrome vocabulary. shadcn/ui components vendored and adapted to our
tokens, plus Radix primitives wrapped with our styling, plus the density and behaviour rules from
`UI_GUIDELINES.md`.

This is a large prompt. If context runs short, stop at a clean component boundary and report which
components remain; prompt 09 covers the value-editing controls separately.

## Deliverables

```
packages/ui/src/
├── button/            Button — variants: primary, secondary, ghost, danger; sizes: sm, md, icon
├── input/             Input, with prefix/suffix slots
├── textarea/          auto-growing
├── select/            Radix Select, styled
├── segmented/         role=radiogroup, arrow nav, animated indicator (layout animation)
├── switch/            Radix Switch
├── slider/            Radix Slider, with a fill track
├── checkbox/          Radix Checkbox, with an indeterminate state
├── tabs/              Radix Tabs, animated indicator, roving tabindex
├── tooltip/           Radix Tooltip, 500ms delay, shows shortcut hints
├── popover/           Radix Popover
├── dropdown/          Radix DropdownMenu, with shortcut column and separators
├── dialog/            Radix Dialog, focus trap + restore, sizes
├── context-menu/      Radix ContextMenu
├── scroll-area/       Radix ScrollArea, overlay scrollbars
├── collapsible/       Radix Collapsible, height animation
├── panel/             Panel, PanelHeader, PanelSection (sticky header, persisted collapse)
├── resizable/         drag handle, min/max, persisted width, keyboard resize
├── toast/             viewport + hook; supports an action ("Undo")
├── kbd/               Kbd — platform-correct key display
├── label/             Label — links to a control, sets focus on click
├── separator/
├── badge/
├── skeleton/          token-coloured, exact-size
├── empty-state/       one sentence + one action
├── styles/
│   ├── variants.ts    shared cva fragments: focus ring, panel surface, row
│   └── density.ts     the height constants from UI_GUIDELINES
└── index.ts
```

Each component directory: `<name>.tsx`, `<name>.types.ts`, `<name>.styles.ts`,
`<name>.test.tsx`, `<name>.stories.tsx`, `index.ts`.

## Constraints

- **Every height comes from `density.ts`.** No literal `h-7` scattered around — the density scale is
  a design decision and it lives in one file.
- **Radix for overlays, our styling on top.** Do not reimplement focus trapping, positioning, or
  dismissal. Do add our tokens, our timings, and our density.
- **`cva` for variants**, in `<name>.styles.ts`. No conditional class strings in markup.
- **Focus ring from the shared variant fragment.** Never `outline: none` without it.
- **Timings from `UI_GUIDELINES.md` § Timing.** Nothing in the chrome animates longer than 260 ms.
- **Reduced motion**: every animated component drops to 0 ms. Since durations come from
  `--ms-duration-*`, which is scaled by `motionScale`, this is automatic — but write one test
  proving it.
- **`Tooltip` shows the shortcut** when given one, rendering it with `Kbd`. The tooltip content is
  also the icon button's `aria-label` source, so the two cannot drift.
- **`Panel` sections persist their collapsed state** via a key passed by the caller; `ui` does not
  touch `localStorage` itself (that is the app's concern) — it takes `open`/`onOpenChange`.
- **`Resizable`** is keyboard-operable: focus the handle, arrows resize by 8 px, `Home`/`End` snap to
  min/max, and it announces the new width.
- Every component forwards `ref` and spreads unknown props to its root, so callers can add
  `data-*` and ARIA attributes without a prop for each.

## Verify

```bash
pnpm --filter @motion-studio/ui test
pnpm dev:storybook
```

Per component, tests must cover:
- Renders with its default props
- Keyboard operation (the specific keys that component owns)
- `axe` clean
- Variants render distinctly (assert on the accessible state, not the class string)

Then judge the craft level against the reference. Open impeccable.style and look at how its surfaces,
borders, and overlays are finished, then look at yours. The chrome should feel like the same hand made
it — quieter, but not cheaper. Specifically compare:
- Value relationships between stacked surfaces
- Hairline borders — do they catch light or just sit there?
- The inner top highlight on dark elevated surfaces
- Popover and dialog entrance feel
- Press feedback

Report what you found and changed. Anything that would count as loud — animated gradients,
decorative glow, cursor effects — does not belong here regardless of how good it looks.

Then in Storybook, walk every component:
- Tab through it — focus ring visible everywhere, order sensible
- Both colour modes
- With `prefers-reduced-motion` emulated — no animation, still usable
- At 200 % browser zoom — nothing clips

Report anything you found and fixed.

## Done when

- [ ] All 25 components implemented with the six-file layout
- [ ] Every height from `density.ts`
- [ ] Every component: story + test + axe assertion
- [ ] Keyboard operation tested per component
- [ ] Reduced-motion behaviour tested
- [ ] Storybook walkthrough performed in both modes and at 200 % zoom
- [ ] `pnpm lint && pnpm typecheck && pnpm test && pnpm build` clean
