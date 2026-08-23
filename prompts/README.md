# Build prompts

65 prompts, one subsystem each, in dependency order. This is the execution plan for the
specification in [`../docs/`](../docs/).

`45a`–`45c` were added after prompt 45 ran: the export dialog made it demonstrable that a block
exports as an empty root element, and closing that needs three subsystems rather than an insertion
into an existing prompt. ADR-249 is the design; the numbering keeps them where they belong in the
order rather than at the end.

## How to use them

**One prompt per session.** Open a fresh Claude Code session, paste the prompt, let it finish, run
the verification, commit. Then start the next session.

The reason is context. A single giant prompt runs out of room, starts inventing, and produces
subsystems that contradict each other. A prompt that says "read `docs/CANVAS.md`, then build the
snapping engine, then prove it works" produces exactly one correct subsystem — and the next session
starts clean.

```
Session N:
  1. Paste prompts/NN-name.md
  2. Wait for it to finish
  3. Run the verification block yourself and read the output
  4. Fix or accept
  5. git commit -m "<the conventional commit given in the prompt>"
  6. /clear
```

**Do not skip the verification step.** The prompt tells the model what to run; you confirm it
actually ran and actually passed. That habit is the difference between a project that works and a
project that reports that it works.

## Before the first session

[`../docs/ENGINEERING_CONTRACT.md`](../docs/ENGINEERING_CONTRACT.md) is the standing contract. Read
it once yourself so you can tell when output violates it.

Then read [`00-GLOBAL_RULES.md`](00-GLOBAL_RULES.md). It is the preamble every prompt assumes.

## Order

| Phase | Prompts | Milestone | Output |
| --- | --- | --- | --- |
| Foundation | 01–05 | M0 | Monorepo, tooling, utils, tokens, CI |
| Design system | 06–11 | M1 | Theme engine, icons, `ui` primitives, Storybook, shell |
| Editor core | 12–16 | M2 | Schema, document model, commands, history, selection |
| Canvas | 17–21 | M3 | Coordinates, viewport, hit testing, snapping, overlays |
| Blocks wave 1 | 22–26 | M4 | Registry, generated inspector, 22 blocks |
| Drag and drop | 27–29 | M5 | dnd layer, drop resolution, layers tree |
| Motion | 30–34 | M6 | Curves, scheduler, 30+ presets, 13 effects, motion panel |
| Responsive + theme | 35–37 | M7 | Breakpoints, override UI, theme builder |
| Blocks wave 2 | 38–41 | M8 | 40 more blocks |
| Export | 42–46, 45a–45c | M9 | IR, four printers, dialog, block markup, golden + compile tests |
| Playground | 47–49 | M10 | Sandboxes, CSS validation, vertex/bezier editors |
| Persistence | 50 | M11 | IndexedDB, autosave, import, templates |
| Public surfaces | 51–53 | M12 | Landing, gallery, docs site |
| Hardening | 54–58 | M13 | Perf, a11y, tests, visual regression, error boundaries |
| Launch | 59–62 | M14 | README, Docker, CI/CD, release |

## Prompt anatomy

Every prompt has the same six sections:

```markdown
# NN — Title

**Milestone** · **Depends on** · **Commit**

## Read first
Which docs, and which sections. Non-negotiable.

## Goal
One paragraph. What exists at the end that did not exist before.

## Deliverables
Explicit file list with what goes in each.

## Constraints
The specific rules this subsystem gets wrong if unstated.

## Verify
Commands to run and assertions to check. Read the output.

## Done when
A checklist. Every box, or the prompt is not finished.
```

## If a session goes wrong

- **Model contradicts a doc** → the doc wins. Point at the section, ask for a redo.
- **Model wants to change a doc** → sometimes right. Make it argue the case, decide, and update the
  doc in its own commit before continuing.
- **Model runs out of context mid-prompt** → the prompt is too big. Split it at a file boundary and
  note the split in this README.
- **Verification fails** → do not accept it. "I've fixed it" without a re-run is not evidence.
- **Model invents a file not in the deliverables** → ask why. Usually scope creep; occasionally a
  real gap in the plan, in which case update the prompt.

## Adjusting the plan

These prompts are a plan, not scripture. If reality diverges — a package splits, a subsystem turns
out simpler — edit the prompt and note it. A stale plan is worse than no plan.

The ordering, though, is load-bearing. `editor` before `canvas` before `blocks` before `codegen` is
not arbitrary: each depends on the previous one's types existing. Reordering means fighting the
compiler for no benefit.
