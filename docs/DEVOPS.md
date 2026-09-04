---
group: Quality
order: 4
summary: CI pipeline, Docker, releases, deploy, quality gates
---

# DEVOPS

## Repository

```
.github/
├── workflows/
│   ├── ci.yml               PR + push to main
│   ├── lighthouse.yml       perf + a11y budgets
│   ├── visual.yml           visual regression, main only
│   ├── export-smoke.yml     weekly: scaffold, install, build the exported output
│   ├── release.yml          tags → changelog + GitHub release
│   └── deploy.yml           main → production
├── ISSUE_TEMPLATE/
│   ├── bug.yml
│   ├── block-request.yml
│   └── preset-request.yml
├── PULL_REQUEST_TEMPLATE.md
└── dependabot.yml
```

## CI

```yaml
# .github/workflows/ci.yml
name: CI
on:
  pull_request:
  push:
    branches: [main]

concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

env:
  TURBO_TOKEN: ${{ secrets.TURBO_TOKEN }}
  TURBO_TEAM: ${{ vars.TURBO_TEAM }}

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version-file: .nvmrc
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm typecheck
      - run: pnpm test:coverage
      - run: pnpm test:codegen
      - uses: codecov/codecov-action@v4

  graph:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: ./.github/actions/setup
      - run: pnpm check:deps        # cycle detection + boundary rules
      - run: pnpm check:registry    # definitions ↔ components ↔ thumbnails parity

  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: ./.github/actions/setup
      - run: pnpm build
      - run: pnpm size-limit
      - run: pnpm analyze --json > bundle.json
      - uses: actions/upload-artifact@v4
        with: { name: bundle-analysis, path: bundle.json }

  compile-exports:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: ./.github/actions/setup
      - run: pnpm test:compile      # tsc over every golden export

  # Nine jobs: one per engine, cut in three. The accessibility specs are in here rather than in a job
  # of their own — `playwright.config.ts` matches them for all three engines, and a second job would
  # run the same specs a second time. ADR-336 has why the split is by engine and not by test count;
  # ADR-338 has why each engine is cut in three, measured rather than guessed.
  e2e:
    runs-on: ubuntu-latest
    strategy:
      fail-fast: false
      matrix:
        project: [chrome, firefox, webkit]
        shard: [1, 2, 3]
    steps:
      - uses: actions/checkout@v7
      - uses: ./.github/actions/setup
      - run: pnpm --filter e2e exec playwright install --with-deps ${{ matrix.project }}
      - run: pnpm build
      - run: pnpm --filter e2e exec playwright test flows editor export playground a11y --project=${{ matrix.project }} --shard=${{ matrix.shard }}/3 --workers=2
      - uses: actions/upload-artifact@v5
        if: failure()
        with:
          name: playwright-${{ matrix.project }}-${{ matrix.shard }}
          path: e2e/test-results
          include-hidden-files: true
```

The performance specs are not in it. They need `MS_INSTRUMENT=1` and they read frame timings, which
a shared runner does not hold still — ADR-332 measured a 27 % swing in `benchmarkIndex` inside one
Lighthouse run. They stay a local gate, run through `pnpm test:e2e:perf`.

### Required checks on `main`

`quality`, `graph`, `build`, `compile-exports`, `e2e` (all six), `lighthouse`.
Branch protection: no direct pushes, no force-push, linear history, up-to-date before merge.

### Custom gates

Three scripts that exist because the rules in `docs/ARCHITECTURE.md` and `docs/README.md` are
otherwise unenforceable:

**`pnpm check:deps`**
- Builds the workspace dependency graph and asserts it is acyclic, reporting the cycle path.
- Asserts the direction rules: `editor` does not import `blocks`, `blocks` does not import
  `editor`, nothing imports `apps/*`.
- Asserts no deep imports (`@motion-studio/x/src/...`).
- Asserts every internal import is declared in the importing package's own `package.json`, which is
  what catches a phantom dependency that only resolves because pnpm hoisted something.

