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

  e2e:
    needs: build
    runs-on: ubuntu-latest
    strategy:
      fail-fast: false
      matrix:
        shard: [1, 2, 3]
        browser: [chromium, firefox, webkit]
    steps:
      - uses: actions/checkout@v4
      - uses: ./.github/actions/setup
      - run: pnpm exec playwright install --with-deps ${{ matrix.browser }}
      - run: pnpm test:e2e --project=${{ matrix.browser }} --shard=${{ matrix.shard }}/3
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-${{ matrix.browser }}-${{ matrix.shard }}
          path: playwright-report/

  a11y:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: ./.github/actions/setup
      - run: pnpm exec playwright install --with-deps chromium
      - run: pnpm test:e2e:a11y     # zero axe violations required
```

### Required checks on `main`

`quality`, `graph`, `build`, `compile-exports`, `e2e` (all shards), `a11y`, `lighthouse`.
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
FROM node:20-alpine AS base
RUN corepack enable
WORKDIR /app

FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/web/package.json apps/web/
COPY packages/*/package.json packages/
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm build --filter=web

FROM base AS runner
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public
USER nextjs
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s \
  CMD wget -qO- http://localhost:3000/api/health || exit 1
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
    build: { context: ., target: builder }
    command: pnpm dev:storybook --host 0.0.0.0
    ports: ["6006:6006"]
    profiles: [dev]
```

`docker compose up --build` gives a running app. That is the whole point — a reader can run the
project without installing a toolchain, and `docker compose --profile dev up` adds Storybook.

Image target: **under 180 MB**. Checked in CI so it does not drift.

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

## Deploy

Vercel, `apps/web`.

| Environment | Trigger | URL |
| --- | --- | --- |
| Production | Push to `main` (after all checks) | `motion-studio.dev` |
| Preview | Every PR | `pr-<n>-motion-studio.vercel.app` |
| Storybook | Push to `main` | `storybook.motion-studio.dev` |

- Build command `pnpm build --filter=web`, output `apps/web/.next`.
- No environment variables required to run. The app has no backend and no secrets — if a build
  ever starts needing a secret, that is an architectural change requiring a decision, not a
  config addition.
- Preview comments post the Lighthouse scores and the bundle delta so a regression is visible in
  the PR without opening a dashboard.

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
