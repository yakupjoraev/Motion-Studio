# 05 — CI and architecture gates

**Milestone** M0 · **Depends on** 04 · **Commit** `ci: add pipeline with dependency and registry gates`

## Read first

- `docs/DEVOPS.md` — § CI, § Custom gates, § Git hooks
- `docs/ARCHITECTURE.md` — § Dependency graph (the rules the gate enforces)
- `docs/TESTING.md` — § CI ordering

## Goal

CI that enforces the architecture, not just the tests. Anyone — including a future session — who
breaks a package boundary finds out in 30 seconds instead of three weeks.

## Deliverables

```
.github/
├── actions/setup/action.yml       composite: checkout deps, pnpm, node, install
├── workflows/ci.yml               quality, graph, build jobs (e2e/a11y/lighthouse added later)
├── ISSUE_TEMPLATE/
│   ├── bug.yml
│   ├── block-request.yml
│   └── preset-request.yml
├── PULL_REQUEST_TEMPLATE.md       the checklist from CONTRIBUTING.md
└── dependabot.yml                 grouped, per docs/DEVOPS.md
scripts/
├── check-deps.mjs                 dependency graph gate
├── check-secrets.mjs              staged-content scan
└── check-commit-msg.mjs           conventional commits + attribution ban
lefthook.yml
```

## Constraints

### `scripts/check-deps.mjs`

Four assertions, each with a clear failure message naming the offending file and line:

1. **Acyclic.** Build the graph from every package's `dependencies` + `devDependencies` on
   `@motion-studio/*`. Report the cycle path if one exists.
2. **Direction rules.** Read `docs/ARCHITECTURE.md`'s rules as data:
   ```js
   const FORBIDDEN = [
     ['@motion-studio/editor', '@motion-studio/blocks'],
     ['@motion-studio/blocks', '@motion-studio/editor'],
     ['@motion-studio/canvas', '@motion-studio/editor'],
     ['@motion-studio/canvas', '@motion-studio/blocks'],
     ['@motion-studio/codegen', '@motion-studio/blocks'],
   ]
   ```
   Plus: nothing may depend on `web` or `storybook`.
3. **No deep imports.** Regex over all source: `@motion-studio/[a-z-]+/(?!package\.json)`.
4. **Declared imports only.** Every `@motion-studio/*` import in a package's source appears in that
   package's `package.json`. Catches phantom dependencies that only work because pnpm hoisted
   something.

Exit code 1 on any failure. Under 150 lines total — this is a script, not a framework.

### `scripts/check-secrets.mjs`

Scans given files for: `sk-`/`pk_`/`ghp_`/`AKIA` prefixes, `PRIVATE KEY`, `.env` assignment
patterns, and absolute local paths (`C:\Users\`, `/Users/`, `/home/`). Reports the file and line.

### `scripts/check-commit-msg.mjs`

Validates Conventional Commits: `type(scope): subject`, allowed types and scopes from
`CONTRIBUTING.md`, subject lowercase, no trailing period, ≤ 72 chars.

Also rejects messages containing assistant or tooling attribution patterns
(`co-authored-by:.*claude`, `generated with`, `ai-assisted`, `🤖`). Case-insensitive.

### `ci.yml`

Three jobs now — `quality`, `graph`, `build` — exactly as in `docs/DEVOPS.md`. The `e2e`, `a11y`,
`compile-exports`, and `lighthouse` jobs are added by the prompts that create what they test;
leave placeholder comments naming which prompt adds each.

`concurrency` with `cancel-in-progress`. Turbo remote cache env vars wired but tolerant of missing
secrets (a fork's PR must still run).

### `lefthook.yml`

Per `docs/DEVOPS.md` § Git hooks. Pre-commit is format + secrets only — fast. Pre-push adds
typecheck and unit tests. Never the full suite in a hook.

## Verify

```bash
node scripts/check-deps.mjs       # passes on the current clean graph
```

Then prove each gate works, and revert each after:

1. Add `"@motion-studio/blocks": "workspace:*"` to `packages/editor/package.json` →
   `check-deps` fails with a direction-rule message
2. Add `import x from '@motion-studio/utils/src/cn/cn'` somewhere → fails with a deep-import message
3. Create an artificial cycle between two placeholder packages → fails, reporting the path
4. `echo 'AKIAIOSFODNN7EXAMPLE' > /tmp/t && node scripts/check-secrets.mjs /tmp/t` → fails
5. `node scripts/check-commit-msg.mjs "added stuff"` → fails
6. `node scripts/check-commit-msg.mjs "feat(ui): add button"` → passes
7. `node scripts/check-commit-msg.mjs "feat: x

   Co-authored-by: Claude"` → fails

Report the result of all seven.

Then push the branch and confirm CI runs green.

## Done when

- [ ] `check-deps` catches all four violation classes; all four demonstrated and reverted
- [ ] `check-secrets` and `check-commit-msg` demonstrated
- [ ] `ci.yml` green on a real push, all three jobs
- [ ] Lefthook installed; pre-commit completes in under 5 seconds
- [ ] Issue templates, PR template, Dependabot config in place
- [ ] Placeholder comments in `ci.yml` name the prompts that add the remaining jobs