The deep-import assertion is **exports-aware**, not a regex on the specifier. ADR-005 puts the ban in
the `exports` map, so the question is whether the target declares the subpath, not whether a subpath
exists: `@motion-studio/config/vitest/node` is legal because `config` exports `./vitest/*`, and every
package's `vitest.config.ts` uses it. `@motion-studio/ui/src/button/button` is not, because nothing
exports it. A specifier-shape regex would fail the repository's own clean graph.

The package list comes from `pnpm-workspace.yaml`, so adding a workspace root cannot silently put a
package outside the gate.

**`pnpm check:registry`**
- `blockRegistry` keys === `renderRegistry` keys.
- Every definition has a thumbnail at the expected path and size.
- Every `defaultMotion` preset id exists.
- Every template in `public/templates/` parses against the current schema.

**`pnpm check:docs-index`**
- Regenerates `docs/README.md`'s index tables from every document's frontmatter and fails when the
  committed file differs, naming `pnpm generate:docs-index` as the fix.
- Fails when a document has no frontmatter block, because such a document is absent from both the
  index and the documentation site's nav and nothing else would say so.
- Fails when a document claims a group the index does not have.

The nav on `/docs` reads the same frontmatter, so the index and the nav cannot drift from each other
— prompt 53 decided the source, and this is what holds it.

Small scripts — one file, no framework — that prevent the specific ways a monorepo rots.

## Turborepo

```jsonc
// turbo.json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local", "tsconfig.json"],
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**", "storybook-static/**"]
    },
    "lint":      { "dependsOn": ["^build"] },
    "typecheck": { "dependsOn": ["^build"], "outputs": ["*.tsbuildinfo"] },
    "test":      { "dependsOn": ["^build"], "outputs": ["coverage/**"] },
    "test:e2e":  { "dependsOn": ["build"], "cache": false },
    "dev":       { "cache": false, "persistent": true }
  }
}
```

Remote caching via Vercel. A cached PR pipeline finishes in ~2 minutes; a cold one in ~8.

## Docker

Multi-stage, standalone Next output, non-root.

```dockerfile
# syntax=docker/dockerfile:1.7
FROM node:22-alpine AS base
RUN corepack enable
WORKDIR /app

FROM base AS deps
# The manifests only, so a source change does not reinstall. `--filter` prunes the graph to what the
# app needs: the end-to-end package pulls three browsers, which no image should carry.
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/web/package.json apps/web/
COPY packages packages
RUN --mount=type=cache,id=pnpm,target=/pnpm/store     pnpm install --frozen-lockfile --filter web...

FROM base AS builder
COPY --from=deps /app ./
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm build --filter=web

# `--profile dev` only, and its own install: the filter above prunes the workshop workspace away.
FROM base AS storybook
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/storybook/package.json apps/storybook/
COPY packages packages
RUN --mount=type=cache,id=pnpm,target=/pnpm/store     pnpm install --frozen-lockfile --filter workshop... --ignore-scripts
COPY . .
EXPOSE 6006

FROM node:22-alpine AS runner
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public
USER nextjs
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s   CMD wget -qO- http://localhost:3000/api/health || exit 1
CMD ["node", "apps/web/server.js"]
```

```yaml
# compose.yaml
services:
  web:
    build: { context: ., target: runner }
    ports: ["3000:3000"]
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:3000/api/health"]
      interval: 30s
  storybook:
    build: { context: ., target: storybook }
    command: pnpm dev:storybook
    ports: ["6006:6006"]
    profiles: [dev]
```

`docker compose up --build` gives a running app. That is the whole point — a reader can run the
project without installing a toolchain, and `docker compose --profile dev up` adds Storybook.

