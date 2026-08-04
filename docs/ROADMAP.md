# ROADMAP

Build order. Each milestone is independently demoable and independently reviewable. Nothing is
built before the thing it depends on, and nothing is "finished" without its definition of done.

Estimates assume one focused engineer. They are for sequencing, not for promising.

## M0 — Foundation (2–3 days)

**Prompts 01–05**

Monorepo, tooling, shared configs, the token package, and CI skeleton.

Deliverables:
- pnpm workspace + Turborepo, all packages scaffolded with real `package.json` and `tsconfig.json`
- `packages/config`: tsconfig presets, Biome, Tailwind v4 base, Vitest presets
- `packages/utils`: `cn`, `assertNever`, `Result`, id generation, clamp/lerp, `innerRadius`
- `packages/tokens`: primitives + semantic layers, CSS/Tailwind generators, contrast tests
- `apps/web`: Next 15 app, one route, tokens applied
- `ci.yml`: lint, typecheck, test, build
- `check:deps` dependency-boundary gate

**Done when:** `pnpm dev` renders a token-styled page, `pnpm lint && pnpm typecheck && pnpm test
&& pnpm build` all pass, CI is green, and the contrast test suite passes for both modes.

## M1 — Design system and chrome (3–4 days)

**Prompts 06–11**

Deliverables:
- `packages/theme`: `ThemeConfig`, palette generation, contrast repair, `applyTheme`, 10 presets
- `packages/icons`: ~60 icons
- `packages/ui`: Button, Input, ScrubField, Select, Segmented, Switch, Slider, Tabs, Tooltip,
  Popover, Dropdown, Dialog, ContextMenu, ScrollArea, Collapsible, Panel, Toast, ColorPicker
- Storybook running with a11y and interaction addons
- The studio shell: top bar, resizable panels, status bar, empty canvas placeholder

**Done when:** the shell is pixel-consistent with `UI_GUIDELINES.md`, every `ui` component has a
story and a test, theme switching is live with zero React re-renders (asserted), and panels resize
and persist.

## M2 — Editor core (4–5 days)

**Prompts 12–16**

The hardest and highest-value milestone. Pure logic, no canvas yet.

Deliverables:
- `packages/schema`: document model, all Zod schemas, `validateDocument`, `migrateDocument`,
  `sanitizeDocument`, byte-stable serialization
- `packages/editor`: store + all seven slices, the full command catalogue, history with coalescing
  and transactions, selection algebra, clipboard
- Selectors and the versioned memo helper
- Property-based tests: invariants hold, undo restores

**Done when:** `editor` and `schema` are at ≥ 90 % coverage, the property tests pass over 40-command
sequences, and a document can be created, mutated, undone, serialized, and reparsed identically —
all in `node`, with no browser.

## M3 — Canvas (4–5 days)

**Prompts 17–21**

Deliverables:
- Coordinate system with branded types and round-trip tests
- Viewport: pan (pointer, keyboard, momentum), zoom (cursor-anchored, drift-free), fit, zoom to
  selection
- Grid, rulers, user guides
- Rect cache via one `ResizeObserver`
- Hit testing (pointer + marquee), isolation
- Snapping engine with all five candidate kinds
- Overlays: selection, multi-select, hover, handles, guides, marquee, spacing, breakpoint frame
- Keyboard navigation and the live-region announcer

**Done when:** 200 placeholder nodes pan/zoom/marquee at 60 fps, zoom drift over 100 operations is
under 0.01 px, every snap candidate kind has a passing test, and the canvas is fully operable by
keyboard.

## M4 — Blocks, wave 1 (4–5 days)

**Prompts 22–26**

Deliverables:
- Registry contract, `defineBlock`, split metadata/render registries, parity check
- Control descriptors and the generated inspector (all 22 control kinds)
- Layout (7), Hero (6), Content (9) — 22 blocks
- Thumbnail generation script
- Registry meta-tests

