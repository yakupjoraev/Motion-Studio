# 52 — Block gallery

**Milestone** M12 · **Depends on** 51 · **Commit** `feat(web): add block gallery with live controls`

## Read first

- `docs/PRODUCT.md` — § Surfaces, § User flows (flow A)
- `docs/VISION.md` — § The problem (this page is the answer to it)
- `docs/PERFORMANCE.md` — § Public pages
- `docs/THEME_ENGINE.md` — § Scoped themes

## Goal

`/blocks` and `/blocks/[slug]` — the surface that serves **flow A**: a developer arrives, finds an
effect, tunes it, copies the code, and leaves in under 60 seconds. No studio, no document, no
onboarding.

This page is the direct answer to the problem statement in `VISION.md`: effects you can manipulate
rather than screenshots you cannot.

## Deliverables

```
apps/web/
├── app/blocks/
│   ├── page.tsx                      RSC list + client preview islands
│   ├── [slug]/page.tsx               RSC shell + client controls island
│   └── [slug]/opengraph-image.tsx
└── src/components/gallery/
    ├── gallery-grid.tsx              category sections, search
    ├── gallery-card.tsx              thumbnail + name + tags, links to detail
    ├── gallery-search.tsx
    ├── detail/
    │   ├── block-preview.tsx         live, resizable, themed
    │   ├── block-controls.tsx        the same generated control system as the inspector
    │   ├── block-source.tsx          live TSX from our codegen
    │   ├── block-props-table.tsx     generated from the zod schema
    │   ├── block-a11y-notes.tsx      from definition.a11y
    │   ├── block-motion-panel.tsx    preset picker for this block
    │   ├── theme-switcher.tsx        ThemeScope over the preview
    │   ├── viewport-switcher.tsx     preview at base/md/xl widths
    │   └── copy-button.tsx
    └── use-block-state.ts            props state, URL-synced
```

## Constraints

### Sixty seconds, no friction

The detail page must be immediately usable:
- Preview visible above the fold at any viewport
- Controls beside it, not below it, on desktop
- A **Copy React** button in the first screenful
- No modal, no tour, no cookie banner, no sign-up

Time the flow yourself with a stopwatch: land on `/blocks/aurora-background`, change two values, copy.
**Report the actual seconds.** If it is over 60, the layout is wrong.

### Controls reuse the inspector system

Import `ControlRenderer` from `@motion-studio/ui` — prompt 23 placed it there for exactly this
consumer, so there is nothing to extract and nothing to refactor. Supply your own state handling:
local state plus URL sync here, where the inspector dispatches commands.

If you find yourself writing a control component in `apps/web/src/components/gallery/`, stop. Two
control systems would drift and the gallery would slowly stop matching the studio, which is the
specific failure this placement prevents.

### Source is generated, not written

The displayed source comes from `packages/codegen` with `scope: 'selection'` on a single-node document.
So the code shown is **exactly** what the export produces. A hand-written snippet would drift within a
week and would be a lie.

Highlighted at build time for the default props; re-highlighted at runtime (lazy highlighter) when the
user changes something.

### URL-synced state

Prop values sync to the URL as compact query params, so a tuned block is shareable:

```
/blocks/aurora-background?blur=32&speed=0.6&noise=0.04
```

- Validated through the block's schema on read — **a URL is untrusted input**
- Invalid values fall back to defaults with a quiet notice, never a crash
- `replaceState` while scrubbing so history is not flooded

### Props table

Generated from the Zod schema: name, type, default, description, whether it is responsive. A
hand-maintained props table is stale documentation waiting to happen.

### Performance

- The list page is RSC with static registry metadata; only the preview cards are client islands
- Previews below the fold mount lazily on intersection
- Heavy blocks lazy-load with an exact-size skeleton
- Each preview is a `ThemeScope`, so theme switching is variable writes, not remounts
- Lighthouse ≥ 95 on both `/blocks` and a representative detail page

### Accessibility

- Live-region announcement when a control changes the preview
- The preview region is labelled and its resize handles are keyboard-operable
- Source blocks are keyboard-scrollable labelled regions
- The a11y notes section per block is genuinely useful content, not boilerplate — it states the
  keyboard behaviour, the ARIA roles used, and any caveats for that specific block

## Verify

```bash
pnpm build
pnpm start
pnpm exec lighthouse http://localhost:3000/blocks --form-factor=mobile
pnpm exec lighthouse http://localhost:3000/blocks/aurora-background --form-factor=mobile
pnpm test:e2e
```

Report all four scores for both pages.

Tests:
- Props table generated from the schema matches the schema (iterate and assert)
- URL state round-trips; an invalid param falls back to the default with a notice
- Source shown equals `codegen` output for the same props (assert equality, not a snapshot)
- Controls are the shared component, not a copy (assert by import path or shared test)
- Below-fold previews do not mount until intersected

E2E `e2e/flows/grab-effect.spec.ts` (flow A):
1. Land on a detail page → the preview is visible without scrolling
2. Change two controls → the preview updates, the URL updates
3. Copy React → the clipboard contains valid TSX starting with the expected line
4. Open the URL in a new tab → the tuned state is restored
5. Every block's detail page renders without error (parameterised over the registry)

Manual, and report:
- **Time flow A with a stopwatch. Report the seconds.**
- Every one of the 62 detail pages loads (the E2E covers it, but spot-check ten by eye)
- Theme switching over a preview → instant, no remount flicker
- Viewport switcher → the preview reflows correctly at each width
- With a screen reader: change a control and report what was announced
- On a phone: is the detail page genuinely usable?

## Done when

- [ ] `/blocks` and all 62 detail pages render; Lighthouse ≥ 95 × 4 on both page types, reported
- [ ] Flow A timed with a stopwatch and under 60 seconds; time reported
- [ ] Controls are the shared inspector system, not a second implementation
- [ ] Source is generated by `codegen` and asserted equal to export output
- [ ] Props table generated from the schema
- [ ] URL state validated through the schema; invalid params degrade quietly
- [ ] Below-fold previews mount lazily
- [ ] Theme switching over previews causes no remount
- [ ] Per-block a11y notes are specific and useful, not boilerplate
- [ ] Flow A E2E spec passing on three browsers
