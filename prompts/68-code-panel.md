# 68 — The code panel

**Milestone** M15 · **Depends on** 64 · **Commit** `feat(web): show the selected block's code beside the canvas`

## Read first

- `docs/EXPORT_ENGINE.md` — the IR and the printers, which already do the work
- `docs/PERFORMANCE.md` — § Studio: the 250 kB first-load budget and what must stay out of it
- `docs/ROADMAP.md` — § The differentiation, and where it is hidden
- `apps/web/src/components/studio/export/` — the dialog this panel takes its generator from

## Goal

Everything that makes this product not a page builder currently lives behind a dialog nobody is told
to open. A visitor sees blocks, a canvas and an inspector — the same three things every builder has —
and concludes it is a cheaper version of one.

Put the code beside the canvas. Select a block, see its React. Change a prop, watch the line change.

## The owner's condition

**Collapsible, and closed is a first-class state.**

> можно конечно сделать панель кода рядом с канвасом, чтобы этот панель можно открывать и закрывать —
> юзеру не всегда нужно видеть, некоторым нужно только итоговый результат

So: the panel remembers whether it was open, opens on a shortcut, and a person composing a page never
has to look at it. The point is that it takes one click to see the difference, not that code is always
on screen.

## What it shows

- The **selected block's** generated component, not the whole document. A document-wide view is the
  export dialog and it already exists.
- Nothing selected: the document's root, or an empty state that says what selecting one will do.
- The change a prop makes, when it makes it. If highlighting the changed line is cheap, do it; if it
  costs a diff on every keystroke, do not.

## Where the care is needed

- **The budget.** Prettier, the printers and the highlighter are the heaviest modules in the app and
  `PERFORMANCE.md` keeps them out of the studio's first load. The panel is dynamically imported, and
  a studio whose panel has never been opened must not have paid for it. Measure with `size-limit`
  before and after and report both numbers.
- **Generation is not free.** Do not regenerate on every keystroke of a text prop. Generate on commit,
  the same moment the history takes an entry, and coalesce.
- **It is a view, not an editor.** Typing into the panel is a much larger feature — a parser, a mapping
  back to props, and a conflict model. Read-only, with a copy button, is this prompt.
- **The panel is chrome.** The three focus scopes `F2` walks are canvas, left panel, inspector; adding
  a region means the keyboard map has to account for it — `SHORTCUTS.md`.

## Deliverables

```
apps/web/src/components/studio/code-panel/   the panel, dynamically imported
apps/web/src/store/                          its open state, persisted like the other panel widths
docs/UI_GUIDELINES.md                        the panel in the studio layout section
docs/SHORTCUTS.md                            the shortcut that toggles it
e2e/flows/read-the-code.spec.ts              select a block, open the panel, change a prop, see it change
```

## Verification

```bash
pnpm lint && pnpm typecheck && pnpm test
pnpm --filter web size-limit
pnpm --filter e2e exec playwright test flows/read-the-code --project=chrome
```

- [ ] First-load JS unchanged with the panel closed — report the number both ways
- [ ] Open it, select three different blocks, and read what it shows for each
- [ ] Change a prop and watch the code change without a visible stall
- [ ] Close it, reload, and it is still closed
- [ ] `F2` still walks the regions in a defined order with the panel open