**Done when:** 22 blocks render on the canvas, the inspector is fully generated from schemas, every
meta-test passes, and editing any control produces exactly one coalesced undo step.

## M5 — Drag and drop (2–3 days)

**Prompts 27–29**

Deliverables:
- `DndProvider`, sensors, canvas transform modifier
- `resolveDropTarget` with all orientations and rejection reasons
- Drop indicators, ghost previews, auto-pan, auto-scroll, spring-open
- Layers tree with virtualization and keyboard drag
- Announcements

**Done when:** all four drag operations work by mouse **and** by keyboard, every rejection shows a
reason, dragging on a 200-node canvas holds 60 fps with zero canvas re-renders, and the E2E specs
pass on all three browsers.

## M6 — Motion engine (4–5 days)

**Prompts 30–34**

Deliverables:
- Curves, springs, `simulateSpring`
- `MotionSpec` / `MotionPreset` model, resolution, composition, conflict detection
- The shared scheduler (one observer, one scroll listener, one pointer listener, one `rAF` loop)
- 30+ presets across five channels, each with reduced variant and codegen fragment
- Reduced-motion policy and the studio preview toggle
- The motion inspector panel: preset picker, spring curve editor, bezier editor, stagger
- 13 effects

**Done when:** every preset has a reduced variant and a codegen golden file, a page with 8 animated
sections plus 3 continuous effects holds 60 fps, and the reduced-motion E2E spec confirms no
transform animations run.

## M7 — Responsive and theme integration (2–3 days)

**Prompts 35–37**

Deliverables:
- Breakpoint model, `resolveResponsiveProps` with cascade
- Breakpoint switcher, artboard resize animation, override indicators, reset affordances
- The editing-scope guardrail hint
- Theme builder panel wired to the document
- Container-query opt-in for the blocks that need it

**Done when:** the cascade tests pass (including the "does not leak downward" case), overrides are
visible and resettable, resetting removes the key rather than writing the base value, and the
theme builder is live with zero re-renders.

## M8 — Blocks, wave 2 (4–5 days)

**Prompts 38–41**

Deliverables:
- Marketing (12), Navigation (6), Interactive (9), Data (5), Forms (5) — 37 blocks
- All with responsive props, default motion, effects support, a11y notes
- Thumbnails for everything

**Done when:** 62 blocks total, every meta-test passes, zero axe violations across the whole
registry, and every block is usable at 360 px.

## M9 — Export engine (4–5 days)

**Prompts 42–46**

Deliverables:
- `buildIR` with all six passes
- React, Next, HTML, JSON, Tokens printers
- Prettier integration, dynamic
- Export dialog with streaming, options, warnings, file tree, zip
- Copy React on selection
- Golden files for every document × target × option set
- `tsc --noEmit` compilation tests over generated output

**Done when:** every golden output compiles clean, the Next export of `full-landing` builds in a
fresh `create-next-app` with zero edits, the export smoke workflow passes, and the generated code
would survive review.

## M10 — Playground (2–3 days)

**Prompts 47–49**

Deliverables:
- Eight property sandboxes with purpose-built targets
- CodeMirror, dynamic, with our theme and CSS diagnostics
- `validateCssValue` with the full blocklist and `CSS.supports` check
- `clip-path` vertex editor, bezier curve editor
- Presets, compare mode, permalinks
- Send to selection

**Done when:** invalid CSS keeps the last valid render, every blocklist entry is rejected with a
reason, vertex and bezier editors are keyboard-operable and announce values, and send-to-selection
is one undoable command.

## M11 — Persistence and documents (1–2 days)

**Prompt 50**

Deliverables:
- IndexedDB wrapper, debounced autosave, flush on hide/unload
- Document list, recent, version history with 10-snapshot ring buffer
- Import with the full pipeline and a repair report dialog
- Eight templates, validated in CI

**Done when:** a hard refresh mid-edit loses nothing, an invalid file produces a readable repair
report instead of a crash, and every template loads and exports.

