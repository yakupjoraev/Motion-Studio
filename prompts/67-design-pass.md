# 67 — The visual pass, through the design skills

**Milestone** M15 · **Depends on** 66 · **Commit** `refactor(web): take the landing and the chrome through a design pass`

## Read first

- `docs/DESIGN_REFERENCES.md` — the whole document, especially the note on impeccable.style
- `docs/UI_GUIDELINES.md` — § Character, § Control rows, § Canvas presentation
- `docs/DESIGN_SYSTEM.md` — the tokens are the source of truth; this prompt spends them, it does not
  invent new ones
- `docs/ENGINEERING_CONTRACT.md` — § 9, *Applies to visual work too*

## Goal

`DESIGN_REFERENCES.md` names impeccable.style as **the primary reference for the entire product**. The
landing and the studio chrome were built against it by eye. The owner's instruction is that the design
skills are not optional for visual work, and they were not used.

Run the pass properly, and report a verdict per surface rather than "looks fine" — which § 9 names as
the banned fourth way wearing a different costume.

## How

Load the skills before touching a file: `impeccable` for auditing and polishing a surface that exists,
`design-taste-frontend` for one being reshaped, `ui-ux-pro-max` for the UX rules to check against.
Announce which one and why.

## Surfaces, in order

```
1. /                    the landing — the first thing anyone sees
2. /studio chrome       panels, tabs, inspector rows, the status bar
3. /blocks              the gallery, including the thumbnails that read as empty plates
4. /docs                the reading surface
5. /playground          the smallest, and the one nobody has looked at twice
```

## Known problems to resolve in this pass

Found while working in the product, not by reading it:

- **Block thumbnails are dark on dark** and several read as empty rectangles in the palette. Prompt 57
  recorded seven container blocks rendering blank and three showing "No image yet".
- **`input-field` is shown in its error state** in the catalogue — a bad `previewProps` choice.
- **`particles` is nearly invisible in light mode**; `bento-grid` cells barely separate from the page in
  either mode.
- **`testimonial-marquee` is clipped** by the bottom of its thumbnail frame.

## The bar

- Compare against the reference **side by side**, and say what the difference is in words before
  changing anything.
- Tokens do the work. A hard-coded colour or a one-off shadow in a component is the defect
  `DESIGN_SYSTEM.md` exists to prevent.
- Contrast is checked, not assumed, in both modes — the theme panel already counts contrast notices.
- `prefers-reduced-motion` is honoured by every animation added or changed.

## Verification

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build
pnpm --filter web size-limit
gh workflow run visual.yml --ref main -f update-baselines=true   # baselines move in this prompt
```

- [ ] A verdict per surface, against the reference, in the session report
- [ ] Lighthouse ≥ 95 on all four categories for the landing, mobile
- [ ] Visual baselines regenerated in CI and reviewed before they are committed
- [ ] Both colour modes checked on every surface touched
