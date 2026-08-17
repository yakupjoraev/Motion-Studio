# PRODUCT

Feature specification. Each surface lists what it contains, how it behaves, and how we know it
is finished. Where a subsystem has its own document, this file states the *requirement* and
links out for the *mechanism*.

## Surfaces

| Route | Purpose | Rendering |
| --- | --- | --- |
| `/` | Landing page. The product's own showcase. | Server Components, streamed |
| `/studio` | The editor. | Client, shell prerendered |
| `/studio?doc=<id>` | Editor with a document loaded from local storage | Client |
| `/playground` | Live CSS property sandboxes | Client, code editor lazy-loaded |
| `/blocks` | Browsable registry with live previews | Server + client islands |
| `/blocks/[slug]` | Single block: live preview, controls, source, a11y notes | Server + client islands |
| `/docs/[...slug]` | Rendered documentation | Static |

## 1. Studio shell

**Layout.** Three columns plus a top bar and a status bar. Left and right panels are
resizable (drag handle, `Cmd+\` to collapse left, `Cmd+Alt+\` for right) and persist their
width to local storage.

```
┌─────────────────────────────────────────────────────────────────┐
│ ☰  Motion Studio   [file ▾]  [edit ▾]   ⟲ ⟳ │ 100% ▾ │ ▭ ▯ ▮ │ ⌘K │  Export
├──────────┬────────────────────────────────────────┬─────────────┤
│ Blocks   │                                        │ Inspector   │
│ Motion   │                                        │             │
│ Effects  │              Canvas                    │  Layout     │
│ Theme    │                                        │  Style      │
│ Layers   │                                        │  Motion     │
│          │                                        │  Effects    │
│          │                                        │  Responsive │
├──────────┴────────────────────────────────────────┴─────────────┤
│ 3 nodes · Hero selected · 60fps · sm md lg xl · ⚡ reduced: off  │
└─────────────────────────────────────────────────────────────────┘
```

**Top bar** — logo/menu, file menu (New, Open `.motion`, Save, Save As, Import JSON, Recent),
edit menu (Undo, Redo, Duplicate, Delete, Select All), undo/redo buttons with tooltip showing
the next action's label, zoom control, breakpoint switcher, command palette trigger, Export.

**Status bar** — node count, selection summary, live FPS meter (dev + a toggle in prod),
active breakpoint, reduced-motion state, autosave indicator.

**Done when:** shell renders under 100 ms of interaction latency, panels resize at 60 fps,
every control has a keyboard path and an accessible name, layout survives a reload.

## 2. Left panel

Four tabs plus a Layers tree.

**Blocks** — searchable, category-grouped list of registry entries. Each entry is a card with a
static thumbnail (animated on hover, respecting reduced motion), name, and category chip.
Cards are drag sources; `Enter` inserts into the current selection's parent.
Categories: Layout, Hero, Content, Marketing, Navigation, Interactive, Data, Forms, Effects —
the nine of [COMPONENT_LIBRARY.md](COMPONENT_LIBRARY.md) § Catalogue, which is the list the registry
is built from (ADR-176).

**Motion** — the preset catalogue, grouped by channel (Entrance, Scroll, Hover, Cursor,
Continuous). Each preset previews on hover. Clicking applies to selection. Applying is a
command, so it undoes.

**Effects** — background and surface effects that attach to a node rather than replacing it:
Aurora, Mesh Gradient, Noise, Grain, Spotlight, Beams, Dot Grid, Glow, Border Beam, Glass.

**Theme** — the theme builder: palette, radius scale, elevation, blur strength, motion scale,
font pairing, dark/light/system. Changes are live and global. See
[THEME_ENGINE.md](THEME_ENGINE.md).

**Layers** — virtualized tree of the document. Drag to reorder and reparent, click to select,
`Shift+click` for range, `Cmd/Ctrl+click` for additive, double-click to rename, eye icon to
toggle visibility, lock icon to prevent selection. Keyboard: arrows to move, `←`/`→` to
collapse/expand, `Enter` to rename.

**Done when:** search returns in under 16 ms over the full registry, the tree stays at 60 fps
with 500 nodes (virtualized), and drag-reorder in the tree is keyboard-operable.

## 3. Canvas

See [CANVAS.md](CANVAS.md) for the mechanism. Requirements:

- Infinite pan; zoom 10 %–400 % with `Cmd+scroll`, pinch, `Cmd+±`, `Cmd+0` (100 %),
  `Shift+1` (fit), `Shift+2` (zoom to selection).
- `Space` + drag or middle-mouse to pan. Trackpad two-finger pans.
- Selection: click, `Shift+click` to add, marquee drag on empty space, `Esc` to clear,
  `Tab`/`Shift+Tab` to walk siblings, `Enter` to enter a container, `Esc` to step out.
- Snap grid (8 px default, configurable), alignment guides against siblings and container
  edges with a 4 px threshold, distance labels between snapped edges.
- Rulers on both axes, cursor position marker, drag from ruler to create a guide.
- Overlays: selection outline with the node name, hover outline, padding/margin shading on
  `Alt` hold, breakpoint frame outline.
- Context menu on right-click: Duplicate, Copy, Paste, Paste Style, Delete, Bring Forward, Send
  Backward, Wrap in Container, Unwrap, Add Motion, Copy React, Reset Overrides. Unwrap sits next to
  Wrap because a menu that offers one and not the other is a one-way door; it is disabled, with the
  reason shown, on a node with no children.
- Live rendering: blocks render with their real animations. A play/pause control freezes all
  motion for inspection; a scrub control replays entrance animations.

**Done when:** 200 nodes at 60 fps, zoom has no cumulative drift over 100 operations, and every
selection and navigation action has a keyboard equivalent.

## 4. Inspector

Generated from the selected block's Zod schema plus universal sections. See
[COMPONENT_LIBRARY.md](COMPONENT_LIBRARY.md) for how control metadata is declared.

**Sections** (collapsible, state persisted per section):

| Section | Controls |
| --- | --- |
| **Layout** | display, direction, gap, padding, margin, align, justify, grid columns/rows, width/height/min/max, aspect ratio, position, z-index |
| **Style** | background (solid / linear / radial / conic / mesh / image), border (width, style, colour, per-side), radius (linked or per-corner), opacity, blend mode |
| **Typography** | family (from theme pairings), size, weight, line height, letter spacing, transform, align, balance, gradient text |
| **Effects** | box-shadow stack (add/remove/reorder), inner shadow, blur, backdrop-filter, glass preset, noise amount, glow, filter chain |
| **Motion** | preset picker, channel, trigger, duration, delay, easing (curve editor), spring (mass/stiffness/damping with live curve), stagger, repeat, hover/tap variants |
| **Responsive** | current breakpoint indicator, per-breakpoint override list, "reset to base" per property |
| **Content** | block-specific text, links, images, list items (add/remove/reorder) |
| **Code** | live TSX of the selected node, copy button, "include children" toggle |

**Control behaviours:**

- Number inputs are **scrub fields**: drag horizontally to change, `Shift` for ×10, `Alt` for
  ×0.1, arrow keys step, typing accepts expressions (`16*2`, `100/3`).
- Colour inputs open a picker with eyedropper, alpha, saved swatches, theme tokens as presets,
  and a contrast indicator against the resolved background.
- Any property overridden at the current breakpoint shows an override dot; clicking it reverts.
- Any property differing from the block default shows a reset affordance.
- Multi-selection shows shared properties; mixed values render as `Mixed` and editing applies
  to all.
- Every edit is a command. Continuous edits (scrub, colour drag) coalesce into one history
  entry keyed by `nodeId:property`.

**Done when:** scrubbing a value re-renders only the affected subtree, a slider drag produces
exactly one undo step, and the whole inspector is operable with `Tab` and arrow keys.

## 5. Motion engine

See [ANIMATION_SYSTEM.md](ANIMATION_SYSTEM.md). Requirements:

- 30+ presets across five channels, each with parameters exposed in the inspector.
- Shared vocabulary: named easings, named springs, a motion scale token that globally
  multiplies durations.
- Scroll-driven presets use a shared observer/timeline pool — never one observer per node.
- Hover and cursor presets attach passive listeners and write CSS variables; no React state.
- Global reduced-motion toggle in the studio previews the reduced variant without changing the
  document.
- Presets are data. `MotionPreset` → resolved config → Motion (`variants`/`transition`) or a
  GSAP timeline. The block never hard-codes an animation.

## 6. Playground

See [PLAYGROUND.md](PLAYGROUND.md). Requirements:

- Sandboxes for `background`, `box-shadow`, `filter`, `backdrop-filter`, `mask-image`,
  `clip-path`, `transform`, `transition`.
- Split view: editor left, live target right. Debounced apply (60 ms), invalid CSS shows an
  inline error and keeps the last valid state rendered.
- A gallery of starting points per property.
- "Send to selection" applies the current value to the selected canvas node as a command.
- The code editor is dynamically imported and never in the studio's initial chunk.

## 7. Export

See [EXPORT_ENGINE.md](EXPORT_ENGINE.md). Four targets:

| Target | Output |
| --- | --- |
| **React** | Self-contained `.tsx` component, Tailwind classes, Motion imports, typed props |
| **Next.js** | `app/page.tsx` + section components + `globals.css` + `tailwind.config.ts` + `package.json` |
| **HTML** | Single `index.html` with inlined CSS and vanilla JS for interactions |
| **JSON** | `.motion` document, portable and re-importable |

Export dialog shows a diff-style preview with syntax highlighting, a file tree for
multi-file targets, per-file copy, and download-as-zip. Options: TypeScript/JavaScript, include
theme tokens, include motion, extract props, single-file, image component, format with Prettier.

**Styling output is Tailwind, and it is not an option.** The React and Next targets emit Tailwind
classes; the HTML target emits real CSS rules generated from the classes actually used. There is no
CSS-Modules switch, because Tailwind is the model the code generator is built on rather than a
formatting choice made at print time — see [EXPORT_ENGINE.md](EXPORT_ENGINE.md) § There is no styling
option, and [ROADMAP.md](ROADMAP.md) § Post-v1 for what adding one would actually cost.

**Done when:** each target's output compiles in a fresh scaffold with zero manual edits, and a
golden-file test suite locks the output for every block.

## 8. Command palette

`⌘K` / `Ctrl+K`. Fuzzy search over: insert block, apply motion preset, run editor command,
change theme, jump to layer, open document, toggle setting, open doc page. Recent actions
first, then best match. Arrow keys navigate, `Enter` runs, `Esc` closes. See
[SHORTCUTS.md](SHORTCUTS.md).

## 9. Landing page

The landing page is a product surface, not a formality — it is the first thing a reader sees
and it must demonstrate the thing it describes.

Sections: hero with a live interactive demo (a real canvas node the visitor can drag), the
problem statement, a live effect grid, an inspector walkthrough that animates on scroll, an
export code reveal, the architecture diagram, and a call to action.

**Constraints:** Server Components by default, streamed, images optimised, hero LCP element is
static text (never an animation), Lighthouse ≥ 95 on mobile, full reduced-motion variant.

## 10. Persistence

Local-first. No backend.

- Autosave to IndexedDB every 2 s after the last change (debounced), plus on `visibilitychange`.
- Document list in local storage; `/studio` restores the last document.
- `.motion` file download and upload, validated against the schema on import with a readable
  error report for invalid files. See [FILE_FORMAT.md](FILE_FORMAT.md).
- Nothing leaves the browser. No telemetry.

## User flows

**Flow A — grab one effect (target: 60 s)**
Open `/blocks/aurora-card` → tune blur, speed, glow in the panel → `Copy React` → paste.

**Flow B — compose a page (target: 20 min)**
Open `/studio` → drag Navbar, Hero, Bento, Pricing, FAQ, Footer → set theme palette and radius
once → adjust copy → apply `reveal` to sections → check `md` breakpoint → Export Next.js.

**Flow C — tune motion (target: 3 min)**
Select node → Motion tab → pick `magnetic` → drag spring stiffness while watching the curve →
`Copy React`.

**Flow D — live CSS (target: 2 min)**
`/playground` → `clip-path` sandbox → edit polygon → Send to selection.

Each flow is an E2E test. See [TESTING.md](TESTING.md).

## Acceptance criteria (v1.0)

- [ ] All four flows pass as Playwright specs on Chromium, Firefox, WebKit.
- [ ] 60+ blocks, 30+ motion presets, 12+ effects registered and documented.
- [ ] All four export targets produce compiling output, locked by golden files.
- [ ] Canvas at 60 fps with 200 nodes; studio initial JS ≤ 250 kB gzip.
- [ ] Lighthouse ≥ 95 × 4 on `/`, `/blocks`, `/docs`.
- [ ] Zero axe violations on every surface; full keyboard operation verified.
- [ ] Unit coverage ≥ 80 % on `editor`, `codegen`, `schema`, `motion`.
- [ ] `docs/` complete and consistent with the implementation.
- [ ] CI enforces every gate above.
