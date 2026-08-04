# 60 — Docker and full CI/CD

**Milestone** M14 · **Depends on** 59 · **Commit** `build: add docker setup and complete ci pipeline`

## Read first

- `docs/DEVOPS.md` — § Docker, § CI, § Releases, § Deploy, § Dependabot
- `docs/TESTING.md` — § CI ordering

## Goal

`docker compose up --build` gives a running product, and CI enforces every gate the documentation
claims. Someone can evaluate this project without installing a toolchain — which materially increases
the chance they actually run it.

## Deliverables

```
Dockerfile                      multi-stage, standalone, non-root
compose.yaml                    web + storybook (dev profile)
.dockerignore
apps/web/app/api/health/route.ts   the healthcheck endpoint

.github/workflows/
├── ci.yml                      complete: all jobs from DEVOPS.md
├── lighthouse.yml
├── visual.yml
├── export-smoke.yml
├── release.yml
└── deploy.yml

.github/actions/setup/action.yml   composite setup, used by every job
lefthook.yml                        verified working
CHANGELOG.md                        seeded by changesets
```

## Constraints

### Dockerfile

Exactly the multi-stage build from `DEVOPS.md`:
- `output: 'standalone'` in `next.config.ts`
- Non-root user (`nextjs:nodejs`, 1001)
- BuildKit cache mount for the pnpm store
- Healthcheck hitting `/api/health`
- **Target: under 180 MB.** Report the actual size.

The layer order matters for build caching: lockfile and manifests first, then `pnpm install`, then
source. Getting this wrong means every source change reinstalls dependencies — a 20-second build becomes
four minutes.

### `/api/health`

The one route handler in the app. Returns `{ status: 'ok', version }` with no dependencies, no database,
no filesystem access. It exists for the Docker healthcheck and nothing else — say so in a comment, so
nobody adds business logic to it.

### `compose.yaml`

```bash
docker compose up --build              # web on :3000
docker compose --profile dev up        # + storybook on :6006
```

Test both from a **clean state**:
```bash
docker system prune -af
docker compose up --build
```

Report the cold build time and the final image size.

### CI — the complete pipeline

All jobs from `docs/DEVOPS.md`, in the fail-fast order from `docs/TESTING.md`:

```
lint → typecheck → unit → component → build
   → e2e (sharded ×3 × 3 browsers) → a11y → lighthouse → size-limit
   → codegen compile → visual (main only)
```

Plus the two custom gates: `check:deps` and `check:registry`.

Every job uses the composite setup action, so the pnpm/node/cache configuration exists in one place.

`concurrency` with `cancel-in-progress` on every workflow. Turbo remote cache wired but tolerant of
missing secrets, so a fork's PR still runs.

**Target: under 8 minutes wall-clock** for a PR with a warm cache. Report the actual time. A slow
pipeline is one people learn to ignore.

### Required checks

Configure branch protection on `main`:
- `quality`, `graph`, `build`, `compile-exports`, `e2e` (all shards), `a11y`, `lighthouse`
- No direct pushes, no force-push, linear history, up-to-date before merge

Report that you configured it (or, if you lack repo admin access, note it as an action for the owner
with the exact list).

### Prove the gates work

For each gate, introduce a deliberate violation, confirm CI fails, and revert. Report the result of
each:

| Gate | Deliberate violation |
| --- | --- |
| lint | `const x: any = 1` |
| typecheck | a type error |
| unit | a failing assertion |
| check:deps | `editor` importing `blocks` |
| check:registry | remove a thumbnail |
| size-limit | a 200 kB eager import on the landing |
| lighthouse | a 5 MB unoptimised hero image |
| a11y | remove an `aria-label` |
| compile-exports | break a printer's output |
| e2e | break a flow |

A gate that does not fail on its violation is not a gate. Ten checks, ten reported results.

### Release workflow

Changesets. On a tag: build, test, GitHub release with the changelog section, push the Docker image to
GHCR, upload the Storybook build.

Seed `CHANGELOG.md` with the 1.0.0 entry summarising what shipped.

### Deploy

Vercel, `apps/web`, build command `pnpm build --filter=web`. Preview per PR; production on `main` after
all checks.

**No environment variables required to run.** If the build starts needing a secret, that is an
architectural change requiring a decision, not a config addition. Note it in the workflow.

Preview comments post the Lighthouse scores and the bundle delta, so a regression is visible in the PR
without opening a dashboard.

## Verify

```bash
docker system prune -af
docker compose up --build
curl http://localhost:3000/api/health
docker images | grep motion-studio          # report the size
docker compose --profile dev up             # storybook too
```

Then push a branch and confirm every workflow runs. Report per job: pass/fail and duration.

Then the ten deliberate violations above, each reported.

Then verify from a truly clean environment — a machine or container with no Node installed:
```bash
git clone <repo> && cd motion-studio && docker compose up --build
```
Open `localhost:3000` and use the product. Report whether it worked with no other setup.

## Done when

- [ ] `docker compose up --build` produces a working product from a clean clone with no Node installed
- [ ] Image under 180 MB; size and cold build time reported
- [ ] Layer caching correct — a source change does not reinstall dependencies (verified)
- [ ] Storybook profile works
- [ ] All CI jobs green; per-job duration reported; total under 8 minutes warm
- [ ] All ten gates proven to fail on their violation; each result reported
- [ ] Branch protection configured, or the exact list handed off
- [ ] Release workflow tested on a pre-release tag
- [ ] Deploy working with zero required environment variables
- [ ] Preview comments post Lighthouse and bundle delta
