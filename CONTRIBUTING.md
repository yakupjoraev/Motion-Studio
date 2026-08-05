# Contributing to Motion Studio

Thanks for looking. This project keeps a deliberately high bar — the code is the portfolio.

## Setup

```bash
git clone https://github.com/<owner>/motion-studio.git
cd motion-studio
pnpm install
pnpm dev
```

Requirements: Node `>=20.11`, pnpm `>=9`. Use `corepack enable` so the pinned pnpm version is used.

## Workflow

1. **Read the relevant doc first.** Every subsystem is specified in `docs/`. If your change
   contradicts a document, change the document in the same PR and say why.
2. Branch from `main`: `feat/inspector-gradient-editor`, `fix/canvas-zoom-drift`,
   `docs/export-engine`, `chore/ci-cache`.
3. Write the test first when there is behaviour to describe. See `docs/TESTING.md`.
4. Keep the PR focused. One subsystem per PR.
5. CI must be green: lint, typecheck, unit, e2e, build, Lighthouse budget.

## Commit convention

[Conventional Commits](https://www.conventionalcommits.org/), imperative mood, English,
lowercase subject, no trailing period.

```
feat(canvas): add alignment guides with 4px snap threshold
fix(editor): coalesce slider drags into a single history entry
perf(inspector): move colour scrub to CSS variables
refactor(codegen): split react printer from jsx serialiser
docs(state): document slice boundaries
test(dnd): cover keyboard reorder across containers
chore(ci): cache turbo remote artifacts
```

Allowed types: `feat`, `fix`, `perf`, `refactor`, `docs`, `test`, `build`, `ci`, `chore`, `style`.

Scopes match package names: `web`, `storybook`, `ui`, `blocks`, `editor`, `canvas`, `dnd`, `codegen`,
`schema`, `motion`, `theme`, `tokens`, `icons`, `hooks`, `utils`, `config`, plus `e2e`, `ci` and `docs`
for the cross-cutting work that belongs to no package.

`scripts/check-commit-msg.mjs` reads this list, so a scope that is not here is rejected. Every workspace
package must appear: `icons`, `config` and `storybook` were missing from the original list while the rule
above said scopes match package names, and the gate caught it on the first commit that needed `icons`.

Commit messages describe the change and nothing else — no tooling attribution, no assistant
mentions, no "as requested".

## Decisions

Read [`docs/ENGINEERING_CONTRACT.md`](docs/ENGINEERING_CONTRACT.md) § 9 before your first PR.

There are three legal ways to resolve a decision: **it is already specified** in `docs/`, **it is
decided by a threshold you stated before measuring**, or **it is escalated to the maintainer**. There
is no fourth. "Seemed better", "was simpler", and "good enough" are not accepted in review, in
comments, or in commit messages — not because they are impolite, but because a reader cannot check
them, and unfalsifiable reasoning is how a codebase becomes unmaintainable.

Anything not already answered by a document gets an entry in
[`docs/DECISIONS.md`](docs/DECISIONS.md), written **before** the code that depends on it, with the
criterion and the measurement.

Cutting scope is the maintainer's decision. If you cannot finish, finish what you can and say
precisely what remains.

## Code rules

Hard requirements, enforced by lint or review:

- TypeScript strict. No `any`, no `@ts-ignore`, no unchecked casts.
- No file over 300 lines.
- No cross-package deep imports. Import from the package root only.
- Components subscribe to state with selectors, never the whole store.
- Every mutation goes through a command in `packages/editor`.
- `prefers-reduced-motion` handled for anything animated.
- Every interactive element is keyboard-reachable and labelled.
- New dependency requires a one-line justification in the PR body.

Full list: [`docs/CODE_STANDARDS.md`](docs/CODE_STANDARDS.md).

## Design references and licences

The visual bar is set by [impeccable.style](https://impeccable.style) and the other references in
[`docs/DESIGN_REFERENCES.md`](docs/DESIGN_REFERENCES.md). **Read that document before contributing
anything visual.** It applies to every surface — landing, gallery, blocks, effects, and the studio
chrome — with loudness varying by surface and the standard of finish never varying.

Two hard rules:

1. **Never paste code from a reference.** Study the technique, write it down in the block's doc
   comment, then implement it against our schema, tokens, motion model and reduced-motion policy. A
   verbatim paste fails review on three counts: it bypasses the registry contract, it hard-codes an
   animation, and it may carry licence obligations nobody verified.
2. **Verify the licence before adapting anything**, and record what you found in
   `packages/blocks/LICENSES.md` with the date. If the terms are unclear, absent, or restrictive,
   build from technique instead. CSS techniques are not copyrightable; specific source is.

## Adding a block to the registry

1. `packages/blocks/src/<category>/<block-name>/` following the file layout in
   [`docs/COMPONENT_LIBRARY.md`](docs/COMPONENT_LIBRARY.md).
2. Define the Zod `propsSchema` — the inspector is generated from it, so control metadata
   belongs there.
3. Provide `defaults`, `previewProps`, and a `codegen` descriptor.
4. Add a story and a smoke test.
5. Register in the category index. Never edit the root registry by hand.

## Adding a motion preset

1. `packages/motion/src/presets/<preset>.ts`, typed as `MotionPreset`.
2. Reuse the shared easing/spring vocabulary from `packages/motion/src/curves`.
3. Provide a reduced-motion fallback. A preset without one fails review.
4. Add it to the preset catalogue table in [`docs/ANIMATION_SYSTEM.md`](docs/ANIMATION_SYSTEM.md).

## Pull request checklist

```markdown
## What
One paragraph.

## Why
Link the issue or the doc section.

## Verification
- [ ] `pnpm lint` clean
- [ ] `pnpm typecheck` clean
- [ ] `pnpm test` — N passing
- [ ] `pnpm test:e2e` — N passing
- [ ] `pnpm build` clean
- [ ] Checked keyboard path
- [ ] Checked reduced motion
- [ ] Checked light + dark
- [ ] No perf budget regression

## New dependencies
None. (Or: name — one line on why nothing existing works.)

## Decisions
- ADR-NNN — <question> — resolved by <specification | measurement of X | maintainer>
- (Or: "None. Every choice was already specified in <documents>.")
```

## Reporting bugs

Include: what you did, what happened, what you expected, browser + OS, and a `.motion` file or
minimal repro if the canvas is involved. Console output helps more than a description of it.
