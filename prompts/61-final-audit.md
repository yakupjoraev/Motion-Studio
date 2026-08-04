# 61 — Final audit

**Milestone** M14 · **Depends on** 60 · **Commit** `chore: address final audit findings`

## Read first

- `docs/PRODUCT.md` — § Acceptance criteria (v1.0). This prompt verifies every line of it.
- `docs/ENGINEERING_CONTRACT.md` — § Non-negotiables. Verify every one.
- `docs/ROADMAP.md` — § If time runs short (what was cut, and is it documented?)

## Goal

The pass before release. Verify every claim the project makes, find what five months of work
accumulated, and fix or document it.

The output is a report, not a feature. An honest report with fifteen findings is worth more than a clean
one with none, because the findings get fixed and the clean report gets disbelieved.

## Deliverables

```
AUDIT.md                      the full findings report
docs/*                        corrected where they diverge from the implementation
+ fixes for everything found
```

## The audit

Work through each section, and report findings for each — including "nothing found", explicitly, with
what you checked.

### 1. Acceptance criteria

Every line of `PRODUCT.md` § Acceptance criteria (v1.0), verified:

- [ ] All four flows pass as Playwright specs on Chromium, Firefox, WebKit
- [ ] 62 blocks, 40+ presets, 13 effects registered and documented
- [ ] All four export targets produce compiling output, locked by golden files
- [ ] Canvas 60 fps with 200 nodes; studio initial JS ≤ 250 kB gzip
- [ ] Lighthouse ≥ 95 × 4 on `/`, `/blocks`, `/docs`
- [ ] Zero axe violations on every surface; full keyboard operation verified
- [ ] Unit coverage ≥ 80 % on `editor`, `codegen`, `schema`, `motion`
- [ ] `docs/` complete and consistent with the implementation
- [ ] CI enforces every gate above

Any that does not pass: fix it, or move it to a documented limitation with a reason. Do not tick a box
that is not true.

### 2. Contract non-negotiables

```bash
rg ':\s*any\b' --type ts packages apps            # expect zero
rg '@ts-ignore|as unknown as' --type ts           # expect zero
rg 'outline:\s*none' --type css --type ts         # each must have a replacement
find packages apps -name '*.ts*' -exec wc -l {} + | awk '$1 > 300'   # expect empty
rg '@motion-studio/[a-z-]+/(?!package)' --type ts  # deep imports; expect zero
rg 'useEditorStore\(\)' --type tsx                 # selector-less subscriptions; expect zero
rg 'console\.log' --type ts packages apps          # expect zero
rg 'TODO|FIXME|XXX|HACK' --type ts                 # each needs an issue link or removal
```

Report the count for each. Any non-zero result is a finding.

### 3. Documentation consistency

The most likely place for divergence. For each of the 26 docs, spot-check its central claims against the
code:

- Does `ARCHITECTURE.md`'s dependency graph match the actual `package.json` files?
- Does `STATE_MANAGEMENT.md`'s store shape match `store.types.ts`?
- Does `COMPONENT_LIBRARY.md`'s catalogue list the blocks that actually exist? Count them.
- Does `ANIMATION_SYSTEM.md`'s preset table list the presets that exist? Count them.
- Does `SHORTCUTS.md` match the registry? Diff them programmatically.
- Do `PERFORMANCE.md`'s budgets match `.size-limit.js` and `lighthouserc.js`?
- Does `TESTING.md`'s coverage contract match the per-package thresholds?
- Do the file paths named in every doc actually exist?

Write the shortcut/registry diff and the block/preset count checks as **tests**, so they cannot diverge
again.

### 4. Repository hygiene

```bash
git log --format='%s%n%b' | rg -i 'claude|copilot|ai-assisted|generated with|co-authored-by|🤖'
```

**Expect zero results.** The history must read as the author's work. If anything appears, it needs a
history rewrite before the repo goes public — report it as blocking.

Also:
```bash
git log --all --format='%an %ae' | sort -u        # one author, correct email
rg -i 'sk-|ghp_|AKIA|BEGIN.*PRIVATE KEY' .        # zero
rg 'C:\\\\Users|/Users/|/home/' --type ts --type json --type md   # zero local paths
git count-objects -vH                              # repo size; report it
```

Check: `.gitignore` covers everything; no build output committed; no `node_modules`; no `.env`; no
large binaries beyond the demo GIFs.

### 5. Dependency audit

```bash
pnpm audit
pnpm licenses list
pnpm dedupe --check
```

- Report any vulnerability with its severity and whether it is reachable
- Every license MIT/ISC/BSD/Apache-2.0 compatible — flag anything else
- Every dependency in `package.json` is actually used (`depcheck` or by hand)
- Every dependency justified in `TECH_STACK.md` — anything not listed is a finding

### 6. Dead code

```bash
pnpm exec knip        # or ts-prune
```

Unused exports, unreferenced files, unused types. Five months of building always leaves some. Delete
what is genuinely dead; report the count.

### 7. Cross-browser

The E2E suite covers Chromium, Firefox, and WebKit. Manually verify what automation misses:

- Safari: `backdrop-filter` performance, `oklch` rendering, scroll behaviour, `clip-path` edge cases
- Firefox: `IntersectionObserver` thresholds, `pointerEvents` capture, `scroll-snap`
- Both: the studio at 1280 px, the canvas gestures, the export dialog

Report anything that differs. Safari's `backdrop-filter` handling in particular is worth real attention
given how much glass is in the design system.

### 8. Cold read

Read the codebase as a stranger would. Pick three packages you did not write most recently and read them
top to bottom. Report:
- Anything you could not understand without asking
- Anything that contradicts a doc
- Anything you would flag in review

### 9. Cut features

`ROADMAP.md` § If time runs short lists what could be cut. For anything actually cut: is it documented
in the README as not present, rather than silently missing? A README claiming a feature that was cut is
the worst finding in this audit.

## `AUDIT.md`

Structure:

```markdown
# v1.0 Release Audit — <date>

## Summary
N findings: X fixed, Y documented as limitations, Z deferred with issues.

## Acceptance criteria
Every line, with pass/fail and evidence.

## Findings
### F1 — <title>  [severity: blocking | major | minor]
What, where, impact, resolution.

## Verified clean
What was checked and found correct — with the command or method used.

## Known limitations
What ships imperfect, why, and the roadmap reference.

## Metrics
The final numbers table.
```

## Verify

```bash
pnpm lint && pnpm typecheck && pnpm test:coverage && pnpm build
pnpm test:e2e && pnpm test:e2e:a11y && pnpm test:e2e:perf
pnpm test:codegen && pnpm test:compile
pnpm size-limit
docker compose up --build
```

Everything green. Every grep reported. Every acceptance criterion evidenced.

## Done when

- [ ] Every acceptance criterion verified with evidence, or moved to a documented limitation
- [ ] Every contract non-negotiable verified by grep; all counts reported
- [ ] Doc/code divergences found and fixed; the shortcut and count checks turned into tests
- [ ] Git history clean of tooling and assistant attribution — verified by grep, zero results
- [ ] No secrets, no local paths, no committed build output
- [ ] Dependency audit clean; every dependency used and justified
- [ ] Dead code removed; count reported
- [ ] Cross-browser manual pass performed; differences reported
- [ ] Cold read of three packages performed; findings reported
- [ ] Cut features documented in the README, not silently missing
- [ ] `AUDIT.md` written with real findings