## M12 — Landing and docs site (3–4 days)

**Prompts 51–53**

Deliverables:
- Landing page: interactive hero, problem statement, live effect grid, inspector walkthrough,
  export reveal, architecture diagram, CTA
- `/blocks` gallery and `/blocks/[slug]` detail pages
- `/docs/[...slug]` rendering `docs/` as MDX with a sidebar and search
- Full reduced-motion variant of everything

**Done when:** Lighthouse ≥ 95 × 4 on mobile and desktop for `/`, `/blocks`, `/docs`; LCP ≤ 2.0 s;
first-load JS ≤ 120 kB; and the landing is fully coherent with zero animation.

## M13 — Quality hardening (3–4 days)

**Prompts 54–58**

Deliverables:
- Performance pass: bundle audit, dynamic import verification, render-count assertions, layer
  audit, memory profile over 30 minutes
- Accessibility pass: the full manual checklist, screen-reader runs on VoiceOver and NVDA, forced
  colours, 200 % zoom
- Test completion to the per-package coverage floors
- Visual regression baselines
- Error boundaries at every level with document-recovery actions

**Done when:** every budget in `PERFORMANCE.md` is met and asserted in CI, the manual a11y
checklist is fully signed off, coverage floors pass, and every error boundary offers a way to
retrieve the document.

## M14 — Launch (2–3 days)

**Prompts 59–62**

Deliverables:
- README with the architecture diagram and four generated GIF demos
- Docker + compose verified from a clean clone
- Full CI/CD: all gates, Lighthouse, visual, export smoke, release, deploy
- Issue and PR templates, Dependabot, topics, description
- Storybook deployed
- v1.0.0 release with a changelog
- History audit: no assistant or tooling attribution anywhere

**Done when:** a stranger can clone, `docker compose up`, and use the product; every acceptance
criterion in `PRODUCT.md` passes; and the repository reads as a finished open-source project.

## Timeline

| Phase | Milestones | Days |
| --- | --- | --- |
| Foundations | M0–M1 | 5–7 |
| Core engines | M2–M3 | 8–10 |
| Content and interaction | M4–M6 | 10–13 |
| Systems | M7–M9 | 10–13 |
| Surfaces | M10–M12 | 6–9 |
| Hardening and launch | M13–M14 | 5–7 |
| **Total** | | **44–59 days** |

Roughly 6–8 focused weeks, or 3–4 months at a part-time pace.

### Critical path

```
M0 → M1 → M2 → M3 → M4 → M5
                  ↓     ↘
                  M6 ────→ M8
                  ↓        ↓
                  M7 ────→ M9 → M13 → M14
                           ↓     ↑
                  M10, M11, M12 ─┘
```

M6 (motion) can start once M4 (blocks) exists. M10–M12 are parallelizable with M9. M13 needs
everything.

### If time runs short

Cut in this order, and say so in the README rather than shipping half-done features:

1. Multi-frame responsive comparison → single frame only
2. Compare mode in the playground
3. Version history → autosave only
4. Blocks wave 2 → 40 blocks instead of 62
5. HTML export target → React, Next, JSON only
6. Visual regression suite

**Never cut:** accessibility, reduced motion, the export compilation tests, or the docs. Those are
what make the project what it claims to be, and a portfolio project that fails its own stated
standards is worse than a smaller one that meets them.

## Post-v1

Not scoped, listed so the v1 boundary is deliberate rather than accidental:

- **v1.1** — user-authored custom blocks via a sandboxed schema
- **v1.2** — plugin API for third-party blocks and presets
- **v1.3** — Figma import (frames → blocks, best-effort)
- **v1.4** — collaborative editing (Yjs; the normalized document model is already CRDT-friendly)
- **v1.5** — a component-library export target (publishable npm package output)
- **v2.0** — a hosted variant with accounts and sharing, if there is demand
