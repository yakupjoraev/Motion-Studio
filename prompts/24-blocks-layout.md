# 24 — Blocks: layout

**Milestone** M4 · **Depends on** 23 · **Commit** `feat(blocks): add layout blocks`

## Read first

- `docs/COMPONENT_LIBRARY.md` — § Anatomy, § Writing a block, § Adding a block
- `docs/DESIGN_SYSTEM.md` — § Space, § Radius
- `docs/RESPONSIVE_ENGINE.md` — § Which properties are responsive

## Goal

The seven layout blocks. They are structural, so they are the ones every other block sits inside —
getting their slot rules and responsive props right prevents a whole class of downstream problem.

`section` and `container` already exist from prompt 22; extend them to full spec and add five more.

## Deliverables

```
packages/blocks/src/layout/
├── section/          extend: sticky option, full-bleed background, min-height, overflow
├── container/        extend: grid mode, wrap, divide
├── stack/            vertical/horizontal with gap, align, justify, divider option
├── grid/             explicit columns/rows, auto-fit, min item width, gap x/y, dense
├── columns/          asymmetric split (e.g. 2fr 1fr), reverse on mobile
├── spacer/           fixed or fluid vertical space
├── divider/          horizontal/vertical, style, label option, gradient fade
└── index.ts
```

Nine files each, per the anatomy in `COMPONENT_LIBRARY.md`.

## Constraints

### Slot rules

| Block | Slot | Accepts | Max |
| --- | --- | --- | --- |
| `section` | `children` | `*` | null |
| `container` | `children` | `*` | null |
| `stack` | `children` | `*` | null |
| `grid` | `children` | `*` | null |
| `columns` | `left`, `right` | `*` | 1 each |
| `spacer` | — | — | — |
| `divider` | — | — | — |

`columns` having two named single-child slots (rather than one slot with two children) is what makes
the drop indicator meaningful — a user dropping into the left column should see the left column
highlight, not an insertion line in an ambiguous list.

### Responsive props

Everything geometric is responsive: `columns`, `gap`, `padding`, `direction`, `align`, `justify`,
`maxWidth`, `split`, `height`, `hidden`. Mark them `responsive: true` in the control descriptors.

`columns.reverseOnMobile` is a real prop, not a responsive override — "which one comes first at
`base`" is a semantic decision, not a size override, and modelling it as a prop makes the export
emit `flex-col-reverse md:flex-row` rather than something confusing.

### `grid` auto-fit

```
auto-fit mode: repeat(auto-fit, minmax(var(--min-item), 1fr))
```

Exposed as `minItemWidth`. This is the mode most users actually want and most builders do not offer.
Both modes (explicit columns, auto-fit) must export to clean Tailwind — explicit columns to
`grid-cols-*`, auto-fit to an arbitrary `grid-cols-[repeat(auto-fit,minmax(16rem,1fr))]` with a
comment in the emitted code.

### `spacer`

Fixed (`height` in px, responsive) or fluid (`grow`, using `flex-1`). A fluid spacer inside a
non-flex parent is a no-op, so `capabilities` declares the parent requirement and the inspector shows
a hint when it will not work. Silently doing nothing is the worst option.

### `divider` with a label

`divider` with a `label` prop renders as a line-text-line composition, which is a small thing that
appears on every second landing page and is annoying to hand-write.

### Universal requirements

- Semantic HTML: `section` renders `<section>`, `divider` renders `<hr>` when unlabelled and a
  `<div role="separator">` when labelled
- Tokens only; no raw values
- Usable at 360 px with defaults
- `axe` clean
- `defaultMotion`: `section` gets `fade-up` on `entrance` (stub the spec now; the engine lands in
  prompt 31), others get none
- `costClass: 'cheap'` for all seven

## Verify

```bash
pnpm --filter @motion-studio/blocks test
pnpm dev:storybook
pnpm dev    # /studio
```

Tests — the meta-tests from prompt 22 cover most of it. Add per block:
- Renders every layout mode without throwing
- `grid` auto-fit and explicit modes produce the expected class sets
- `columns` slots accept exactly one child each
- `divider` renders `<hr>` unlabelled, `role="separator"` labelled
- `spacer` fluid mode inside a non-flex parent does not throw

Manual, and report:
- Build a nested structure in the studio: section → columns → (container + stack) → headings
- Drop targets behave sensibly at every level (dnd comes in prompt 27; test insertion via `Enter`
  from the palette for now)
- Every responsive prop shows the breakpoint override affordance
- At 360 px artboard width, every block is usable
- Storybook: each block in all its modes, both colour modes

## Done when

- [ ] Seven layout blocks, nine files each
- [ ] Slot rules exactly as tabled, with `columns` using two named single-child slots
- [ ] Every geometric prop marked responsive
- [ ] `grid` supports auto-fit with a clean export path for both modes
- [ ] `spacer` declares its parent requirement and hints when it will not apply
- [ ] Semantic HTML per block, including the divider's two forms
- [ ] All meta-tests pass; axe clean
- [ ] Usable at 360 px