Image budget: **under 260 MB**, checked in CI so it does not drift, with the breakdown printed beside
the number on every run. ADR-344 has the measurement that replaced the original 180 MB: the base
image and this application's own server chunks are 188 MB before a single dependency is counted, and
two rounds of removal — a slimmer runner stage, then excluding three traced packages the server never
executes — took the image from 274 MB to 248 MB rather than to 180.

Three details in the file above are load-bearing and were each wrong in an earlier version of this
document:

- **`node:22`, not `node:20`.** `engines.node` is `>=22.18` (ADR-330 raised it: `size-limit` 13
  requires it), so a Node 20 base fails at `pnpm install` rather than at run time.
- **`COPY packages packages`, not `COPY packages/*/package.json packages/`.** Docker's `COPY` flattens
  a glob into the destination directory, so the second form copies fourteen manifests over each other
  and leaves one file named `packages`. Copying the directory keeps the workspace shape pnpm needs to
  resolve `workspace:*`.
- **`--filter web...`** prunes the install to the app and what it depends on. Without it the image
  build installs `e2e`, which downloads three browsers.
- **`COPY --from=deps /app ./`, not just `/app/node_modules`.** pnpm puts a `node_modules` beside
  every workspace package; with only the root one, `pnpm build --filter=web` stops at "Local
  package.json exists, but node_modules missing".
- **Storybook builds from its own stage, not from `builder`.** `--filter web...` prunes the workshop
  workspace, so `builder` has no `storybook` binary to run. ADR-345.
- **No `--host` on `dev:storybook`.** It is a turbo task, and turbo exits on the unknown flag before
  Storybook ever sees it. Storybook 8.6 already listens on every interface.

**The image serves no test fixtures, and an e2e run must not be pointed at it.** `/fixtures/[name]`
reads `e2e/fixtures/documents` from the working tree, and `.dockerignore` leaves `e2e` out on
purpose, so every `?fixture=` name answers 404 in a container. Playwright's config reuses a server
already on the port, which makes the mistake easy to make and hard to read: the three specs that
open a fixture time out waiting for `html[data-fixture]` while everything that builds its document
by clicking passes. Run the suite against `pnpm --filter web start`, as the config intends.

The size the budget refers to is the one CI prints. It is not what `docker image inspect
--format '{{.Size}}'` reports on a machine using Docker Desktop's containerd image store — there the
field is the **compressed** size, roughly a third of it. Locally, read `docker images`, which prints
`CONTENT SIZE` and `DISK USAGE` separately.

`output: 'standalone'` is set in `apps/web/next.config.ts`; without it there is no `server.js` to
run and the runner stage copies nothing.

## Lighthouse CI

```js
// lighthouserc.js
module.exports = {
  ci: {
    collect: {
      url: [
        'http://localhost:3000/',
        'http://localhost:3000/blocks',
        'http://localhost:3000/blocks/aurora-card',
        'http://localhouse:3000/docs/architecture',
      ],
      numberOfRuns: 3,
      settings: { preset: 'desktop' },
    },
    assert: {
      assertions: {
        'categories:performance':   ['error', { minScore: 0.95 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices':['error', { minScore: 0.95 }],
        'categories:seo':           ['error', { minScore: 0.95 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2000 }],
        'cumulative-layout-shift':  ['error', { maxNumericValue: 0.02 }],
        'total-blocking-time':      ['error', { maxNumericValue: 200 }],
      },
    },
    upload: { target: 'temporary-public-storage' },
  },
}
```

Run twice — desktop and mobile presets — with the mobile budgets from
[PERFORMANCE.md](PERFORMANCE.md). Three runs each, median taken, because a single Lighthouse run
on a shared CI runner is not a measurement.

## Export smoke test

Weekly, and on any change to `packages/codegen`, `packages/blocks` or `packages/motion` — those three
decide what the exported page contains:

