# 62 — Release

**Milestone** M14 · **Depends on** 61 · **Commit** `chore(release): v1.0.0`

## Read first

- `AUDIT.md` — from prompt 61. Every blocking finding must be resolved.
- `docs/DEVOPS.md` — § Releases, § Repository hygiene
- `docs/ROADMAP.md` — § Post-v1

## Goal

Ship v1.0.0. Tag it, publish it, deploy it, and leave the repository in the state a reader should find
it in.

## Deliverables

```
CHANGELOG.md                    the 1.0.0 entry
package.json                    version 1.0.0 across the workspace
git tag v1.0.0
GitHub release                  with the changelog and demo GIFs
docs/ROADMAP.md                 v1 marked shipped; post-v1 items become issues
.github/ISSUE_TEMPLATE/         verified working
Repository settings             description, topics, homepage, social preview
```

## Pre-release gate

Nothing proceeds until all of this is true. Verify each and report:

```bash
pnpm install --frozen-lockfile
pnpm lint && pnpm typecheck
pnpm test:coverage
pnpm test:codegen && pnpm test:compile
pnpm build && pnpm size-limit
pnpm test:e2e && pnpm test:e2e:a11y && pnpm test:e2e:perf
docker compose up --build
```

- [ ] Every command above green
- [ ] Every blocking finding in `AUDIT.md` resolved
- [ ] Every major finding either fixed or documented as a limitation
- [ ] All 62 blocks, all presets, all effects present and documented
- [ ] All four export targets compile-verified
- [ ] Lighthouse ≥ 95 × 4 on all three public routes, both form factors
- [ ] Zero axe violations everywhere
- [ ] Git history clean of tooling and assistant attribution
- [ ] README stats accurate
- [ ] Demo GIFs current
- [ ] Docker works from a clean clone with no Node installed

## Constraints

### `CHANGELOG.md`

The 1.0.0 entry is written for a reader deciding whether to try the project, not for a machine. Grouped
by area, concrete, and honest about what is not in it:

```markdown
## 1.0.0 — 2026-XX-XX

Initial release.

### Editor
- Infinite canvas with zoom, pan, snapping, alignment guides, and rulers
- Patch-based undo/redo with gesture coalescing — a slider drag is one step
- Multi-select, marquee, container isolation, full keyboard operation
- Drag and drop by mouse or keyboard, across canvas and layers tree

### Blocks
- 62 blocks across 9 categories, all responsive and accessibility-checked
- Inspector generated from each block's schema — 22 control kinds
- 13 surface effects

### Motion
- 43 presets across 6 channels, each with a reduced-motion variant
- Shared scheduler: one observer pool, one scroll listener, one frame loop
- Spring and bezier curve editors with live preview

### Theming
- Token-driven runtime theming with OKLCH palette generation
- Contrast verification with reported repairs
- 10 presets; token export in 4 formats

### Export
- React, Next.js, HTML, and JSON targets
- Every output type-checked in CI; the Next export builds in a fresh project unmodified

### Playground
- 8 CSS property sandboxes with live editing
- Draggable clip-path vertices and bezier control points
- Shareable permalinks

### Not in this release
- Collaborative editing
- Custom user-authored blocks
- Cloud persistence
- Figma import

See docs/ROADMAP.md for what comes next.
```

The "Not in this release" section is the part that builds trust. Include it.

### Versioning

Changesets, fixed mode:

```bash
pnpm changeset          # a major changeset covering 1.0.0
pnpm changeset version
git add -A
git commit -m "chore(release): v1.0.0"
git tag -a v1.0.0 -m "v1.0.0"
git push --follow-tags
```

Verify the tag triggers `release.yml` and that the GitHub release is created with the changelog section
and assets.

### Repository settings

- **Description**: "A visual editor for modern React interfaces. Infinite canvas, production-grade block
  registry, live motion engine, real code export."
- **Homepage**: the deployed URL
- **Topics**: `react`, `nextjs`, `typescript`, `design-tools`, `visual-editor`, `framer-motion`,
  `tailwindcss`, `code-generation`, `motion`, `design-system`
- **Social preview image**: generated, showing the studio with a real document
- Issues enabled, Discussions optional, Wiki off, Projects off
- Branch protection on `main` per prompt 60

### Post-v1 issues

Convert `ROADMAP.md` § Post-v1 into real GitHub issues, one per item, each with:
- What it is, in two sentences
- Why it is not in v1
- A rough shape of the work
- The `enhancement` label and a milestone

An open-source project with a roadmap in issues reads as alive. One with an empty issue tracker reads as
abandoned on arrival.

Also file issues for every deferred finding from `AUDIT.md`, so nothing is lost.

### Final read

Open the repository as a stranger and go through it in order: README → a demo GIF → `docs/README.md` →
`ARCHITECTURE.md` → `packages/editor/src/commands/move-nodes.ts` → the live site.

Report honestly:
- Is the first impression that of a real product?
- Does the documentation make the architecture clear without reading code?
- Does a randomly-opened source file hold up?
- Does the live site work, immediately, with no friction?
- Would you interview the person who built this?

That last question is the actual acceptance criterion for the whole project. Answer it honestly, and if
the answer is no, say what is missing.

## Verify

```bash
git tag -l v1.0.0
gh release view v1.0.0
gh issue list
curl -I <deployed URL>
```

Then, from a completely clean environment:
```bash
git clone <repo> fresh && cd fresh
docker compose up --build
```

Use the product for ten minutes. Compose a page. Export it. Report anything that broke.

## Done when

- [ ] Every pre-release gate item verified and reported
- [ ] `CHANGELOG.md` written, including "Not in this release"
- [ ] v1.0.0 tagged; `release.yml` ran; GitHub release published with assets
- [ ] Deployed and reachable; the live site works
- [ ] Repository description, topics, homepage, and social preview set
- [ ] Branch protection active
- [ ] Post-v1 roadmap items and deferred audit findings filed as issues
- [ ] `ROADMAP.md` updated: v1 shipped
- [ ] Clean-clone Docker run, ten minutes of real use, no breakage
- [ ] Final read performed and the five questions answered honestly
