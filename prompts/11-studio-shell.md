# 11 — Studio shell

**Milestone** M1 · **Depends on** 08, 10 · **Commit** `feat(web): add studio shell layout`

## Read first

- `docs/UI_GUIDELINES.md` — § Layout, § Density scale, § Loading and empty states, § Responsiveness of the chrome
- `docs/PRODUCT.md` — § 1. Studio shell
- `docs/ARCHITECTURE.md` — § Rendering strategy in `apps/web`
- `docs/ACCESSIBILITY.md` — § Focus

## Goal

The studio's frame: top bar, three resizable columns, status bar. Server-rendered so the first paint
is layout rather than a spinner, with the (still empty) canvas area mounting as a client island.

No editor logic yet. This prompt produces the room the furniture goes into.

## Deliverables

```
apps/web/
├── app/
│   ├── layout.tsx                fonts, colour-mode script, theme application
│   ├── page.tsx                  temporary landing placeholder
│   └── studio/
│       ├── layout.tsx            studio-specific shell metadata
│       ├── page.tsx              server component: renders the chrome skeleton
│       └── studio-client.tsx     'use client' — mounts the interactive shell
├── src/
│   ├── components/studio/
│   │   ├── studio-shell.tsx      the three-column grid + resize wiring
│   │   ├── top-bar/
│   │   │   ├── top-bar.tsx
│   │   │   ├── file-menu.tsx
│   │   │   ├── edit-menu.tsx
│   │   │   ├── history-buttons.tsx     disabled placeholders
│   │   │   ├── zoom-control.tsx        disabled placeholder
│   │   │   ├── breakpoint-switcher.tsx disabled placeholder
│   │   │   └── export-button.tsx       disabled placeholder
│   │   ├── left-panel/
│   │   │   ├── left-panel.tsx          tab strip + content area
│   │   │   └── panel-tabs.tsx          Blocks, Motion, Effects, Theme, Layers — empty states
│   │   ├── inspector/
│   │   │   └── inspector.tsx           "No selection" state
│   │   ├── canvas-area/
│   │   │   └── canvas-placeholder.tsx  "Drag a block to start" + ⌘K hint
│   │   └── status-bar/
│   │       ├── status-bar.tsx
│   │       └── fps-meter.tsx
│   ├── hooks/
│   │   ├── use-panel-layout.ts    widths + collapse, persisted to localStorage
│   │   └── use-viewport-guard.ts  the < 1024px notice
│   └── styles/
└── public/
```

## Constraints

- **The skeleton is server-rendered.** `studio/page.tsx` is a Server Component that renders the
  static structure — bars, panel frames, tab strips. `studio-client.tsx` hydrates the interactive
  parts. The user sees layout in the first paint; there is never a full-page spinner.
- **Grid layout, not flexbox**, for the three columns — `grid-template-columns` with CSS variables
  for the panel widths means a resize is one variable write, no reflow of the grid definition.
- **Panel widths in CSS variables** (`--ms-panel-left`, `--ms-panel-right`), driven by the resize
  handle via the transient pattern. Resizing must not re-render the canvas area.
- **Persisted layout** via `use-panel-layout`, debounced 500 ms, with a guard against corrupt
  localStorage values (clamp to min/max, fall back to defaults).
- **`overscroll-behavior: none`** on the app root; the studio never scrolls the page.
- **Every placeholder control is genuinely disabled** — `disabled` attribute plus `aria-disabled`,
  with a tooltip saying which prompt enables it is *not* needed, but the control must not look
  clickable and then do nothing.
- **`F2` focus cycling** works now: canvas → left → inspector → canvas. Each region has
  `data-shortcut-scope` and a `tabindex="-1"` container that receives focus.
- **Below 1024 px** show the notice from `UI_GUIDELINES.md` § Responsiveness with a link to
  `/blocks`. Between 1024 and 1280, panels become overlays.
- **Empty states** are one sentence and one action, exactly as specified. No illustrations.
- The FPS meter is real (a `rAF` sampler with a 30-frame rolling average) and shows in dev plus
  behind a status-bar toggle in production.

## Verify

```bash
pnpm dev            # visit /studio
pnpm build          # confirm the studio route's first-load JS in the build output
pnpm lint && pnpm typecheck && pnpm test
```

Manual, and report each:
- View source on `/studio` → the chrome markup is present in the server HTML
- Resize both panels → smooth, and the canvas area does not flash or re-render (add a temporary
  render counter to confirm, then remove it)
- Reload → widths and collapse states restored
- Corrupt the localStorage value manually → falls back to defaults without crashing
- `Cmd+\` and `Cmd+Alt+\` collapse the panels (wire just these two shortcuts now, directly; the
  registry comes in prompt 33)
- `F2` cycles focus through all three regions, visibly
- Tab through the whole shell → focus ring visible, order matches the visual layout
- Narrow the window below 1024 px → the notice appears
- Both colour modes
- Compare against the ASCII layout in `PRODUCT.md` § 1 — same structure, same proportions

Record the studio route's first-load JS from the build output. It should be well under the 250 kB
budget at this stage; note the number so later prompts can see the growth.

## Done when

- [ ] Chrome present in server-rendered HTML
- [ ] Three columns with CSS-variable widths, resizable, persisted, clamped
- [ ] Resize does not re-render the canvas area (verified with a counter)
- [ ] Every placeholder properly disabled
- [ ] `F2` cycling and the two panel shortcuts work
- [ ] Sub-1024 px notice and 1024–1280 px overlay behaviour
- [ ] FPS meter functional
- [ ] Both colour modes correct; full keyboard tab pass clean
- [ ] First-load JS recorded in the report
