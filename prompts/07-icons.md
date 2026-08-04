# 07 — Icon set

**Milestone** M1 · **Depends on** 02 · **Commit** `feat(icons): add studio icon set`

## Read first

- `docs/DESIGN_SYSTEM.md` — § Iconography
- `docs/UI_GUIDELINES.md` — § Character (icon sizing)
- `docs/PERFORMANCE.md` — § Tree-shaking discipline

## Goal

~60 hand-built icons as individual React components. No icon library, no sprite sheet, no runtime
SVG fetching — each icon is a component so tree-shaking works and only used icons ship.

## Deliverables

```
packages/icons/src/
├── icon.types.ts       IconProps { size?, strokeWidth?, className? } extends SVGProps
├── create-icon.tsx     factory: consistent viewBox, stroke, caps, joins, a11y
├── <name>.tsx          one file per icon
├── icon-name.ts        IconName union type, derived from the registry
├── registry.ts         IconName → component, for dynamic lookup by name
└── index.ts
```

### The set

**Editor** — cursor, hand, move, resize, duplicate, delete, lock, unlock, eye, eye-off, undo, redo,
copy, paste, scissors, group, ungroup

**Layout** — layout-grid, layout-columns, layout-rows, align-left, align-center-h, align-right,
align-top, align-center-v, align-bottom, distribute-h, distribute-v, padding, margin, gap

**Style** — palette, droplet, gradient, blur, shadow, border, radius, opacity, type, sparkles, noise

**Motion** — play, pause, replay, zap, wave, spring, curve, timeline, cursor-follow

**Navigation** — chevron-up/down/left/right, plus, minus, x, check, search, settings, more-horizontal,
more-vertical, external-link, panel-left, panel-right

**Blocks** — hero, grid, card, list, table, form, navbar, footer, image, video, code

**Files** — file, folder, download, upload, save, export, history

**Status** — info, warning, error, success, loading

## Constraints

- 20 × 20 grid, `viewBox="0 0 20 20"`, 1.5 px stroke, `currentColor`, `round` caps and joins,
  `fill="none"` unless the glyph requires a fill.
- `size` prop sets both width and height; default 16.
- `aria-hidden="true"` and `focusable="false"` by default. An icon is decorative — its container
  carries the accessible name. If a caller needs a labelled icon they pass `aria-label`, which
  removes `aria-hidden` automatically in `createIcon`.
- **No default exports.** Named export per file: `export function CursorIcon(props: IconProps)`.
- Optically consistent: a circle and a square of the same nominal size should read as the same
  weight. Check by rendering the whole set at 16 px in a grid and looking at it.
- Hand-authored paths. Do not paste a 400-node path from an editor — these are simple geometric
  glyphs and a 30-character path is the target.
- `registry.ts` maps names to components for the cases needing dynamic lookup (block definitions
  reference an `IconName`). **Decided: the registry imports all icons eagerly.** Each icon is a
  ~30-character path in a ~120-byte component, so the full set is under 8 kB gzipped, and the only
  consumers — the block palette and the icon picker — both live in the studio chunk, which already
  carries every icon.

  Two rules make that decision safe, and both are enforced:
  1. Individual icons stay importable from the barrel, so `apps/web`'s landing and gallery pull only
     what they render and never touch the registry.
  2. A test asserts the registry's gzipped size stays **under 8 kB**. If the icon set grows past
     that, the decision is revisited with a measurement — record it in `docs/DECISIONS.md`, do not
     quietly switch to lazy loading.

  A lazy map was rejected: 60 dynamic imports produce 60 chunks and 60 request waterfalls in the
  picker, which is measurably worse than 8 kB.

## Verify

```bash
pnpm --filter @motion-studio/icons test
pnpm lint && pnpm typecheck
```

Tests:
- Every entry in `registry.ts` renders without throwing
- `IconName` union matches the registry keys exactly (a compile-time assertion plus a runtime test)
- Default render has `aria-hidden="true"`
- Passing `aria-label` removes `aria-hidden` and sets `role="img"`
- `size={24}` sets both dimensions

Then render the full set at 16 px in a temporary page, in both colour modes, and look at it. Fix any
icon that reads heavier or lighter than its neighbours. Remove the temporary page.

## Done when

- [ ] ~60 icons, all groups covered
- [ ] Consistent grid, stroke, caps, joins
- [ ] Optical weight checked visually across the full set
- [ ] `IconName` and the registry cannot drift (tested)
- [ ] a11y defaults correct, with the labelled path tested
- [ ] Named exports only; tree-shaking verified by checking a build that imports one icon
- [ ] Verification clean
