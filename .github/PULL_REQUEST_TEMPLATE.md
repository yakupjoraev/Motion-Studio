## What

One paragraph.

## Why

Link the issue or the doc section.

## Verification

Run them and paste what they printed. `CONTRIBUTING.md` § Pull request checklist: a claim without a
run is not evidence.

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