```yaml
# .github/workflows/export-smoke.yml
- run: pnpm generate:export-fixture --document export-landing --target next --out /tmp/exported
- run: npm install && npm run build && npm start -- --port 3100 &   # in /tmp/exported
- run: npx lighthouse http://localhost:3100 --output=json --output-path=./lh.json
- run: node scripts/assert-lighthouse.mjs ./lh.json --performance 90 --accessibility 95
- run: pnpm test:e2e:export     # axe, reduced motion, section count, a clean console
```

`npm`, not `pnpm`, inside the exported project: most users are on npm and the export must work there.
The document is `export-landing` — the shipped catalogue, sixty nodes, the shape of a page somebody
would ship.

The exported page must itself score ≥ 90 Performance and ≥ 95 Accessibility. If our generator
produces a slow or inaccessible page, the feature is broken regardless of whether it compiles. The
scores it reaches are recorded in `docs/EXPORT_ENGINE.md` § Testing, with the date they were measured.

## Releases

Changesets.

```bash
pnpm changeset          # describe the change, pick bumps
pnpm changeset version  # apply bumps, write CHANGELOG.md
git push --follow-tags
```

`release.yml` on a tag: build, test, publish GitHub release with the changelog section, attach the
Docker image to GHCR, and upload the Storybook static build as an artifact.

Versioning: the app is `apps/web`'s version. Packages are versioned together (fixed mode) — they
are not published to npm in v1, so independent versioning would be ceremony without benefit.

### Before the tag

Two generated artefacts are the ones that rot silently, because nothing fails when they are stale —
a README showing an interface the product no longer has is worse than a README showing none:

```bash
pnpm build && PORT=3000 pnpm --filter web start   # in another shell
pnpm generate:demos      # the four README GIFs, re-recorded against this build
pnpm generate:diagram    # docs/assets/architecture.svg, from the docs page
pnpm stats               # the numbers in the README's Project stats
```

Read the four numbers `stats` prints against the README and correct any that moved. The demo run
fails if a GIF lands over 3 MB, which is the only automatic check these have.

## Deploy

Vercel, `apps/web`, driven by `deploy.yml` rather than by Vercel's own Git integration.

| Environment | Trigger | URL |
| --- | --- | --- |
| Production | Push to `main` | `motion-studio-y3dev.vercel.app` |
| Preview | Every PR | `motion-studio-<hash>-y3dev.vercel.app`, posted as a comment |

No custom domain is registered, so those are the URLs the project serves. Storybook is not hosted
anywhere: `release.yml` uploads its build as a release artifact, and hosting it is a roadmap entry.

- Three secrets and one variable: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`, and
  `VERCEL_ENABLED=true`. Every job is skipped without the variable, which is what a fork's pull
  request sees. **The token has to be a full-account one** — a token scoped to the team carries no
  user context, and the CLI will not start with it (`Error: User not found`, measured on two).
- Two settings live in the project rather than in the repository, because Vercel has no file for
  them: **Root Directory `apps/web`** and **Node.js Version 22.x** — the version the gates run.
  Everything expressible in a file is in `apps/web/vercel.json`, including the install command,
  which passes `--ignore-scripts` for the reason the Dockerfile does. ADR-346 has both stories.
- Build command and output directory are auto-detected: Vercel finds Turbo and runs `turbo run
  build`, which is the build this repository already has. A hand-written command would be a second
  definition of it, free to drift.
- No environment variables required to run. The app has no backend and no secrets — if a build
  ever starts needing a secret, that is an architectural change requiring a decision, not a
  config addition.
- Deployments are public — SSO protection is off, so the preview link in a comment opens for whoever
  is reading the pull request.
- Preview comments post the Lighthouse scores and the bundle delta so a regression is visible in
  the PR without opening a dashboard. Those scores are a deployment's, not the gate's: the gate is
  the `Lighthouse` workflow against a local `next start`, and the two are not comparable. On a
  `vercel.app` host **SEO reads 60 rather than 100**, because Vercel serves every deployment URL
  with `X-Robots-Tag: noindex` and `is-crawlable` is the one audit that fails. Read the comment for
  movement between pushes, not against `PERFORMANCE.md`.

## Git hooks

```yaml
# lefthook.yml
pre-commit:
  parallel: true
  commands:
    format:
      glob: "*.{ts,tsx,mts,mjs,json,md,css}"
      run: pnpm biome check --write --no-errors-on-unmatched {staged_files}
      stage_fixed: true
    secrets:
      run: pnpm check:secrets {staged_files}

