# 45b — Icon geometry as data, and the shared producers

**Milestone** M9 · **Depends on** 45a · **Commit** `refactor(icons): hold icon geometry as data`

## Read first

- `docs/DECISIONS.md` — ADR-249 § Named prerequisite
- `docs/DESIGN_SYSTEM.md` — § Iconography
- `packages/icons/src/create-icon.tsx` — the contract this prompt must not change

## Goal

Twenty-two of the catalogue's render files draw icons, and an icon's geometry is JSX inside
`packages/icons`. A markup producer cannot reach JSX without pulling React into the export path, and
the exported project must not depend on `@motion-studio/icons` at all. So the geometry becomes data,
one source, read by both the components and the producers.

Then the shared subcomponents get producers, because they are where the leverage is: `marketing-section`
is used by 8 blocks, `control-icon` by 8, `hero-copy` and `section-heading` by 6, `nav-link` and
`panel-content` by 5.

## Deliverables

```
packages/icons/src/
├── geometry.ts                ICON_GEOMETRY: every glyph as shapes — path and circle records
├── create-icon.tsx            builds the component from the table; the contract is unchanged
└── registry.test.tsx          asserts every name in the table and no name outside it

packages/blocks/src/
├── markup/icon.ts             an icon as a MarkupNode: a real inline <svg>, no dependency
├── marketing/*.markup.ts      marketing-section, section-heading, action-button, media-frame
├── hero/hero-copy.markup.ts   the six heroes' shared copy column
└── navigation/*.markup.ts     nav-link, nav-action, nav-icon
```

## Constraints

### One source of geometry

`createIcon` reads the table. A test asserts the two sets are identical, so an icon added as a
component without geometry, or geometry with no component, fails at once.

The stroke contract — 20 × 20 grid, 1.5 px stroke, `currentColor`, round caps, no fill — is applied in
**both** places from one shared constant, not typed twice.

### The exported icon is an inline `<svg>`

Never an import. A user's project has no icon package, and an export that references one does not
compile in a fresh scaffold, which is the claim `PRODUCT.md` § 7 makes.

`aria-hidden="true"` unless the call site gives a label, which is the component's own rule.

### The shared producers are shared

A block's producer calls them; it does not restate their markup. `hero-split` and `hero-centered`
differ in their frame, not in their copy column, and the parity test will prove it for both.

## Verify

```bash
pnpm --filter @motion-studio/icons test
pnpm --filter @motion-studio/blocks test
pnpm lint && pnpm typecheck
```

- Diff one icon's rendered SVG before and after the refactor: byte-identical, or the geometry moved
  wrongly.
- Report the icon count and the number of blocks whose producers are now unblocked.

## Done when

- [ ] Geometry is data, and `createIcon` is built from it with no visual change
- [ ] An exported icon is an inline `<svg>` with no import
- [ ] The ten shared producers exist and are called rather than copied
- [ ] Parity test still green with zero exceptions
