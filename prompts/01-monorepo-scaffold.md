# 01 — Monorepo scaffold

**Milestone** M0 · **Depends on** nothing · **Commit** `build: scaffold pnpm + turborepo monorepo`

## Read first

- `docs/ARCHITECTURE.md` — § Monorepo topology, § Dependency graph, § Folder conventions
- `docs/TECH_STACK.md` — § Runtime requirements, § Tooling
- `docs/ENGINEERING_CONTRACT.md` — § Directory law

## Goal

An empty but real monorepo: pnpm workspaces, Turborepo, every package directory created with a
valid `package.json` and `tsconfig.json`, and a Next.js 15 app that builds. No feature code yet —
this prompt produces the skeleton the next 61 prompts fill in.

## Deliverables

```
package.json                  root scripts, packageManager, engines
pnpm-workspace.yaml
turbo.json                    per docs/DEVOPS.md § Turborepo
.nvmrc                        20.11
.npmrc                        strict-peer-dependencies, node-linker=isolated
tsconfig.json                 root, references all packages
apps/web/                     Next 15 App Router, TypeScript, Tailwind v4
apps/storybook/               placeholder package.json only
packages/{config,utils,tokens,icons,schema,theme,motion,hooks,ui,blocks,editor,canvas,dnd,codegen}/
  package.json                name, version 0.0.0, exports map, scripts
  tsconfig.json               extends the right config preset
  src/index.ts                empty barrel with a placeholder export
  README.md                   five lines: what this package owns
e2e/package.json              placeholder
```

Root scripts:

```jsonc
{
  "scripts": {
    "dev": "turbo dev --filter=web",
    "dev:storybook": "turbo dev --filter=storybook",
    "build": "turbo build",
    "lint": "turbo lint",
    "typecheck": "turbo typecheck",
    "test": "turbo test",
    "test:unit": "turbo test -- --environment=node",
    "test:coverage": "turbo test -- --coverage",
    "test:e2e": "turbo test:e2e",
    "clean": "turbo clean && rm -rf node_modules",
    "check:deps": "node scripts/check-deps.mjs"
  }
}
```

Package naming: `@motion-studio/<dir>`. Every `exports` map points at `./src/index.ts` (bundled by
the consumer — no build step for internal packages, which keeps `pnpm dev` fast).

## Constraints

- **`packageManager` pinned** in root `package.json`; `corepack` documented in the README.
- **No package has a `dependencies` entry yet** except `apps/web` on `next`, `react`, `react-dom`.
  Dependencies get added by the prompt that needs them, so the graph stays honest.
- **`exports` maps prevent deep imports.** Only `"."` and `"./package.json"` are exported.
- `apps/web` gets one route: `app/page.tsx` rendering the project name. Nothing else.
- Tailwind v4 installed and wired via `@import "tailwindcss"` in `app/globals.css`. No config file
  yet — v4 is CSS-first and the token package will generate the `@theme` block in prompt 04.
- Do not create files not in the deliverable list.

## Verify

```bash
pnpm install
pnpm typecheck        # every package resolves
pnpm build            # apps/web builds
pnpm dev              # localhost:3000 renders
node scripts/check-deps.mjs   # will be written in prompt 05; skip if absent
```

Also confirm by inspection:
- `pnpm ls --depth -1` lists all 14 packages plus 2 apps
- No package has a dependency it does not use
- `apps/web/.next` is gitignored

## Done when

- [ ] 14 packages + 2 apps exist with valid manifests
- [ ] `pnpm install` clean, no peer warnings
- [ ] `pnpm typecheck` clean across the workspace
- [ ] `pnpm build` succeeds
- [ ] `pnpm dev` serves a page
- [ ] Every package has a one-paragraph `README.md`
- [ ] No stray files beyond the deliverables