pre-push:
  commands:
    typecheck: { run: pnpm typecheck }
    unit:      { run: pnpm test:unit }   # = turbo test; see below

commit-msg:
  commands:
    conventional: { run: pnpm check:commit-msg {1} }
```

The `format` glob covers `.mjs` and `.mts` because the gate scripts themselves are `.mjs`, and Biome
lints them like any other source. Left out, a formatting slip in a gate reaches CI as a `pnpm lint`
failure instead of being fixed and re-staged where it was made.

`check:secrets` is a small script scanning staged content for API-key patterns, `.env` contents,
and absolute local paths. Cheap insurance in a repo that will be public.

The gate scripts print their results on stdout, which is what `console.log` is for in a CLI. Biome's
`noConsole` rule allows only `warn` and `error`, so `scripts/**` carries an override — the same shape
as the overrides for `app/` default exports and config files.

`check:commit-msg` enforces Conventional Commits and rejects messages containing tooling or
assistant attribution — the repository history should read as the work of its author.

Hooks never run a *slow* suite. A pre-commit hook that takes 40 seconds gets bypassed with
`--no-verify`, and then it protects nothing.

`test:unit` runs `turbo test` — every package's own suite, at each package's own configured environment.
It does **not** force `--environment=node` across the workspace: that override silently reconfigures
Vitest for packages that need `jsdom`, and it broke the moment `packages/theme` arrived with component
tests. Measured, the whole suite is 4.9 s cold and 0.35 s on a warm Turborepo cache, so the split the
override was reaching for buys nothing a hook would notice. See ADR-028.

## Dependabot

```yaml
version: 2
updates:
  - package-ecosystem: npm
    directory: /
    schedule: { interval: weekly }
    open-pull-requests-limit: 5
    groups:
      react:      { patterns: ["react", "react-dom", "@types/react*"] }
      next:       { patterns: ["next", "@next/*"] }
      testing:    { patterns: ["vitest", "@vitest/*", "@playwright/*", "@testing-library/*"] }
      tooling:    { patterns: ["@biomejs/*", "turbo", "typescript"] }
      motion:     { patterns: ["motion", "gsap"] }
  - package-ecosystem: github-actions
    directory: /
    schedule: { interval: monthly }
```

Grouped so a React bump is one PR, not four. Full CI runs on every Dependabot PR — the point of
the gates is that a dependency upgrade cannot silently regress a perf or a11y budget.

## Repository hygiene

- `README.md` with the architecture diagram, quick start, and GIF demos of each flow.
- `CONTRIBUTING.md` with the real rules.
- `docs/` complete and consistent with the code.
- `LICENSE` (MIT).
- Issue templates for bug, block request, preset request.
- PR template with the verification checklist.
- Topics set: `react`, `nextjs`, `typescript`, `design-tools`, `framer-motion`, `tailwindcss`,
  `visual-editor`, `code-generation`.
- Description and homepage set.
- Releases with real changelogs.
- No commit in history mentioning tooling or assistant involvement.

## Demo assets

The README's GIFs are generated, not hand-recorded, so they stay current:

```bash
pnpm generate:demos     # Playwright drives each flow, records, converts to optimised GIF/WebM
```

Four demos matching the four flows in [PRODUCT.md](PRODUCT.md). Each under 3 MB, each regenerated
when the UI changes. A README with a stale screenshot is worse than one with none.
