# 63 — Narrow arrangements across the catalogue

**Milestone** M15 · **Depends on** 62 · **Commit** `feat(blocks): give every card row a narrow arrangement`

## Read first

- `docs/RESPONSIVE_ENGINE.md` — § How a block asks its own width, § Two arrangements, and the user picks
- `docs/DECISIONS.md` — ADR-356 (container queries per band), ADR-357 (slider or stack)
- `packages/blocks/src/narrow-track.ts` — the shared track, already written
- `packages/blocks/src/marketing/feature-grid/` — the reference implementation, end to end

## Goal

Three blocks carry the `narrow` choice. Every other block that puts cards, logos, quotes or figures in
a row still stacks them, which is the arrangement M15 opened by rejecting.

Finish the pass. Then keep going: the owner's standard is **more choices, each one working perfectly**,
so this prompt is also where a block gains the second arrangement it obviously wants and does not have.

## Blocks that need `narrow`

```
marketing/bento-grid          cells of two sizes; the slider has to keep the sizes legible
marketing/logo-cloud          two columns already read well on a phone — decide, and record why
marketing/testimonial-marquee already a moving row; the question is whether `narrow` means anything here
marketing/comparison-table    a table, not a row — likely a different answer entirely
marketing/feature-split       rows, not cards; check before assuming
interactive/carousel          already a slider — make sure the two do not fight
layout/grid, layout/columns   user-composed; a prop, not a default
```

**A block that should not have it is a finding, not an omission.** Record the reason in the same pass —
"a logo mark is 40 px tall and two columns of them are readable at 320 px, so a swipe hides content
for no gain" is a decision; silence is not.

## More options, and the bar for them

The owner's words: *больше выбора, который работает на 100% без багов и артефактов*. So:

1. **Every option ships with the test that proves it**, in both the component and the markup producer.
   The two share one style function — keep it that way, or the export drifts from the preview.
2. **Every combination works.** `stat-grid` found this: a slider on a drawn plate must not bleed, or
   the rounded border is dragged off both edges. Enumerate the combinations, check each, and use a
   compound variant rather than shipping a pair that looks broken.
3. **Every focusable thing draws a focus ring**, and every scrolling region takes exactly one tab stop.
   The per-category a11y suite catches both; do not weaken the test to fit the block.
4. **No option that only sometimes works.** If an arrangement is wrong in a state, either make it right
   in that state or do not offer it there.

## Verification

```bash
pnpm --filter @motion-studio/blocks test
pnpm --filter @motion-studio/blocks typecheck
pnpm lint
```

Then in the studio, at the `base` artboard, for every block touched:

- [ ] Insert it, switch `On narrow` both ways, and look at both
- [ ] The track reaches the band's edges, or deliberately does not, and the reason is written down
- [ ] Tab reaches the track once and the ring is visible
- [ ] Switch to `xl` — the wide arrangement is unchanged
- [ ] Export the page and diff the emitted classes against what the studio drew

Report the combinations you enumerated and which ones needed a compound variant.
