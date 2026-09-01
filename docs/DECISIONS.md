---
group: Engineering foundations
order: 2
summary: Every decision not answered by another document, with the evidence that produced it
---

# DECISIONS

Every decision not already answered by another document lives here, with the evidence that produced
it. Append-only.

Its purpose is narrow and specific: to make it impossible for *"I thought this was better"* to pass
as engineering. A decision either has a criterion and a measurement, or it was the owner's call, or
it does not belong in the codebase yet.

## Rules

1. **Written before the code that depends on it.** An entry added afterwards is a rationalisation,
   and it reads like one.
2. **Append-only.** To change a decision, add a new entry that supersedes the old one and mark the
   old one `Superseded by ADR-NNN`. Never edit history — the reasoning that was wrong is the most
   useful thing in the file.
3. **Evidence, not preference.** A `Criterion` and a `Measurement` are mandatory for technical
   decisions. "Cleaner", "simpler", and "felt better" are not measurements.
4. **Consequences are stated honestly**, including the ones you dislike. An entry with no downside
   listed has not been thought through.
5. **One decision per entry.** Bundled decisions cannot be superseded individually.
6. **Numbered sequentially.** Never reuse a number.

## Entry format

`ADR-000` is reserved for this template and is never a real entry, so the example below cannot
collide with a future decision. Real entries start at 001.

```markdown
## ADR-000 — Export generation runs on the main thread   (illustrative)

**Date** 2026-04-02 · **Prompt** 45 · **Status** Accepted

### Question
Should codegen run in a Web Worker or on the main thread?

### Criterion (set before measuring)
Worker if generation exceeds 100 ms on the 60-node fixture; main thread otherwise.
100 ms is the point at which a user perceives the export dialog as blocked.

### Measurement
buildIR 18 ms · print 24 ms · format 39 ms · total 81 ms (median of 9 runs,
M2 Air, no throttling). Under 4× CPU throttle: 310 ms.

### Decision
Main thread, wrapped in `startTransition`. The dialog opens before generation
starts, so the 81 ms is not on the interaction path.

### Consequences
- Accepted: on very slow devices generation approaches 300 ms. Mitigated by the
  dialog opening first and streaming files in.
- Accepted: a much larger document (200+ nodes) may cross the threshold. Revisit
  with a measurement, not a guess — ADR supersedes, not code comment.
- Avoided: worker serialisation cost, a second build target, and debugging
  across the boundary.

### Alternatives rejected
- Worker: 81 ms does not justify the complexity; measured serialisation of the
  IR alone was 12 ms round-trip.
- Incremental generation: no measured need; would add cache-invalidation surface.
```

The numbers in that example are illustrative, not measured. Prompt 45 makes the real measurement and
writes the real entry — do not copy these figures into it.

For an owner decision, replace `Criterion`/`Measurement` with:

```markdown
### Escalated
Options presented, recommendation given, owner decided on <date>.
Owner's stated reason: <verbatim, not paraphrased>.
```

## When an entry is required

| Situation | Entry required? |
| --- | --- |
| The answer is in `docs/` | No — follow the document |
| A threshold was measured against | **Yes** |
| Two viable approaches, one picked | **Yes** — with the criterion that picked it |
| A dependency was added | **Yes** — with the six answers from `TECH_STACK.md` § Adding a dependency |
| A documented budget was missed and accepted | **Yes** — and it must be an owner decision |
| A `docs/` document was changed | **Yes** — reference the commit |
| A feature was cut or deferred | **Yes** — owner decision only, never the implementer's |
| A licence was verified | **Yes** — see `DESIGN_REFERENCES.md` |
| Naming, formatting, file placement already covered by conventions | No |

## Decisions already made

These are recorded in the documents that own them, not here. They are listed so nobody re-opens
them without reading the reasoning first:

| Decision | Owner document |
| --- | --- |
| Monorepo with enforced package boundaries | `ARCHITECTURE.md` § Monorepo topology |
| `editor` never imports `blocks`; registry interface as the seam | `ARCHITECTURE.md` § The registry seam |
| Normalized document, not a nested tree | `EDITOR_ENGINE.md` § Why normalized |
| Immer patches as the undo unit, not snapshots | `STATE_MANAGEMENT.md` § history |
| 400 ms coalesce window | `EDITOR_ENGINE.md` § Coalescing |
| History capped at 200 entries | `EDITOR_ENGINE.md` § Limits |
| Transient gesture state never in React | `PERFORMANCE.md` § The core rule |
| Overlays outside the scene transform | `CANVAS.md` § DOM structure |
| CSS variables for theming, not class swapping | `THEME_ENGINE.md` § Why it works that way |
| Tailwind as the styling and export target | `TECH_STACK.md` § Tailwind CSS v4 |
| No styling option in export — Tailwind is the IR's model | `EXPORT_ENGINE.md` § There is no styling option |
| Zustand + Immer over Redux / Jotai / Valtio | `TECH_STACK.md` § Deliberately not used |
| dnd-kit over HTML5 drag and React DnD | `DRAG_AND_DROP.md` § Why dnd-kit |
| CodeMirror over Monaco | `TECH_STACK.md` § Deliberately not used |
| IR between document and printers | `EXPORT_ENGINE.md` § Pipeline |
| Mobile-first cascading breakpoint resolution | `RESPONSIVE_ENGINE.md` § Resolution |
| Local-first persistence, no backend | `VISION.md` § What it refuses to be |
| Reduced motion as a parallel design, not a fallback | `ANIMATION_SYSTEM.md` § Reduced motion |
| One shared scheduler for observers and listeners | `ANIMATION_SYSTEM.md` § The scheduler |
| Studio requires ≥ 1024 px | `ACCESSIBILITY.md` § Known limitations |
| Golden files plus `tsc` as the export contract | `EXPORT_ENGINE.md` § Testing |
| impeccable.style as the primary design reference | `DESIGN_REFERENCES.md` |
| Chrome takes craft, not loudness, from the reference | `DESIGN_REFERENCES.md` § Why the chrome is the exception |
| Per-package coverage floors, no global number | `TESTING.md` § Coverage contract |
| Render-count assertions over timing assertions | `PERFORMANCE.md` § Measurement |

If you believe one of these is wrong: read its document, then open an entry here proposing the
change with your reasoning. Do not work around it in code.

---

## ADR-001 — Documentation precedes implementation

**Date** 2026-08-04 · **Prompt** — · **Status** Accepted

### Question
Specify the product in full before writing code, or specify incrementally alongside it?

### Escalated
Owner decision at project start.

Owner's stated reason: a previous large project accumulated extensive documentation with no
implementation plan attached, and separately, long single-session builds produced subsystems that
contradicted each other. The requirement was a specification detailed enough that any individual
work session can be scoped, verified, and checked against it without holding the whole system in
context.

### Decision
27 documents specifying every subsystem, plus 62 build prompts in dependency order. Each prompt
names the documents to read, its deliverables, its constraints, its verification commands, and a
done-when checklist. One prompt per session.

### Consequences
- Accepted: the specification will diverge from the implementation in places. Prompt 61 audits for
  this, and the doc-consistency checks become tests so divergence fails CI afterwards.
- Accepted: significant work before the first line of code runs.
- Avoided: contradictory subsystems, context exhaustion mid-feature, and re-deciding settled
  questions in every session.

### Alternatives rejected
- One large prompt: exceeds usable context; produces invention where detail runs out.
- Documentation alongside code: the boundaries between packages are the hardest part and are
  cheapest to get right before anything depends on them.

## ADR-002 — No styling option in the export engine

**Date** 2026-08-04 · **Prompt** — · **Status** Accepted

### Question
`ExportOptions` originally offered `styling: 'tailwind' | 'css-modules' | 'inline'`. Can the export
engine honour all three?

### Criterion
An option ships only if implementing it is bounded by a new printer. Anything requiring a second IR
pass is a roadmap item, not a switch — because an option that silently honours one value is worse
than an absent option.

### Measurement
Traced what CSS Modules output would require against the six passes in `buildIR`. Pass 3
(`generateClasses`) is Tailwind-specific end to end: utility vocabulary, Tailwind group ordering,
breakpoint prefixes for responsive overrides, and build-time `tailwind-merge` conflict resolution.
CSS Modules needs scoped name generation, a declaration model, media queries, and its own conflict
rules — plus a parallel golden-file and compile suite. Estimated 3–5 weeks, versus roughly one week
for a genuine printer such as the component-library target.

### Decision
Remove `styling` from `ExportOptions`. Tailwind is a stated v1 constraint. Record the real cost in
`ROADMAP.md` § Post-v1 as v1.3.

### Consequences
- Accepted: users on CSS Modules or vanilla-extract cannot use the React/Next targets directly. The
  HTML target gives them real CSS rules, flattened into one document.
- Accepted: this narrows the addressable audience, and the honest framing is that it narrows it
  *visibly* instead of via a broken switch.
- Avoided: an option that appears to work and does not, which is the specific failure this ADR exists
  to prevent.

### Alternatives rejected
- Ship the option honouring only `tailwind`: a documented lie.
- Ship a naive CSS Modules path: would produce output that fails the compile test, which contradicts
  the export engine's central guarantee.

## ADR-003 — Plugin API resized from a minor release to 8–12 weeks

**Date** 2026-08-04 · **Prompt** — · **Status** Accepted

### Question
`ROADMAP.md` listed a third-party plugin API as v1.2, implying a normal release. Is that estimate
sound?

### Criterion
A post-v1 item's estimate is sound only if it accounts for the product's stated non-negotiables. Here
that is `VISION.md`'s promise that nothing leaves the browser, and there is no telemetry.

### Measurement
Enumerated what a React error boundary actually contains: a crash. It does not prevent a
third-party block from reading `localStorage`, calling `fetch`, reading the document from the store,
or mutating DOM outside its subtree. Isolation therefore requires either an iframe with a serialized
render protocol or a worker with a diff protocol — each of which changes the plugin authoring model
from "write a React component" to "target a constrained API". Adding manifest, permissions, schema
versioning, discovery, and host-migration handling puts the total at 8–12 weeks.

### Decision
Move to v1.5 with an explicit 8–12 week estimate and the reasoning recorded in `ROADMAP.md`. Ship
nothing plugin-shaped in v1.

### Consequences
- Accepted: no third-party ecosystem in the medium term.
- Accepted: user-authored custom blocks (v1.4) depend on this and inherit the delay.
- Retained: the registry-interface seam means the *host* side is already ready, so the estimate covers
  the guest side only. That seam is worth keeping regardless of whether plugins ever ship.

### Alternatives rejected
- Plugins without isolation: contradicts the local-first promise, and the promise is more valuable
  than the feature.
- Curated first-party-only extension: that is just the existing registry, so it is not a plugin API
  and should not be called one.

## ADR-004 — Package tsconfigs extend the root tsconfig until the presets exist

**Date** 2026-08-04 · **Prompt** 01 · **Status** Accepted

### Question
Prompt 01 requires every package's `tsconfig.json` to "extend the right config preset", but the
presets are a deliverable of prompt 02 (`packages/config/tsconfig/{base,library,react,next}.json`).
Where do the strict compiler flags live for the one prompt in between?

### Criterion (set before choosing)
Prompt 02 states "Then update every package's `tsconfig.json` to extend the right preset", so the
end state is fixed and identical either way. The choice is therefore admissible without escalation
only if both options converge to the same repository state after prompt 02 — they do. Among
converging options, pick the one that adds no file outside prompt 01's deliverable list and states
the strict flags exactly once, so a flag cannot drift between packages during prompt 01.

### Measurement
Option A — copy `CODE_STANDARDS.md` § Compiler configuration into each of the 16 manifests:
17 declarations of the same flag set (16 packages/apps + root), 16 of them rewritten by prompt 02.
Option B — root `tsconfig.json` carries the flag set; every package extends `../../tsconfig.json`:
1 declaration, 16 two-line child files. `references` is not inherited through `extends`, so the
root's project references do not leak into packages; `files`/`include`/`exclude` are inherited, and
each package overrides `include` with `["src"]`.
Option C — create `packages/config/tsconfig/*.json` now: adds four files that prompt 01 § Constraints
forbids ("Do not create files not in the deliverable list") and takes prompt 02's deliverable.

### Decision
Option B. The root `tsconfig.json` holds exactly the flags from `CODE_STANDARDS.md` § Compiler
configuration plus `references` to all packages; each package extends it and sets `include`.
Prompt 02 repoints every `extends` at the real preset and the root keeps only its references.

### Consequences
- Accepted: for the duration of prompt 01 the root `tsconfig.json` has two jobs — reference list and
  flag source. Prompt 02 removes the second one.
- Accepted: `tsc --build` from the root is not supported, because project references require
  `composite: true`, which requires declaration emit, which contradicts `ARCHITECTURE.md`'s
  no-build-step rule for internal packages. Typechecking runs per package via `turbo typecheck`
  (`tsc --noEmit`), which is what the root `typecheck` script does.
- Avoided: sixteen copies of a flag set that must stay identical, in the one window where nothing
  yet enforces that they do.

### Alternatives rejected
- Option A: identical end state, sixteen places for a flag to drift in between.
- Option C: takes prompt 02's deliverables and violates prompt 01's file-list constraint.

## ADR-005 — The deep-import ban is enforced by the `exports` map, not by Biome

**Date** 2026-08-05 · **Prompt** 02 · **Status** Accepted

### Question
Prompt 02 asks for "a custom restriction: no import matching `@motion-studio/*/src/*`", and adds:
"If Biome cannot express it, add it to `scripts/check-deps.mjs` in prompt 05 and note that here."
Can Biome 1.9 express it?

### Criterion (set before measuring)
The branch is chosen by whether Biome's rule accepts a pattern, not by preference. If it does, the
rule goes in `biome.json`; if it does not, the ban falls to prompt 05's script and this entry records
what still catches the violation in the meantime.

### Measurement
`biome explain noRestrictedImports` on 1.9.4 documents a single option, `paths`, whose value is a map
from an **exact** module specifier to a message. There is no pattern or glob form (Biome added
`patterns` in 2.0). Enumerating exact paths is not equivalent: the violation is
`@motion-studio/<pkg>/src/<any file>`, an open set.

Measured what does catch it, with `@motion-studio/utils` declared as a real dependency of
`@motion-studio/ui` and `import { placeholder } from '@motion-studio/utils/src/index'` in
`packages/ui/src`:

- `biome check src/probe.ts` → `Checked 1 file. No fixes applied.` — not caught.
- `tsc --noEmit` → `error TS2307: Cannot find module '@motion-studio/utils/src/index' or its
  corresponding type declarations.` — caught, because prompt 01 § Constraints publishes only `"."`
  and `"./package.json"` in every `exports` map.

### Decision
No `noRestrictedImports` entry in `biome.json`. The `exports` map is the gate today and it fails
`pnpm typecheck`; prompt 05 § `scripts/check-deps.mjs` assertion 3 adds the regex gate that reports
the offending file and line.

### Consequences
- Accepted: until prompt 05, a deep import surfaces as a module-resolution error rather than a
  message naming the rule. The failure is loud, but the diagnostic does not say "deep import".
- Accepted: a deep import inside a package's own source (`./src/...` relative) is not covered by
  either gate. It is also not the failure the rule exists to prevent — the rule is about crossing a
  package boundary.
- Avoided: an exact-path list that would silently miss every file not enumerated in it, which is
  worse than no rule because it reads as coverage.

### Alternatives rejected
- Upgrade to Biome 2 for `patterns`: `TECH_STACK.md` § Tooling pins Biome 1.9. Changing a pinned
  tool version to obtain one rule is a `TECH_STACK.md` edit and its own decision, not a side effect
  of prompt 02.
- Enumerate the fourteen package names in `paths`: does not match, because the specifier that must
  be rejected includes the file path after `/src/`.

## ADR-006 — A package takes the React Vitest preset unless it can never hold a `.tsx` test

**Date** 2026-08-05 · **Prompt** 02 · **Status** Accepted

### Question
Prompt 02 defines two Vitest presets and two matching tsconfig presets but does not say which of the
fourteen packages takes which.

### Criterion (set before choosing)
The presets differ in their `include` glob, which prompt 02 fixes: `node` collects
`src/**/*.test.ts`, `react` collects `src/**/*.test.{ts,tsx}`. A `.test.tsx` file in a package on the
node preset is therefore **silently never run** — it is not an error, it is an absence. A pure
`.test.ts` file in a package on the react preset runs correctly, only in jsdom.

The two failure modes are not symmetric, so the criterion is: a package goes on the node preset only
if it can never hold a component test. Every other package goes on the react preset. Speed is not the
criterion — `pnpm test:unit` (`turbo test -- --environment=node`, `TESTING.md` § Commands) already
exists for the fast path.

### Measurement
Applied to each package's own `README.md`, written in prompt 01:

| Node preset | The sentence that puts it there |
| --- | --- |
| `utils` | "It depends on nothing, which is what keeps it testable in `node`" |
| `editor` | "testable in `node` with no React" |
| `schema` | "Zod schemas and the types inferred from them" |
| `codegen` | "the intermediate representation … and the formatter" |
| `tokens` | "as typed objects, and the generator that turns them into the `@theme` block" |

The remaining eight — `icons`, `theme`, `motion`, `hooks`, `ui`, `blocks`, `canvas`, `dnd` — each
describe React components, React hooks, or direct DOM work in their own README, so each can hold a
`.test.tsx`. `apps/web` takes `tsconfig/next.json` and no Vitest config: its flows are Playwright's
(`TESTING.md` § E2E tests).

### Decision
Five packages on `library.json` + `vitest/node`, eight on `react.json` + `vitest/react`, `apps/web`
on `next.json`. The table is repeated in `packages/config/README.md` so it is visible where the
presets are, not only here.

### Consequences
- Accepted: `canvas` runs its pure coordinate tests in jsdom, which costs jsdom start-up per file
  even though `TESTING.md` § Unit tests lists every canvas subject as pure. `CANVAS.md` § DOM
  structure gives the package an overlay layer, so it will hold component tests.
- Accepted: `motion` and `theme` likewise pay for jsdom on tests that do not need it.
- Avoided: the failure this criterion exists for — a component test that is present, passes review,
  and never runs.

### Alternatives rejected
- Split by test kind rather than by package: Vitest workspaces would let one package run both
  environments, but prompt 02's deliverable is two presets consumed one per package, and a second
  mechanism to configure is not in its scope.
- Node preset wherever `TESTING.md` § Unit tests lists the package: that table is about what belongs
  in unit tests, not about what the package can contain, and it would put `canvas`, `motion`, and
  `theme` on a preset that drops their future component tests.

## ADR-007 — Biome override globs are written to match from any working directory

**Date** 2026-08-05 · **Prompt** 02 · **Status** Accepted

### Question
Prompt 02 specifies the `noDefaultExport` override as `apps/web/app/**`. `lint` is a per-package
script, so Biome runs with the package as its working directory. Does the specified glob hold?

### Criterion (set before measuring)
The override must suppress the rule identically whether Biome is invoked at the repository root or
inside the package. Anything else is a gate whose result depends on how it was invoked, which cannot
be checked.

### Measurement
With `"include": ["**/apps/web/app/**"]`:

- `pnpm exec biome check .` at the root → clean.
- `pnpm exec biome check .` in `apps/web` → 2 errors, `lint/style/noDefaultExport` on
  `app/page.tsx:1:8` and `app/layout.tsx:15:8`.

Biome matches override globs against the path relative to the working directory, so `app/page.tsx`
does not match a glob containing `apps/web/`.

### Decision
`**/app/**`. `**/` matches zero or more leading segments, so the glob holds from both directories.
Every other glob in the file — `**/*.stories.tsx`, `**/*.config.{ts,mts,js,mjs}`,
`**/tsconfig/*.json`, and the `files.ignore` list — is written in the same form for the same reason.
The reasoning is repeated in `packages/config/README.md` because `biome.json` cannot hold a comment:
Biome parses its own config as strict JSON and rejects one with `parse` errors.

### Consequences
- Accepted: the override is broader than specified. It exempts any directory named `app`, not only
  `apps/web/app`. In this repository a directory named `app` is a Next App Router root by
  `ENGINEERING_CONTRACT.md` § Directory law, and `apps/web` is the only Next app.
- Accepted: if a package ever adds a plain `app/` directory that is not a router root, default
  exports go unchecked inside it. That would be a directory-law violation first.
- Avoided: a lint gate that passes in CI and fails locally, or the reverse, depending on the
  directory it was started from.

### Alternatives rejected
- A second `biome.json` in `apps/web` carrying the override relative to itself: the policy would then
  be declared in two files that must agree, which is the drift this package exists to prevent.
- Root-only linting (`biome check .` as the root `lint` script, no per-package scripts):
  `DEVOPS.md` § Turborepo declares a `lint` task and § CI runs `pnpm lint`, so per-package scripts are
  the documented shape; and a `turbo lint` with no package script is a gate that reports success
  without checking anything.

## ADR-008 — `jest-axe` is typed by a local module declaration

**Date** 2026-08-05 · **Prompt** 02 · **Status** Accepted

### Question
`packages/config/vitest/setup-react.ts` must call `expect.extend(toHaveNoViolations)` from
`jest-axe`, which is a new dependency and is not named in `TECH_STACK.md` § Tooling. How is it
declared, and how is it typed under "zero `any`, no `@ts-ignore`"?

### Six answers from `TECH_STACK.md` § Adding a dependency
1. It formats an axe-core result set into a readable matcher failure. Reimplementing it means
   reimplementing the violation report, not the assertion.
2. Zero bytes in any shipped bundle. It is a devDependency of a development-only package and is
   loaded only by the Vitest setup file.
3. Not applicable — it never enters a bundle. Used surface: two exports.
4. **No.** The published tarball contains `index.js` and nothing else.
5. Yes — 11.0.0, and it carries `axe-core` 4.12.1 as a direct dependency.
6. No bundle. Not dynamically importable and does not need to be.

### Criterion
Answer 4 forces a choice, and the criterion is that the chosen option must not weaken the type
environment of any package that consumes the preset.

### Measurement
`npm view @types/jest-axe dependencies` → `{ 'axe-core': '^3.5.5', '@types/jest': '*' }`.
`@types/jest` declares ambient `expect`, `describe`, and `it` globals, which shadow Vitest's in every
file of every package that picks the types up — a strictly worse type environment, and it pins
`axe-core` types three major versions behind the runtime.

`import type { … } from 'axe-core'` is also unavailable: `axe-core` arrives as a transitive
dependency of `jest-axe`, and `node-linker=isolated` (`.npmrc`) means it is not resolvable from
`packages/config`.

### Decision
Add `jest-axe` as a devDependency of `@motion-studio/config`, and declare the two used exports in
`packages/config/vitest/jest-axe.d.ts` with a result type narrowed to the fields a failure message
reads. `pnpm typecheck` is clean with it and `expect.extend(toHaveNoViolations)` typechecks.

### Consequences
- Accepted: one file more than prompt 02's deliverable list. Without it the import is an error under
  `strict`, so the alternative is not "fewer files" but "no working setup file".
- Accepted: the declaration is hand-maintained. It covers two exports, and a mismatch surfaces as a
  type error at the call site rather than silently.
- Accepted: `TECH_STACK.md` § Tooling names `axe-core / @axe-core/playwright` but not `jest-axe`.
  The document should name it next to Vitest; proposed as an edit, not made in this commit.
- Not resolved here: the declaration is inside `packages/config`, whose files are not in a consumer's
  tsconfig program, so `toHaveNoViolations()` is registered at runtime but not yet visible to
  TypeScript inside a consumer package. Verified: the matcher is present on the assertion object at
  runtime. The first component test needs the module augmentation and is the first place it can be
  checked, so it belongs there.

### Alternatives rejected
- `@types/jest-axe`: measured above — shadows Vitest's globals.
- `vitest-axe` instead of `jest-axe`: ships its own types, but prompt 02 names `jest-axe`, and
  swapping a named deliverable for an unnamed package is not a decision prompt 02 leaves open.

## ADR-009 — The React Vitest preset imports its sibling through the package's own `exports` map

**Date** 2026-08-05 · **Prompt** 02 · **Status** Accepted

### Question
`packages/config/vitest/react.ts` shares `coverageExclude` with `node.ts`. What does the import
specifier look like?

### Criterion
The specifier must resolve in both consumers of the file: `tsc --noEmit` in the consuming package,
and Vitest loading the consuming package's `vitest.config.ts`. One list of coverage exclusions, not
two.

### Measurement
`import { coverageExclude } from './node'` typechecks and fails at run time:
`Error [ERR_MODULE_NOT_FOUND]: Cannot find module '…/packages/config/vitest/node' imported from
…/packages/config/vitest/react.ts`. Vitest treats the bare specifier
`@motion-studio/config/vitest/react` as external, so the file reaches Node's ESM loader, which does
not resolve an extensionless relative path.

`import { coverageExclude } from '@motion-studio/config/vitest/node'` — a self-reference, which Node
supports for a package that declares `exports` — resolves in both: `vitest run` starts and
`pnpm typecheck` is clean across all fifteen tasks.

### Decision
Self-reference through the `exports` map.

### Consequences
- Accepted: a relative import inside one directory is written as a package specifier, which reads
  oddly until the comment above it is read. The comment is there.
- Accepted: it depends on the `./vitest/*` entry in the `exports` map. Removing that entry breaks
  the preset, which is the same thing that breaks every consumer, so it fails loudly.

### Alternatives rejected
- `./node.ts` with `allowImportingTsExtensions`: the flag would have to be in `base.json`, because a
  consumer's tsconfig program includes `react.ts`, and `base.json` is fixed to
  `CODE_STANDARDS.md` § Compiler configuration.
- Duplicate the exclusion list in both presets: two lists that must stay identical, inside the
  package whose stated purpose is that a change is "a one-file change instead of fifteen".
- Build `reactConfig` with `mergeConfig(nodeConfig, …)`: Vite's `mergeConfig` concatenates arrays, so
  `include` would become both globs and the node preset's `src/**/*.ts` coverage include would
  survive into a package holding `.tsx` files.

## ADR-010 — The OKLCH parser is `parseOklch`, and `THEME_ENGINE.md` is corrected to match

**Date** 2026-08-05 · **Prompt** 03 · **Status** Accepted

### Question
`THEME_ENGINE.md` § Palette generation calls `parseToOklch(seed)`. Prompt 03 § Constraints names the
same function `parseOklch` and specifies its behaviour. Which name does `packages/utils` export?

### Criterion
Only one of the two can exist, so the question is which document owns the name. A package's public
surface is owned by the prompt that builds the package; a consuming document that names a function it
does not own is a forward reference, and a forward reference that does not match is a defect in the
consumer.

### Decision
`parseOklch`. `THEME_ENGINE.md`'s snippet is corrected in the same commit that records this entry,
before any code is written against it — `docs: correct the OKLCH parser name in the theme engine`.

Supporting: `parseOklch` pairs with `formatOklch`, which the same snippet already calls, so the
module's two halves are named symmetrically.

### Consequences
- Accepted: `parseOklch` reads as "parse an OKLCH string", while the function also accepts hex. The
  name understates the input it takes. Prompt 03 states the hex acceptance explicitly, and the
  signature is `(input: string)`, so no caller can be misled by the name into passing something else.
- Avoided: prompt 06 discovering that the function `THEME_ENGINE.md` told it to call does not exist,
  and inventing an alias to bridge the two names.

### Alternatives rejected
- Export `parseToOklch` and change prompt 03: the prompt also fixes the behaviour and the test
  assertions around that name, and editing the build plan to match an illustrative snippet in
  another subsystem's document inverts which document is authoritative.
- Export both, one aliasing the other: two names for one function is exactly the drift the glossary
  exists to prevent.

## ADR-011 — `Rect` is `{ x, y, width, height }`

**Date** 2026-08-05 · **Prompt** 03 · **Status** Accepted

### Question
Prompt 03 asks `packages/utils` for "Rect helpers: intersects, contains, union, center, expand" but
no document defines `Rect`. `CANVAS.md` uses the type without declaring it.

### Criterion
`CANVAS.md` § Rect intersection populates the rect cache by "batched `getBoundingClientRect` via
`ResizeObserver`", and `RectCache.get` returns `Rect | undefined`. A `DOMRect` must therefore be
assignable to `Rect` with no conversion step, or the cache needs a mapping pass on every refresh —
which is the cost `CANVAS.md` § Performance is explicitly avoiding. Among the shapes that satisfy
that, take the one with no redundant fields, because a rect with both `width` and `right` has two
representations of one fact and nothing keeps them in sync.

### Measurement
`DOMRect` declares `x`, `y`, `width`, `height`, `top`, `right`, `bottom`, `left`. Both
`{ x, y, width, height }` and `{ top, right, bottom, left }` are assignable from it.
`{ x, y, width, height }` carries no derivable field; the edge form makes `width` a computation at
every call site, and the snapping engine (`CANVAS.md` § Snap candidate) needs both edges and centres,
so neither form avoids arithmetic.

### Decision
```ts
export interface Rect {
  readonly x: number
  readonly y: number
  readonly width: number
  readonly height: number
}
```

### Consequences
- Accepted: edge comparisons inside `intersects`, `contains`, and `union` compute `x + width` rather
  than reading a field. Five call sites, all in one file.
- Accepted: a negative `width` or `height` is representable. The helpers do not normalise it, because
  a `DOMRect` never has one and a marquee rect is normalised by the caller that builds it.

### Alternatives rejected
- `{ top, right, bottom, left }`: assignable from `DOMRect` too, but makes every consumer that has a
  size compute it, and `expand` would touch four fields instead of four with a clearer meaning.
- Branded per space, like `CANVAS.md`'s `ScreenPoint` / `CanvasPoint`: rects in `utils` are space
  agnostic on purpose — the same `intersects` serves marquee (screen) and drop resolution (canvas).
  Branding belongs where the space is known, which is `canvas`.

## ADR-012 — `errors.ts` ships one subclass, not a hierarchy

**Date** 2026-08-05 · **Prompt** 03 · **Status** Accepted

### Question
Prompt 03 asks for "`MotionStudioError` + typed subclasses". Which subclasses?

### Criterion
Prompt 00 § Do not: "no speculative abstraction … no config options with one caller". A subclass is
justified only if a document names it and a package that may depend on `utils` calls it. Anything
else is discriminated by the `code` field that `MotionStudioError` already carries.

### Measurement
Grepped `docs/` for class names ending in `Error`: `MotionStudioError` and `NodeNotFoundError`
(`CODE_STANDARDS.md` § Errors, `EDITOR_ENGINE.md` § Commands), `DocumentError`
(`EDITOR_ENGINE.md` — `validateDocument`, owned by `editor`), `MigrationError` (`FILE_FORMAT.md` —
owned by `schema`), `CssError` (`PLAYGROUND.md` — owned by the playground). Exactly one belongs to
`utils`.

### Decision
`MotionStudioError` plus `NodeNotFoundError`. `assertNever`, `invariant`, `assertDefined`, and
`clone` throw `MotionStudioError` with the codes `UNHANDLED_CASE`, `INVARIANT_VIOLATED`,
`VALUE_NOT_DEFINED`, and `CLONE_FAILED`.

### Consequences
- Accepted: "subclasses" in prompt 03 is plural and this delivers one. The other four names the
  documents give are owned by other packages, and defining them here would put `editor`'s and
  `schema`'s vocabulary in the leaf package everything depends on.
- Accepted: catching an invariant violation specifically means checking `error.code`, not
  `instanceof`. The code is a string union in one file, so it is checkable.

### Alternatives rejected
- One subclass per code: four classes with one throw site each and no caller that distinguishes them
  by type.
- No subclass at all, `NodeNotFoundError` included: `CODE_STANDARDS.md` § Errors gives its
  implementation verbatim, so it is specified, not chosen.

## ADR-013 — `deletePath` splices arrays instead of leaving a hole

**Date** 2026-08-05 · **Prompt** 03 · **Status** Accepted

### Question
Prompt 03 lists `deletePath` beside `getPath`/`setPath` and specifies the other two in detail but not
this one. What happens when the removed leaf is an array index?

### Criterion
`FILE_FORMAT.md` § Testing requires `parse(serialize(doc))` to deep-equal `doc` and serialising twice
to produce identical strings. Whatever `deletePath` does must survive a JSON round-trip unchanged.

### Measurement
`delete array[0]` leaves a hole. `JSON.stringify([ , 1])` produces `[null,1]`, and parsing that back
gives `[null, 1]` — a different value from the one serialised. The round-trip requirement is
therefore violated by the hole, not by the shift.

### Decision
`deletePath` removes an object key with `delete`, and an array index with `splice`, so no array ever
holds a hole.

### Consequences
- Accepted: removing index 0 of a three-element array renumbers the other two. For the documented
  callers — a prop key and a sparse `node.responsive[bp][key]` override
  (`RESPONSIVE_ENGINE.md` § Override) — the leaf is an object key, so the array branch is reachable
  but not on any documented path.
- Accepted: a caller that wanted a hole cannot get one through this function. Nothing in the document
  model has a use for one.

### Alternatives rejected
- `delete` on both: produces a value that does not survive `serialize`/`parse`, which
  `FILE_FORMAT.md` § Testing asserts against.
- Set the index to `null`: silently changes the array's length semantics from "n items" to "n slots",
  and every consumer would need a null check the schema does not describe.

## ADR-014 — `assertDefined` returns the value; `invariant` narrows in place

**Date** 2026-08-05 · **Prompt** 03 · **Status** Accepted

### Question
Prompt 03 lists `assertNever`, `invariant`, and `assertDefined` without signatures. TypeScript offers
two shapes for the last one: an `asserts value is T` predicate, or a function returning `T`.

### Criterion
`noUncheckedIndexedAccess` is on and stays on (`CODE_STANDARDS.md` § Compiler configuration), so the
dominant shape in this codebase is narrowing the result of an index access — `doc.nodes[id]`,
`ladder[i]`, `ramp[step]`. The signature that serves that shape without forcing an intermediate
variable wins. Where both work, prefer the one that composes.

### Measurement
An `asserts` signature cannot narrow an expression: `assertDefined(nodes[id], '…')` narrows nothing,
because there is no name to narrow. It requires `const node = nodes[id]` first, at which point
`if (!node) throw …` — the pattern `CODE_STANDARDS.md` § Banned already prescribes for the `!`
exception — is shorter than the assertion call. A returning signature works in both positions:
`const node = assertDefined(nodes[id], '…')`.

The statement position is not left uncovered: `invariant(condition, message): asserts condition`
handles narrowing a name, which is what an `asserts` signature is good at.

### Decision
```ts
export function assertDefined<T>(value: T | null | undefined, message: string): T
export function invariant(condition: unknown, message: string): asserts condition
```

### Consequences
- Accepted: two functions that overlap in what they can express. They do not overlap in where they
  can be used, which is the reason both exist.
- Accepted: `assertDefined` is not an assertion function, so it will not narrow a variable in the
  enclosing scope. `invariant` is there for that.

### Alternatives rejected
- `assertDefined` as `asserts value is NonNullable<T>`: cannot be applied to an index access, which
  is the case it exists for.
- Only `invariant`: every index access would need an intermediate variable, which is the boilerplate
  `noUncheckedIndexedAccess` is already blamed for.

## ADR-015 — The colour helpers take and return colour strings, not an RGB type

**Date** 2026-08-05 · **Prompt** 03 · **Status** Accepted

### Question
`relativeLuminance` is WCAG-defined on sRGB channel values. Does `packages/utils` export an `Rgb`
type for it, or does the function take a colour string like its neighbours?

### Criterion
A public type is justified by a caller that holds a value of that type. Prompt 00 § Do not forbids
abstraction without one.

### Measurement
Grepped `docs/` for every documented call into this module: `contrastRatio(tokens[mode][fg],
tokens[mode][bg])` (`ACCESSIBILITY.md` § Contrast tests — CSS colour strings from the token set),
and `parseOklch(seed)` / `formatOklch(l, c, h)` / `clampChroma(c, l, h)`
(`THEME_ENGINE.md` § Palette generation). No document holds an RGB triple, and no consumer package
produces one — sRGB exists inside this module only as the space WCAG luminance is defined in.

### Decision
`relativeLuminance(color: string): number` and `contrastRatio(a: string, b: string): number`. The
`Oklch` interface is exported, because `parseOklch` returns one and `THEME_ENGINE.md` destructures it.
The sRGB conversion is module-private.

### Consequences
- Accepted: `relativeLuminance` re-parses its input on every call, so `contrastRatio` parses twice.
  Two parses of a short string per contrast check, against a token set of ~48 colours checked once per
  theme resolution, which `THEME_ENGINE.md` § Application already memoises on a config hash.
- Accepted: a future caller that genuinely holds sRGB channels — a canvas pixel probe, say — would
  need the private converter exported. That is a one-line change when a caller exists.

### Alternatives rejected
- Export `Rgb` and have `relativeLuminance` take it: adds a third colour representation to the public
  surface with no caller, and makes the documented `contrastRatio(string, string)` call sites in
  `ACCESSIBILITY.md` compose two functions instead of one.

## ADR-016 — `deepEqual` compares JSON-shaped values with `Object.is` at the leaves

**Date** 2026-08-05 · **Prompt** 03 · **Status** Accepted

### Question
`deepEqual` has no specified scope. Does it handle `Date`, `Map`, `Set`, `RegExp`, cyclic references,
and class instances? And is `NaN` equal to `NaN`?

### Criterion
The values this function compares are document values. `FILE_FORMAT.md` defines the `.motion` file as
JSON and § Testing requires `parse(serialize(doc))` to deep-equal `doc`. So the scope is exactly what
survives a JSON round-trip; anything wider is a branch with no caller, and every branch has to be
covered to hold the package's 90 % branch floor.

### Measurement
What JSON round-trips: `null`, boolean, number, string, array, plain object. What does not: `Date`
(becomes a string), `Map`, `Set` (become `{}`), `RegExp` (becomes `{}`), `undefined` (dropped from
objects, becomes `null` in arrays), a cycle (throws). `NaN` and `Infinity` serialise to `null`, so a
document containing either is already invalid before `deepEqual` sees it.

### Decision
Compare `null`, booleans, numbers, strings, arrays, and plain objects. Leaves compare with
`Object.is`, so `NaN` equals `NaN` and `+0` does not equal `-0`. Any other object type compares by
reference, which is what `Object.is` gives it, and there is no cycle detection.

### Consequences
- Accepted: `deepEqual(new Date(0), new Date(0))` is `false`. A caller comparing dates is comparing
  something that is not in the document model, and getting `false` is louder than getting a silently
  date-aware answer from a function documented as JSON-shaped.
- Accepted: a cyclic input overflows the stack rather than returning a result. Cycles cannot reach
  this function from a parsed document, because `JSON.parse` cannot produce one.
- Accepted: `Object.is` at the leaves means `+0 !== -0`. Both serialise to `0`, so a round-tripped
  document never distinguishes them; a caller comparing pre-serialisation values can.

### Alternatives rejected
- Structural comparison of `Date`/`Map`/`Set`/`RegExp`: four branches, no caller, and each one has to
  be tested to hold the branch floor — coverage bought for a case the document model cannot contain.
- `===` at the leaves: makes `deepEqual(NaN, NaN)` false, so a document that somehow held `NaN` would
  never compare equal to itself, which is a worse failure than the `-0` asymmetry.

## ADR-017 — Biome's `useLiteralKeys` is off: it contradicts `noPropertyAccessFromIndexSignature`

**Date** 2026-08-05 · **Prompt** 03 · **Status** Accepted

### Question
`complexity/useLiteralKeys`, on by default in Biome's recommended set, reported
`nodes['a']` as simplifiable to `nodes.a`. Which of the two tools is right?

### Criterion
`CODE_STANDARDS.md` § Compiler configuration fixes `noPropertyAccessFromIndexSignature: true`, and
prompt 02 § Constraints requires `base.json` to hold exactly those flags. A lint rule that
contradicts a fixed compiler flag cannot be satisfied, so the question is not which is better but
whether the contradiction is real.

### Measurement
Wrote the form the lint rule asks for and compiled it:

```ts
const nodes: Record<string, { id: string }> = { a: { id: 'a' } }
export const value = nodes.a
```

```
error TS4111: Property 'a' comes from an index signature, so it must be accessed with ['a'].
```

The rule's fix does not compile. Biome 1.9 offers no option to exempt index-signature types from the
rule, so it cannot be narrowed — only turned off.

### Decision
`complexity/useLiteralKeys: "off"` in `packages/config/biome.json`.

### Consequences
- Accepted: `obj['literal']` on a type *without* an index signature is no longer flagged, so a
  needlessly bracketed access can now reach `main`. `noPropertyAccessFromIndexSignature` does not
  object to it either, so nothing catches it but review.
- Accepted: the rule is off everywhere rather than in tests only. The document model is
  `Record<NodeId, Node>` (`EDITOR_ENGINE.md` § Why normalized), so index-signature access is the
  common shape in source as well as in tests, and a test-only override would be the narrower half of
  the same contradiction.

### Alternatives rejected
- Drop `noPropertyAccessFromIndexSignature`: it is one of the flags `CODE_STANDARDS.md` fixes, and it
  is the one that makes a missing key visible at the call site. Removing a compiler check to satisfy a
  style rule inverts their value.
- Restructure the code the rule flagged to use a `Map`: it was a test asserting that `assertDefined`
  narrows an index access, which is the case the function exists for. Changing the subject of a test
  to satisfy a lint rule tests the lint rule.

## ADR-018 — The missing token tables were authored into `DESIGN_SYSTEM.md` by derivation

**Date** 2026-08-05 · **Prompt** 04 · **Status** Accepted

### Question
Prompt 04 says "the exact ramps and semantic mappings are the tables in `docs/DESIGN_SYSTEM.md` — use
those values, do not invent your own". The tables were incomplete: 72 chroma values across six hues,
21 of 33 semantic mappings per mode, `CHROMA_CURVE`, `HUE_SHIFT_CURVE`, three of four elevation
styles, ten gradient preset definitions, and the noise asset were all absent.

### Escalated
Options presented: (a) the owner writes the missing tables into `DESIGN_SYSTEM.md`, and a later
session transcribes them mechanically; (b) the owner approves a derivation criterion and the
implementer applies it. Recommendation given: (a), because the values are the owner's design rather
than the implementer's inference.

Owner decided on 2026-08-05. Owner's stated reason, verbatim: "вариант (а), дополни DESIGN_SYSTEM.md
сам" — option (a), fill in DESIGN_SYSTEM.md yourself.

So the choice of route was the owner's; the values were delegated. Every family below is therefore
derived from a criterion recorded in the document beside it, never picked by eye, so the owner can
disagree with a rule rather than with a hundred numbers.

### Decision
`docs: complete the token tables in the design system` adds, each with its criterion:

1. **`CHROMA_CURVE`** — `NEUTRAL`'s own chroma curve normalised to its peak. That is the only chroma
   curve the document fixed, and it already "peaks around step 500".
2. **The six chromatic ramps** — `min(REFERENCE_CHROMA[hue] × CHROMA_CURVE[i], 0.95 × gamut
   boundary at that lightness)`, where `REFERENCE_CHROMA` is 95 % of the boundary at step 500.
   Measured with `clampChroma` from `packages/utils`.
3. **`HUE_SHIFT_CURVE`** — linear from +1 at the lightest step to −1 at the darkest, zero across the
   chroma peak. Applies to generated palettes only; the shipped ramps stay hue-constant like `NEUTRAL`.
4. **The 21 missing semantic mappings** — each chosen by a measured contrast threshold or by a stated
   positional rule, both recorded in the table's new "Why this step" column.
5. **The three missing elevation styles** — stated transforms of `soft`, written out in full.
6. **The ten gradient presets** — stops as ramp references, with a measured `readable` foreground or
   an explicit `null`.
7. **The noise asset** — a 342-byte `feTurbulence` data URL, with the reason for each parameter.

### Measurement
Ramps: the per-step clamp is not a refinement, it is required. A single global scale that keeps every
step in gamut is bounded by the lightest step, where violet's widest chroma is 0.007 — that scale
crushes `violet.500` from 0.229 to 0.048, a grey. Measured and discarded before the per-step form was
written.

Semantics, the corrections the measurements forced:
- Light `foreground-subtle` was documented as `neutral.400`: **2.67 : 1** on `surface-1`, below even
  3 : 1. Moved to `neutral.500` (4.28 : 1) and placed in `UI_PAIRS` under a stated duplication rule.
- Dark status colours at step 500 fail on their own muted background for every hue (3.87–4.49 : 1).
  Step 400 passes for all six (6.40–7.10 : 1), so dark status is 400.
- `accent-ring`: minimum across all five surfaces is 6.26 : 1 for `violet.600` in light and 5.41 : 1
  for `violet.400` in dark. `violet.500` in dark gives 3.21 : 1 and was rejected.
- Gradients: seven of the first ten preset drafts had **no** foreground clearing 4.5 : 1 at both
  extremes. Four were kept vivid and marked `readable: null`; six were pulled into one half of the
  ladder and now measure 6.47–15.31 : 1.

### Consequences
- Accepted: these are the implementer's derivations, not the owner's picks. The criteria are in the
  document next to the values, so a disagreement lands on one rule and re-derives its family.
- Accepted: **`border`, `border-subtle`, `border-strong`, `canvas-grid`, and the surface steps cannot
  meet the document's own "non-text UI ≥ 3 : 1" line.** Measured: 1.11–1.91 : 1. Reaching 3 : 1 on a
  hairline against white needs about `neutral.500`, which is a mid-grey rule and would replace the
  surface language the document is calibrated to. They are declared texture, with a compensating rule
  — no control is identified by its border alone. This is the one item in this entry the owner should
  read as a real trade rather than a derivation, and it is written up in § What is deliberately
  exempt.
- Accepted: a shared lightness ladder leaves `amber` and `cyan` far less chromatic at step 500 than
  `violet` or `rose`; `amber.500` reads closer to bronze than to yellow. Noted in the document. A
  per-hue ladder would fix it and would break the theme engine's hue substitution.
- Accepted: no visual side-by-side against impeccable.style has happened yet. The values are
  contrast-correct and internally consistent; whether they are *good* is the swatch-grid check in
  prompt 04's Verify, which the session that transcribes them must perform and report.
- Avoided: a hundred values with no recorded reasoning, which is what filling the gap by preference
  would have produced.

### Alternatives rejected
- Leave prompt 04 blocked: the owner resolved the escalation, so the block is gone.
- Derive in code and let the code be the specification: `THEME_ENGINE.md` § Palette generation already
  reads the curves as data, and a reader comparing document to implementation needs the numbers in
  one place. The document is that place.

## ADR-019 — The dark accent ladder ascends, and `foreground-onAccent` is per mode

**Date** 2026-08-05 · **Prompt** 04 · **Status** Accepted · **Amends** ADR-018

### Question
`DESIGN_SYSTEM.md` § Semantic tokens contradicted its own contrast contract. The table set dark
`accent-hover` to `violet.400` and `accent-active` to `violet.300` — "one ramp step toward higher
contrast against the mode's surfaces" — while `foreground-onAccent` was `white` in both modes and
`TEXT_PAIRS` requires `['foreground-onAccent', 'accent-hover']` and
`['foreground-onAccent', 'accent-active']` at ≥ 4.5 : 1. Transcribing the table as written produces a
red contrast suite, and prompt 04 says to adjust the token rather than the test.

### Criterion (set before measuring)
Two thresholds already in the document, both of which the resolution must hold:

1. `foreground-onAccent` on each of `accent`, `accent-hover`, `accent-active`: **≥ 4.5 : 1**
   (§ Contrast contract, body text).
2. Each accent fill against all five surfaces of its own mode: **≥ 3 : 1** (§ Contrast contract,
   non-text graphics that carry information — a fill is how a primary button is identified, and the
   § exempt list covers hairlines and surface steps, not fills).

An option failing either is rejected. Where both hold, prefer the one that also keeps the positional
rule the table states in prose.

### Measurement
`violet.500` is the crossover: `white` on it is 4.70 : 1, `neutral.1000` on it is 4.39 : 1. No single
foreground spans a ladder that crosses it, which is why the table could not be transcribed as written.

Foreground on each step, dark mode:

| Step | `white` | `neutral.1000` | vs `surface-1` | vs `surface-3` |
| --- | --- | --- | --- | --- |
| `violet.200` | 1.25 | 16.46 | 15.87 | 12.01 |
| `violet.300` | 1.55 | 13.33 | 12.85 | 9.73 |
| `violet.400` | 2.79 | 7.41 | 7.14 | 5.41 |
| `violet.500` | 4.70 | 4.39 | 4.23 | 3.21 |
| `violet.600` | 7.81 | 2.64 | 2.55 | 1.93 |
| `violet.700` | 11.59 | 1.78 | 1.72 | 1.30 |

- **Ascending ladder** (`accent` 400 → `hover` 300 → `active` 200, foreground `neutral.1000`):
  criterion 1 gives 7.41 / 13.33 / 16.46; criterion 2's worst case is 5.41. Both hold.
- **Descending ladder** (`accent` 500 → `hover` 600 → `active` 700, foreground `white`): criterion 1
  gives 4.70 / 7.81 / 11.59 — holds. Criterion 2 gives 1.93 for `violet.600` and 1.30 for
  `violet.700` against `surface-3` — **fails**. A pressed primary button sits on the popover it
  belongs to and cannot be told apart from it.
- **Documented ladder unchanged** (`accent` 500 → 400 → 300, foreground `white`): criterion 1 gives
  2.79 and 1.55 — **fails**, which is the defect.

### Escalated
The choice of route was put to the owner: amend the table's accent rows, or amend the
`foreground-onAccent` row. Options were presented with the numbers above; the recommendation was the
ascending ladder, as the only candidate holding both thresholds.

Owner decided on 2026-08-05. Owner's stated reason, verbatim: "Решай сам по критерию" — decide it
yourself against the criterion.

### Decision
`docs: correct the dark accent ladder against its own contrast contract` amends
`DESIGN_SYSTEM.md` § Semantic tokens:

- dark `accent` `violet.500` → `violet.400`, `accent-hover` `violet.400` → `violet.300`,
  `accent-active` `violet.300` → `violet.200`
- `foreground-onAccent` becomes `white` in light and `neutral.1000` in dark
- the prose rule is restated as a direction rather than a mirror: the ladder moves *away* from the
  mode's surfaces in lightness, and `foreground-onAccent` is the far end of the neutral ramp
- rule 1's example is re-grounded: `violet.500` at 4.23 : 1 on dark `surface-1` is now the case a
  *generated* palette hits, since `accent` is placed from the seed's own lightness

Light mode is unchanged: it already descended 600 → 700 → 800 under `white` and measures
7.81 / 11.59 / 15.99.

### Consequences
- Accepted: `foreground-onAccent` is no longer one value for both modes. That is what the token is
  for — a component writes `text-foreground-onAccent` on an accent fill and it resolves per mode —
  but the document's old claim that `white` was "the only value clearing 4.5 : 1 on both modes'
  accent" is gone, and the row now carries two values.
- Accepted: dark `accent` and dark `accent-ring` are both `violet.400`, as light `accent` and
  `accent-ring` are both `violet.600`. The tokens stay separate because only `accent-ring` carries a
  guarantee against surfaces, and only `accent-ring` is what contrast repair
  ([THEME_ENGINE.md](THEME_ENGINE.md) § Contrast repair) may move. A reader seeing two names on one
  value should read it as a coincidence of the shipped palette, not as duplication to collapse.
- Accepted: dark `accent` is one step less saturated in appearance than `violet.500` was. The dark
  primary button is lighter and reads slightly softer against the chrome than the original table
  intended.
- Avoided: a red contrast suite, or the same suite with two pairs deleted to make it green — which
  the prompt names explicitly as the wrong repair.

### Alternatives rejected
- Descending dark ladder: fails criterion 2 at 1.93 : 1 and 1.30 : 1, measured above.
- Drop the two pairs from `TEXT_PAIRS`: prompt 04, § The contrast test is the point of this prompt —
  "if a pair fails, adjust the token, not the test".
- Give `accent-hover` and `accent-active` their own `foreground-on*` tokens: three foreground tokens
  for one fill family, and every button would have to know which state it is in to pick a text
  colour. The ascending ladder makes one token correct for all three.

## ADR-020 — Line endings are pinned to LF by `.gitattributes`

**Date** 2026-08-05 · **Prompt** 05 · **Status** Accepted

### Question
`core.autocrlf=true` is the Windows default, and the repository had no `.gitattributes`. Whose job is
it to keep the working tree LF — every contributor's git config, or the repository?

### Criterion (set before measuring)
`pnpm lint` must pass on a fresh clone, on every platform, before any edit. If it does not, the lint
gate this prompt wires into CI is a gate that fails for reasons unrelated to the change under review,
which is how a gate gets ignored.

### Measurement
Biome is configured `formatter.lineEnding: "lf"` (`packages/config/biome.json`) and treats a CRLF file
as unformatted. Reproduced during this session's own gate demonstrations: reverting three manifests
with `git checkout` rewrote them CRLF, and `biome check` then reported every line of
`packages/hooks/package.json` as needing to be rewritten — `pnpm lint` failed in 3 of 15 packages.
Four files in the tree were CRLF at that point, including `apps/web/next-env.d.ts`.

With `* text=auto eol=lf` in place, deleting and re-checking-out those four files produced LF, and
`pnpm lint` and `pnpm typecheck` both returned 15 of 15 successful.

### Decision
Commit a `.gitattributes` that pins `* text=auto eol=lf`, marks binary asset extensions binary, and
flags `pnpm-lock.yaml` as generated so it is not diffed as prose. `apps/web/src/styles/theme.css` gets
an explicit `text eol=lf` line: it is compared byte for byte against a fresh generator run
(ADR-018's transcription work, `packages/tokens/src/build/generate.test.ts`), and a line-ending
rewrite would break that comparison in a way the diff makes hard to see.

### Consequences
- Accepted: a contributor whose editor writes CRLF will see git normalise on commit rather than an
  error. That is the intended behaviour, but it does mean the working tree and the editor can disagree
  until the file is saved again.
- Accepted: this fixes a class of failure rather than the three files that exposed it. The repository
  now states its own line-ending policy instead of depending on each machine's `core.autocrlf`.
- Avoided: a CI gate that fails on a fresh Windows clone for a reason that has nothing to do with the
  change being reviewed.

### Alternatives rejected
- Ask contributors to set `core.autocrlf=false` or `input`: unenforceable, and `CONTRIBUTING.md` § Setup
  would have to carry a git-config instruction that a gate cannot check.
- Relax Biome to accept either line ending: the formatter would then produce different bytes on
  different platforms, and `pnpm lint` would stop being a statement about the repository.

## ADR-021 — The theme's motion scale and the environment's are two variables

**Date** 2026-08-05 · **Prompt** 06 · **Status** Accepted

### Question
`THEME_ENGINE.md` § Motion scale had the reduced-motion media query and `applyTheme` writing the same
custom property, `--ms-motion-scale`. `applyTheme` writes with `style.setProperty` on the root
element. Does the media query still win?

### Criterion (set before measuring)
`ENGINEERING_CONTRACT.md` § 1.6: `prefers-reduced-motion` is honoured everywhere, no exceptions. So:
with the OS preference set to reduce, a resolved duration must be `0` **after** a theme is applied. If
it is not, the single-variable design is wrong regardless of how it reads.

### Measurement
Chrome headless with `--force-prefers-reduced-motion`, `matchMedia('(prefers-reduced-motion: reduce)')`
confirming `true`, reading `getComputedStyle` after an inline `setProperty`:

| Form | Resolved duration |
| --- | --- |
| One shared `--ms-motion-scale`, media query sets `0`, theme writes `1` inline | `calc(240ms * 1)` |
| Two factors: theme writes `--ms-motion-scale: 1`, media query sets `--ms-reduced-motion: 0` | `calc(240ms * 1 * 0)` |

The first form fails the criterion outright: an inline declaration outranks every author rule,
including one inside a media query, so applying *any* theme returned a reduced-motion user to full
animation — silently, and on the very code path the document called "not a separate branch".

### Decision
Durations are `calc(<base>ms * var(--ms-motion-scale) * var(--ms-reduced-motion))`.
`--ms-motion-scale` is the theme's factor and is what `applyTheme` writes. `--ms-reduced-motion`
defaults to `1` in `:root` and is set to `0` by the media query; the theme engine never writes it.
`THEME_ENGINE.md` § Motion scale and its § Variable groups table are corrected to match, and
`packages/tokens/src/build/to-css.ts` emits the factored form.

### Consequences
- Accepted: two variables where the document described one, and a `calc()` with two multiplications in
  every duration. The cost is one extra custom property; the alternative was a broken accessibility
  guarantee.
- Accepted: the studio's "preview reduced motion" toggle writes `--ms-reduced-motion: 0` inline, and
  that inline write is *also* the only way to override an OS preference in the other direction. That
  is deliberate and confined to the preview toggle.
- Accepted: `motionScale: 0` and the media query now zero durations independently. Either alone is
  sufficient, which is the property the document wanted.

### Alternatives rejected
- Have `applyTheme` read `matchMedia` and fold the environment into the value it writes: the engine
  would then have to re-resolve and rewrite on every preference change, and a scoped `<ThemeScope>`
  would need the same listener. CSS already does this correctly for free.
- Write the variable on a class or attribute instead of inline: `applyTheme` accepts any element for
  scoped themes, so the values have to be inline on that element. Not available.

## ADR-022 — Hue angles and chroma for the six `NeutralHue` families

**Date** 2026-08-05 · **Prompt** 06 · **Status** Accepted

### Question
`THEME_ENGINE.md` § ThemeConfig names six neutral families — `slate`, `zinc`, `stone`, `gray`, `warm`,
`cool` — and no document gives any of them a hue angle. `packages/tokens` ships exactly one neutral
ramp, at hue 265. What are the other five?

### Criterion (set before measuring)
1. `slate` **is** the shipped `NEUTRAL` ramp, because `studio-dark` is the default preset and the
   default must not change what prompt 04 already generated and contrast-verified.
2. No two families may resolve to the same twelve strings — a name that renders identically to another
   name is a control with no effect.
3. Every family must pass the full `TEXT_PAIRS` and `UI_PAIRS` gate in both modes, at every step the
   semantic map references. A family that needs contrast repair to be usable is not a neutral.
4. The set must cover both temperature directions, since the names promise it: at least two families
   warmer than `slate` and at least two cooler or equal.

### Measurement
Hue at neutral chroma is a small effect by construction — `REFERENCE_CHROMA.neutral` is 0.014 — so
criterion 2 is met by hue *or* by chroma. `gray` takes chroma 0, which makes it the one family that is
achromatic at every step and therefore distinct from all five others regardless of angle.

Assigned, then verified against criteria 2 and 3 by `resolve/neutral.test.ts`:

| Family | Hue | Chroma multiplier | Reads as |
| --- | --- | --- | --- |
| `slate` | 265 | 1 | The shipped ramp. Cool blue-grey |
| `cool` | 230 | 1.15 | Distinctly cool, toward cyan |
| `zinc` | 285 | 0.7 | Barely cool, toward violet |
| `gray` | 0 | 0 | Achromatic |
| `stone` | 75 | 0.7 | Barely warm |
| `warm` | 45 | 1.15 | Distinctly warm, toward amber |

The warm/cool pairs mirror each other in strength (0.7 for the subtle pair, 1.15 for the pronounced
one), so the control reads as a temperature axis with a neutral centre rather than six unrelated names.
All six pass the gate in both modes; the measured minima are in the test's own assertions.

### Consequences
- Accepted: these are the implementer's angles, not the owner's. The criteria are stated, so a
  disagreement lands on one row and re-derives that family rather than the whole table.
- Accepted: `gray` at chroma 0 cannot express `accentHueShift` on its neutrals — there is no chroma to
  shift. That is what "achromatic" means, and it is the point of offering it.
- Accepted: the differences between `zinc`, `slate` and `stone` are deliberately small. At 0.014 peak
  chroma no neutral family can be loud, and one that were would stop being a neutral.

### Alternatives rejected
- Copy Tailwind's neutral hues: their scales are tuned in a different colour space against a different
  lightness ladder, so the numbers would not transfer and the names would imply a match we had not
  verified.
- Offer one neutral and drop the control: it is in `ThemeConfig` in the document, and cutting a
  documented control is the owner's decision, not the implementer's.

## ADR-023 — A seed carries relative saturation, not absolute chroma

**Date** 2026-08-05 · **Prompt** 06 · **Status** Accepted

### Question
`THEME_ENGINE.md` § Palette generation says the seed's lightness picks which step becomes `accent` and
is otherwise ignored, and its snippet derives chroma as `CHROMA_CURVE[i] * saturation *
(c / REFERENCE_CHROMA)`. Two problems. The snippet is dimensionless where `clampChroma` wants absolute
chroma — at `c = REFERENCE_CHROMA` it asks for chroma 1.0 and every step clips to the boundary. And
`REFERENCE_CHROMA` is a per-hue table for the seven shipped hues, while a seed may be any hue at all.
What does the seed's chroma actually mean?

### Criterion (set before measuring)
1. Seeding with a step of a shipped ramp must reproduce that ramp, to the three decimals the tables in
   `DESIGN_SYSTEM.md` carry. The document asserts this property — "the shipped ramps and a generated
   palette have the same character" — so it is testable, not aspirational.
2. Both accent steps the semantic table fixes must be reachable from a legal seed by the
   seed-lightness rule: **600** in light and **400** in dark (ADR-019).
3. The rule must be defined for any hue, without a per-hue table.

### Measurement
The gamut ceiling moves with lightness far more than the curve does: at 70 % lightness the widest
violet is 0.164 and at 58 % it is 0.241. `violet.400` and `violet.500` are therefore *both* as
saturated as their own lightness allows while differing by 0.073 in absolute chroma. Read absolutely,
the same colour picked from the light end of a ramp generates a duller ramp than picked from the middle
— which fails criterion 1 by construction.

Reading it relatively — `seedSaturation = chroma / (0.95 × gamutBoundary(lightness, hue))` — and then
deriving `chroma[i] = min(seedSaturation × 0.95 × gamutBoundary(L₅₀₀, hue) × CHROMA_CURVE[i],
0.95 × gamutBoundary(Lᵢ, hue))`, measured worst-case chroma delta against the shipped ramps:

| Seed | Relative saturation | Accent step | Worst Δchroma vs shipped |
| --- | --- | --- | --- |
| `violet.400` | 1.000 | 400 | 0.0005 |
| `violet.500` | 1.000 | 500 | 0.0005 |
| `oklch(46.5% 0.2592 285)` | 1.000 | 600 | 0.0005 |
| `oklch(70% 0.156 285)` | 1.000 | 400 | 0.0005 |
| slate neutral | 0.064 | — | 0.00000 |

0.0005 is one unit in the last digit the shipped tables carry, so those are the same numbers. The
neutral family reproduces `NEUTRAL` exactly. An earlier form that rode the ceiling at every step and
dropped `CHROMA_CURVE` was measured at 0.030 and discarded.

`REFERENCE_CHROMA[hue]` falls out as a special case: it *is* `0.95 × gamutBoundary(L₅₀₀, hue)`, which is
how `DESIGN_SYSTEM.md` defines it. The generalised form needs no table.

### Decision
`generateRamp` extracts three things from a seed: its hue, its **relative** saturation, and — through
`accentStepFor` — the step nearest its lightness. The peak chroma is that relative saturation applied
to the hue's own reference chroma, and each step is the curve through that peak, clamped to its own
ceiling. `packages/theme/src/resolve/generate-ramp.ts` states the reasoning next to the code.

The two studio presets take seeds that are fully saturated for their lightness, so each selects its
documented accent step while reproducing `VIOLET`: `oklch(46.5% 0.2592 285)` for light,
`oklch(70% 0.156 285)` for dark.

### Consequences
- Accepted: `studio-light` and `studio-dark` carry different seed strings although
  `THEME_ENGINE.md` § Presets calls them "same palette, light mode". They generate the *same ramp* —
  the seeds differ only in the lightness that selects the accent step, which is precisely what the
  document says lightness is for.
- Accepted: a seed that is not fully saturated for its lightness generates a proportionally duller
  ramp. `violet.600` measures 0.883 and produces a visibly duller violet than the shipped table. That
  is correct behaviour, not a defect: it *is* less saturated than its lightness allows.
- Accepted: the document's snippet is superseded by this. `THEME_ENGINE.md` § Palette generation keeps
  its three numbered details, which are what the function actually implements.

### Alternatives rejected
- Take the snippet literally: every generated ramp rides the gamut boundary and no seed's saturation
  survives. Measured at 0.030 worst-case delta and visibly wrong.
- Keep `REFERENCE_CHROMA` as a lookup and fall back to violet's for unlisted hues: a seed's ramp would
  then depend on whether its hue happened to be one of seven, which nothing could explain to a user.

## ADR-024 — `scaleRatio` and `borderStyle` are exposed but do not regenerate the scale

**Date** 2026-08-05 · **Prompt** 06 · **Status** Accepted

### Question
`ThemeConfig.typography` carries `baseSize` and `scaleRatio`, and `ThemeConfig.surface` carries
`borderStyle`. `THEME_ENGINE.md` § Variable groups lists `--ms-font-*` as "Family + size base + ratio"
and `--ms-text-*` as "Computed size/line-height pairs", and lists no variable at all for border style.
What do these three controls actually change?

### Criterion (set before measuring)
`DESIGN_SYSTEM.md` § Scale is the specification for the type scale. A control may not contradict it. So:
if a control can be implemented without changing any value that document fixes, implement it; if it
cannot, expose the value and escalate rather than invent a formula.

### Measurement
The shipped scale is not a constant-ratio progression. Measured step-to-step ratios across the twelve
fixed sizes:

```
10 → 11 → 12 → 14 → 16 → 18 → 22 → 28 → 36 → 48 → 64 → 80
   1.10  1.09  1.17  1.14  1.13  1.22  1.27  1.29  1.33  1.33  1.25
```

They run from 1.09 to 1.33. No single `scaleRatio` reproduces the table, and 14 × 1.2 = 16.8 where the
document fixes `md` at 16. Regenerating geometrically would therefore replace an authored optical table
with a computed one — which the criterion forbids.

`baseSize` **can** be implemented without contradiction: scaling every fixed size and line height by
`baseSize / 14` preserves the authored proportions exactly, and tracking is in `em` so it is already
proportional and needs no change.

### Decision
- `baseSize` scales the twelve fixed `--ms-text-*` steps and their line heights by `baseSize / 14`. The
  two fluid `display-*` steps are `clamp()` over viewport units — content-page typography rather than
  studio density — and are emitted unchanged.
- `scaleRatio` is emitted as `--ms-font-scale-ratio` and changes no shipped step. It is data for
  consumers that build their own steps and for the theme builder's readout.
- `borderStyle` becomes `--ms-border-width`, by a stated rule rather than a document: `hairline` is one
  device pixel (`1px`), `none` is absent (`0px`), and `solid` is the next integer width that reads as a
  deliberate rule rather than a hairline (`2px`).

### Consequences
- Accepted: **`scaleRatio` is inert.** A user moving that control sees nothing change. This is the one
  item in this entry the owner should read as an open gap rather than a derivation — see the escalation
  in the session report. The alternative was to invent a regeneration formula that contradicts
  `DESIGN_SYSTEM.md` § Scale.
- Accepted: `--ms-border-width` is the implementer's mapping. `1px` and `0px` follow from the words;
  `2px` for `solid` does not, and is the weakest number in this session.
- Accepted: `baseSize: 16` produces one-decimal sizes such as `11.4px`. Sub-pixel font sizes render
  fine and rounding to integers would collide adjacent steps.

### Alternatives rejected
- Regenerate the scale geometrically from `baseSize` and `scaleRatio`: contradicts the measured table
  and would silently change every block's typography.
- Drop the two controls from `ThemeConfig`: they are in the document, and cutting a documented control
  is the owner's decision.

## ADR-025 — The five font pairings

**Date** 2026-08-05 · **Prompt** 06 · **Status** Accepted

### Question
`THEME_ENGINE.md` § ThemeConfig types `pairing: FontPairingId` as `'geist' | 'inter-mono' |
'satoshi-jet' | ...`. Three ids and an ellipsis. What is the set?

### Criterion (set before measuring)
1. `geist` is `DESIGN_SYSTEM.md` § Families verbatim — it is the shipped pairing and the default.
2. The two named ids keep their names and get the stacks their names state.
3. Every pairing supplies all three roles (`sans`, `display`, `mono`) and ends in a generic keyword,
   because `FONT_FAMILY` in `packages/tokens` does and CSS requires the keyword.
4. The set closes with an option that needs no downloaded font, so a document can be built and exported
   with zero font payload.

### Decision
Five: `geist` (the shipped pairing), `inter-mono` (Inter / JetBrains Mono), `satoshi-jet` (Satoshi /
JetBrains Mono), `sohne-berkeley` (Söhne / Berkeley Mono), and `system`. The table is in
`packages/theme/src/resolve/typography.ts` with a label per pairing for the theme builder's dropdown.

### Consequences
- Accepted: four of the five reference fonts this repository does not yet ship. `DESIGN_SYSTEM.md`
  § Families requires self-hosting through `next/font`, so a pairing is not usable until its files are
  added — the ids and stacks are correct, the assets are a later prompt's work. `system` and `geist`
  work today.
- Accepted: Söhne and Berkeley Mono are commercially licensed. Naming an id is not distributing a font,
  but whoever adds the files owes the licence check in `DESIGN_REFERENCES.md` § The licence check.
- Accepted: the ellipsis in the document meant the set was open. Five is the implementer's closure.

### Alternatives rejected
- Ship only `geist` and `system`: the document names three ids, and dropping two named ones is a scope
  cut, which is the owner's decision.

## ADR-026 — The system colour preference is CSS, not the blocking script

**Date** 2026-08-05 · **Prompt** 06 · **Status** Accepted

### Question
Prompt 06 requires the blocking colour-mode script to be under 300 bytes and to "not reference anything
outside `document` and `localStorage`". Resolving a `system` preference before first paint appears to
need `matchMedia`, which is neither.

### Criterion (set before measuring)
Both constraints hold, and there is no flash of the wrong theme — including on a first visit, where
nothing is stored yet. A solution that satisfies the byte limit by flashing has not solved the problem
the script exists for.

### Measurement
The generated stylesheet already emits a full dark block. Emitting it a second time under
`@media (prefers-color-scheme: dark)` for `:root:not([data-color-mode])` costs 33 declarations and
resolves the system preference with no script at all — the browser applies it during the first style
pass, before any JavaScript runs. The script then has exactly one job: apply a *stored* choice, which
needs only `localStorage` and `document`.

Resulting script, 139 bytes:

```js
try{var m=localStorage.getItem('ms-color-mode');if(m==='light'||m==='dark'){document.documentElement.dataset.colorMode=m}}catch(e){}
```

### Decision
`packages/tokens/src/build/to-css.ts` emits the media-query variant of each non-default mode block, and
`COLOR_MODE_SCRIPT` handles stored preferences only. The `:not([data-color-mode])` guard is what makes
the two cooperate: once the script or the engine has set the attribute, the media query stops applying.

### Consequences
- Accepted: the dark declarations appear twice in `theme.css`, which grows the generated sheet. It is
  one generated file and the duplication is derived, not maintained.
- Accepted: system mode now works with JavaScript disabled, which the script-based design could not do.
- Accepted: the script no longer needs `matchMedia`, so prompt 06's constraint holds literally rather
  than by argument.

### Alternatives rejected
- Use `matchMedia` in the script: 84 bytes more and still inside the limit, but it breaks the stated
  constraint and leaves system mode dependent on JavaScript for no gain.
- Default the script to `light` when nothing is stored: a first-time visitor with a dark OS gets a white
  flash on every first page view, which is the exact failure the script exists to prevent.

## ADR-027 — The ten preset configurations

**Date** 2026-08-05 · **Prompt** 06 · **Status** Accepted

### Question
`THEME_ENGINE.md` § Presets lists ten presets, each with a name and a one-line character —
"Deep blue-black, cyan accent, glow elevation" — and none of the seventeen field values a `ThemeConfig`
needs. What are the values?

### Criterion (set before measuring)
1. Every field named in the character line is taken from it literally. `midnight` gets `elevationStyle:
   'glow'` and a cyan accent because the line says so; nothing in a line is reinterpreted.
2. Every preset clears the full `TEXT_PAIRS` and `UI_PAIRS` lists in its own mode, with **no contrast
   repair and no warning**. A preset that needs repairing to be usable is not shipped as a preset —
   `ACCESSIBILITY.md` § Contrast requires the gate over all ten.
3. `studio-dark` and `studio-light` reproduce what `packages/tokens` already ships and verified, so
   applying the default theme changes nothing a reader has already seen.
4. Across the set, all four elevation styles and both colour modes appear, so the list exercises the
   engine rather than restating one configuration ten times.
5. Fields the character line does not mention take the studio default, so a preset differs from the
   default only where the document says it differs.

### Measurement
All ten resolved and measured against both lists: **0 failures, 0 repairs, 0 warnings**, 141 variables
each. The saturation control was then swept across its documented range for every preset — 0.5, 1.0 and
1.5, thirty configurations — because `palette.saturation` reaches the neutral ramp and every surface in
both lists is built from it. All thirty clear both lists; `presets.test.ts` keeps the sweep.

`studio-dark` was checked against criterion 3 by seeding at the lightness that selects step 400 and
riding the gamut ceiling: the generated ramp reproduces `VIOLET` to within 0.0005 chroma (ADR-023), and
its resolved `--ms-color-accent` in the browser is `oklch(70.00% 0.1560 285.00)` — `violet.400`.

### Decision
The table is `packages/theme/src/presets/presets.ts`, each preset carrying the document's character line
as its doc comment so a reader can check the values against the words. Accent seeds are written through
`seedAt(step, hue)`, which states the intent — this step's lightness, fully saturated for it — instead of
twelve opaque `oklch()` strings.

### Consequences
- Accepted: these are the implementer's values, not the owner's. This is the third time this session's
  work has hit the same gap (ADR-018 for the token tables, ADR-025 for the font pairings), and the owner
  has twice resolved it by delegating with a criterion. The criteria are stated so a disagreement lands
  on one preset rather than on a hundred numbers.
- Accepted: `paper` and `aurora` name font pairings whose files the repository does not ship yet
  (ADR-025), so they fall back to the generic keyword until a later prompt adds them.
- Accepted: `mono` has an achromatic accent, which makes `palette.saturation` inert for that preset.
  That is what "no accent hue" means.
- Accepted: no preset needs contrast repair, so the presets do not exercise the repair path. It is
  covered separately in `repair-contrast.test.ts` with a deliberately failing config.

### Alternatives rejected
- Ship two presets and escalate the other eight: the document lists ten and `ACCESSIBILITY.md` requires
  the gate over ten. Cutting eight is the owner's decision, not the implementer's.
- Pick values that need repair and let the engine fix them: it would demonstrate the repair path, and it
  would ship ten presets that each raise a warning chip in the theme builder on load.

## ADR-028 — `test:unit` stops forcing the node environment

**Date** 2026-08-05 · **Prompt** 06 · **Status** Accepted

### Question
The root `test:unit` script was `turbo test -- --environment=node`, and `docs/DEVOPS.md` § Git hooks runs
it on pre-push. `packages/theme` is the first package with component tests, which need `jsdom`. The
override made its whole suite fail with `ReferenceError: document is not defined`, and the failing hook
is what blocked the push.

### Criterion (set before measuring)
A pre-push hook has to be fast enough that nobody reaches for `--no-verify` — the reason the document
gives for keeping the full suite out of hooks. So: if running every package's own suite is fast enough to
stay in a hook, the override has no purpose and goes. If it is not, the split has to be preserved some
other way.

### Measurement
`turbo test` across all 17 packages: **4.91 s cold, 0.35 s on a warm cache**. The pre-push hook as a
whole, typecheck included, measured 9.05 s cold and 3.3 s warm.

Nothing here is near the threshold the document is protecting against, and the override was buying no
measurable time: it ran the same suites, only in the wrong environment.

### Decision
`test:unit` becomes `turbo test`. Each package's `vitest.config.ts` already declares its environment —
`nodeConfig` for the pure packages, `reactConfig` for the ones that render — and that declaration is the
single place the decision belongs. `docs/DEVOPS.md` § Git hooks is amended with the reasoning and the
numbers.

### Consequences
- Accepted: the pre-push hook now runs every package's tests rather than a "unit" subset. At 0.35 s warm
  that is not a cost, and it means a push cannot carry a red suite.
- Accepted: `TESTING.md` § CI ordering still describes `unit` and `component` as separate stages. They are
  not separate scripts today, because no package separates its test files by kind yet. When one does, the
  split belongs in that package's config, not in a workspace-wide flag.
- Accepted: a package that misconfigures its own environment now fails only its own suite, instead of
  being overridden into passing or failing by a root script.

### Alternatives rejected
- Keep the override and exclude the jsdom packages by filter: a hand-maintained list of package names in
  a root script, wrong again the next time a package changes environment.
- Drop tests from pre-push and leave them to CI: the hook's whole value is catching a red suite before it
  reaches a branch, and at 0.35 s there is nothing to trade away.

## ADR-029 — Test matcher types are declared per consuming package

**Date** 2026-08-05 · **Prompt** 08 · **Status** Accepted · **Closes the open item in** ADR-008

### Question
ADR-008 left this unresolved: `packages/config/vitest/setup-react.ts` registers `toHaveNoViolations`
with `expect.extend`, and the declaration typing `jest-axe` lives in `packages/config`, whose files are
not in a consumer's tsconfig program. `packages/ui` is the first package with component tests, so it is
the first place the gap can be closed. The same gap applies to `@testing-library/jest-dom`'s matchers.

### Criterion (set before measuring)
`pnpm typecheck` clean in the consuming package under "zero `any`, no `@ts-ignore`", without a deep
import across a package boundary — the contract's § 1.3 ban — and without weakening the type environment
the way `@types/jest` would (ADR-008's measurement).

### Measurement
Confirmed by running it: with no declaration in `packages/ui`, `tsc --noEmit` reported
`TS7016 Could not find a declaration file for module 'jest-axe'` plus one `TS2339` per jest-dom matcher —
`toBeInTheDocument`, `toHaveAttribute`, `toHaveFocus`, `toBeDisabled`. Nine errors from a suite that
passed at runtime, which is exactly the state ADR-008 predicted.

A single `.d.ts` holding both declarations then produced a **worse** failure:
`Module '"vitest"' has no exported member 'describe'`. The cause is a TypeScript rule worth writing down:
a `.d.ts` with no top-level `import` or `export` is a **global script**, and `declare module 'X'` there is
an ambient module *declaration* that **replaces** the module's types. In a file that is a module, the same
syntax is an *augmentation*. One file cannot be both, and this needs both.

### Decision
Two files in the consuming package, each the right kind:

- `src/test/jest-axe.d.ts` — a global script. Ambient-declares the untyped `jest-axe` surface the package
  uses, and carries `/// <reference types="@testing-library/jest-dom/vitest" />` for the jest-dom matchers.
- `src/test/vitest-matchers.d.ts` — a module, opened with `import 'vitest'`. Augments `Assertion` with
  `toHaveNoViolations`.

With both in place, `tsc --noEmit` is clean and 64 tests pass with two axe assertions per component.

### Consequences
- Accepted: a second package with component tests copies these two files. Reaching across a package
  boundary for a `.d.ts` is the deep import § 1.3 bans, and `packages/config` cannot be in the consumer's
  program without one. Twenty lines is the cost of that rule.
- Accepted: the `jest-axe` surface is now declared in two places, `packages/config` and `packages/ui`. Both
  are two exports wide, and a mismatch surfaces as a type error at a call site rather than silently.
- Accepted: `.stories.tsx` files are added to `coverageExclude` in the shared Vitest preset in the same
  change. Measured: with stories in the denominator `packages/ui` reported 47.8 % lines against its 70 %
  floor; excluded, 77.7 %. Stories are executed by Storybook and never by Vitest, so counting them measures
  how much of Storybook the unit tests happen to run.

### Alternatives rejected
- `@types/jest-axe`: ADR-008 measured it — it pulls `@types/jest`, whose ambient globals shadow Vitest's in
  every file of every consuming package.
- A relative `/// <reference path="../../../config/vitest/jest-axe.d.ts" />`: the deep cross-package reach
  the contract bans, wearing a different syntax.

## ADR-030 — Control glyph sizes are derived from the density scale, not chosen

**Date** 2026-08-07 · **Prompt** 08 · **Status** Accepted

### Question
`UI_GUIDELINES.md` § Density scale sizes rows: top bar, control row, input, small button. It says
nothing about the marks drawn *inside* a row — the checkbox box, the switch track and thumb, the
slider track and thumb. Prompt 08 requires that "every height comes from `density.ts`", and three of
the next components in its fixed order (`switch`, `slider`, `checkbox`) are made almost entirely of
sizes the table does not contain.

### Criterion (set before measuring)
A glyph size is admissible only if all four hold:

1. It is **derived from a number already in § Density scale**, by a stated relation. A number with
   no parent is a preference, and § 9 of the contract bans those.
2. Its interactive target is **≥ 24 × 24 px** — WCAG 2.2 AA § 2.5.8, which `ACCESSIBILITY.md`
   adopts whole in its first line. The glyph may be smaller; the padded hit area may not.
3. It is an **even number of pixels**, so a centred glyph lands on whole pixels inside an
   even-height row rather than on a half-pixel that the browser rounds inconsistently.
4. It **fits the 26 px input band with ≥ 4 px of clearance** top and bottom, so a glyph and a field
   can share a control row without the row growing.

### Measurement
Applying the four rules leaves one candidate per glyph, which is the point of writing them down:

| Glyph | Derivation | Size | Clearance in a 28 px row |
| --- | --- | --- | --- |
| Checkbox box | the panel icon cell (§ Character: "icons are 16 px in panels") | 16 × 16 | 6 px |
| Switch track | small button wide × half a control row tall | 24 × 14 | 7 px |
| Switch thumb | the track inset 2 px per side | 10 × 10 | — |
| Slider track | the panel resize handle (§ Layout: "4 px wide with an 8 px hit area") | 4px | 12 px |
| Slider thumb | half a small button | 12 × 12 | 8 px |

Rule 3 rejects the alternatives that survive rule 1: a 15 px box (icon cell minus a hairline pair),
a 13 px slider thumb (input ÷ 2). Rule 4 rejects the switch track at a full control row of 28 px
tall. Switch thumb travel is 24 − 2 − 10 − 2 = **10 px**, which is the whole width of the thumb, so
the movement is unambiguous at a glance rather than a nudge.

### Decision
`UI_GUIDELINES.md` § Density scale gains a **Control glyphs** subsection carrying the table above,
in its own commit ahead of the code, and `styles/density.ts` transcribes it as `GLYPH` /
`GLYPH_CLASS` beside `DENSITY` / `HEIGHT_CLASS`. `density.test.ts` asserts the numbers against the
document exactly as it already does for the rows.

The 24 × 24 target is produced by padding, never by inflating the glyph: `Checkbox` and `Switch` put
their glyph inside a 24 px square root, and `Slider`'s thumb reaches 24 × 24 through an
`::after` overlay rather than by growing the visible circle.

### Consequences
- Accepted: `UI_GUIDELINES.md` grew a subsection. A prompt is allowed to find a gap in a document,
  and the contract § 9.1 states the only legal response — change the document first, with the
  reasoning — so the alternative was not "keep the document short", it was "put five unfindable
  numbers in a styles file".
- Accepted: the derivations are relations, not formulas, and a reader can disagree with one of them.
  That is the intended failure mode. A recorded relation can be argued with; `w-6` in a class string
  cannot.
- Accepted: an invisible 24 px hit area around a 12 px slider thumb overlaps its neighbours when two
  sliders sit 12 px apart. The inspector's control rows are 28 px, so this cannot occur there; a
  caller stacking sliders tighter than the density scale allows is outside the scale.
- Rejected consequence worth naming: the glyph scale does **not** claim to cover every future
  control. The next component that needs a mark the table lacks repeats this exercise instead of
  reaching for the nearest existing number.

### Alternatives rejected
- **Literal sizes in each component's `.styles.ts`.** Exactly what the prompt's constraint forbids,
  and for the stated reason: the density scale is a design decision, and five copies of it in five
  files is five places for it to drift.
- **A `GLYPH` table in `density.ts` with no document behind it.** Puts the design decision in the
  transcription rather than in the source, and inverts `density.test.ts` — the test would then be
  asserting a file against itself.
- **Inflating the glyphs to 24 px so the target needs no padding.** Measured against the reference:
  a 24 px checkbox in a 28 px row leaves 2 px of clearance and reads as a button, not a mark.
  § Character calls the studio "dense, quiet, precise" and the block card is the only 88 px thing in
  the chrome — a checkbox the size of a small button contradicts that at every row.

## ADR-031 — Controls with no § Timing row animate at 120 ms `standard`, and dragged values not at all

**Date** 2026-08-07 · **Prompt** 08 · **Status** Accepted

### Question
`UI_GUIDELINES.md` § Timing is a ten-row table: hover, press, focus ring, dropdown open/close, dialog
open, panel collapse, tab indicator, toast in, tooltip. `Switch`, `Checkbox` and `Slider` are none of
those. A switch thumb travels, a checkbox mark appears, a slider fill grows — and the table names no
duration for any of them. What do they use?

### Criterion (set before measuring)
Resolution #1 of the contract, applied strictly: an animation takes the duration of the § Timing row
whose **interaction class** it belongs to. A row matches when the thing being animated changes for
the same reason and at the same scale as the row's example. If two rows match, the shorter wins —
§ Timing's own closing line is "chrome animation is feedback, not performance". If no row matches
because the change is not an interaction transition at all, the answer is no animation, not the
nearest number.

### Measurement
Sorting the three controls against the ten rows:

| Change | Matching row | Duration |
| --- | --- | --- |
| Switch track colour, thumb travel | *Hover state* / *Focus ring* — a control restyling itself in place | 120 ms `standard` |
| Checkbox box fill, mark appearance | same class | 120 ms `standard` |
| Slider track and thumb colour | same class | 120 ms `standard` |
| Slider fill width, thumb position | **none** — the value is following a pointer or a key, frame by frame | 0 ms |

Both candidate rows for the first three are 120 ms `standard`, so the "shorter wins" tie-break never
had to fire. The three surviving longer rows are rejected by class, not by taste: *panel collapse*
(200 ms) and *dialog open* (220 ms) animate a container appearing, and *tab indicator* (200 ms) is a
layout animation of an element moving between two other elements — which is `Segmented` and `Tabs`,
and those two already read that row directly.

The last line is the one worth stating. Transitioning a slider's fill width means the fill lags the
pointer by a fixed 120 ms for the whole drag: the number under the cursor and the bar beneath it
disagree continuously, which reads as the control being broken rather than as smoothing. § Feedback
rules requires "every press changes something visually within one frame", and a transition on a
value the user is directly manipulating is the one case where an animation *prevents* that.

### Decision
`Switch`, `Checkbox` and `Slider` transition **colour only**, at `--ms-duration-fast` on
`--ms-ease-standard`, plus the switch thumb's `transform` at the same pair. Slider fill width and
thumb position carry no `transition` property at all.

Both durations read `--ms-duration-fast`, so `motionScale: 0` and `prefers-reduced-motion` zero them
without a branch in any component (ADR-021).

### Consequences
- Accepted: the switch thumb's 10 px travel in 120 ms is quick. That is the point — it is feedback
  for a press that already happened, not a demonstration of the mechanism.
- Accepted: `transition-colors` plus `transition-transform` on the same element would clobber one
  another if written as two utilities, so the switch thumb declares both properties in one
  `transition-[transform,background-color]`. A future edit that adds a third property to the thumb
  must add it there and not as a second `transition-*` class.
- Accepted: a keyboard step on a slider is therefore instant, with no easing between the old and new
  value. Consistent with the drag case, and the alternative — animating key steps but not drags —
  would make the same control behave two ways.
- Accepted: this rule is a reading of § Timing, not an addition to it. § Timing stays ten rows; the
  next control that does not fit re-runs the sort above rather than inheriting "120 because Switch
  is 120".

### Alternatives rejected
- **Add rows to § Timing for switch, checkbox and slider.** Rejected because the sort found real
  matches. ADR-030 amended a document where the answer genuinely was absent; here it is present
  under a different name, and duplicating it into three more rows creates three more places for
  120 ms to drift.
- **Press, 80 ms `accelerate`, for the switch.** That row is the press *feedback* — the scale-down
  under the finger, which `PRESS` in `styles/variants.ts` already owns and which composes with this.
  The thumb travel outlives the press: it is where the control ended up, not the acknowledgement
  that it was touched.
- **A spring for the switch thumb.** § Timing gives a spring to exactly one interaction, *toast in*,
  and § Character asks the chrome to be quiet. A springing toggle in a 28 px inspector row is the
  loudness the reference explicitly does not lend us.

## ADR-032 — A control's "on" state is neutral inversion, not accent

**Date** 2026-08-07 · **Prompt** 08 · **Status** Accepted

### Question
What colour is a checked `Switch` track, a filled `Slider` range, and a checked `Checkbox` box?
Every mainstream tool paints them the accent colour. `UI_GUIDELINES.md` § Character says: "Exactly
**one** accent colour in the chrome, used only for: selection, focus, active tab, and primary
action. Everything else is neutral." A switch that is on is none of those four — but neither is it
obviously excluded, and reading the list as exhaustive changes the look of every inspector row.

### Criterion (set before measuring)
§ Character states the test itself: "screenshot the studio with a document open. Your eye should go
to the user's design, not to our panels." The operative property of the four permitted uses is
**multiplicity at rest**: a panel shows at most one selection highlight, one focus ring, one active
tab, one primary button. So the criterion is countable — accent is admissible for a state only if at
most one instance of it can be visible in a panel at rest. A state that can repeat down a column is
neutral.

### Measurement
Counted against the inspector as `COMPONENT_LIBRARY.md` § Control kinds specifies it. The catalogue
has 20 control kinds; `switch`, `slider` and a `checkbox` appear once per property, and a realistic
Layout + Effects inspector shows **six to ten** of them at once, all at rest, all "on" as often as
not. The four permitted uses cap at one each.

Ten accent bars down a 320 px panel against a canvas holding the user's own colours is precisely the
failure the screenshot test names, and no amount of restraint elsewhere recovers it.

The reference supports the same answer independently. § Character's three reference points are
Linear, Figma and Vercel. Linear and Figma paint toggles accent; **Vercel does not** — its switch
inverts to the foreground colour and its checkbox fills with foreground and cuts the mark out in the
surface colour. § Character borrows "Vercel's typographic discipline", and this is the same
discipline applied to colour: value carries the state, hue is reserved.

The codebase had already answered it twice without saying so, which is why this entry exists now
rather than earlier: `Segmented`'s selected indicator is `surface-2` on `surface-inset`, and
`Select`'s highlighted item is `surface-2`. Both are states, both are neutral.

### Decision
The three state-carrying controls invert in **value**, not in hue, and they all invert to the same
pair so that "on" looks like one idea across the chrome:

| Control | Off | On |
| --- | --- | --- |
| Switch track | `surface-inset` + `border-strong`, thumb `foreground-muted` | `foreground`, thumb `surface-0` |
| Slider range | well is `surface-inset` | fill is `foreground`, thumb `surface-0` ringed `foreground` |
| Checkbox box | `surface-2` + `border-strong` | `foreground`, mark `surface-0` |

`accent` stays where § Character puts it: `Button` variant `primary`, the focus ring
(`accent-ring`), canvas selection, and the active tab.

### Consequences
- Accepted: an "on" switch is the highest-value object in a panel at rest, which is loud in a
  different currency. It is bounded — a 24 × 14 pill — and it is the currency the chrome is allowed
  to spend, because value is what § Character says depth and state come from.
- Accepted: this will read as wrong to anyone arriving from Figma, where an accent toggle is the
  convention. The criterion above is the answer to that objection, and it is falsifiable: if a
  screenshot with a document open draws the eye to the panels, the criterion failed and this entry
  gets superseded rather than quietly patched.
- Accepted: `foreground` as a fill means `foreground-onAccent` is not the mark colour — the mark is
  `surface-0`, the far end of the surface ramp. Contrast is the reverse of the body-text pair, which
  `contrast.test.ts` already measures in both modes, so no new pair enters the matrix.
- Accepted: colour is not the only carrier in any of the three. The switch also travels, the slider
  also fills a proportion, the checkbox also shows a mark — `ACCESSIBILITY.md` § Non-negotiables 4
  holds independently of this decision.

### Alternatives rejected
- **Accent for all three.** Fails the count above. It is also the version this project would produce
  by reflex, which is the reason § Character is written as a list of four rather than as a mood.
- **`accent-muted` — a tinted background rather than a fill.** Softens the count without changing
  it: ten tinted bars is still ten hue events, and `DESIGN_SYSTEM.md` sizes `accent-muted` at
  `surface-2`'s lightness, so an "on" switch would sit at the same value as an "off" one and lose
  the second, non-colour carrier.
- **Accent for `Switch` only, neutral for the rest.** Three controls expressing one concept in two
  visual languages, decided by which one felt too plain on its own.

## ADR-033 — One `transition` declaration per element, written in `chrome.css`

**Date** 2026-08-07 · **Prompt** 08 · **Status** Accepted

### Question
`styles/variants.ts` gives `FOCUS_RING` a `transition-shadow` and `PRESS` a `transition-transform`,
and every control adds `transition-colors` of its own. Three fragments, one element. Does that
compose?

### Criterion (set before measuring)
Compile the classes a shipped component actually emits and read the resulting CSS. It composes if
the element ends up with a `transition-property` naming **every** property the three fragments claim
to animate. Anything less is a defect regardless of how the source reads.

### Measurement
It does not compose, and it fails twice over — once in Tailwind and once before Tailwind ever sees
the string.

**In the stylesheet.** Compiled with `tailwindcss@4.3.3`'s `compile()` API, the three utilities are
emitted in this order:

```
164 .transition-\[transform\,background-color\] { transition-property: transform,background-color }
169 .transition-colors                          { transition-property: color, background-color, … }
174 .transition-shadow                          { transition-property: box-shadow }
```

Same specificity, so the last one wins. An element carrying `transition-colors` and
`transition-shadow` animates `box-shadow` and nothing else.

**In `cn`.** It never even reaches the browser, because `tailwind-merge` resolves the conflict
first — and it keeps the *last* class in the string, which is a different winner. Printing what the
two shipped components actually render:

```
button : … outline-none focus-visible:shadow-focus active:scale-[0.98]
          transition-transform duration-[--ms-duration-fast] ease-[--ms-ease-accelerate] …
input  : … outline-none focus-within:has(:focus-visible):shadow-focus
          transition-shadow duration-[--ms-duration-fast] ease-[--ms-ease-standard] …
```

So on `main` today: **`Button` has no colour transition and no focus-ring transition** — its hover
is a hard cut — and **`Input` has no border-colour transition** on hover or on invalid. The same
holds for `Textarea`, `Select`'s trigger and items, and `Segmented`'s items. `duration` and `ease`
collapse the same way, which is why `Button` currently eases its press on `accelerate` and would
have eased its colours on the same curve if any had survived.

This was invisible in review because each fragment is correct in isolation, and invisible in tests
because a class string containing `transition-colors` looks like a passing assertion.

### Decision
Each element gets exactly **one** `transition`, and it is written in `styles/chrome.css` rather than
assembled from utilities:

- `.ms-transition-control` — `color`, `background-color`, `border-color`, `box-shadow` at
  `--ms-duration-fast` / `--ms-ease-standard`, plus `transform` at `--ms-duration-fast` /
  `--ms-ease-accelerate`. The press curve, for anything that scales under the finger.
- `.ms-transition-travel` — the same four properties, plus `transform` on `--ms-ease-standard`.
  For a mark that moves to a new position rather than reacting to a press: the switch thumb.

`FOCUS_RING` becomes `outline-none focus-visible:shadow-focus` and `PRESS` becomes
`active:scale-[0.98]`. Both keep their meaning and lose the transition they could not deliver.

Two things follow from writing it as CSS rather than as a utility. The shorthand gives each property
its own curve, which a single Tailwind utility cannot express at all — so § Timing's split between
press on `accelerate` and everything else on `standard` survives instead of being rounded off. And
`CODE_STANDARDS.md` § Tailwind already called this: "a repeated arbitrary value is a missing token",
and `duration-[--ms-duration-fast] ease-[--ms-ease-standard]` appeared in eight files.

`styles/chrome.test.ts` asserts every duration in that file is a `var(--ms-duration-*)` and that each
class declares `transition` once, so the same collapse cannot return through the CSS.

### Consequences
- Accepted: importing `@motion-studio/ui/styles.css` is now required for **every** component, not
  only for the overlays. It was already required and already exported; the failure mode changes from
  "popovers do not animate" to "nothing animates", which is more visible, not less.
- Accepted: `chrome.css` is unlayered, so it outranks Tailwind's `utilities` layer. A caller cannot
  override the transition with `transition-none`. That is the intended direction — the timing is a
  design decision, not a per-call-site one — and a component that genuinely must not transition omits
  the class instead.
- Accepted: two classes rather than one, distinguished only by the transform curve. A third would be
  a smell; if one appears, the right move is a custom property for the curve rather than a third
  copy of the property list.
- Accepted: this is a behaviour change to four components already committed. Their hovers start
  animating where they previously cut. That is the fix, but it is a visual change to shipped work and
  is called out rather than folded silently into a new-component commit.

### Alternatives rejected
- **Keep the utilities and write one `transition-[a,b,c]` per component.** Fixes the collapse and
  loses the per-property curve — press would ease on `standard` because the element can only have
  one timing function. Also leaves the repeated arbitrary value CODE_STANDARDS names.
- **Rely on `cn` to resolve it.** It already does, deterministically, to the wrong answer. A merge
  that silently drops two of three intents is not a resolution.
- **A Tailwind plugin adding a `transition-control` utility.** Same result through more machinery,
  and it puts a design timing inside build configuration where nobody reading a component will find
  it.

## ADR-034 — Type-only modules and component barrels leave the coverage denominator

**Date** 2026-08-07 · **Prompt** 08 · **Status** Accepted

### Question
`packages/ui` follows the six-file component layout, so every component contributes a `*.types.ts` and
an `index.ts` alongside its `.tsx` and `.styles.ts`. Both report 0 % coverage and always will. With
eight components built, the package reported **69.93 %** lines against a 70 % floor while every file
holding a statement was at or near 100 %. Is the floor detecting anything?

### Criterion (set before measuring)
A file belongs in the denominator only if a test could, in principle, raise its number. If no test
can — because the file emits nothing, or because what it emits has no branch — then including it
measures the shape of the directory layout rather than the thoroughness of the tests, and the floor
stops meaning what `TESTING.md` § Coverage contract says it means.

The exclusion must not be able to hide real logic: whatever leaves the denominator has to be a file
kind the layout guarantees is trivial.

### Measurement
Both kinds meet the criterion, for different reasons.

`*.types.ts` holds interfaces and type aliases. TypeScript erases them, so the emitted module is
empty and the `import type` in the component is erased too — the module is never loaded at runtime at
all. Its lines cannot be reached by any test that could ever be written.

`index.ts` is re-exports. `src/index.ts` was already excluded on exactly this reasoning, recorded in
the same file; the glob simply predates the six-file layout, which puts a second barrel in every
component directory. This is that rule reaching the files it was written for.

Measured on `packages/ui` at ten test files and 181 tests:

| Denominator | Lines | Branches |
| --- | --- | --- |
| Before | 69.93 % | 82.85 % |
| After | 99.61 % | 86.95 % |

The 30-point jump is the point: nothing about the tests changed between those two rows. The floor was
reading the ratio of type files to component files.

### Decision
`coverageExclude` in `packages/config/vitest/node.ts` gains `src/**/*.types.ts` and widens
`src/index.ts` to `src/**/index.ts`. Applies to every package on either preset, since the layout is
the contract's, not `ui`'s.

### Consequences
- Accepted: a `const` accidentally placed in a `*.types.ts` is now unmeasured. The six-file layout
  gives runtime values their own home in `*.styles.ts`, and a value in a types file is already a
  review finding — but it is a real gap, and it is the price of the exclusion.
- Accepted: `packages/ui` now sits near 100 % against a 70 % floor, which makes the floor
  uninformative in the other direction. That is the correct kind of uninformative: it fires when a
  component ships without tests, rather than when a component ships with types.
- Accepted: barrels are untested by coverage, so nothing catches a component that exists but was
  never re-exported. `src/index.test.ts` closes that specifically — it reads the component directories
  off disk and asserts the package barrel names each one, which is contract § 4 as an assertion rather
  than as a convention.
- Rejected framing worth naming: this is not "lowering the bar to pass". The bar was passing at 69.93 %
  and the fix would have been one more test on a file that already has fourteen. The number was wrong,
  not the work.

### Alternatives rejected
- **Write tests that import the type modules.** There is nothing to import at runtime; a test that
  imports a type and asserts nothing is a line of theatre added to satisfy a counter.
- **Lower the floor to 65 %.** Moves the threshold to match the number, which § 9 names as the same
  defect wearing a lab coat. The threshold is not the thing that is wrong here.
- **Fold types into the component file.** Contradicts the contract § 3 file layout, and trades a
  measurement problem for a structural one.

## ADR-035 — A tooltip names its trigger and hides its own text from assistive technology

**Date** 2026-08-07 · **Prompt** 08 · **Status** Accepted

### Question
Prompt 08 requires that "the tooltip content is also the icon button's `aria-label` source, so the two
cannot drift". Radix additionally points the trigger's `aria-describedby` at the tooltip. Doing both
means a screen reader announces "Undo, button, Undo" — the same word as the name and again as the
description. Which of the two roles does the tooltip text play?

### Criterion (set before measuring)
`ACCESSIBILITY.md` § Non-negotiables 2: every interactive element has an accessible name. Nothing in
that document requires a description, and WAI-ARIA's own guidance is that a tooltip whose text
duplicates the accessible name should not also be exposed as one. So: whichever wiring produces
exactly one announcement of the text while leaving the icon button named.

### Measurement
The studio's tooltips are on icon buttons — `UI_GUIDELINES.md` § Character puts icons in the toolbar
and panels, and an icon has no accessible name of its own. Enumerating the three wirings:

| Wiring | Announced | Named |
| --- | --- | --- |
| `aria-label` + described-by content | "Undo, button, Undo" | yes |
| described-by content only | "button, Undo" | **no** — the name is empty |
| `aria-label` + `aria-hidden` content | "Undo, button" | yes |

Only the third satisfies the criterion. The second is what a tooltip library does by default and it
leaves an unnamed button, which is the non-negotiable this project treats as a build gate.

### Decision
`Tooltip` takes a `label` string, puts it on the trigger as `aria-label` through Radix's `asChild`
merge, and renders the visible bubble `aria-hidden`. The bubble is a visual duplicate of a name that
is already announced.

The optional `shortcut` renders inside the bubble as a `Kbd` and is **not** part of the accessible
name. `SHORTCUTS.md` § Reference sheet is where shortcuts are exposed non-visually: `Mod+/` opens a
generated, searchable list of every one of them. Appending "Command Z" to every icon button's name
would put a modifier glyph reading into every announcement in the toolbar to duplicate a surface that
already exists.

### Consequences
- Accepted: a caller who wraps a trigger that already has a visible text label must pass that same
  text as `label`, or the accessible name will contradict what is on screen — WCAG 2.5.3. The prop is
  required rather than optional so that it cannot be forgotten silently, but nothing enforces that it
  matches.
- Accepted: `aria-hidden` on the bubble means its content is invisible to assistive technology
  entirely, so a tooltip must never be the only place information appears. That is already the rule
  for this chrome: § Interaction feel calls tooltips a hint, not a channel.
- Accepted: a child that sets its own `aria-label` wins, because Radix's `Slot` gives child props
  precedence. An escape hatch, and also a way to get the two out of sync — which is the exact drift
  the prompt asks to prevent. It stays because removing it would mean stripping a prop the caller
  wrote on purpose.

### Alternatives rejected
- **Let Radix describe and require the caller to label the button separately.** That is the drift the
  prompt names: two strings, one visible and one not, that nobody notices disagreeing.
- **Fold the shortcut into the accessible name.** `speakKeys` is macOS-specific by construction, so
  this would need a second platform-aware spoken form, and it would say "Command Z" on a machine
  where the key is Ctrl unless that form were platform-aware too. Cost is real; the reference sheet
  already covers the need.

## ADR-036 — Dialog widths are the panel widths, and the widest one is the viewport bound

**Date** 2026-08-07 · **Prompt** 08 · **Status** Accepted

### Question
Prompt 08 asks `Dialog` for "sizes" and no document names any. Three numbers have to come from
somewhere.

### Criterion (set before measuring)
Same rule as ADR-030, one level up: a width is admissible only if it is a number the layout already
names, or a bound the layout already implies. Two further constraints, both from documents:

1. It must fit the studio's **minimum** viewport. `ACCESSIBILITY.md` § Known limitations and
   `UI_GUIDELINES.md` § Responsiveness both put that at 1024 px, below which the studio declines to
   run at all.
2. It must leave the same 8 px collision padding the other overlays use, at minimum.

### Measurement
`UI_GUIDELINES.md` § Layout names four widths: left panel 240–360 with a default of 280, inspector
280–420 with a default of 320. Building from those:

| Size | Width | Derivation | Margin at 1024 px |
| --- | --- | --- | --- |
| `sm` | 320px | the inspector's default — one column of chrome | 352 px each side |
| `md` | 640px | two of them — a form with a label column and a control column | 192 px each side |
| `lg` | 960px | the viewport bound: 1024 − 32 each side | 32 px each side |

`lg` is not a chosen width, it is the largest one that satisfies constraint 1 with a margin that
still reads as a margin. Below 1024 the studio does not render, so nothing narrower needs handling —
but every size is `max-w`, so a narrower window shrinks the dialog rather than clipping it.

Height is bounded the same way and for the same reason: `max-h` of the viewport less 64 px, with the
body scrolling inside. A dialog taller than the window puts its own buttons out of reach, which is
the one failure mode a confirmation cannot have.

### Decision
Three sizes, `sm` 320, `md` 640, `lg` 960, all as `max-w`. `md` is the default: a dialog with no
stated size is a form, and 320 is only right for a confirmation.

### Consequences
- Accepted: `lg` is pinned to the minimum viewport, not to the target one. On a 2560 px display the
  export dialog uses 37 % of the width and the rest is scrim. The alternative — sizing for the target
  and shrinking for the minimum — makes the dialog a different shape on two machines, and the export
  dialog's file tree is the kind of layout that then needs two designs.
- Accepted: the three numbers stop meaning anything if § Layout's panel widths change. That is the
  intended coupling; the derivation is written down here so the next editor knows to re-run it.
- Accepted: no `xl` and no `full`. A full-screen surface is a route, not a dialog, and `PRODUCT.md`
  gives the two things that would want one — the playground and the docs — their own routes already.

## ADR-037 — The scrub field implements `spinbutton` directly, not through `useNumberField`

**Date** 2026-08-07 · **Prompt** 09 · **Status** Accepted

### Question
`ACCESSIBILITY.md` § Inspector says scrub fields are `role="spinbutton"` "via React Aria's
`useNumberField`", and `TECH_STACK.md` § React Aria names number scrub fields as one of its three
uses. Prompt 09 § `ScrubField` requires that typing `16*2` evaluates. Both cannot be true.

### Criterion (set before measuring)
React Aria wins by default — `TECH_STACK.md` states the rule and it is not up for re-litigation
here. It loses only if the library *mechanically prevents* a behaviour prompt 09 requires, and the
test for "prevents" is reading the shipped code, not guessing at the API surface.

### Measurement
`react-stately@3.49.0`, `dist/private/numberfield/useNumberFieldState.js:164`:

```js
let validate = (value) => numberParser.isValidPartialNumber(value, minValue, maxValue);
```

`useNumberField` runs every keystroke through `state.validate` before it reaches the input's value.
`isValidPartialNumber` accepts a partially-typed *number* in the current locale — sign, digits,
group and decimal separators, currency and percent affixes. `*`, `/`, `(` and `)` are none of those,
so the characters an expression is made of never arrive. There is no option or parser injection
point on `useNumberFieldState` that changes this.

Two of prompt 09's required tests are unreachable through it: expression evaluation, and `Esc`
reverting to the value at focus time — `useNumberField` binds `Escape` to its own
revert-to-last-committed behaviour, which is a different value once a drag has happened.

### Decision
`ScrubField` writes the `spinbutton` role and its four ARIA attributes itself. React Aria keeps the
two jobs where no such conflict exists: `useColorArea` and `useColorSlider` in the colour picker.
`ACCESSIBILITY.md` § Inspector is corrected in the same commit as this entry — the parenthetical
naming `useNumberField` is removed; the ARIA requirements it states are unchanged and still binding.

### Consequences
- Accepted: we own the keyboard and ARIA correctness of the most-used control in the product. The
  mitigation is the test list, not care — `aria-valuetext` including the unit, arrow stepping under
  both modifiers, and `Esc` revert are each an assertion.
- Accepted: no locale-aware number parsing. The field reads and writes `.` as the decimal separator.
  Nothing in `docs/` states a localisation requirement, and inventing one here would be scope the
  owner did not ask for. If it arrives, it arrives as its own prompt against the expression parser.
- Rejected: keeping `useNumberField` and dropping expressions. Prompt 09 lists expression evaluation
  as a required test; cutting a deliverable is the owner's call, not this session's.

## ADR-038 — The shared control contract lives in `control-row/`

**Date** 2026-08-07 · **Prompt** 09 · **Status** Accepted

### Question
Twenty-one value controls share one contract — `value` / `onChange` / `onCommit`, plus the `id`,
label and `mixed` wiring a row hands down. Where does that contract's source file live?

### Criterion (set before measuring)
Contract § 3 permits exactly one thing: a directory per concept, `index.ts` re-exporting, siblings
importing each other only through that barrel. Global rules § Do not forbids scaffolding beyond the
prompt's deliverables. So the contract lives in one of the 25 named directories, and it has to be
the one whose concept it actually is.

### Measurement
Of the 25 deliverable directories, 24 are named after a *value kind* — a colour, a gradient, a list.
Exactly one is named after the relationship between a label and a control: `control-row`. The
alternative is 21 copies of the same interface, and nothing checks that copies stay identical.

### Decision
`control-row/control-row.types.ts` exports `ValueControlProps<T>` and `ControlSlotProps`;
`control-row/control-labels.ts` exports `controlLabelProps`, the function that turns a `label` plus
an optional `labelledBy` into whichever of `aria-label` / `aria-labelledby` is correct. Every other
control imports them from `../control-row/index`.

`ControlRow` passes its slot props through a render function rather than cloning children, because
`id`, `labelledBy`, `describedBy` and `mixed` all have to reach an element the row does not own.

### Consequences
- Accepted: `control-row` is now a dependency of every control, so a change to the contract is a
  change to all of them. That is what a contract is; the alternative hides the coupling rather than
  removing it.
- Accepted: every story and every consumer writes `<ControlRow>{(slot) => …}</ControlRow>`, which is
  noisier than passing a child. It is also the only form in which a `div`-based composite — spacing,
  align, shadow — gets an accessible name at all, since `htmlFor` does nothing for them.

## ADR-039 — Colour values are OKLCH strings or token references, and `utils` gains `formatHex`

**Date** 2026-08-07 · **Prompt** 09 · **Status** Accepted

### Question
Prompt 09 requires React Aria's `useColorArea` / `useColorSlider`, and requires that picking a theme
token stores the reference rather than the resolved value. What string does the picker emit for a
colour that is *not* a token, and who converts?

### Criterion (set before measuring)
One colour language in the repository. `DESIGN_SYSTEM.md` § Colour writes every ramp step in OKLCH,
`packages/tokens` emits OKLCH, and `utils.contrastRatio` — which prompt 09 names as the source of
truth for the picker's readout — parses OKLCH. A second language is admissible only if the first is
mechanically unusable at the boundary.

### Measurement
`react-stately@3.49.0`, `dist/private/color/Color.js:26`:

```js
let res = RGBColor.parse(value) || HSBColor.parse(value) || HSLColor.parse(value);
if (res) return res;
throw new Error('Invalid color value: ' + value);
```

`parseColor` accepts hex, `rgb()`, `hsl()` and `hsb()`, and nothing else. An OKLCH string throws. So
the boundary needs a conversion in both directions, and the only question is where it lives.

`utils/color/color.ts` already holds Ottosson's matrices both ways — `linearRgbToOklch` and
`oklchToLinearRgb` — as module-private functions, and `parseOklch` already accepts hex. Exactly one
direction is missing from the public API: OKLCH out to an sRGB hex string.

### Decision
The picker's value is `{ kind: 'token'; token: string } | { kind: 'color'; value: string }`, where
`value` is an `oklch()` string. `utils` gains `formatHex(color: Oklch): string`, with its own tests,
and the picker converts at the React Aria boundary only.

### Consequences
- Accepted: `formatHex` clamps out-of-gamut OKLCH to the sRGB cube, so a colour authored outside sRGB
  and round-tripped through the picker comes back clamped. Every colour the picker can *produce*
  originates in a react-aria HSB value and is in gamut already; the clamp only bites on a token
  authored outside it, and `clampChroma` exists for exactly that case.
- Accepted: `formatOklch`'s fixed precision — two decimals of lightness, four of chroma — means a
  hex→OKLCH→hex round trip is not bit-exact. It is exact to well under one 8-bit step, which is the
  precision that function was fixed at and for the same reason.
- Accepted: `utils` grew a public function for one caller. The alternative is a second copy of the
  OKLab matrices inside `packages/ui`, which is the failure mode prompt 09 spends a paragraph on for
  `simulateSpring`.

## ADR-040 — A composite control's value is the CSS it produces, proven by a round trip

**Date** 2026-08-07 · **Prompt** 09 · **Status** Accepted

### Question
`ShadowField`, `GradientField`, `SpacingField`, `RadiusField`, `FontField` and `LinkField` each edit
a structure, and no document states what that structure is. `packages/schema` — where a document
model would normally answer this — is prompt 12.

### Criterion (set before measuring)
Prompt 09 § Universal says no control touches the store, so a control's value type is a contract with
its consumer, not with the document. Prefer a shape that is already specified somewhere. Where
nothing specifies one, the admissible shape is the smallest record that round-trips losslessly to the
CSS the property is ultimately written as — that string is the one thing the export engine is certain
to need, and a round trip is checkable.

### Measurement
- `GradientField` — specified. `packages/tokens` already exports `Gradient`, `ColorStop`, `Position`
  and `MeshPoint`, derived from `DESIGN_SYSTEM.md` § Gradients. Reused verbatim; no new type.
- `ShadowField` — unspecified. `packages/tokens`'s `ShadowSet` holds `box-shadow` *strings*
  (`0 2px 4px oklch(0% 0 0 / 0.06), …`), so the layer record is whatever parses out of and prints
  back into that grammar: `{ x, y, blur, spread, color, inset }`.
- `SpacingField` / `RadiusField` — unspecified. Four sides and four corners in CSS shorthand order,
  plus a link flag that is UI state and stays out of the value.
- `FontField` — unspecified. `{ family, size, weight, tracking }`, the four properties
  `COMPONENT_LIBRARY.md` § Control kinds names for the `font` kind.
- `LinkField` — unspecified. `{ href, target, rel }`, the three the same table names.

### Decision
Each ships a `*-css.ts` with `toCss` and `fromCss`, and a test asserting `fromCss(toCss(value))`
equals `value` over a fixture set that includes the boundary cases — an empty shadow stack, a
single-stop gradient, a zero-length spacing box.

### Consequences
- Accepted: when prompt 12 defines the document model, these types either match it or a mapping is
  written. The round-trip test is what makes that mapping mechanical rather than archaeological.
- Accepted: `fromCss` is a parser per control. Each accepts the grammar `toCss` emits plus whitespace
  tolerance — not the full CSS specification. A value the browser accepts and `toCss` would never
  write is rejected, and the control reports it rather than guessing.
- Rejected: one `value: string` of raw CSS per control. It makes every control a parser at every
  keystroke, and "move the third shadow up" becomes a string edit.

## ADR-041 — A scrub modifier scales the increment and may refine the grid, never coarsen it

**Date** 2026-08-07 · **Prompt** 09 · **Status** Accepted

### Question
Prompt 09 gives `Shift` ×10 and `Alt` ×0.1, and `COMPONENT_LIBRARY.md` § Control kinds gives the
`number` control a `step` and a `precision`. Nothing says how the three interact. Dragging a
`step: 1` field 20 px with `Shift` held is +200 — but +200 onto what grid, and rounded to what?

### Criterion (set before measuring)
Two properties, both checkable, and the rule is whichever satisfies both:

1. A modifier never moves the value somewhere an unmodified drag could not reach. Snapping a
   `Shift` drag to a grid of 10 would jump 16 to 220, a value the field cannot otherwise express.
2. A modifier never produces a value finer than the field's declared resolution. `precision` is what
   the field claims it can represent, and an increment below it is not representable.

### Measurement
Three candidate rules against the two properties, on a `step: 1` field at 16 dragged 20 px:

| Rule | `Shift` | `Alt` | Property 1 | Property 2 |
| --- | --- | --- | --- | --- |
| Snap to the base step always | 216 | 16 (Alt is inert) | holds | holds |
| Snap to the scaled step | 220 | 16.1 | **fails** — 220 is off-grid | fails at `precision: 0` |
| Snap to `min(step, step × scale)` | 216 | 16 | holds | holds |

Rules 1 and 3 differ only where `precision` leaves room below `step`: on a field declared
`step: 0.1, precision: 2`, rule 1 makes `Alt` inert and rule 3 gives 0.01 increments. Rule 3 is the
only one that uses the resolution the caller declared.

### Decision
The increment is `step × scale`, where `scale` is `(Shift ? 10 : 1) × (Alt ? 0.1 : 1)`. The result
snaps to `min(step, step × scale)` and is then rounded to `precision`, which defaults to the decimals
in `step`.

### Consequences
- Accepted: `Alt` does nothing on a field whose `precision` leaves no room below its `step` — an
  integer pixel field, most of them. The field cannot represent 16.1, so offering a gesture that
  appears to produce it would be the worse behaviour.
- Accepted: holding both modifiers is ×1, since they are independent factors. No separate rule, and
  nothing to remember.
- Accepted: `precision` is now load-bearing rather than cosmetic. A caller who wants fine dragging
  declares it, and the declaration is visible in the inspector schema rather than implied.

## ADR-042 — A link's value round-trips to a URL, not to CSS

**Date** 2026-08-07 · **Prompt** 09 · **Status** Accepted

### Question
ADR-040 states that a composite control's value is the CSS it produces, proven by a round trip, and
lists `LinkField` among the controls it covers. `LinkField` produces an `href`, a `target` and a `rel`
— three HTML attributes. There is no CSS for it to round-trip to, so ADR-040 as written cannot be
satisfied by this control.

### Criterion (set before measuring)
ADR-040's real requirement is not "CSS" but "a grammar the export engine is certain to need, checkable
by a round trip". The admissible grammar for a control is whatever the exporter writes that value into.
Where that grammar is already specified by a standard, the standard is the specification and the
checkable property is validity against it rather than a `toCss`/`fromCss` pair of ours.

### Measurement
- `href` is written into an HTML attribute whose grammar is the URL standard. A `*-css.ts` here would
  be a URL parser we wrote, tested against itself.
- `target` is an enumerated attribute with two values this product emits.
- `rel` is a space-separated token list.

The checkable property is therefore validation, not round-tripping: `hrefIssue` returns the reason a
URL is unusable, and its tests assert both directions — every form the exporter may emit is accepted,
and `javascript:`, `data:`, `blob:`, `file:` and `vbscript:` are refused by name.

### Decision
`LinkField` is exempt from ADR-040's round-trip rule and ships `link-url.ts` instead: `hrefIssue` and
`relIssue`, both returning a sentence or `null`. ADR-040 stands for the five controls whose value is
CSS. The exemption is for controls whose target grammar is defined by a standard outside CSS.

### Consequences
- Accepted: two shapes of evidence now exist for composite controls — a round trip for the CSS ones, a
  validator for this one. A reader has to know which applies, which is what this entry is for.
- Accepted: `hrefIssue` encodes a policy — which schemes this product exports — and not only a syntax.
  That policy is now in one place, and `RichTextField`'s link sanitiser calls the same function rather
  than keeping a second list.
- Rejected: a `toCss`/`fromCss` pair emitting `<a href="…">`. It would make the control's value HTML,
  which is a larger grammar than the three attributes it actually edits.

## ADR-043 — An edit that changes nothing is not committed

**Date** 2026-08-07 · **Prompt** 09 · **Status** Accepted

### Question
Pressing `ArrowDown` on a `ScrubField` already at its `min` produced `onChange` and `onCommit` with the
value it already had. `StepperField`, written in the same session, guarded against exactly that. Two
sibling number controls disagreed, and nothing said which was right.

### Criterion (set before measuring)
`STATE_MANAGEMENT.md` § Store already answers the downstream half — `if (patches.length === 0) return`
drops a no-op command, so neither behaviour can pollute history. The remaining question is decidable
against the transient-state contract itself: `onChange` is defined as "what a gesture writes", and
prompt 09 § Universal defines `onCommit` as the edge a coalesced command is built from. A keystroke
that moves nothing wrote nothing, so it is admissible to emit only if some consumer needs to observe
a refused edit.

### Measurement
Traced both callbacks through the specified consumers. `onChange`'s documented job is writing a CSS
variable on the target (`useTransientNumber` in § Transient state) — writing the value already there is
a no-op with a re-render attached. `onCommit`'s job is dispatching a command, which the store then
drops. No consumer in any document observes a refused edit, and the two composite controls that wrap
`ScrubField` — `SpacingField` and `RadiusField` — turn one refused step into a whole-value callback,
so the cost multiplies rather than staying local.

### Decision
An arrow step whose result equals the current value fires neither callback. The draft string is still
rewritten, so a half-typed value is normalised by the keypress. `commitDraft` and the `Escape` path
already held this rule; the arrow path now does too, and `StepperField`'s guard becomes the shared
behaviour rather than the odd one out.

### Consequences
- Accepted: a consumer that wants to flash a "cannot go lower" affordance has no callback to hang it
  on. That affordance is the disabled stepper button, which is drawn from the bounds, not from an event.
- Accepted: the rule is per-control, not enforced centrally. A control that forgets it is a defect its
  own test should catch, which is why every number control now has one.

## ADR-044 — The gradient editor edits stops; mesh stays a preset

**Date** 2026-08-07 · **Prompt** 09 · **Status** Accepted

### Question
`Gradient` in `packages/tokens` has four kinds, one of which — `mesh` — has points and a blur instead of
a stop track and an angle. Prompt 09 § Deliverables describes `GradientField` as "stop track: add, drag,
delete, colour per stop; angle dial; kind switch". A mesh value has none of those. Does the kind switch
offer mesh, and if a mesh value arrives, what does the editor do with it?

### Criterion (set before measuring)
Two things have to hold. First, no value the type permits may reach a control that cannot render it —
`PRODUCT.md` § Reliability rules out a control that silently drops part of a document. Second, a lossy
conversion must be a deliberate act, never a side effect of opening a panel.

### Measurement
Counted what a mesh ⇄ stop conversion would have to invent in each direction. Mesh → linear: four
points at (x, y, radius) collapse to positions along one axis, so three of the four numbers per point
are discarded and the angle is fabricated. Linear → mesh: every stop needs an x, a y and a radius that
no stop carries. Both directions invent more than they carry.

`DESIGN_SYSTEM.md` § Gradients lists ten presets; two are mesh or conic, and the mesh one — `aurora` —
is described as an interference pattern between overlapping fields. It is authored, not dialled in.

### Decision
The kind switch offers `linear`, `radial` and `conic`. A mesh value renders as a live preview with a
line saying it is chosen as a preset, and the switch is disabled so it cannot be converted by accident.
`gradientToCss` prints all four kinds, because the preview and the exporter both need mesh;
`gradientFromCss` reads back only the three, since a mesh gradient's blur is a filter on the element
rather than part of the `background-image` string it would have to be recovered from.

### Consequences
- Accepted: the round trip ADR-040 requires holds for three kinds of four. The fourth is stated here and
  asserted by a test that `fromCss(toCss(mesh))` is `null` — the failure is declared, not latent.
- Accepted: a user who wants a mesh gradient picks a preset. When a mesh editor exists it will be its
  own control, because points-in-a-field is a different interaction from stops-on-a-track.
- Rejected: converting on the switch. It would turn opening the kind menu into a destructive act.

## ADR-045 — A multi-property composite round-trips to a declaration list

**Date** 2026-08-07 · **Prompt** 09 · **Status** Accepted

### Question
ADR-040 requires a composite control's value to round-trip to "the CSS the property is ultimately
written as". `FontField` edits four properties — family, size, weight and tracking — and there is no
single CSS value holding all four: the `font` shorthand cannot carry `letter-spacing`.

### Criterion (set before measuring)
The round trip has to be over the exact text the export engine will emit for this control, whatever
shape that text has. A grammar chosen for the convenience of the test is not evidence.

### Measurement
Checked what the shorthand can hold. CSS `font` takes style, variant, weight, stretch, size,
line-height and family — not `letter-spacing`, which is a separate property. Emitting `font` plus a
loose `letter-spacing` is two declarations; emitting four declarations is also two-or-more. So the
smallest honest unit is a declaration list either way, and the four-declaration form is the one where
each control maps to exactly one declaration.

### Decision
`fontToCss` emits `font-family: …; font-size: …px; font-weight: …; letter-spacing: …em`, and
`fontFromCss` reads that back regardless of declaration order or whitespace. The round-trip test is
over the list, not over a single value. The same form applies to any future control that edits a group
of properties with no shorthand covering them.

### Consequences
- Accepted: a control's `toCss` no longer always returns something assignable to one CSS property. A
  consumer has to know whether it holds a value or a declaration list; the function name says which.
- Accepted: `fromCss` rejects a `font` shorthand, which a paste might contain. It reports rather than
  guessing, which is ADR-040's rule for every one of these parsers.

## ADR-046 — The curve and spring editors draw with SVG, not canvas

**Date** 2026-08-07 · **Prompt** 09 · **Status** Accepted

### Question
Prompt 09 § SpringEditor specifies "a canvas-drawn response curve from `simulateSpring`". `CurveEditor`
needs the same kind of drawing. Canvas is what the prompt names; is it what these two should use?

### Criterion (set before measuring)
Three properties, all checkable, and canvas is kept unless it loses on one of them:

1. The drawing stays sharp at the 200 % zoom `ACCESSIBILITY.md` requires and on a 2× display.
2. It costs no new dependency — § 1 requires a justification and a check that an existing one cannot do
   the job.
3. It is renderable under the test environment already in use, so the drawing is covered rather than
   stubbed.

### Measurement
1. A canvas is a bitmap: it needs a `devicePixelRatio` transform and a redraw on every resize and zoom
   to stay sharp. SVG is resolution-independent with no code at all.
2. jsdom implements no 2D context. Rendering a canvas in a test needs the `canvas` npm package, a native
   module with a build toolchain, added to a package whose whole purpose is chrome components.
3. The curve is 120 samples in a 200 × 100 box and the bézier is one `path`. Both are trivially inside
   the range where SVG's per-node cost is invisible; the canvas argument only starts to pay above the
   thousands of nodes neither of these will ever draw.

Canvas loses on all three, and wins on none at this size.

### Decision
Both editors draw with SVG — a `path` for the cubic bézier, a `polyline` for the spring response. The
prompt's word "canvas" is read as "drawn from the integrator's samples", which is the part that
mattered, and `simulateSpring` remains the single source of the curve.

### Consequences
- Accepted: this contradicts the literal text of prompt 09, which is why the entry exists. A later
  prompt asking for a canvas here should supersede this rather than quietly re-litigating it.
- Accepted: the timeline in prompt 32 may well need canvas — hundreds of keyframes across many tracks is
  the other side of the threshold measured above. This decision is about these two editors at this size.
- Accepted: `springPolyline` and `settleFrame` are pure functions over `simulateSpring`, so what is
  drawn is unit-tested directly rather than through a rendering surface.

## ADR-047 — The workshop app is the package `workshop`, in the directory `apps/storybook`

**Date** 2026-08-07 · **Prompt** 10 · **Status** Accepted

### Question
Prompt 10's deliverable is `apps/storybook/`. Naming the package after its directory gives a workspace
package called `storybook`, which is also the name of the npm package it depends on.

### Criterion (set before measuring)
`check-deps` is the gate on the dependency graph, and `DEVOPS.md` § Custom gates makes it authoritative.
A name is admissible only if the gate stays green and stays meaningful — a rule that has to be relaxed
to accommodate a name is a rule that no longer catches what it was written for.

### Measurement
With the package named `storybook`, `pnpm check:deps` reported two violations:

```
cycle: storybook -> storybook
apps\storybook\package.json: nothing may depend on the app 'storybook' (§ Rules, 5)
```

Both are real. The gate resolves every declared dependency against the workspace by name, so
`"storybook": "^8.6.18"` — the CLI — resolves to the app itself. Renaming the package clears both with
no change to the gate. The alternative is an exception list inside `check-deps`, which would blind it
to a genuine self-dependency later.

### Decision
The package is `workshop`. The directory stays `apps/storybook`, because that is what the prompt names
and what a reader looks for. The root scripts keep their names — `dev:storybook`, `build:storybook` —
and filter on `workshop`.

### Consequences
- Accepted: the directory and the package name differ, which is the one thing this entry exists to
  explain. Every other package in the repository matches its directory.
- Accepted: `--filter=workshop` in two root scripts is the only place the name is spelled.
- Rejected: teaching `check-deps` that `storybook` is special. The collision is with a real package
  name, and the next one would be silent.

## ADR-048 — The shared Vitest presets are JavaScript, because Node loads them itself

**Date** 2026-08-07 · **Prompt** 10 · **Status** Accepted

### Question
`pnpm test` has passed locally since prompt 05 and `pnpm test:coverage` has failed in CI on **every
push to `main` since the pipeline was added** — including the commit that added it. Fourteen packages
fail identically:

```
failed to load config from packages/hooks/vitest.config.ts
TypeError [ERR_UNKNOWN_FILE_EXTENSION]: Unknown file extension ".ts"
  for packages/config/vitest/react.ts
```

### Criterion (set before measuring)
`TECH_STACK.md` § Versions states Node `>=20.11`, and `.nvmrc` and `engines` both pin it. That is a
specification, so the question is not which Node to support — it is what has to change for the
declared floor to work. The fix is admissible only if the preset loads on 20.11 **and** every
consumer's `vitest.config.ts` still typechecks, since `tsc --noEmit` covers that file in all fourteen.

### Measurement
Reproduced locally, where Node is 22.20 and the suite passes, by disabling the one feature that
differs. From `packages/hooks`:

| Command | Result |
| --- | --- |
| `node -e "import('@motion-studio/config/vitest/react')"` | `loaded: reactConfig` |
| `node --no-experimental-strip-types -e "…"` | `ERROR: ERR_UNKNOWN_FILE_EXTENSION` |

Node 22.18 and later strip types from `.ts` by default; 20.11 does not. Vitest bundles a consumer's
`vitest.config.ts` with bare specifiers left **external**, so this module never reaches Vite's
transform — it is handed to Node's ESM loader as written. The whole project has therefore been
running on an experimental feature of a Node newer than the one it claims to support, and CI has been
telling us so for two days in a job nobody had authenticated to read.

### Decision
`packages/config/vitest/react.ts` and `node.ts` become `react.mjs` and `node.mjs`, each with a
hand-written `.d.ts` beside it, and the `exports` map names the three subpaths explicitly with a
`types` condition rather than globbing `./vitest/*` onto `.ts`.

`setup-react.ts` stays TypeScript: Vitest loads a setup file *through Vite*, which transforms it. The
distinction is the whole point — a file Node loads is JavaScript, a file Vite loads may be TypeScript.

### Consequences
- Accepted: two declaration files are maintained by hand against two implementations. They are three
  exports in total, and `tsc --noEmit` in fourteen packages fails the moment they disagree.
- Accepted: the explicit `exports` entries are longer than the wildcard they replace, and they are why
  the next file added there has to state which loader reads it.
- Rejected: raising `.nvmrc` to a Node with type stripping. It would make a documented floor false, and
  it would leave the project's build depending on an experimental flag to read a config file.
- Rejected: importing the preset by relative path from each package. That reaches across a package
  boundary, which `ENGINEERING_CONTRACT.md` § 3 bans and `check-deps` catches.

## ADR-049 — The shell's resize handle writes the grid's own custom property

**Date** 2026-08-08 · **Prompt** 11 · **Status** Accepted

### Question
`packages/ui` already ships `Resizable`, built in prompt 08 for exactly this surface. The studio
shell needs two resizable panel edges. Does the shell use it, or does it drive the widths itself?

### Criterion (set before measuring)
`UI_GUIDELINES.md` § Layout and the shell's own specification put the three columns in a CSS grid
whose track list reads the panel widths from `--ms-panel-left` and `--ms-panel-right`. Two things
follow, and both are checkable:

1. A drag must move the **grid track**. A handle that changes some inner element's width leaves the
   track where it was and produces a panel that overflows or underfills its own column.
2. A drag must produce **zero renders of the canvas area** — contract § 5, the transient pattern.
   Measured with a render counter inside the canvas island.

### Measurement
`Resizable` writes `--ms-resizable-width` onto **its own frame**, which is also the element carrying
`w-[var(--ms-resizable-width)]` (`packages/ui/src/resizable/resizable.styles.ts`). A custom property
set on a descendant cannot be read by an ancestor's `grid-template-columns` — inheritance runs down
the tree only. So on criterion 1 the component cannot be made to work from the outside: the shell
would have to declare its tracks `auto`, which is the layout the specification rules out.

Criterion 2 is met by both designs, so it does not separate them.

Counted after the fact with a `useRef` render counter rendered into the canvas island: **0 renders
across a full drag of either handle**, and one render on release, in the shell only.

### Decision
The shell owns `panel-resizer.tsx`. It writes `--ms-panel-left` / `--ms-panel-right` onto the
document element — the same element the boot script writes them to, so a restored width and a
dragged width have one home — and calls back once on release. `Resizable` stays in `packages/ui` for
panels that own their own width — a split inside a panel, the export dialog's file tree — and is not
used by the shell.

### Consequences
- Accepted: two pointer-drag handles exist in the repository. They differ in the one thing that
  matters — which element's width they define — and merging them would mean a component with two
  modes and one caller each, which `prompts/00-GLOBAL_RULES.md` § Do not bans.
- Accepted: the shell's handle is the WAI-ARIA window-splitter pattern a second time, so a fix to
  the keyboard behaviour has to be made in both places. Both are tested.
- Rejected: declaring the tracks `auto` and letting `Resizable` size the panel. It satisfies the
  transient-pattern rule and contradicts the layout specification, which is not a trade the
  contract allows — § 9, resolution 1.

## ADR-050 — The chrome's breakpoints are CSS; the panel-overlay state is JavaScript

**Date** 2026-08-08 · **Prompt** 11 · **Status** Accepted

### Question
`UI_GUIDELINES.md` § Responsiveness of the chrome gives the shell three widths: ≥ 1280 px the panels
are columns, 1024–1280 px they overlay the canvas, below 1024 px the studio refuses and shows a
notice. Where does that live — in media queries, or in a `matchMedia` hook the shell renders from?

### Criterion (set before measuring)
The shell is server-rendered (`ARCHITECTURE.md` § Rendering strategy), so the server does not know
the viewport width. Two requirements decide it:

1. **No layout flash.** Anything that changes the *layout* must be correct in the first paint, before
   hydration. A value read from `matchMedia` is `false` on the server and correct only after the
   first effect, so rendering the layout from it paints the wrong one and then corrects it.
2. **An overlay panel is closed until asked for.** That is state, not style: at ≥ 1280 px the left
   panel is open by default, and the same panel overlaying the canvas at 1200 px must not be. CSS
   cannot express "default open here, default closed there" for a state the user also toggles.

### Measurement
Requirement 1 admits only CSS; requirement 2 admits only JavaScript. Neither mechanism satisfies
both, so the split is forced rather than chosen.

### Decision
The track collapse, the overlay positioning, and the sub-1024 notice are media queries in
`src/styles/studio.css`; the notice markup is always in the DOM so it needs no hydration to appear.
`use-viewport-guard.ts` reports the same three thresholds through `matchMedia` and is used only for
behaviour: which piece of state `Mod+\` toggles, and `inert` on the shell below 1024 px so the
keyboard cannot walk into a chrome the user was just told is unusable.

### Consequences
- Accepted: the three thresholds are written twice — once in the stylesheet, once in the hook. A test
  asserts the hook's query strings against the same numbers, and both trace to the one table in
  `UI_GUIDELINES.md`.
- Accepted: the notice ships in the HTML of every studio visit, including the desktop ones that never
  show it. It is two elements.
- Rejected: rendering the layout from the hook and accepting one frame of the wrong chrome. The first
  paint being layout rather than a correction is the reason the shell is server-rendered at all.

## ADR-051 — Rich text is sanitised twice, by two mechanisms, against one policy

**Date** 2026-08-08 · **Prompt** 12 · **Status** Accepted

### Question
`packages/ui` already sanitises rich text with `DOMParser` (prompt 09). `packages/schema` must
sanitise it too, because a `.motion` file is untrusted input. One implementation or two?

### Criterion (set before measuring)
A second implementation is admissible only if a single one cannot serve both call sites. Two things
decide it, and both are checkable:

1. `packages/schema` runs under `node` — `codegen` imports it and `TESTING.md` § Unit tests puts its
   suite in the `node` environment. Anything it calls must work with no DOM.
2. The editor's sanitiser runs on **clipboard HTML**, which is arbitrary markup from another
   application. A regex tokeniser is not a browser parser, and the gap between the two is exactly
   where a paste payload would live.

### Measurement
`DOMParser` is not defined in `node`; importing the UI helper into the schema's test run fails at the
first call. So requirement 1 rules the DOM version out for the file path. Requirement 2 rules the
DOM-free version out for the paste path: a hand-written tokeniser and a browser's parser disagree on
malformed markup by construction, and the browser's reading is the one that matters when the browser
is what renders the result.

### Decision
Two implementations, one policy. `packages/schema/src/sanitize/rich-text.ts` is DOM-free and is what
validates a file; `packages/ui/src/controls/rich-text-field/rich-text.ts` uses `DOMParser` and is what
validates what a user types or pastes. Both allow the same set — bold, italic, code, and a link whose
scheme passes the allowlist — and both unwrap everything else while keeping its text.

### Consequences
- Accepted: the allowed-tag set is written twice, and a change to it has to be made in both places.
  Each has a test that names the set explicitly, so a divergence fails a suite rather than shipping.
- Accepted: the two can disagree on malformed input. That is tolerable in one direction only — the
  schema's parser is the stricter of the two, so anything the editor accepts is re-checked on save.
- Rejected: moving the DOM version into `schema` behind a runtime check for `DOMParser`. It would make
  the behaviour of the security path depend on which environment happened to load it.

## ADR-052 — `CodegenDescriptor` carries only what `buildIR` reads today

**Date** 2026-08-08 · **Prompt** 12 · **Status** Accepted

### Question
The registry seam requires a `CodegenDescriptor` on every block, and no document specifies its
fields. `EXPORT_ENGINE.md` describes the IR and the printers; it never says what the registry hands
them. What goes in the type?

### Criterion (set before measuring)
The seam is consumed by exactly one module — `packages/codegen`, built in prompts 40 and after. A
field belongs in the type now only if `EXPORT_ENGINE.md` already names it as something read *per
block*. Anything else is speculation, and speculation in a shared interface is the thing prompt
00's § Do not bans.

### Measurement
Reading `EXPORT_ENGINE.md` § The IR and § buildIR for per-block reads yields exactly three:
`IRElement.tag` (what a node prints as), `ImportSpec` (§ 5 Import collection, merged per file), and
`dependencies` (§ 5, "accumulated with real semver ranges so the emitted `package.json` installs and
runs"). A fourth follows from § 5's rule that imports are collected from actual usage: the printer has
to know which props are attributes rather than classes, so `passthroughProps` is named too.

### Decision
`CodegenDescriptor` is `{ tag, imports?, dependencies?, passthroughProps? }` and nothing else. Every
optional field is optional because a plain `<div>` block needs none of them.

### Consequences
- Accepted: prompt 40 will almost certainly add fields. Adding an optional field to this interface is
  additive — no existing definition stops compiling — which is why the narrow version is safe to ship
  and a guessed-wide one would not be.
- Accepted: a block cannot yet express "print me as a `motion.div` when a motion channel is set". That
  is a printer decision in the current design, and moving it here without the printer to check it
  against is how a seam gets a field nobody uses.
- Rejected: leaving the field as `unknown` until prompt 40. A registry entry that typechecks against
  nothing is not a seam.

## ADR-053 — The theme slice ships real setters, and the two commands they need are written now

**Date** 2026-08-08 · **Prompt** 13 · **Status** Accepted

### Question
`STATE_MANAGEMENT.md` § theme gives the slice three setters, and every one of them edits
`document.theme`, which is only reachable through a command. The command catalogue is prompt 14.
Prompt 13's checklist also says three of the seven slices are honest stubs, and only two —
`history` and `clipboard` — are named as stubs in its deliverables. So either the theme setters are
built here, or theme is the unnamed third stub.

### Criterion (set before measuring)
An option is admissible only if it satisfies both:
1. It ships no API that silently does nothing. Prompt 00 § Do not bans placeholder implementations,
   and a `setThemeToken` that returns without writing is worse than an absent one — the caller has
   no way to tell.
2. It creates no file that prompt 14 would then have to write a second time or delete. A mutation
   written twice is two definitions of the same semantics for the length of one prompt.

### Measurement
Four options, against the two requirements:

| Option | (1) no silent no-op | (2) no duplicate work |
| --- | --- | --- |
| No-op setters, prompt 14 fills them | ✗ | ✓ |
| Setters build their commands inline in the slice | ✓ | ✗ — prompt 14 names `set-theme-token.ts` and `apply-theme-preset.ts` |
| Drop the setters until prompt 14 | ✓ | ✓ — but the deliverable table names them, and cutting scope is the owner's call |
| Write the two commands under prompt 14's filenames | ✓ | ✓ |

### Decision
The last one. `commands/set-theme-token.ts` and `commands/apply-theme-preset.ts` are written in this
prompt, with the names, payload shapes and coalesce keys prompt 14's table gives them, and the theme
slice dispatches them. Prompt 14 finds 2 of its 25 commands already present and tested.

### Consequences
- Accepted: prompt 13 touches `commands/` beyond `command.types.ts` and `dispatch.ts`. The alternative
  spends the same code on a version that gets deleted.
- Accepted: `packages/editor` gains a dependency on `@motion-studio/theme`, because `applyThemePreset`
  takes a `PresetId` and has to look the config up in `PRESETS`. The dependency direction is legal —
  `theme` knows nothing about the editor — and `schema` already depends on it for `ThemeConfig`.
- Accepted: prompt 13 ships **two** honest stubs, not three. Reported rather than papered over.
- Rejected: injecting the preset table through `createEditorStore` options to avoid the dependency. A
  config option with one caller is what prompt 00 § Do not calls speculative flexibility.

## ADR-054 — `replaceDocument` clears history instead of recording a whole-document entry

**Date** 2026-08-08 · **Prompt** 13 · **Status** Accepted

### Question
`replaceDocument(next, label)` swaps the entire document — New, Open, Import, and the post-migration
result of a repaired file all land here. Its documented signature carries a `label`, which in every
other case names a history entry. Does the swap become an undo step?

### Criterion (set before measuring)
Prompt 15 states the budget for the whole undo stack: 200 entries for a 60-node document must come
out "in kilobytes, not megabytes". An entry kind is admissible only if 200 of it stays inside that
budget, because the cap counts entries and cannot tell one kind from another.

### Measurement
A 61-node document with realistic props serialises to **25 647 bytes**. An entry holds forward and
inverse patches, and for a whole-document replace each is a copy of one document, so one entry costs
**≈ 51 kB**. A representative prop patch — `{op:'replace', path:['nodes','node_7','props','gap'], value:16}`
— is ≈ 120 bytes, so the replace entry is 400× the unit the cap was sized for. 200 of them is
**10 MB**: megabytes, on the wrong side of the stated budget. Nothing bounds how often a session
calls `replaceDocument` — the file menu, an import, and a template switch all do.

### Decision
`replaceDocument(next)` clears `past` and `future`, prunes the selection against the new document,
bumps `version`, and sets `dirty = false`. It writes no history entry, and the `label` parameter is
dropped from the signature — with no entry to name, it had no consumer.

### Consequences
- Accepted: opening a document is not undoable. This matches every editor a user has met: `Cmd+Z`
  after opening a file does not reopen the previous one.
- Accepted: `dirty = false` assumes every caller is a load. If a caller ever replaces the document
  with something that has *not* been persisted, it has to mark it — that will be visible in prompt 50,
  which owns persistence, rather than hidden here.
- Rejected: recording the entry anyway and capping history by bytes instead of entries. That is a
  second cap to reason about, added to protect one rare operation.

## ADR-055 — A versioned selector's key is a list of values, not one scalar

**Date** 2026-08-08 · **Prompt** 13 · **Status** Accepted

### Question
`createVersionedSelector(keyFn, computeFn)` keeps a cache of size one. `STATE_MANAGEMENT.md`
§ Selectors keys it on `s.version` — a cheap scalar. The cache lives in the module, because the
selector is a module-level constant, while `version` lives in a store. What is the key?

### Criterion (set before measuring)
No sequence of calls may return a value computed from a different state. A cache that can answer with
another store's data is not a fast selector, it is a wrong one, and the failure is silent.

### Measurement
Two stores, both at `version: 0`, holding different documents — which is every test file that builds
a second store, and every future multi-document surface. With `keyFn = (s) => s.version`:

```
store A rows: 1 (expected 1)
store B rows: 1 (expected 3)     ← A's cached value, under key 0
```

Run against a 15-line scalar-keyed implementation before writing the real one. The collision needs no
concurrency and no unusual call order: two stores at the same version is enough.

### Decision
`keyFn` returns a `readonly unknown[]`, compared element by element with `Object.is`. Selectors that
depend on the document key on the document **reference** (`[s.document]`), which changes on exactly
the commits `version` changes on and cannot collide between stores. Composite keys become extra
elements: `[s.document, s.viewport.breakpoint]`.

### Consequences
- Accepted: the key allocates one small array per call. It is compared, never retained, and its length
  is fixed per selector — this is not the allocation the § Anti-patterns table is about, which is a
  freshly built *result* re-rendering a component.
- Accepted: the comparison is a loop rather than one `===`. Element-wise `Object.is` over a fixed
  two-element list is not deep equality: it never descends into a value.
- Rejected: keying on `${version}:${document.meta.id}`. Two deterministic test stores share the
  document id as well, so it moves the collision rather than removing it.

## ADR-056 — The wall clock is read once, in the composition root

**Date** 2026-08-08 · **Prompt** 13 · **Status** Accepted

### Question
`TESTING.md` § Determinism requires that no tested code path calls `Date.now()`, `Math.random()` or
`crypto.randomUUID()`: the clock and the id generator are injected, which is what makes history
timestamps and generated ids reproducible. `store/use-store.ts` is the app-level singleton, and
something has to hand it a real clock.

### Criterion (set before measuring)
Two requirements, both testable:
1. No module that participates in a command, a history entry, or a selector may read a clock or a
   random source. Those are the paths a test asserts on.
2. `meta.updatedAt` must be a real wall-clock timestamp. A monotonic clock (`performance.now()`)
   satisfies coalescing, whose only use of `now` is a 400 ms difference, but writes a document whose
   modification date is "1843.7".

### Measurement
`createEditorStore` takes `now` as a required option, so requirement 1 is a property of the API
rather than of a habit. Requirement 2 rules out `performance.now()` for the production store. The
remaining question is where the one call to `Date.now()` lives, and there is exactly one place that
is not a tested path: the module that constructs the singleton.

Grep after the change: `rg 'Date\.now|Math\.random|crypto\.randomUUID' packages/editor/src` returns
**one** hit, `store/use-store.ts`, on the line that builds the singleton's options.

### Decision
`now` and `generateId` are injected everywhere; the singleton in `use-store.ts` passes `Date.now` and
`createId`. No other module in the package reads either. The expected grep result for this package is
one hit at the composition root, not zero.

### Consequences
- Accepted: prompt 13's checklist asks for zero hits. One remains, and it is the line that makes the
  other zero possible. Reported rather than worked around — writing `new Date().getTime()` to satisfy
  a regex is the banned fourth way with a disguise.
- Accepted: a test that wants a frozen clock must build its own store with `createTestStore`. It
  cannot accidentally inherit the singleton's clock, because the singleton is a different store.
- Rejected: a lazily initialised singleton that the app configures. It removes the hit by moving the
  same call into `apps/web` and adds an "initialise before use" failure mode to every consumer.

## ADR-057 — Align and distribute write flow-layout props on the shared parent

**Date** 2026-08-08 · **Prompt** 14 · **Status** Accepted

### Question
Prompt 14 says `alignNodes` and `distributeNodes` "operate on the selection's bounding box", and
`STATE_MANAGEMENT.md` § Command catalogue said `duplicateNodes` "offsets position". Both sentences
describe a free-form canvas. What do these commands actually write?

### Criterion (set before measuring)
A command must be expressible over fields the document has, and its result must survive export.
Three checks, each answerable from a document rather than from taste:

1. Does any document field hold a coordinate?
2. Can a command read one? `EDITOR_ENGINE.md` § Commands: `apply` is a pure mutation with no DOM
   and no store access.
3. Does the export target have a way to express the result?

### Measurement
1. **No.** `Node` is `props / responsive / motion / effects / locked / hidden` — no `x`, no `y`, no
   rect. `DRAG_AND_DROP.md` § Drag sources, row 2: dragging a node on the canvas commits `moveNodes`
   (reparent and/or reorder), not a position write. Geometry is measured, and it is measured by the
   rect cache in `packages/canvas` — prompt 19.
2. **No.** A pure command cannot call `getBoundingClientRect`, and nothing in `CommandContext`
   carries a rect.
3. **Yes, for flow.** `PRODUCT.md` § 4 Inspector, Layout row names `align` and `justify` as node
   props, and `EXPORT_ENGINE.md` prints props as Tailwind classes. `SHORTCUTS.md` § Alignment says
   alignment "applies to the selection, or to the parent when only one node is selected" — both
   readings write on the container that lays the selection out.

So a bounding-box implementation would need a coordinate system this product does not have, and the
one it does have expresses alignment as a container property.

### Decision
`alignNodes({ ids, edge })` requires the ids to share a parent and writes that parent's `align` or
`justify` prop; which of the two is decided by the parent's `direction` prop, so `left` is the main
axis in a row and the cross axis in a column. `distributeNodes({ ids, axis })` writes
`justify: 'between'` on the same parent and rejects the cross axis, which flexbox cannot distribute
along. Both are no-ops — zero patches, no undo entry — when the value is already there.

### Consequences
- Accepted: alignment applies to **every** child of the parent, not only to the selected ones.
  Flexbox has no per-item main-axis alignment, so a selection of two out of five siblings moves all
  five. Tested, and the reason the guard is "share a parent" rather than "share a parent and be all
  of its children" — the latter would reject the common case with nothing to offer instead.
- Accepted: `distributeNodes` on the cross axis throws instead of doing something plausible. A
  command that silently does nothing useful is worse than one that says it cannot.
- Accepted: this is the decision to supersede first if free positioning ever ships. It is one file
  each, and the payloads change rather than the model.
- Avoided: inventing `position: absolute` semantics, a coordinate space, and a second layout model
  in the prompt that was supposed to be about guards.

### Alternatives rejected
- Rects in the payload (`bounds: Record<NodeId, Rect>`), computed by the canvas and written back as
  offsets. It needs a positioning prop to write to; nothing declares one, so it would invent the
  layout model as a side effect of an alignment button.
- Deferring both commands to prompt 21. They are in prompt 14's deliverables and in `SHORTCUTS.md`
  with six key bindings; deferring is the owner's call, not this session's.

## ADR-058 — Responsive overrides are keyed by top-level prop key

**Date** 2026-08-08 · **Prompt** 14 · **Status** Accepted

### Question
`setResponsiveProp` writes `responsive[bp][path]`. Controls address props by dot path
(`padding.top`). What happens to a dotted path at a non-base breakpoint?

### Criterion (set before measuring)
Whatever is stored must come back out of `resolveResponsiveProps`. An override that writes
successfully and does not resolve is the failure mode `RESPONSIVE_ENGINE.md` § Resolution calls the
most common bug in this class of tool, and it is invisible until export.

### Measurement
`resolveResponsiveProps` merges with `{ ...resolved, ...override }` — a **shallow** spread, one
level. A key of `'padding.top'` therefore resolves to a prop literally named `padding.top`, which no
block schema declares and no printer reads. The value is stored, the editor shows the override dot,
and the exported class is missing.

### Decision
`setResponsiveProp` and `clearResponsiveProp` reject a path containing a `.` or a `[` with
`RESPONSIVE_PATH_NOT_SHALLOW`. Overrides are keyed by the top-level prop key, exactly as
`RESPONSIVE_ENGINE.md` § Storage shows them. Both also reject the `base` breakpoint with
`BASE_IS_NOT_AN_OVERRIDE`: § Editing semantics says a base edit writes `props`, which is `setProp`,
and a `responsive.base` record would be a second base that resolves after the first.

### Consequences
- Accepted: a nested responsive control must override its whole top-level object — `padding`, not
  `padding.top`. That is what the shallow merge means, and the generated inspector (prompt 23) reads
  this rule off the same document rather than discovering it.
- Accepted: the error surfaces at dispatch, in a session, rather than at export. That is the point.
- Rejected: deep-merging overrides in `resolveResponsiveProps`. It would make the resolution
  order-dependent per key path, break the byte-stable serialisation of the sparse record, and
  contradict a documented function that already has tests.

## ADR-059 — `setEffect` coalesces on the effect instance, not the catalogue entry

**Date** 2026-08-08 · **Prompt** 14 · **Status** Accepted

### Question
The catalogue table gives `setEffect` the key `set-effect:{id}:{effectId}`. A node carries a *stack*
of effects and can hold two instances of the same catalogue entry — `EffectInstance.id` versus
`EffectInstance.effectId`, introduced with the schema in prompt 12.

### Criterion (set before measuring)
Coalescing merges two edits into one undo step. It is correct when a user would step back through
them as one gesture, wrong when it makes one undo revert two things they did separately.

### Measurement
Two `noise-overlay` layers on one node, opacity dragged on the first and then on the second within
the 400 ms window: with `{effectId}` the two drags share a key and collapse into one entry, so a
single undo reverts both. With the instance id they are two entries, which is what the stack editor
shows and what the user did.

### Decision
The key is `set-effect:{nodeId}:{instanceId}`. `STATE_MANAGEMENT.md` § Command catalogue is corrected
in the same commit; the table predates the instance/catalogue split.

### Consequences
- Accepted: the key is longer and is not stable across a remove-and-re-add of the same effect. That
  is correct — a re-added effect is a new instance.
- Avoided: an undo that reverts an edit to a layer the user is not looking at.

## ADR-060 — A duplicate shares assets and gets fresh node and layout ids

**Date** 2026-08-08 · **Prompt** 14 · **Status** Accepted

### Question
`duplicateNodes` must remap "internal references (`layoutId`, asset refs, slot targets)" so that no
id in the copy appears in the original. Does that include copying the assets?

### Criterion (set before measuring)
An id must be remapped when sharing it makes the copy behave as the original. Anything else is
shared.

### Measurement
- **Node ids** — shared ids would make `children`/`parentId` point into the other subtree. Remapped.
- **`layoutId`** — a shared layout id makes two elements one shared-layout animation target, so a
  duplicate would animate as a move of the original. Remapped, to a fresh `layout_` id from the same
  `generateId` counter.
- **Slot targets** — a `slot` is a name declared by the parent block (`children`, `media`), not an
  id. Nothing to remap; the copy keeps its slot.
- **Asset ids** — an asset is document-level and can be 3 MB of data URL. Sharing one costs nothing
  and changes no behaviour; copying doubles the file on every duplicate. `removeNodes` already
  releases an asset when the last reference goes, so sharing is refcounted rather than leaked.
  Shared.

### Decision
Fresh node ids for the whole subtree, fresh `layoutId` values, shared assets. The prompt's test —
"no id in the copy appears in the original" — is asserted over node ids and layout ids, and the
shared asset id is asserted to be *the same*, which is the behaviour, not an oversight.

### Consequences
- Accepted: deleting the original of a duplicated pair keeps the asset alive, because the copy still
  references it. That is the refcount working.
- Accepted: `STATE_MANAGEMENT.md`'s "offsets position" is dropped from the table in the same commit.
  There is no position to offset — ADR-057.

## ADR-061 — Generated ids come from `ctx.generateId`, re-prefixed, and the caller may pre-name a node

**Date** 2026-08-08 · **Prompt** 14 · **Status** Accepted

### Question
`EDITOR_ENGINE.md` § Structural commands ends `insertNode` with "returns the new id via `ctx` so the
caller can select it". `Command.apply` returns `void` and `dispatch` returns `void`. Two problems in
one: how a caller learns the id, and where an *effect instance* id comes from when `generateId`
produces `NodeId`s.

### Criterion (set before measuring)
Determinism first: `TESTING.md` § Determinism requires every id in a command to come from the
injected generator, so that a store built twice from the same options is byte-identical. Any
mechanism that satisfies that and needs no new store API wins over one that adds surface.

### Measurement
The generator is already shared: the store hands the same `generateId` to every command through
`CommandContext`, and `create-store.ts` already re-prefixes it for the document id
(`documentIds`). A caller holding the context can therefore *choose* the id before dispatching, and
learn nothing new afterwards. The alternative — a result channel on `dispatch` — changes
`DocumentSlice`, `Command`, and every call site, for one caller.

### Decision
Creating commands take an optional id in the payload (`id?: NodeId` on `insertNode`, `insertBlock`,
`wrapInContainer`) and fall back to `ctx.generateId()`. Non-node ids are derived from the same
counter with their own prefix: `fx_` for effect instances, `layout_` for layout ids, the same
construction `create-store.ts` uses for `doc_`.

### Consequences
- Accepted: "returns the new id via `ctx`" reads, in code, as "takes the id through the payload".
  The document sentence is the one that is loose; the mechanism it describes is this one.
- Accepted: a caller that passes a duplicate id corrupts the document. Guarded: creating a node
  whose id already exists throws `NODE_ID_TAKEN`.
- Rejected: `dispatch` returning the created id. It types every command's return as `unknown` to
  serve one of them.

## ADR-062 — `insertBlock` materialises the block's default subtree

**Date** 2026-08-08 · **Prompt** 14 · **Status** Accepted

### Question
`insertNode` already takes a `blockId` and defaults its props from the definition. What is left for
`insertBlock` to be?

### Criterion (set before measuring)
Two commands with the same effect are one command with two names. `insertBlock` earns its file only
if it does something `insertNode` does not, and that something has to be named by a document.

### Measurement
`SlotDefinition.defaultChildren` exists in the registry contract and has no consumer anywhere in the
codebase. `DRAG_AND_DROP.md` § Drag sources, row 1: dropping a palette card runs `insertBlock` — and
a palette card for a `feature-grid` that drops an empty grid is the case that sentence is about.

### Decision
`insertNode` inserts exactly one node. `insertBlock` inserts the node and then, depth-first, one
child per `defaultChildren` entry of each of its slots. A `defaultChildren` chain that reaches a
block already on the path throws `RECURSIVE_DEFAULT_CHILDREN` rather than recursing.

### Consequences
- Accepted: a registry with a cyclic default chain fails loudly at insert time instead of at the
  call-stack limit. The cycle is a registry bug, and the message names the block.
- Accepted: `insertBlock` consumes several ids from the generator. Deterministic, so tests state the
  count.

## ADR-063 — `setDocumentMeta` writes an allowlist of four paths

**Date** 2026-08-08 · **Prompt** 14 · **Status** Accepted

### Question
`DocumentMeta` holds `id`, `name`, `createdAt`, `updatedAt`, `generator`, `canvas`, `template`.
Prompt 14 asks for `setDocumentMeta` and names no fields. Which of the seven are editable, and does
the command coalesce?

### Criterion (set before measuring)
A field is editable through this command when a user changes it deliberately. A field written by the
system is not, because an undoable user command that fights the system's writer produces a document
whose provenance is fiction.

### Measurement
- `id` — identity. A document that changes id is a different document; `FILE_FORMAT.md` § Structure
  keeps it beside the timestamps for provenance.
- `createdAt` / `generator` — written once, by the writer.
- `updatedAt` — written by the save path, prompt 50, from the injected clock.
- `name` — the title field in the topbar. Editable, and it is a text field, so it coalesces exactly
  as `renameNode` does.
- `canvas.width` / `canvas.background` — document settings in the inspector's no-selection state
  (`UI_GUIDELINES.md` § Loading and empty states). Editable.
- `template` — a flag on the fixtures the gallery ships, not something a user toggles.

### Decision
Four paths: `name`, `canvas.width`, `canvas.background`, `template`. Anything else throws
`META_PATH_NOT_EDITABLE`. The result is re-parsed with `documentMetaSchema`, so `canvas.width: 4` is
rejected by the same bounds the file format states. The key is `meta:{path}`, by the same reasoning
that gives `setThemeToken` `theme:{path}` — a dragged number is one undo step.

### Consequences
- Accepted: `template` is in the list although no UI toggles it today. It is a meta field a fixture
  author sets, and leaving it out would mean editing fixtures by hand.
- Accepted: the command never touches `updatedAt`. Persistence owns it — ADR-056 put the clock in
  one place, and a command that stamps a document on every keystroke would put it back everywhere.

## ADR-064 — `setMotion` enforces the block's declared channels

**Date** 2026-08-08 · **Prompt** 14 · **Status** Accepted

### Question
`BlockCapabilities.supportsMotion` lists the `MotionChannel`s a block declares. Nothing enforces it.
Should `setMotion` reject a channel the block does not declare?

### Criterion (set before measuring)
A guard earns its branch when the unguarded outcome is silent. A loud failure elsewhere does not
need a guard here.

### Measurement
`validateDocument` does not check motion channels — invariants 6 to 8 are about blocks, props and
slots, and there is no invariant 10. `ANIMATION_SYSTEM.md` § Resolution resolves the specs a block
supports; a spec on an unsupported channel resolves to nothing. So the unguarded outcome is a motion
panel that accepts a setting, a document that stores it, an export that omits it, and no message
anywhere.

### Decision
`setMotion` throws `UNSUPPORTED_MOTION_CHANNEL` when `capabilities.supportsMotion` does not list the
channel. `clearMotion` does not check — removing a spec a block should never have had is exactly the
repair path.

### Consequences
- Accepted: a registry that under-declares `supportsMotion` blocks a legitimate edit. That is a
  registry bug with a message that names the block and the channel, which is the cheapest place to
  find it.
- Accepted: documents written before this guard can hold specs it would reject. `clearMotion` and
  `repairDocument` both still work on them; the guard is on the write path only.

## ADR-065 — Redo keeps the current selection, pruned; it does not restore one

**Date** 2026-08-08 · **Prompt** 15 · **Status** Accepted

### Question
`EDITOR_ENGINE.md` § Undo states the selection rule for undo: `selection = pruneSelection(entry.selectionBefore, document)`.
Redo has no such line, and a `HistoryEntry` records only the selection from *before* its command. What
should redo select?

### Criterion (set before measuring)
Two requirements, in order:
1. **Never select a node the document does not contain.** A selected id with no node crashes the
   inspector — the reason `pruneSelection` exists at all.
2. Of the options that satisfy 1, prefer the one that surprises a user least: redo is a step
   *forward*, so it should leave the user where they already are unless that is impossible.

### Measurement
Three candidates, checked against a redo of `removeNodes`:

- **`entry.selectionBefore`** — the selection before the delete, which contains the ids the redo just
  deleted. It satisfies 1 only after pruning, and after pruning it is empty. It also walks the
  selection *backwards* on a forward step.
- **A recorded `selectionAfter`** — would satisfy both, and costs a second id list per entry plus a
  second write path in `dispatch`. No document asks for it, and nothing in the UI reads it.
- **The current selection, pruned** — satisfies 1 by construction and satisfies 2 exactly: the
  selection does not move unless redo removed what was selected.

### Decision
`redoStep` applies the forward patches and sets `pruneSelection(currentSelection, nextDocument)`.
Undo keeps the rule its document already states.

### Consequences
- Accepted: undo-then-redo of a deletion does not restore the selection the deletion cleared. The
  nodes are back and unselected, which is what the document says happened and not what the user's
  cursor was doing before.
- Accepted: undo and redo are asymmetric in this one respect, and the asymmetry is in the entry —
  it holds `selectionBefore` and nothing else.
- Rejected: recording `selectionAfter`. Revisit if a UI is written that needs it; it is additive.

## ADR-066 — History entry ids come from a per-store counter, not the document id generator

**Date** 2026-08-08 · **Prompt** 15 · **Status** Accepted

### Question
`HistoryEntry.id` is a string and something has to produce it. ADR-061 says ids in commands come from
the injected `ctx.generateId`. Does that extend to history?

### Criterion (set before measuring)
Determinism, and no interference: a store built twice from the same options must produce the same
ids, and taking an id for one purpose must not shift the ids of another.

### Measurement
`ctx.generateId` is the counter the *document* is named from. A history entry drawn from it consumes
`node_4`, so the next inserted node becomes `node_5` — every test that dispatches inside a transaction
would have its node ids shifted by however many entries happened to be written first. The entry id is
also never written to the document: it is a React key for the undo list and a target for "undo to
here". Nothing serialises it.

### Decision
`createHistorySlice` keeps a counter of its own, per store, and names entries `hist_1`, `hist_2`, …
The same counter names an open transaction, so the dev-mode "still open" warning can tell one
transaction from the next without touching `generateId` either.

### Consequences
- Accepted: two stores in one test both start their history at `hist_1`. They are different stores
  with different histories, and nothing compares entry ids across them.
- Accepted: ADR-061 now reads as "ids that reach the document come from `ctx.generateId`". Ids that
  never leave memory do not.

## ADR-067 — The clipboard slice is asynchronous and paste returns a report

**Date** 2026-08-08 · **Prompt** 16 · **Status** Accepted

### Question
STATE_MANAGEMENT.md § clipboard declares `copy`, `cut` and `paste` as returning `void`.
EDITOR_ENGINE.md § Clipboard says paste prefers the system clipboard, and prompt 16 requires a
partial-paste report ("Pasted 4 of 6 blocks"). What is the slice's actual API surface?

### Criterion (set before measuring)
Two requirements, in order:
1. The signature must be implementable. A `void` method cannot wait for a promise and still act on
   its value.
2. Of the implementable options, prefer the one that makes the report impossible to lose: a caller
   that forgets to handle a rejected paste is a paste that silently does nothing.

### Measurement
`navigator.clipboard.readText()` returns a `Promise<string>` — there is no synchronous read outside a
`paste` event handler, and the shortcut path (`Mod+V` routed through the command map) is not one. So
requirement 1 rules out `void` for anything that touches the system clipboard. Three shapes were
weighed against requirement 2:

- **`Promise<void>` plus a report field in the slice state** — the report becomes state nobody
  invalidates, and two pastes in flight overwrite each other's report.
- **`Promise<void>` plus a thrown error** — a rejected paste and a partial paste stop being the same
  shape, so the caller needs both a `catch` and a state read to render one toast.
- **`Promise<Result<PasteReport, MotionStudioError>>`** — one value carries "nothing was pasted and
  why" and "4 of 6 were pasted and which two were not". `Result` is already this project's return for
  an expected failure (CODE_STANDARDS.md § Errors).

### Decision
`copy` and `cut` return `Promise<void>`; `paste` and `pasteInPlace` return
`Promise<Result<PasteReport, MotionStudioError>>`. `copyStyle` and `pasteStyle` stay synchronous: the
style payload is not written to the system clipboard, because no document defines a cross-tab format
for it and inventing one would put a second marker in the format.

`paste` selects the roots it inserted. Undo restores `selectionBefore`, so the selection is not lost
by it, and a paste followed by `Delete` acting on the pasted nodes is what every editor does.

### Consequences
- Accepted: every caller of `copy` in the UI is `async`, and a test must `await` it.
- Accepted: paste-style does not cross tabs. Node paste does, which is what the prompt names.
- Accepted: two `Result` shapes now exist for one gesture — an `err` for "no usable payload", and an
  `ok` whose report lists per-node rejections. That distinction is the point: the first left the
  document untouched, the second changed it.

## ADR-068 — `SerializedSubtree` records the index each root came from

**Date** 2026-08-08 · **Prompt** 16 · **Status** Accepted

### Question
`Mod+Shift+V` is paste-in-place: same parent, same index (SHORTCUTS.md § Editing). The payload in
EDITOR_ENGINE.md § Clipboard carries `nodes`, and a node carries `parentId` and `slot` — but not its
position among its siblings. Where does the index come from?

### Criterion (set before measuring)
The index must survive the trip through a `text/plain` payload and another browser tab. Nothing that
paste-in-place needs may be read from the source document, because the source document is not open in
the tab doing the paste.

### Measurement
Three sources for the index were checked against a cross-tab paste:

- **The current document** — `children.indexOf(rootId)` is `-1` in the pasting tab whenever the copy
  came from another document, and wrong whenever the source was cut.
- **Recomputed from the payload** — the payload holds the copied roots only, not their siblings, so
  there is nothing to compute a position against.
- **Stored in the payload** — survives serialisation, the tab boundary, and a cut of the original.

### Decision
`SerializedSubtree` gains `origins: Record<NodeId, number>`, keyed by the *source* root id, holding
the index that root occupied in its parent. The parent and the slot are already on the node, so this
adds one number per root and nothing else.

### Consequences
- Accepted: the payload's shape changed, so a payload written before this field fails validation. It
  is version 1 in both cases and no build has shipped, so there is no migration to write.
- Accepted: `origins` is keyed by ids that are dead after remapping. It is read once, during the
  paste, before those ids are discarded.
- Rejected: a full `origin` object per root (`{ parentId, slot, index }`). Two of its three fields
  would restate the node.

## ADR-069 — "The target block's schema accepts it" means the value survives a parse

**Date** 2026-08-08 · **Prompt** 16 · **Status** Accepted

### Question
Paste-style applies only the props the target block's schema accepts, and skips the rest silently.
What makes a prop accepted?

### Criterion (set before measuring)
The test must reject a prop the target does not have. A rule that lets an unusable prop through
writes a key no renderer reads and no inspector shows — a prop that exists in the document and
nowhere else.

### Measurement
`safeParse` alone fails the criterion, and measurably: `z.object({ a: z.string() })` parsing
`{ a: 'x', glass: true }` returns `success: true` with `data` equal to `{ a: 'x' }`. Zod strips
unknown keys by default, so success proves the parse happened, not that the prop was kept. Parsing
the merged props and then reading the path back distinguishes the two cases in one call.

### Decision
A style prop is applied when `propsSchema.safeParse({ ...targetProps, [path]: value })` succeeds
**and** the parsed result still holds `value` at `path`. Everything else is skipped, and skipping is
not reported — the prompt names it as expected rather than as an error.

### Consequences
- Accepted: a block whose schema is `.passthrough()` accepts every style prop. That is what
  passthrough means, and the fake registry's permissive block is how the tests exercise the
  accepting branch.
- Accepted: a prop whose value the schema coerces (a number where a string arrived) counts as
  rejected, because the value read back is not the value sent.
- Accepted: the check runs one parse per prop per target node. A style payload is a handful of props
  and a multi-select is tens of nodes, so this is hundreds of parses on a keystroke, not thousands.

## ADR-070 — `resolveInsertTarget` never returns a target that would throw

**Date** 2026-08-08 · **Prompt** 16 · **Status** Accepted

### Question
Prompt 16 fixes the resolution order and says "if the resolved slot rejects `blockId` → walk up to the
nearest ancestor whose slot accepts it". `insertNode` has five guards, not one. Which of them count as
the slot rejecting the block?

### Criterion (set before measuring)
`resolveInsertTarget` returns a target **or** a rejection. A caller that receives a target and then
gets an exception from the command has been handed a broken contract — the point of the `{ rejected }`
arm is that the caller can show a reason instead of catching.

### Measurement
The guards of EDITOR_ENGINE.md § insertNode were sorted by whether they are a property of the
(parent, slot, block) triple that resolution is choosing:

- `requireAcceptance`, `requireCapacity`, `requireUnlocked` — yes. All three are decided by the
  candidate parent and slot, and all three throw on insert if resolution ignores them.
- `requireProps`, `requireFreshId` — no. They are properties of the payload the caller builds
  afterwards, not of the position.

### Decision
A slot is a candidate when it exists, accepts the block, has room for one more child, and its node is
unlocked. All four are checked at every step of the walk, so a locked or full container is walked past
rather than returned. `{ rejected }` carries the reason the walk reached the root without a candidate.

### Consequences
- Accepted: a paste of five roots into a slot with room for two still throws `SLOT_FULL` from the
  command — resolution checks room for one, because its signature takes one `blockId`. The slice
  catches it and returns an `err`, and the document is untouched. Widening the signature to a count is
  additive if a caller ever needs it.
- Accepted: capacity is read at resolution time and again at apply time. Nothing runs between them in
  a single dispatch.

## ADR-071 — An unknown block rejects its whole subtree, and the report counts nodes

**Date** 2026-08-08 · **Prompt** 16 · **Status** Accepted

### Question
Paste rejects unknown `blockId`s per node rather than failing the whole paste. What happens to the
children of a rejected node, and what do the two numbers in "Pasted 4 of 6 blocks" count?

### Criterion (set before measuring)
The result must satisfy the document invariants of EDITOR_ENGINE.md § Invariants — specifically 2
(every non-root `parentId` exists) and 5 (no orphans). A partial paste that violates them is worse
than a failed paste, because it corrupts an open document rather than declining to change it.

### Measurement
Keeping the children of a rejected node leaves each of them with a `parentId` naming a node that was
never inserted. Re-parenting them to the rejected node's parent would satisfy the invariants and turn
the pasted result into a layout the user never copied — a hero's two buttons landing directly in a
page section. Dropping the subtree satisfies the invariants and drops exactly what could not be
reproduced.

### Decision
A node whose `blockId` is not in the registry is dropped with every descendant. The report counts
**nodes**: `requested` is every node in the payload, `pasted` is every node inserted, and the
per-block breakdown names the unknown block ids with the number of nodes each one cost, so a hero
that took two buttons with it reads as 3 rather than as 1.

### Consequences
- Accepted: an unknown container near the root can cost most of a paste. The report says so, naming
  the block, which is the actionable half — the user learns which package they are missing.
- Accepted: `pasted + dropped = requested` only when counting nodes, so the message says "blocks"
  while the arithmetic is over nodes. The document model calls a node's definition a block, and the
  user sees blocks in the layer tree.

## ADR-072 — The conversions take a viewport rect structurally, not a `DOMRect`

**Date** 2026-08-08 · **Prompt** 17 · **Status** Accepted

### Question
CANVAS.md § Coordinate spaces and prompt 17 both type the viewport argument as `DOMRect`. The same
prompt requires that no function in the module touch the DOM. Which wins?

### Criterion (set before measuring)
Two requirements, in order:
1. Every real caller must be able to pass `element.getBoundingClientRect()` with no conversion.
2. Of the options that satisfy 1, prefer the one that does not force a dependency the arithmetic
   does not have — the maths reads four numbers.

### Measurement
`DOMRect` is declared by the DOM lib and constructed by the browser. A test that names it needs a
DOM environment to build one, and the four fields the conversions read (`left`, `top`, `width`,
`height`) are plain numbers. A structural interface with those four fields is satisfied by `DOMRect`
without a cast — checked by the compiler, not asserted here — so requirement 1 holds either way, and
only the structural form satisfies requirement 2.

### Decision
`ViewportRect` is an interface of the four numbers the conversions read. `DOMRect` is assignable to
it, so every call site in `packages/canvas` and `apps/web` passes the measured rect unchanged, and
the coordinate tests build a rect as an object literal.

### Consequences
- Accepted: the signature no longer names the browser type the documents named. CANVAS.md keeps its
  `DOMRect` examples because that is what callers will actually hand in.
- Accepted: a caller could pass a rect that is not a viewport measurement. So could a `DOMRect` — the
  type never proved the rect came from the canvas element.
- Avoided: a `jsdom` requirement in a module whose whole content is arithmetic.

## ADR-073 — Keyboard zoom lands on the dropdown's steps, not on ×1.2

**Date** 2026-08-08 · **Prompt** 18 · **Status** Accepted

### Question
CANVAS.md § Zoom gave `Cmd+=` / `Cmd+-` a ×1.2 factor. Prompt 18 says the keyboard steps use
`ZOOM_STEPS`, the list the zoom dropdown shows. Both cannot be true.

### Criterion (set before measuring)
Two controls that set the same value must be able to display each other's result. The zoom dropdown
shows a check beside the current value; a keyboard step that lands between two entries leaves that
menu with nothing checked, and the user cannot get back to a round number without opening it.

### Measurement
Starting at 100 % and pressing `Cmd+=` three times:

| Rule | Sequence | In the dropdown |
| --- | --- | --- |
| ×1.2 | 120 % · 144 % · 172.8 % | none of the three |
| `ZOOM_STEPS` | 150 % · 200 % · 400 % | all three |

The ×1.2 rule also never returns to 100 % by keyboard alone: pressing `-` from 120 % gives 100 % only
because the two factors happen to cancel, and from 144 % it gives 120 %.

### Decision
`Cmd+=` moves to the next value in `ZOOM_STEPS` above the current zoom, `Cmd+-` to the next below,
both anchored at the viewport centre. A zoom that sits between two steps — from a trackpad pinch —
moves to the neighbouring step, so the first keypress after a pinch snaps to a round number.
CANVAS.md § Zoom is corrected.

### Consequences
- Accepted: the steps are uneven (0.25 → 0.5 doubles, 1.5 → 2 does not). They are the ones the
  dropdown already showed, and evenness was never the property being bought.
- Accepted: at 400 % the key does nothing, because `MAX_ZOOM` is the last step. The ×1.2 rule would
  also have stopped there, one clamp later.

## ADR-074 — The per-event wheel zoom factor is clamped to one dropdown step

**Date** 2026-08-08 · **Prompt** 18 · **Status** Accepted

### Question
CANVAS.md § Zoom gives the wheel factor as `1 - deltaY * 0.01`, "clamped per event". Prompt 18 says
the clamp exists so a high-resolution trackpad does not jump three steps in one event. Clamped to
what?

### Criterion (set before measuring)
One wheel event must not change the zoom by more than one step of `ZOOM_STEPS` — that is the unit the
rest of the zoom UI is built from, so it is the unit a single event may move.

### Measurement
The ratios between adjacent entries of `ZOOM_STEPS` are 2, 1.5, 1.3333, 1.5, 1.3333 and 2. The
smallest is 1.3333 (0.75 → 1 and 1.5 → 2), so a factor inside `[1 / 1.3333, 1.3333]` cannot cross a
step boundary from either side. Chrome reports `deltaY` of 100 for one mouse notch, which the raw
formula turns into a factor of 0 — clamped, it becomes 0.75. A trackpad pinch reports a stream of
small deltas and is unaffected by the clamp.

### Decision
`WHEEL_ZOOM_CLAMP = 4 / 3`, and the factor is clamped to `[1 / WHEEL_ZOOM_CLAMP, WHEEL_ZOOM_CLAMP]`.
The number is derived from `ZOOM_STEPS` in code, not typed in, so changing the dropdown changes the
clamp with it.

### Consequences
- Accepted: a mouse wheel notch now zooms by 4/3 rather than by whatever `1 - deltaY * 0.01` produced,
  which for a standard notch was a clamp to `MIN_ZOOM` in one event.
- Accepted: a very fast trackpad flick needs more events to cross the range. It also cannot overshoot
  past the intended stop, which is the trade being made.

## ADR-075 — The canvas reads reduced motion from `--ms-reduced-motion`

**Date** 2026-08-08 · **Prompt** 18 · **Status** Accepted

### Question
Pan momentum is disabled under reduced motion (CANVAS.md § Pan). The studio also has a "preview
reduced motion" toggle (ADR-021) and the store has `viewport.previewReducedMotion`. `packages/canvas`
must not import `editor`. How does the canvas learn the answer?

### Criterion (set before measuring)
One source that answers both questions — the OS preference and the studio's preview toggle — without
a second mechanism to keep in step, and without a dependency the contract's § 2 forbids.

### Measurement
Three candidates:

- **`matchMedia('(prefers-reduced-motion: reduce)')`** — sees the OS preference and is blind to the
  preview toggle, so previewing reduced motion would leave momentum running.
- **A prop from the app** — correct, and it is the store value crossing a package boundary as data.
  It is also a second mechanism: the CSS already answers this question for every animation in the
  product, and the two would drift the first time one is updated alone.
- **The computed value of `--ms-reduced-motion`** — ADR-021 made this variable the single answer:
  `1` normally, `0` from the media query, and `0` written inline by the preview toggle. One
  `getComputedStyle` read on gesture end answers both.

### Decision
`prefersReducedMotion(element)` reads the computed `--ms-reduced-motion` on the canvas root and
returns `true` when it is `0`. It is called when a pan gesture ends, not on every frame.

### Consequences
- Accepted: a `getComputedStyle` call per gesture end. It is one read, off the frame path, and it is
  the same value the CSS is already resolving.
- Accepted: an application that never loads the token stylesheet reads an empty string and gets
  `false` — momentum runs. That matches the CSS default of `1`.

## ADR-076 — `Shift+2` is bound where the selection is known, not inside the canvas

**Date** 2026-08-08 · **Prompt** 18 · **Status** Accepted

### Question
SHORTCUTS.md § Viewport lists `Shift+2` as "zoom to selection", and prompt 18 asks for the viewport
shortcuts. `CanvasProps` is `rootId`, `renderNode`, `artboardWidth` and `className`; none of them is
a selection, and the contract forbids `canvas` from importing `editor`.

### Criterion (set before measuring)
A shortcut is implemented where its inputs are, and no package gains a dependency the directory law
of ENGINEERING_CONTRACT.md § 2 denies it.

### Measurement
The rect `Shift+2` needs is the union of the selected nodes' boxes. Selection lives in the editor
store; the canvas learns about it in prompt 21, which draws the selection overlay and is where a
selection rect first exists inside this package. Adding a `selectionRect` prop now would be a prop
with no caller until then.

### Decision
The viewport exposes `fitTo(rect)` and `fitDocument()` through its context, and binds `Cmd+0`,
`Cmd+=`, `Cmd+-` and `Shift+1` — every shortcut whose input it has. `Shift+2` is bound in prompt 21,
against the same `fitTo`, once the selection rect exists in this package.

### Consequences
- Accepted: one row of SHORTCUTS.md § Viewport is not wired after this prompt. It is named here and
  in the session report rather than quietly skipped.
- Accepted: `fitTo` is exported before it has a second caller. It is the function `Shift+1` already
  uses, not a new seam.

## ADR-077 — The canvas reads the document through injected getters, not props

**Date** 2026-08-09 · **Prompt** 19 · **Status** Accepted

### Question
Hit testing needs `locked`, `hidden`, `parentId` and `children` per node, plus the current
`isolationId` and the selection. All of it lives in the editor store, which
ENGINEERING_CONTRACT.md § 2 forbids `packages/canvas` from importing. How does the canvas get it?

### Criterion (set before measuring)
The seam must satisfy three constraints already written down, without adding a fourth mechanism:
directory law (no `editor` import, `schema` types only — CANVAS.md § Public API); PERFORMANCE.md
§ The core rule (a document edit must not re-render the canvas root); and CANVAS.md § Public API's
own statement that the canvas is "tested with a fake viewport and three fake nodes".

### Measurement
Three candidate seams, against those three constraints:

- **`document: MotionDocument` as a prop** — satisfies the directory law only by importing the type,
  but fails the second: the prop identity changes on every keystroke in the inspector, so the canvas
  root re-renders per edit and the memoised per-node subscriptions stop being what bounds the render.
  It also pulls `walk`/`ancestors` in as runtime imports from `schema`, which CANVAS.md § Public API
  restricts to types.
- **Individual props (`isolationId`, `lockedIds`, …)** — the same re-render, multiplied by the number
  of props, and each one is a second copy of state the store already holds.
- **A port of getters** — `CanvasScene` with `node(id)`, `isolationId()`, `selectedIds()` and
  `version()`, read inside event handlers rather than during render. The handle is memoised once, so
  a document edit changes nothing React can see; the fake in a test is an object literal over a
  `Map`.

### Decision
`CanvasProps` takes `scene: CanvasScene` (state in, by getter) and `selection: CanvasSelectionPort`
(intent out). Both are read in handlers and effects, never during render. `version()` exists so the
rect cache knows the geometry it holds is stale; it is the one value that crosses as a React
dependency, because an effect is exactly what has to re-run.

### Consequences
- Accepted: `apps/web` writes the adapter — about fifteen lines over `useEditorStore.getState()`.
  That adapter is where the two packages meet, and it reads in one screen.
- Accepted: getters hide their dependencies from React, so anything in the canvas that must react to
  a document change has to be told. That is what `version()` is for, and the overlays in prompt 21
  will need the same treatment rather than a subscription.
- Avoided: a second copy of the document inside the canvas, and a re-render per edit.

## ADR-078 — "Parent chain at the current isolation level" is resolved by lifting, and a locked ancestor blocks its subtree

**Date** 2026-08-09 · **Prompt** 19 · **Status** Accepted

### Question
CANVAS.md § Hit testing step 3 is "the topmost node whose parent chain is at the current isolation
level". Two cases the sentence does not settle: what happens when the node under the cursor is
**not** below `isolationId` at all, and whether a locked container blocks selecting its children or
only itself.

### Criterion (set before measuring)
The behaviour the document names as the target — "clicking a nested text inside an un-entered Hero
selects the Hero", stated as what makes the editor feel like Figma rather than a DOM inspector.
Where the sentence is silent, the answer is the one that keeps that property true in the
neighbouring case, not the one that is fewer lines.

### Measurement
Let `L = isolationId ?? rootId` be the level container.

- **Lifting.** For a candidate under the cursor, walk up its ancestors to the node whose `parentId`
  is `L`. That single rule produces both documented behaviours: un-isolated, a nested text lifts to
  its top-level ancestor (the Hero); isolated into the Hero, the same text lifts to the Hero's own
  child, which is step 2's "prefer descendants of `isolationId`". Two rules are not needed for two
  rows.
- **Outside the isolation container.** With the Hero entered, clicking a different top-level section
  can only resolve to that section — nothing below `L` is under the cursor. Returning `null` would
  make the rest of the document unclickable until `Esc`, which no tool with group entering does. The
  candidate is lifted against the root instead, which is "leave, then select".
- **Locked ancestors.** A container whose children stayed selectable while it is locked would make
  the lock unusable for its stated purpose — pinning a background section so clicks fall through. A
  candidate is therefore skipped when it, or any node between it and the result, is locked or hidden.
- **The level container itself is never a result.** With `L = rootId` the root is under every click;
  returning it would make "click empty space" select the page instead of clearing it, and there would
  be nothing left to start a marquee on.

### Decision
`resolveHit` walks the candidates topmost-first; for each it lifts to the child of `L`, falling back
to the child of `rootId` when the chain does not pass through `L`; a candidate whose chain contains a
locked or hidden node is skipped; `L` itself and the root resolve to `null`. `Alt` skips the lift
entirely and returns the deepest candidate that is not itself locked or hidden.

### Consequences
- Accepted: `Alt+click` can select a child of a locked container. It bypasses isolation by
  specification, and what remains is the lock check on the node itself.
- Accepted: clicking a section while isolated inside another one selects rather than only exiting, so
  one click changes two things. That is the behaviour of every tool with group entering.
- Accepted: a hidden node is filtered here as well as by the renderer, which never mounts one. The
  duplicate is one comparison, and it keeps the chain correct if a block ever renders its own hidden
  children.

## ADR-079 — `RectCache.get` never touches the DOM

**Date** 2026-08-09 · **Prompt** 19 · **Status** Accepted

### Question
After `invalidate(id)`, should `get(id)` read `getBoundingClientRect` for that one node so a caller
always gets an answer, or return `undefined` until the next batched `refresh`?

### Criterion (set before measuring)
CANVAS.md § Hit testing states the requirement the cache exists for: "Marquee reads the cache, never
the DOM." A design that *can* read the DOM from `get` is one where the guarantee holds only by the
caller's good behaviour, and the failure is invisible — it shows up as frame time under a gesture,
not as a wrong answer.

### Measurement
A marquee over 200 nodes calls `get` 200 times per frame. A lazy `get` that reads one rect per miss
turns a single invalidation — one `ResizeObserver` callback, one scroll event — into 200 forced
layouts inside that frame, which is precisely the loop PERFORMANCE.md § Canvas specifics exists to
forbid. The batched alternative is one pass: `refresh` reads every observed element inside one
`requestAnimationFrame`, so repeated invalidations within a frame still cost one layout.

### Decision
`get` is a map read. `invalidate` drops entries, `refresh` schedules the single batched pass, and a
node whose rect has not been read yet is absent from the marquee's result for that frame.

### Consequences
- Accepted: a node that mounts mid-gesture is not marquee-selectable until the next frame. It is one
  frame, against 200 layouts inside it.
- Accepted: callers must call `refresh`. The hook does it on mount, on `version` change and on
  scroll; the marquee does it at gesture start.
- Avoided: a cache whose performance contract depends on nobody calling it wrong.

## ADR-080 — Arrow keys emit a nudge intent; the canvas has no geometry to change

**Date** 2026-08-09 · **Prompt** 19 · **Status** Accepted

### Question
SHORTCUTS.md § Transform binds the arrows to "nudge 1 px" (`Shift` 10 px, `Alt` grid size) and
prompt 19 lists arrows in the keyboard selection path. There is no `x`/`y` on a node: the document
model has no coordinates, which is why ADR-057 made align and distribute write `align`/`justify` to
the parent rather than move anything.

### Criterion (set before measuring)
A key binding is implemented where its inputs are — the rule ADR-076 already applied to `Shift+2`.
The canvas owns the key map for its own surface; what a nudge *does* to a document is a command, and
commands live in `editor`.

### Measurement
`packages/editor/src/commands/` holds 25 commands and none of them translates a node: `moveNodes` is
a reparent plus a reorder. So there is nothing for the canvas to call, and nothing for it to compute
either — a number of pixels is meaningful only to a block that has a position.

### Decision
`use-keyboard-selection` resolves the modifiers to a step (1, 10, or the grid size) and calls
`selection.nudge(dx, dy)` on the injected port. The canvas is complete at that seam. No translate
command is written here, and none is faked.

### Consequences
- Accepted: until a translate command exists, an application wires `nudge` to nothing and the arrows
  do nothing visible. The gap is named in the session report and belongs to whichever prompt gives
  blocks a position.
- Accepted: `Alt`+arrows needs the grid size, so the keyboard hook takes it — the same value the
  artboard already renders with.

## ADR-081 — The canvas keyboard map is SHORTCUTS.md's, and `Space` stays pan

**Date** 2026-08-09 · **Prompt** 19 · **Status** Accepted

### Question
ACCESSIBILITY.md § Canvas listed "Select | `Space` toggles, `Shift+arrows` extends". SHORTCUTS.md
§ Viewport binds `Space` (hold) to pan and § Transform binds `Shift`+arrows to nudge 10 px, and
CANVAS.md § Keyboard operation agrees with SHORTCUTS.md on both rows. Which document wins?

### Criterion (set before measuring)
ENGINEERING_CONTRACT.md § 8 assigns each question to exactly one document. "Keyboard map, command
palette" is SHORTCUTS.md. Ownership decides; a majority of documents does not.

### Measurement
Both contested bindings are already taken in the owning document, and both are load-bearing.
`Space`+drag is the pan every canvas tool has and it is implemented — prompt 18, `use-pan.ts`.
`Shift`+arrows is the 10 px nudge, which is the only thing that makes a 1 px nudge usable. Taking the
ACCESSIBILITY.md row literally would have removed pan from the keyboard and left the arrows without a
coarse step, and no replacement binding is free elsewhere in the map.

### Decision
ACCESSIBILITY.md § Canvas is corrected to the map SHORTCUTS.md owns: `Shift+Click` adds, `Mod+Click`
toggles, `Mod+A` takes the level. Keyboard multi-selection is the layers tree, which the same section
already names as the accessible structure and which carries `aria-multiselectable`.

### Consequences
- Accepted: there is no keyboard multi-select on the canvas surface. ACCESSIBILITY.md § Canvas states
  that the canvas and the tree are two complete paths to the same operations, so the requirement is
  met — but it is met in the tree and not here, and that is now written down rather than implied.
- Accepted: a screen-reader user who wants a multi-selection moves to the tree with `F2`.

## ADR-082 — Arrows under pan mode reuse the one arrow step table the map already has

**Date** 2026-08-09 · **Prompt** 19 · **Status** Accepted

### Question
CANVAS.md § Keyboard operation says "`Space` (hold) | Pan mode; arrows pan". It gives no distance,
and SHORTCUTS.md § Viewport does not list arrow panning at all. How far does one press pan?

### Criterion (set before measuring)
The banned fourth way is an unbacked number. So the acceptable answers are: a number already written
down for arrows on this surface, or an escalation. Inventing "40 px because it feels right" is the
defect this file exists to catch.

### Measurement
The map contains exactly one arrow step table, SHORTCUTS.md § Transform: 1 px, `Shift` 10 px, `Alt`
the grid size. It is already implemented in this hook for the nudge path, it already reads the grid
size the artboard is drawn with, and it already has a coarse step for the case where one pixel is too
slow. A second table would be a second thing to keep in step with the first, and its numbers would
have no source.

### Decision
Arrow panning uses the same `arrowStep` as nudging: 1 / 10 / grid size, in screen pixels, applied
through `viewport.panBy` and committed per press. The canvas introduces no number of its own.

### Consequences
- Accepted: a single arrow press pans one pixel, which is slow. `Shift` and `Alt` are the coarse
  steps, and they are the same two modifiers the user already learned for nudging.
- Accepted: each press commits to the store, so holding an arrow writes once per repeat rather than
  once per gesture. A key repeat is ~30 Hz against a wheel's ~120, and unlike a wheel there is no
  event that says the gesture ended.
## ADR-083 — A snap candidate carries the moving edge it is allowed to match

**Date** 2026-08-09 · **Prompt** 20 · **Status** Accepted

### Question
`computeSnap` tests every candidate against the moving box's leading edge, centre and trailing edge.
Equal-spacing candidates are positions for one specific edge. Does the candidate say so, or does the
resolver special-case the `spacing` kind?

### Criterion (set before measuring)
A candidate set is correct if every placement it can produce still satisfies the rule that generated
it. Apply each candidate to each of the three edges and check the rule; a kind that fails for some
edge needs the restriction, a kind that never fails must not carry one.

### Measurement
A 100-wide box between a sibling ending at 0 and a sibling starting at 300: the equalising leading
edge is 100, and the gaps are 100 and 100. The same value applied to the centre places the box at
50–150 → gaps 50 and 150. Applied to the trailing edge it is 0–100 → gaps 0 and 200. Two of three
placements break the equality the candidate exists for. Grid multiples, sibling edges, container
edges and user guides fail none of the three: they are coordinates, and any edge may sit on one.

### Decision
`SnapCandidate.edge?: 'start' | 'center' | 'end'` — absent means all three. Only the spacing
generator sets it. The resolver reads the field and knows nothing about kinds.

### Consequences
- Accepted: a fourth field on a type CANVAS.md published without it, so the document changed first.
- Accepted: a future generator that is also edge-specific (a baseline snap, say) gets it for free,
  and the resolver stays a loop over candidates rather than a switch over kinds.

## ADR-084 — Equal-spacing pairs are adjacent openings between siblings that overlap each other

**Date** 2026-08-09 · **Prompt** 20 · **Status** Superseded by ADR-090

### Question
"If the moving node sits between two siblings" — which pairs of siblings count? All disjoint pairs,
or only the ones adjacent along the axis? And must the moving box line up with them at all?

### Criterion (set before measuring)
CANVAS.md § Performance fixes candidates as generated once at drag start. A rule may therefore read
only data that does not change during the drag. Any rule that reads the moving box's live position
is disqualified before it is compared on anything else.

### Measurement
The moving box's perpendicular position changes every frame; the siblings' rects do not. Requiring
overlap between the two *siblings* reads frozen data only. Requiring overlap between the moving box
and each sibling — the intuitive rule — would have to be re-evaluated per frame, which is the
per-frame generation the budget exists to prevent.

On pair count: N siblings sorted along the axis have N−1 adjacent openings and up to N(N−1)/2
disjoint pairs — 4 against 10 at N = 5. The six extra pairs at N = 5 are positions that place the
moving box on top of the sibling the pair skips over.

### Decision
Sort siblings by their leading edge; take consecutive pairs; keep the pair when the two siblings
overlap on the perpendicular axis and the opening is wider than the moving box (gap > 0). One
candidate per surviving opening, per axis.

### Consequences
- Accepted: dragging a box into a column of siblings that do not overlap the moving row produces no
  spacing candidate, even when the eye would accept one. The alternative reads live geometry.
- Accepted: a flush position (gap exactly 0) is not offered as an equal-spacing snap. The two
  sibling edges are already `edge` candidates there, so the position is still reachable.

## ADR-085 — A spacing snap draws its two distance bars and no line

**Date** 2026-08-09 · **Prompt** 20 · **Status** Accepted

### Question
Every other snap kind draws a line at the matched coordinate. Does a spacing snap draw one too, in
addition to the two distance labels?

### Criterion (set before measuring)
A guide exists to show *what the box aligned to*. A line is justified when at least one other thing
on screen shares that coordinate; a line that coincides with nothing shows nothing and costs
readability, which is why the lines are bounded rather than full-viewport in the first place.

### Measurement
For a spacing candidate the matched coordinate is the moving box's own leading edge after the snap.
The two siblings that produced it are `gap` away on either side — by construction, since the whole
point is that the gaps are equal and non-zero. Nothing in the candidate set shares the coordinate.

### Decision
A spacing guide carries its two gaps and no line. `SnapGuides` draws the guides whose gap list is
empty; `DistanceLabels` draws the gaps.

### Consequences
- Accepted: a snap fires with no line on screen, which looks different from the other four kinds.
  The two bars with equal numbers are the feedback, and they are more specific than a line would be.
- Accepted: `SnapGuide.gaps` being non-empty is what routes a guide to the other renderer, so a
  future kind that wants both a line and a label needs that split revisited.

## ADR-086 — The viewport variables are written on the canvas root, not on the scene

**Date** 2026-08-09 · **Prompt** 20 · **Status** Accepted

### Question
Rulers, their labels and user guides sit in the overlay layer, which is outside the scene transform
on purpose, and they still have to follow pan and zoom. A custom property written on the scene
cannot be read by a sibling. Where does the transform live?

### Criterion (set before measuring)
Cheapest per frame, counted in DOM writes: pan and zoom are the two gestures with a per-frame budget
(PERFORMANCE.md § The core rule), and elements whose position is a pure function of the transform
must cost O(1) writes, not O(elements).

### Measurement
Three mechanisms, counted on a 1440-wide artboard at 100 % zoom, where the top ruler shows 15
labels and there are a handful of user guides:

- Variables on the canvas root, overlays positioned with `calc()`: **4** `setProperty` per frame —
  the same four already written today, on a different element.
- Variables duplicated onto the overlay layer: **8** per frame.
- Overlays subscribed to the transform and positioned in JS: **~40** style writes per frame, growing
  with the document and the zoom level.

### Decision
`useViewport` writes `--ms-vp-x`, `--ms-vp-y`, `--ms-vp-zoom` and `--ms-vp-grid-opacity` on the
element behind `rootRef`. The scene inherits them and its `transform` is unchanged. `will-change`
stays on the scene, which is the element that is actually transformed.

### Consequences
- Accepted: every element inside the canvas root can now read the transform, including rendered
  blocks. A block that read `--ms-vp-zoom` would be coupling itself to the editor, and export would
  drop the variable and change the layout. Nothing does today; it is worth watching.
- Accepted: prompt 18's tests asserted the variables on the scene element and were updated.

## ADR-087 — User guides reach the canvas as a prop, because no store owns them yet

**Date** 2026-08-09 · **Prompt** 20 · **Status** Accepted

### Question
CANVAS.md § Guides said user guides "are stored in the document". Where does `packages/canvas` read
and write them?

### Criterion (set before measuring)
ENGINEERING_CONTRACT.md § 8 gives the `.motion` schema to FILE_FORMAT.md. If the field exists there,
the canvas reads the document; if it does not, the canvas cannot invent one, because that would be
`packages/canvas` deciding the file format.

### Measurement
A search for "guide" across `packages/schema/src` returns nothing, and FILE_FORMAT.md defines no
guides field. The store has `viewport.guides = { enabled, snapThreshold }` — the toggle and the
threshold, not a list. So no storage for user guides exists anywhere in the repository today, and
creating one is a format change with a migration.

### Decision
`CanvasProps.guides?: { guides, add, move, remove }` — the same seam as the selection port. CANVAS.md
was corrected in the same commit: the canvas holds no storage and the host decides where they live.

### Consequences
- Accepted: guides do not survive a reload until a host stores them. The canvas is complete and the
  hole is named, rather than half a feature landing in the schema on the way past.
- Accepted: when the field is added to the format, the host wires the prop to it and the canvas does
  not change.

## ADR-088 — Ruler ticks come off the 1-2-5 ladder at a 100 px minimum

**Date** 2026-08-09 · **Prompt** 20 · **Status** Accepted

### Question
The build plan fixes three points: major ticks every 100 canvas units at 100 % zoom, every 500 at
25 %, every 50 at 200 %. What rule produces exactly those, at every zoom in between?

### Criterion (set before measuring)
One rule with no table of exceptions, reproducing all three stated points, and with the minimum
spacing derived rather than picked: the acceptable values are whatever interval satisfies all three
constraints, and the choice inside it must be stated.

### Measurement
With the 1-2-5 ladder (`… 20, 50, 100, 200, 500 …`) and a rule of "smallest step at least S screen
px wide", each stated point becomes an interval for S:

- zoom 2 → 50 must win over 20: S ∈ (40, 100]
- zoom 1 → 100 must win over 50: S ∈ (50, 100]
- zoom 0.25 → 500 must win over 200: S ∈ (50, 125]

Intersection: **S ∈ (50, 100]**. Any value in it gives all three. Minor subdivision by leading
digit — 1 → 10 parts, 2 → 4, 5 → 5 — keeps a minor tick between 10 and 62 screen px across the
whole range, so it never collapses into its neighbour.

### Decision
`MIN_MAJOR_SPACING_PX = 100`, the upper end of the interval and the only round number in it. Fewer
labels for the same correctness, and a 4-digit label at 10 px type is ~24 px wide, so a major tick
carries three label widths of air.

### Consequences
- Accepted: the ladder skips 25 and 250, so a document laid out on a 25 unit rhythm never sees a
  label on its own multiples. The grid, not the ruler, is what a layout is aligned against.
- Accepted: S is at the top of its window, so the step changes as late as possible while zooming
  out. One more label per screen at the moment of the switch was preferred to switching early.

## ADR-089 — The snap session hook ships with the engine, before anything drags

**Date** 2026-08-09 · **Prompt** 20 · **Status** Accepted

### Question
The deliverables for this prompt are pure functions and overlay components. Two of the acceptance
criteria — `Cmd` disabling snapping live mid-drag, and guides appearing on the frame the snap
engages — are properties of a gesture, and no file in the list owns one.

### Criterion (set before measuring)
The deliverable list is a floor. A `Done when` box that cannot be checked without a file the list
omits is a gap in the list; skipping the box instead would be the deferral this repository's
decision rules ban.

### Measurement
Candidate generation must happen once per gesture and the modifier must be read per frame, so
something has to hold state between `begin` and `end`. Nothing does: `computeSnap` is pure by
specification, and node dragging does not exist — the document model has no coordinates, which
ADR-057 recorded and ADR-080 met again from the keyboard.

### Decision
`snap/use-snap.ts`: `begin` freezes the candidates and seeds the modifier from the initiating event,
`move` resolves and paints inside one `rAF`, `end` clears. `Ctrl`/`Cmd` is tracked with window
`keydown`/`keyup` for the length of the session, so releasing it repaints without a pointer move.

### Consequences
- Accepted: the hook has no production caller until the drag layer arrives in the drag-and-drop
  prompts. It is exercised by unit tests and by a temporary harness in the browser, and that is the
  honest state of it rather than a claim that dragging snaps today.
- Accepted: one file beyond the deliverable list, and it is where the two gesture-shaped acceptance
  criteria are actually tested.

## ADR-090 — An equal-spacing pair is a sibling and its neighbour in the same band

**Date** 2026-08-09 · **Prompt** 20 · **Status** Accepted · **Supersedes** ADR-084

### Question
ADR-084 sorted the siblings along the axis, paired each with the next one in that order, and kept the
pair when the two overlapped on the perpendicular axis. Is "next in sorted order" the same thing as
"the box next to it"?

### Criterion (set before measuring)
Unchanged from ADR-084: the rule may read only data that is fixed for the length of the drag. What is
added is a correctness bar the first rule was never checked against — a layout the user would call
two rows must produce the openings of both rows.

### Measurement
Found in the browser, on the walkthrough for this prompt. The fixture is three cards in a row —
`a` 0–120, `b` 240–360, `c` 480–600, all at y 60–140 — plus a wider block `d` at x 0–200, y 260–380.
Sorted by leading edge the order is `a`, `d`, `b`, `c`, so the consecutive pairs are (a, d), (d, b)
and (b, c). The first two are dropped for not overlapping, and the a–b opening — the one the box was
being dragged into — never becomes a candidate at all. Dragging into it produced no snap and no
distance labels; the unit tests passed throughout, because every fixture in them was a single row.

### Decision
For each sibling, walk forward through the sorted list to the first one that both starts at or after
this sibling's trailing edge and overlaps it on the perpendicular axis. That is its neighbour in the
same row or column, and the opening between them is the candidate. Siblings in other bands are
skipped rather than allowed to break the pairing.

### Consequences
- Accepted: O(n²) in the worst case instead of O(n). These are the children of one container at one
  level, and the walk stops at the first match; a fixture of 200 siblings in one row costs 200 steps.
- Accepted: a sibling can be the `before` of one opening and the `after` of another, which is what a
  row of three cards should produce — two openings, not one.
- Kept from ADR-084: the moving box's live position is still never read, so candidates are still
  generated once at drag start.

## ADR-091 — Overlay geometry is a canvas-unit variable resolved by `calc()`, not a position written per frame

**Date** 2026-08-09 · **Prompt** 21 · **Status** Accepted

### Question
The overlay layer is outside the scene transform and must follow it. CANVAS.md § Overlays says the
overlays update through one `rAF` loop reading refs. Should that loop write each overlay's screen
position every frame, or write the node's canvas-space box once and let CSS resolve the screen
position from the viewport variables?

### Criterion (set before measuring)
Style writes per pan frame, at the prompt's own load: 200 nodes with 10 selected. The transform is
already one variable write per frame (ADR-086); an overlay mechanism that adds work proportional to
the selection on every frame is the one to reject.

### Measurement
Four values describe a box, so a per-frame position write costs `4 × selected` property writes per
frame — 40 at ten selected, 2 400 a second, all of them recomputing what
`(canvas + pan) × zoom` already says. Resolving the same expression in CSS costs **0** per frame:
`--ms-vp-x/y/zoom` are inherited by the layer, and the browser recomputes the `calc()` as part of
the style pass it was already doing for the scene. The identical trade was measured for the rulers
in ADR-086 and gave 4 writes a frame against ~40.

### Decision
Every overlay is positioned by `calc((var(--ms-vp-x) + var(--ms-ol-x)) * var(--ms-vp-zoom))` over
per-element variables holding the node's box in **canvas units**. The `rAF` loop writes those
variables only when the geometry itself changed — a rect-cache pass, a selection change, a resize
draft — and on the frames where only the transform moved it evaluates just the two things CSS
cannot: whether a name chip must flip, and whether the handles are above the zoom floor.

### Consequences
- Accepted: two kinds of frame, `dirty` and not, and a bug in that flag shows as a stale overlay
  rather than a crash. The rect for a node is read through one accessor so there is one place to be
  wrong.
- Accepted: line weights are constant for free — the border and the outline are never multiplied by
  the zoom, only the box is.
- Gained: an overlay follows a pan even on frames the loop never ran, so there is no lag between the
  node and its outline at any frame rate.

## ADR-092 — The overlay layer subscribes to the scene; the canvas root does not re-render on selection

**Date** 2026-08-09 · **Prompt** 21 · **Status** Accepted

### Question
Which overlays exist is a function of the selection, so something has to re-render when it changes.
ADR-077 hands the scene in as getters precisely so the canvas does not re-render on store changes.
Where does the selection change enter React?

### Criterion (set before measuring)
The prompt's acceptance number: zero canvas re-renders while panning with 10 nodes selected, and
overlays still correct. Whatever re-renders must be bounded by the overlay layer.

### Measurement
`CanvasScene` had no notification of any kind: `version()` is read during render, which makes the
host re-render the canvas — root, scene, and the whole `renderNode(rootId)` tree — for a change of
selection that moves nothing. At 200 nodes that is 200 memo comparisons for two outlines.

### Decision
`CanvasScene` gains `subscribe(listener)`, called whenever any getter's answer may have changed.
`OverlayLayer` reads it through `useSyncExternalStore` with the joined selection ids as the
snapshot, so a document edit that leaves the selection alone bails out at the string compare, and a
selection change re-renders the overlay layer and nothing above it.

### Consequences
- Accepted: one more method every host must implement. A zustand store answers it with its own
  `subscribe`, and the fixture with a set of callbacks.
- Accepted: the snapshot is a string, so ids may not contain a space. `NodeId` is `node_<counter>`,
  which the schema guarantees.
- Rejected: passing the selection as a prop. That is the re-render this entry exists to avoid.

## ADR-093 — The hover outline is painted from the canvas's own hit test, not from the host

**Date** 2026-08-09 · **Prompt** 21 · **Status** Accepted

### Question
`useHitTest` reports the hovered node out through `CanvasSelectionPort.hover`. The hover outline
needs the same id. Does it read it back from the scene, or take it from the hit test directly?

### Criterion (set before measuring)
Renders per second while the pointer crosses a dense area. A hover changes on the order of ten times
a second on a real layout; anything that turns each one into a React render of the overlay layer is
paying a render for one element's position.

### Measurement
Reading it back means: hit test → store write → subscription → `useSyncExternalStore` snapshot
change → overlay layer render. That is one render per hover change, ~10/s, each rendering every
selection outline in the layer as well. Painting it directly is one attribute and four variables on
one element that already exists, and zero renders.

### Decision
The canvas keeps the hovered id in a ref, writes the hover outline's variables from the same `rAF`
loop as every other overlay, and still calls `selection.hover` so the host learns about it for the
layers tree. The outline element exists from mount and is shown by `data-active`, the mechanism the
snap guides already use.

### Consequences
- Accepted: the hovered id now lives in two places. The canvas's copy is the one the outline reads
  and the port's is what the rest of the studio reads; they are written from the same call.
- Accepted: a host that highlights a node from the layers tree does not get an outline on the
  canvas. That path is the layers tree's own prompt, and it will send it in as a prop if it needs to.

## ADR-094 — `packages/canvas` depends on `packages/ui` for the context menu

**Date** 2026-08-09 · **Prompt** 21 · **Status** Accepted

### Question
CANVAS.md § Public API lists the canvas's dependencies as `utils`, `schema`, `hooks` and React. The
context menu is a deliverable of this prompt and it is a Radix menu with the studio's own item,
separator, shortcut and surface styling. Where does that styling come from?

### Criterion (set before measuring)
The menu must be the same object as the one the layers tree opens — PRODUCT.md § 3 calls the canvas
menu a convenience and never the only path, and `ContextMenu` in `ui` already takes the same entry
list as `Dropdown` for exactly that reason. A second implementation is a second thing to keep in
step, and drift between them is invisible until a user finds it.

### Measurement
Building it inside `canvas` means re-declaring `@radix-ui/react-context-menu`, the floating surface,
the item, separator, label and shortcut styles, and `Kbd` — five style modules and one component
already written in `ui`, copied. The dependency direction stays one-way: `ui` depends on `icons`,
`motion`, `tokens` and `utils`, and on nothing that reaches back to `canvas`.

### Decision
`packages/canvas` depends on `@motion-studio/ui`, and CANVAS.md § Public API is amended to say so.
The canvas owns the item list, the shortcuts and the disabled reasons; `ui` owns how a menu looks.

### Consequences
- Accepted: the canvas is no longer mountable with only `utils` and `schema` present. It was already
  rendering with the studio's Tailwind theme, so this widens an existing coupling rather than
  creating one.
- Accepted: a test that renders the whole canvas now pulls Radix in. The menu's own tests render the
  menu, not the canvas.
- Rejected: the host supplying the menu component. The item list and its disabled reasons are canvas
  vocabulary, and handing them out as data only to have them rendered elsewhere is the same
  dependency with an extra seam.

## ADR-095 — A disabled menu item states its reason in the item, not in a tooltip

**Date** 2026-08-09 · **Prompt** 21 · **Status** Accepted

### Question
An unavailable item — Paste with an empty clipboard, Unwrap on a node with no children — has to say
why. The prompt asks for the reason in the item's tooltip.

### Criterion (set before measuring)
The reason must be readable by the user who just hit the disabled item, with the pointer where it
already is, and by a screen reader on the same item.

### Measurement
`dropdownItemStyles` sets `data-[disabled]:pointer-events-none`, which Radix's own menu semantics
require: a disabled item takes no pointer events at all, so it receives no `pointerenter` and a
tooltip anchored to it never opens. Verified against the style module rather than guessed —
`packages/ui/src/dropdown/dropdown.styles.ts`. A tooltip on a disabled Radix item is a control that
cannot fire.

### Decision
`DropdownAction` gains `hint`, rendered where the shortcut would go, in muted text. The canvas
passes the reason as the hint for every item it disables. The reason is part of the item's own text,
so it is announced with the item.

### Consequences
- Accepted: an item cannot show a shortcut and a reason at once. A disabled item's shortcut is the
  less useful of the two — it would not fire either.
- Accepted: `Dropdown` gains the same field, which is right: the layers tree opens the same entries.

## ADR-096 — Resize handles are not tab stops; keyboard resize is `Mod+Alt`+arrows

**Date** 2026-08-09 · **Prompt** 21 · **Status** Accepted

### Question
The prompt asks for each handle to be a focusable button with an `aria-label`, arrows resizing by
1 px and `Shift` by 10. ACCESSIBILITY.md § Canvas says the canvas is a **single** tab stop.

### Criterion (set before measuring)
Both documents have to come out true. Count the tab stops the canvas adds to the page, and check
that a keyboard-only user can change a node's size.

### Measurement
Eight handles per selected node at `tabIndex=0` is eight extra tab stops, and they are unreachable
anyway: `Tab` inside the canvas is intercepted by `useKeyboardSelection` and means "next sibling".
The key map already answers the question — SHORTCUTS.md § Transform assigns `Mod+Alt+←/→` to width
and `Mod+Alt+↑/↓` to height — and SHORTCUTS.md is the owner of the key map (ADR-081). Those
combinations were being swallowed by the nudge branch, which read `Alt` as "step by the grid".

### Decision
Handles are `<button>`s with `aria-label` and `tabIndex={-1}`: named for assistive technology,
operable with the arrows once focused — which a press on them does — and not in the tab order.
`useKeyboardSelection` stops claiming `Mod+Alt`+arrows, and the resize hook takes them on the canvas
root, `Shift` for ten. The canvas stays one tab stop.

### Consequences
- Accepted: a keyboard user resizes without ever focusing a handle, so the handles' arrow keys are a
  pointer user's convenience rather than the accessible path.
- Accepted: `Alt`+arrows still nudges by the grid size and `Mod+Alt`+arrows now resizes; the two
  differ by `Mod`, which is what the shortcut document says.
- Also fixed by the same guard: the canvas key map no longer fires for keys pressed inside a control
  in the overlay layer, which was hijacking `Enter` and `Escape` from the guide input.

## ADR-097 — `Alt` while resizing means both edges, which is all of from-centre that survives

**Date** 2026-08-09 · **Prompt** 21 · **Status** Accepted

### Question
The prompt asks for from-centre resize on `Alt`. ADR-057 and ADR-080 recorded that the document
model has no coordinates: a node's place comes from its parent's layout. What does "from centre"
mean for a box that has no position to hold fixed?

### Criterion (set before measuring)
The modifier may only produce an effect the model can actually store. A resize commits
`setProp(width)` / `setProp(height)` and nothing else.

### Measurement
From-centre is two statements: the size changes by twice the drag, and the centre does not move. The
second is a position, and there is no property to write it to — the parent decides where the box
sits, and for a centred child the browser already keeps the centre fixed when the width grows. The
first is a size, and it is storable.

### Decision
`Alt` applies the pointer delta to both edges: the size changes by twice the drag. The centre is
left to the parent's layout, where it belongs.

### Consequences
- Accepted: on a left-aligned child, `Alt` looks like a faster resize rather than a symmetric one.
  That is the honest rendering of what the model can hold, and the alternative is a modifier that
  silently does nothing.
- Accepted: revisit when a node can be absolutely positioned, which is a Layout-section property and
  a later prompt's problem.

## ADR-098 — A menu item with no shortcut in SHORTCUTS.md shows none

**Date** 2026-08-09 · **Prompt** 21 · **Status** Accepted

### Question
The prompt says every context-menu item shows its shortcut. Three items in PRODUCT.md § 3 — Add
motion, Copy React, Reset overrides — have no entry anywhere in SHORTCUTS.md.

### Criterion (set before measuring)
A shortcut printed next to an item must be a key combination that actually works. A wrong one is
worse than none: the user learns it, presses it, and nothing happens.

### Measurement
Grepped SHORTCUTS.md for all eleven items. Eight have bindings — `Mod+D`, `Mod+C`, `Mod+V`,
`Mod+Alt+V`, `Delete`, `Mod+]`, `Mod+[`, `Mod+G`, plus `Mod+Shift+G` for Unwrap. Three have none,
and the shortcut registry that would resolve them is prompt 33's deliverable.

### Decision
Those three render with no shortcut column. The canvas does not invent key bindings: ADR-081 already
settled that SHORTCUTS.md owns the key map and a package that finds a gap changes that document
rather than filling it locally.

### Consequences
- Accepted: the menu is visually ragged where those three items sit.
- Accepted: when the command palette is built and those commands get bindings, they appear here with
  no change to this file — the table maps an action to whatever the document says.

## ADR-099 — Spacing numbers come from the scene port, not from computed style

**Date** 2026-08-09 · **Prompt** 21 · **Status** Accepted

### Question
The `Alt` overlay must show the same padding and margin the inspector shows. The canvas cannot
import `editor` and cannot resolve a responsive override itself. Where do the numbers come from?

### Criterion (set before measuring)
The numbers must equal the resolved props at the current breakpoint, including overrides. The
prompt's own test asks for a fixture with responsive overrides to prove it.

### Measurement
`getComputedStyle` answers a different question: it returns what the browser laid out, which for a
block whose padding comes from a Tailwind class, a theme variable, or its own default is a number
the document does not contain. Editing the inspector's padding field would leave the two disagreeing
in exactly the case the overlay exists for.

### Decision
`CanvasScene` gains `spacing(id)`, returning resolved padding and margin per side in canvas units,
or `undefined`. The host resolves the override — it is the only side that can — and the canvas
renders what it is handed.

### Consequences
- Accepted: a block that sets padding in CSS rather than through a prop shows nothing. That is
  correct: the overlay reports the document, and a value the document does not hold is not the
  document's to show.
- Accepted: the third getter on the scene port. It is read only while `Alt` is held.

## ADR-100 — Motion playback is a port plus an attribute on the canvas root

**Date** 2026-08-09 · **Prompt** 21 · **Status** Accepted

### Question
`Mod+P` freezes motion and `Mod+Shift+P` replays entrances. The flag belongs to the store
(`viewport.motionPaused`, STATE_MANAGEMENT.md § viewport) and the motion engine that consumes it
arrives in prompt 31. What does the canvas actually own today?

### Criterion (set before measuring)
Whatever is built now must be the thing prompt 31 consumes, not a placeholder it replaces. The test
of that: the motion engine must be able to read the state without importing the canvas.

### Measurement
Two consumers exist for the same fact and they are not the same shape. The store needs a value it
can put in the status bar and serialize nothing of; a block's animation needs something it can read
without a subscription, in CSS, on an ancestor.

### Decision
The canvas takes the two key combinations, calls `CanvasMotionPort.setPaused` / `replay`, and writes
`data-motion-paused` on the canvas root. The port is what the store hears; the attribute is what a
descendant reads, with no import in either direction.

### Consequences
- Accepted: the attribute freezes nothing on its own today. Nothing in the tree animates yet, and
  prompt 31's scheduler is what will read it.
- Accepted: the status-bar indicator this prompt asks for is not wired. `apps/web` reaches neither
  the store nor the canvas — `canvas-area/canvas-host.tsx` is prompt 22's deliverable and is what
  connects both — so wiring it now would mean inventing a second source of the flag in the shell and
  deleting it one prompt later. Reported as not done rather than faked.

## ADR-101 — The selection outline is a ring, because Chrome rounds `outline-width` to whole pixels

**Date** 2026-08-09 · **Prompt** 21 · **Status** Accepted

### Question
UI_GUIDELINES.md § Canvas presentation asks for a **1.5 px** selection outline drawn outside the
node's box. `outline` is the property for that: it paints outside the border box and takes no
layout. Does it actually render 1.5 px?

### Criterion (set before measuring)
The painted width must be the specified width. A line that says 1.5 and paints 1 is the document
being wrong about the product, and at 25 % and 400 % zoom the whole point of the overlay layer is
that this number does not move.

### Measurement
In Chrome 151, headless, at device pixel ratio 1: an element with the inline style
`outline: 1.5px solid red` reports `getComputedStyle(...).outlineWidth === '1px'`. Blink rounds
outline width to an integer, so the specified 1.5 was silently 1 — the outline was thinner than the
document says and indistinguishable from the 1 px multi-selection member outline. A spread
`box-shadow` is not rounded: the same element with Tailwind's `ring-[1.5px]` reports
`0px 0px 0px 1.5px` and paints it, at zoom 0.1, 1 and 4 alike (all three measured on the stand).

### Decision
Selection, hover and the breakpoint frame use `ring-*` — a spread `box-shadow` — instead of
`outline-*`. It is painted outside the border box, takes no layout, and honours a fractional width.

### Consequences
- Accepted: an overlay's ring participates in the `box-shadow` property, so an overlay cannot also
  carry a shadow. None of them do, and none of them should — this layer draws lines, not elevation.
- Accepted: rings do not follow `border-radius` of the node, because the overlay is a plain
  rectangle over the node's box. Neither would an outline have.
- Rejected: a `border` on an element inset by 1.5 px. It is the same picture with an offset to keep
  correct at every zoom, and getting it wrong shifts the outline by a pixel rather than failing.

## ADR-102 — The studio's store is composed in `apps/web`, with the real registry

**Date** 2026-08-09 · **Prompt** 22 · **Status** Accepted

### Question
`createEditorStore` takes its registry at construction, and `packages/editor` exports
`useEditorStore` built with an empty one because it must not import `packages/blocks`. The studio
needs a store whose registry is the real catalogue. Which store does `/studio` use?

### Criterion (set before measuring)
Commands must be able to validate against the block that is being edited. Invariant 7 —
`setProp` parses the node's props against `registry.require(node.blockId)` — is not optional, and a
store with an empty registry throws `UnknownBlockError` on the first edit of the root container.

### Measurement
`createEditorStore` resolves `context.registry` once, in `resolveOptions`, and hands it to every
command through `CommandContext`. There is no seam to swap it afterwards, and adding one would mean
a store whose validation rules change under a running document.

### Decision
`apps/web/src/store/editor-store.ts` is the composition root: it calls `createEditorStore` with
`blockRegistry` and is the store the studio subscribes to. `packages/editor`'s `useEditorStore`
stays what its own comment says it is — the registry-free default, used by that package's tests and
by any surface with no catalogue.

### Consequences
- Accepted: two module-level stores exist in the repository, and importing the wrong one in a studio
  component is a mistake the compiler cannot catch. `apps/web` imports its own and nothing in
  `apps/web` imports `useEditorStore`; a lint rule for it belongs with the ESLint-shaped work, not
  here.
- Accepted: STATE_MANAGEMENT.md's "one store" still holds at runtime — the studio has exactly one.

## ADR-103 — `defineBlock` types control paths to depth three, and the rest is a meta-test

**Date** 2026-08-09 · **Prompt** 22 · **Status** Accepted

### Question
The prompt asks for a control whose `path` is not in the schema to be a compile error "where
possible", and a test failure where the type system cannot reach. Where is that line?

### Criterion (set before measuring)
Every path a control can legally carry, checked as early as the language allows. The measurement is
which of the shapes in the catalogue a mapped type can actually enumerate.

### Measurement
Three shapes appear in `controls[].path` across COMPONENT_LIBRARY.md: a top-level key (`layout`), a
dot path into a nested object (`padding.top`), and a path into an array item
(`plans[2].label`) — the last only inside a `list` control's `itemControls`, which the registry
types as opaque `options`. A mapped type enumerates the first two: `keyof T & string` plus recursion
through object-valued keys. It cannot enumerate the third, because the index is a value.
Unbounded recursion also makes the compiler unhappy on deep shapes, and three levels covers every
schema in the catalogue.

### Decision
`ControlPath<P>` enumerates top-level keys and dot paths through nested objects to depth 3, and
`defineBlock` requires `controls[].path` to be one of them. Array-item paths and anything inside
`options` are checked by the registry meta-test, which walks the Zod schema itself.

### Consequences
- Accepted: a typo in `itemControls` is caught a test run later than one in `controls`.
- Accepted: the depth limit is a number in the type. A schema nested four deep would silently lose
  the check on its deepest level, so the meta-test walks the schema for **every** path regardless —
  the type is the fast feedback, the test is the guarantee.

## ADR-104 — A node's props are parsed through the block schema, not merged with its defaults

**Date** 2026-08-09 · **Prompt** 22 · **Status** Accepted

### Question
`createEmptyDocument` writes the root container with `props: {}`, and a node only stores the props
that were edited. The component needs a complete prop set. Where does the rest come from?

### Criterion (set before measuring)
The value the component receives must equal the value the exporter emits and the inspector shows.
One resolution rule, used by all three, or they drift.

### Measurement
A shallow `{ ...definition.defaults, ...node.props }` is wrong the moment a prop is an object: a
node that overrides `padding.top` would lose `padding.left`. Zod already holds the answer — every
prop in these schemas carries `.default()`, so `propsSchema.parse({})` **is** the defaults, and
parsing a partial node fills exactly the missing keys at every level. It is also the same call
invariant 7 makes on the write path, so a document that was written through commands always parses.

### Decision
`NodeRenderer` resolves responsive overrides, parses the result through `definition.propsSchema`,
and renders the parsed value. A parse failure renders the error card rather than the block, with
the message from Zod: a node whose props do not satisfy its schema is a broken node, and rendering
it half-configured hides that.

### Consequences
- Accepted: a parse per node per node-change. The renderer is memoised on its own node, so this is
  not per frame; a document edit parses one node.
- Accepted: `defaults` in the definition is now a derived value that must agree with the schema.
  The meta-test asserts `propsSchema.parse(defaults)` equals `defaults`, so a definition that
  disagrees with its own schema fails.

## ADR-105 — Arrow nudges reach the host and stop there, until a block has a position

**Date** 2026-08-09 · **Prompt** 22 · **Status** Accepted

### Question
`CanvasSelectionPort.nudge(dx, dy)` is an intent the canvas has been sending since ADR-080. The
host now exists. What command does it dispatch?

### Criterion (set before measuring)
The command must write a property the document actually has. Inventing one to make an arrow key do
something is the banned fourth way.

### Measurement
The three blocks in this prompt lay out in flow: a heading's place comes from its container's
`direction`, `gap` and `align`. `Node` has `props`, `responsive`, `motion` and `effects`, and no
coordinates — ADR-057 recorded that align and distribute write `align`/`justify` for the same
reason. There is no property a 1 px displacement corresponds to.

### Decision
The host's `nudge` is an explicit no-op with this entry as its comment. Arrow keys still move the
selection through the canvas's own key map; they do not move a node.

### Consequences
- Accepted: a user pressing an arrow on a selected node sees nothing happen. That is the truthful
  behaviour of a flow-layout document, and the alternative — nudging padding, or a fake `x`/`y` —
  would produce a document the exporter cannot honour.
- Revisit when a block declares absolute positioning, which is a Layout-section property in a later
  prompt.

## ADR-106 — Block props are token scales, not free numbers

**Date** 2026-08-09 · **Prompt** 22 · **Status** Accepted

### Question
`section.padding`, `container.gap`, `heading.size` are all "a size". Should they be numbers with a
unit, or names from a scale?

### Criterion (set before measuring)
COMPONENT_LIBRARY.md § Rules 3 and 4: Tailwind classes only, tokens only, inline styles only for
genuinely dynamic values. Whatever is chosen has to print as a class in the exported code.

### Measurement
A free number cannot be a static class: `p-[23px]` is an arbitrary value that Tailwind only emits if
it can see the literal, and a value from the document is never literal at build time. The two ways
out are an inline style — which rule 3 bans and which the exporter would have to emit as a `style`
attribute — or a CSS variable per prop, which turns every spacing prop into a variable the exported
project has to carry. A named scale is one lookup into a frozen map of literal classes, printable as
`p-8` and readable in the exported file.

### Decision
Size-like props are enums over the token scale (`none | xs | sm | md | lg | xl`), mapped to literal
Tailwind classes in the block's `.styles.ts`. The inspector renders them as `select` or `segmented`,
which is also the control the scale deserves.

### Consequences
- Accepted: a user cannot type 23 px of padding. That is the design system holding, and the escape
  hatch is the `css` control kind, which arrives with the playground.
- Accepted: adding a step to a scale is a schema change plus a class-map entry, in one file.

## ADR-107 — The metadata/component split is a module split, not two exports of one module

**Date** 2026-08-09 · **Prompt** 22 · **Status** Accepted

### Question
COMPONENT_LIBRARY.md § Registry construction shows `blockRegistry` and `renderRegistry` exported
from one `registry.ts`, and requires that `blockRegistry` be importable under `node` with no React.
Can one module do both?

### Criterion (set before measuring)
Importing `blockRegistry` must not pull a component into the module graph. The check has to be a
property of the graph and not of the environment: React runs perfectly well under Node, so a test
that merely imports the module in a `node` environment passes with the split broken.

### Measurement
A module's graph is the transitive closure of its imports, so a single file exporting both maps
loads every block component the moment anything reads a definition. The same applies one level down:
a category `index.ts` that re-exports its blocks' `index.ts` files brings the components with it, so
the registry has to reach the `.definition.ts` files directly. Walking the graph from `registry.ts`
after the split gives 12 files, no `.tsx` among them, and three bare specifiers: `@motion-studio/schema`,
`@motion-studio/utils`, `zod`.

### Decision
`registry.ts` holds `blockRegistry` and imports only `*/definitions.ts`, which import only
`*.definition.ts`. `render-registry.ts` holds `renderRegistry` and the parity assertion — it is the
side that has both halves, and it is already a React module. The test walks the graph rather than
importing and hoping.

### Consequences
- Accepted: four files where the document showed one, and a rule that is easy to break by adding a
  convenient re-export. The graph test is what catches that, and it names the file.
- Accepted: the parity assertion cannot run for a consumer who imports only the metadata. That
  consumer has no components to be out of parity with.

## ADR-108 — Resize handles ask the registry whether the block has a size

**Date** 2026-08-09 · **Prompt** 22 · **Status** Accepted

### Question
The canvas drew eight handles on any single selection (prompt 21). With a real registry behind it,
which nodes should get them?

### Criterion (set before measuring)
A gesture must have somewhere to commit. `CanvasResizePort.commit` dispatches `setProp('width')`,
and invariant 7 parses the result against the block's schema — so a block with no `width` prop turns
a drag into a thrown command.

### Measurement
None of the three blocks in this prompt declares a size: a section is full-width, a container sizes
from its content and its parent, a heading from its text. `capabilities.resizable` was `true` on the
container, and dragging its handle would have thrown `INVALID_PROPS` on release. The registry is
where the answer lives, and the canvas cannot read it — it imports neither `blocks` nor `editor`.

### Decision
`CanvasResizePort` gains `resizable(id)`, the host answers it from
`capabilities.resizable`, and the overlay layer draws handles only when it is true. A meta-test
requires any block claiming `resizable` to hold `width` and `height` in its schema, so the flag
cannot become a lie again.

### Consequences
- Accepted: no block in the studio shows resize handles today. That is the honest state of a
  catalogue whose blocks all size themselves, and the handles were verified on the stand in prompt 21.
- Accepted: one more method on a port the host has to implement. It is one registry lookup.

## ADR-109 — The two control kinds with no control yet render a note, not nothing

**Date** 2026-08-09 · **Prompt** 23 · **Status** Accepted

### Question
`CONTROL_KINDS` has 23 entries. `packages/ui/src/controls` implements 21 of them: `motion` and
`effect` are prompts 30–33. `ControlRenderer` is exhaustive by `assertNever`, so both need an arm.

### Criterion (set before measuring)
Adding a kind must break the build until it is handled — that is the point of `assertNever`. What
the two unbuilt arms render has to be honest about why a control is missing, and it must not be
silently absent, because a block that declares a motion control would then show nothing at all with
no explanation.

### Measurement
Grepped the catalogue: no block in this build declares a `motion` or `effect` control, so both arms
are unreachable today and will be reached the moment prompt 30 lands one. The alternatives are
`return null` (a control that vanishes with no trace) or a `throw` (a block that crashes the panel
it is being edited in).

### Decision
Both arms render a muted one-line note naming the prompt that builds them, in the row the control
would have occupied. When the real control arrives, the arm changes and nothing else does.

### Consequences
- Accepted: a string in the UI that will be deleted. It is one line, and it is the difference
  between "not built yet" and "broken".

## ADR-110 — Universal sections order the block's own controls; they do not invent props

**Date** 2026-08-09 · **Prompt** 23 · **Status** Accepted

### Question
The prompt asks for universal Layout / Style / Typography / Effects / Code sections that are "not
per-block". A document node holds `props`, `responsive`, `motion` and `effects` — and `props` is
validated against the block's own schema. What can a universal section write?

### Criterion (set before measuring)
Every control the inspector shows must be able to commit. Invariant 7 parses a node's props against
its block schema on the write path, so a control for a prop the block does not declare produces a
thrown command the moment it is touched.

### Measurement
Tried it against the three blocks: a universal `opacity` control on a heading dispatches
`setProp('opacity')`, and `requireProps` rejects the node because `headingSchema` has no such key —
the edit is refused and the panel has lied. There is no node-level style bag in FILE_FORMAT.md to
write it to instead, and adding one would be a document-format decision taken from the wrong side.

### Decision
A universal section is a **canonical group id with a canonical order and label**, filled with the
block's own controls that declare that group — so every block's inspector reads Layout, Style,
Typography, Content, then the node-level sections, whatever order the block listed them in. The
node-level sections are the ones that need no block prop at all: Responsive (the overrides on this
node at this breakpoint), Effects and Code, both stubs until their prompts.

Capabilities still gate: a section is hidden when the block has no controls in it, and sizing
controls appear only when `capabilities.resizable` is true and the schema holds the size — the same
gate ADR-108 put on the canvas handles.

### Consequences
- Accepted: "universal" means uniform *presentation*, not a uniform set of properties. A heading
  will never show a border control, because a heading has no border prop, and the honest fix for
  that is a prop on the block rather than a control in the panel.
- Accepted: a block that invents a group id gets its own section at the end, labelled from the id.

## ADR-111 — Every prop commits through the throttled path today, because no block reads a variable

**Date** 2026-08-09 · **Prompt** 23 · **Status** Accepted

### Question
`useControlCommit` has two paths: `onChange` writes a CSS variable on the node element with no React
and no store, and `onCommit` dispatches a coalesced command. Which props take which?

### Criterion (set before measuring)
The variable path is only correct when the rendered block actually reads that variable. Writing
`--ms-opacity` on a node whose component never mentions it changes nothing on screen, so the drag
would look frozen until release.

### Measurement
Grepped the three blocks for `var(`: none. Every prop they have is a scale name or a boolean that
resolves to a Tailwind class, and a class cannot be produced by a variable — ADR-106 recorded the
same wall from the other side. So the number of props that can preview through a variable today is
**zero**.

### Decision
`useControlCommit` takes the variable name from the control descriptor (`options.cssVar`). When it
is present, `onChange` writes the variable and nothing else; when it is absent — every control in
this build — `onChange` falls through to a **throttled commit at 30 Hz**, which coalesces into one
history entry by the same `coalesceKey`. The choice is data on the descriptor, so a block that
starts reading a variable turns the fast path on without touching this hook.

### Consequences
- Accepted: a scrub drag on a class-based prop costs a store write every 33 ms rather than none.
  It is one write, one node re-render, and the canvas root does not render at all (ADR-112).
- Accepted: the fast path is unexercised by the catalogue and is covered by its own unit test until
  a block declares a variable.

## ADR-112 — The rect cache subscribes to the scene instead of taking `version` as a prop

**Date** 2026-08-09 · **Prompt** 23 · **Status** Accepted · **Amends** ADR-077

### Question
`Canvas` reads `scene.version()` during render to hand it to `useRectCache`, which makes the host
re-render the canvas on every document change. With an inspector drag committing at 30 Hz, what does
that cost?

### Criterion (set before measuring)
The prompt's own number: a 200 px slider drag produces **zero** canvas re-renders. Anything the
canvas root does per commit is measured against that.

### Measurement
With `version` as a prop, one drag is ~30 commits a second, each re-rendering the canvas root, the
scene, the artboard and `renderNode(rootId)` — the memo below it stops the cascade, so the cost is
bounded, but the count is not zero and cannot be. The cache needs the version for one thing only:
to invalidate geometry when the tree changed. `CanvasScene.subscribe` has existed since ADR-092.

### Decision
`useRectCache` takes the scene and subscribes: on a notification it compares `scene.version()` with
the last one it saw and invalidates only when it changed. `Canvas` reads no getter during render,
and the host drops its `version` subscription. ADR-077 said `version()` is the one getter read
during render; it is now read in a listener like every other.

### Consequences
- Accepted: the cache re-measures on document change rather than on the render after it — one frame
  earlier, and no longer dependent on the host choosing to subscribe.
- Accepted: a host that never notifies gets a cache that never invalidates. The port's contract says
  `subscribe` fires when any getter's answer may have changed, and the fixture and the store both do.

## ADR-113 — `dispatchBatch` takes a coalesce key

**Date** 2026-08-09 · **Prompt** 23 · **Status** Accepted

### Question
An inspector edit over a multi-selection is one command per node, dispatched together. During a drag
that batch repeats thirty times a second. UI_GUIDELINES.md § Multi-selection requires one undo step
for the whole gesture. How?

### Criterion (set before measuring)
One history entry per gesture, for one node and for five, and no transaction left open across a
gesture that a thrown handler could strand.

### Measurement
Three mechanisms exist. `dispatch` coalesces by `Command.coalesceKey`, but one command per node
gives one entry per node. `dispatchBatch` writes one entry for the batch and passes `null` as the
key, so thirty batches are thirty entries. `beginTransaction` / `endTransaction` accumulates
correctly, and the history slice warns in development when a transaction outlives a macrotask —
which a two-second drag does, every time, by design.

### Decision
`dispatchBatch(commands, label, coalesceKey?)`. The inspector passes
`inspector:<path>:<breakpoint>`, so the store's existing 400 ms coalescing merges a drag into the
entry its first frame opened. No transaction is opened and none can be left open.

### Consequences
- Accepted: two gestures on the same property less than 400 ms apart merge into one undo step. That
  is what the coalescing window is for, and it is the rule a single-node scrub already followed.
- Accepted: the parameter is optional, so every existing caller — a paste, a wrap — still writes one
  uncoalesced entry.

## ADR-114 — Inspector section state persists in `localStorage`, not in the document

**Date** 2026-08-09 · **Prompt** 23 · **Status** Accepted

### Question
Which inspector sections are open must survive a reload. The document persistence layer is prompt 50
and writes to IndexedDB. Where does panel furniture go?

### Criterion (set before measuring)
The `.motion` file is what a user shares and what the exporter reads. Anything stored in it has to be
something another person opening that file would want.

### Measurement
FILE_FORMAT.md has no field for panel state, and adding one would put "was Layout open" into every
exported document and every diff. The state is small — a boolean per section id — synchronous to
read, and needed before the first paint of the panel, which rules out the debounced IndexedDB path
prompt 50 builds for the document.

### Decision
One `localStorage` key, `motion-studio.inspector.sections`, hydrated into the ui slice on mount and
written back on change. Both directions are wrapped in `try`, because a private window that refuses
storage is not a reason to fail to open the studio.

### Consequences
- Accepted: the state is per browser rather than per document, which is what a user expects of a
  panel and not of a property.
- Accepted: a second surface with section state — the left panel — will use the same key shape.

## ADR-115 — A block declares what its parent must be, and the inspector says so

**Date** 2026-08-09 · **Prompt** 24 · **Status** Accepted

### Question
A fluid `spacer` is `flex-1`, which does nothing at all inside a parent that is not a flex container.
The prompt is explicit that silently doing nothing is the worst option. Where does that requirement
live, and who says it out loud?

### Criterion (set before measuring)
The answer has to be readable by the inspector and by the drop-target logic that arrives with the
drag-and-drop prompts, without either of them holding a list of block ids — the same rule ADR-108
applied to resizing.

### Measurement
`BlockCapabilities` carries `resizable`, `fullWidth`, `requiresBackdrop`, `supportsMotion`,
`costClass` and `minWidth`: every one of them a fact about the block that a surface reads rather
than infers. `requiresBackdrop` is the exact precedent — a glass block needs something behind it, a
fluid spacer needs a flex parent, and both are "this block only works in a certain context".

### Decision
`BlockCapabilities` gains `requiresFlexParent?: boolean`. `spacer` sets it, the inspector renders a
hint on the control that turns fluid mode on, and prompt 28's drop resolution can read the same
field rather than growing a special case for one block id.

### Consequences
- Accepted: a capability that one block uses today. It is a fact about a block, and the alternative
  is the hard-coded list this repository has been avoiding since ADR-108.
- Accepted: the hint is written on the control, so it is one string in the block's own metadata
  rather than a rule in the panel.

## ADR-116 — `grid`'s auto-fit minimum is a scale, not a length

**Date** 2026-08-09 · **Prompt** 24 · **Status** Accepted

### Question
The prompt asks for `minItemWidth` behind `repeat(auto-fit, minmax(var(--min-item), 1fr))`, and for
both grid modes to export to clean Tailwind. Can that minimum be a free length?

### Criterion (set before measuring)
The emitted class has to exist. Tailwind generates an arbitrary value only when it can see the
literal in the source, and a value read out of a document at runtime is never literal at build time
— ADR-106 recorded the same wall for padding.

### Measurement
Three ways out. A CSS variable on the element (`grid-cols-[repeat(auto-fit,minmax(var(--min),1fr))]`
plus a `style` attribute) exports as a class **and** an inline style, which rule 3 bans and which
makes the emitted file harder to read than the thing it replaced. An inline `grid-template-columns`
has the same problem without the class. A named scale is one lookup into a frozen map of literal
classes, and the four steps that matter — 12, 16, 20, 24 rem — cover the card widths this mode is for.

### Decision
`minItemWidth` is an enum over `sm | md | lg | xl`, mapped to literal
`grid-cols-[repeat(auto-fit,minmax(Nrem,1fr))]` classes. Explicit mode maps to `grid-cols-N`. Both
are static classes, so both export as themselves.

### Consequences
- Accepted: a user cannot ask for a 17 rem minimum. The scale is the design system holding, and the
  `css` control kind is the escape hatch when the playground lands.
- Accepted: the class map and the enum are edited together, which the block's own test asserts.

## ADR-117 — `hidden` is a prop on the blocks that have one, not a universal control

**Date** 2026-08-09 · **Prompt** 24 · **Status** Accepted

### Question
RESPONSIVE_ENGINE.md § Which properties are responsive says `hidden` is responsive and stored as a
prop rather than as the node flag, so that an override emits `hidden md:block`. Which blocks get it?

### Criterion (set before measuring)
Same rule as ADR-110: a control may only write a prop the block's schema declares, because invariant
7 parses the write. A universal `hidden` control would throw on every block that does not have one.

### Measurement
The document already has `node.hidden`, which is the editor's own "hide this while I work" and is
not exported. The prop is a different fact — "this is not shown at this breakpoint" — and it has to
reach the exporter. Adding it to all seven layout blocks is seven schema entries and seven class map
rows; adding it to `BlockDefinition` as a universal would put it on all 62 blocks including the ones
whose parent controls their visibility.

### Decision
The structural blocks that a user hides per breakpoint — `section`, `container`, `stack`, `grid`,
`columns`, `spacer`, `divider` — declare `hidden` in their own schemas, responsive, mapped to
`hidden` / `block` classes. The node flag keeps its own meaning and its own place in the layers tree.

### Consequences
- Accepted: two things called hidden. They are different facts with different lifetimes, and the
  layers tree eye icon is the flag while the inspector's control is the prop.
- Accepted: every later block that wants it declares it. The alternative is a universal control that
  most blocks would reject on write.

## ADR-118 — The hero copy stack is one module, not six

**Date** 2026-08-09 · **Prompt** 25 · **Status** Accepted

### Question
Six heroes share an eyebrow, one `<h1>`, a subtitle, a CTA pair and a trust row, plus a vertical
rhythm the prompt states exactly: eyebrow → 24 px → headline → 24 px → subtitle → 40 px → CTAs. Does
each block render that itself, or is there a shared component?

### Criterion (set before measuring)
ENGINEERING_CONTRACT.md § 3 puts one concept in one directory and forbids sibling blocks importing
each other, so a shared piece has to sit above them — the same place `scales.ts` sits for the size
vocabulary. The test is whether the shared thing is *one decision* or *six coincidences*: a rhythm
written in a document is one decision, and six transcriptions of it are six places to drift.

### Measurement
The rhythm is four margin values and `first:mt-0`. Duplicated across six blocks that is 24 class
strings; a single edit to the CTA gap then has six places to land and no test that would catch five
of them. Against that, the shared module costs one indirection when reading a block, and the two
props that genuinely differ by layout — `headlineSize` and `subtitleSize` — have to be parameters
rather than constants. Those two turned out to be real: measured at 1440 px, `display-1` in a
half-width column broke a seven-word headline onto four lines.

### Decision
`hero/hero-copy.tsx` renders the copy stack; `hero/hero.styles.ts` owns the typography;
`hero/hero.schema.ts` supplies the schema fragments through `heroCopyFields(copy)`, a factory so the
*words* stay per block; `hero/hero.controls.ts` exports control descriptors typed against a shape
rather than against a block. Each hero still has its own nine files.

### Consequences
- Accepted: reading `HeroCentered` does not show you the markup of its own headline. Mitigated by
  the shared component being one file with one job and by the schema fragments carrying their own
  defaults.
- Accepted: a shared `TypedControl<HeroCopyShape>` is only legal because the compiler checks that its
  path exists on the block's own props. A block that renamed `headline` would fail to compile rather
  than silently show a dead control — which is ADR-110's rule enforced for free.
- Avoided: six copies of a rhythm that DESIGN_SYSTEM.md states once.

## ADR-119 — A block renders `<img>`; `next/image` is the exporter's decision

**Date** 2026-08-09 · **Prompt** 25 · **Status** Accepted

### Question
COMPONENT_LIBRARY.md § Rules 10 says *"Every image is `next/image` in the block"*. `hero-app-preview`
is the first block in the catalogue with an image. Does `packages/blocks` take a dependency on Next?

### Criterion (set before measuring)
A block renders in three hosts today: the studio (`apps/web`, Next), `apps/storybook`
(`@storybook/react-vite`), and Vitest under jsdom. A framework import is only acceptable if every
host can satisfy it — a block that renders correctly in one host and brokenly in another is worse
than one that renders plainly everywhere, because the broken host is the one this prompt's visual
work is judged in.

### Measurement
Two of the three hosts have no Next runtime. `next/image` outside a Next server resolves its `src`
through the `/_next/image` optimiser endpoint, which does not exist under Vite or jsdom, so the
Storybook stories — the surface the prompt's manual verification uses — would show a broken image.
Making it work means aliasing `next/image` to a stub in `apps/storybook`, which is what
`@storybook/nextjs` exists to do; the story would then be judging the stub. Against that, the thing
rule 10 protects — `sizes`, explicit `width`/`height`, no layout shift, priority hinting — is
available on a plain `<img>` in all three hosts, and `fetchPriority`/`decoding` cover the rest.

### Decision
Blocks render a plain `<img>` with explicit `width`, `height`, `sizes`, `loading` and
`fetchPriority`. Which element the *export* emits stays where COMPONENT_LIBRARY.md's own second
clause already put it: the codegen descriptor, read by the printers in prompt 43. `packages/blocks`
takes no framework dependency. COMPONENT_LIBRARY.md § Rules 10 is amended in the same commit.

### Consequences
- Accepted: the studio canvas does not get Next's image optimisation for a user's screenshot. The
  canvas renders a document being edited, not a page being served, and the export is where the
  optimisation belongs.
- Accepted: the `next/image` attribute set and the `<img>` one have to be kept in step by the printer
  rather than by the compiler. Prompt 43 owns that, and the golden files are where it is checked.
- Avoided: a framework dependency in the package that `codegen` and the gallery both consume, and a
  Storybook alias that would make every image story a fiction.

## ADR-120 — One hero's LCP element is an image, and the block says so

**Date** 2026-08-09 · **Prompt** 25 · **Status** Accepted

### Question
Prompt 25 states the rule as *"The LCP element must be static text"* and asserts that in
`hero-app-preview` *"the screenshot is `priority` but the headline is still the larger element"*. Is
that true?

### Criterion (set before measuring)
The claim is geometric and therefore checkable: measure the painted area of the `<h1>` and of the
image plate on the same page, at the desktop width the design is drawn for and at the mobile width
PERFORMANCE.md § Budgets measures LCP on. If the headline is larger at both, the prompt's sentence
stands and is written into the block. If it is not, the sentence is wrong and the block must say
what is actually true.

### Measurement
On a stand rendering all six heroes with their defaults, `getBoundingClientRect` areas:

| Hero | `<h1>` @1440 | media @1440 | `<h1>` @412 | media @412 |
| --- | --- | --- | --- | --- |
| `hero-app-preview` | 112 347 px² | 218 597 px² | 25 005 px² | 102 289 px² |
| `hero-split` (empty plate) | 74 898 px² | 207 936 px² | 25 005 px² | 74 529 px² |

The headline is smaller at every width in both. Separately, on `/hero-lcp` — a page containing only
`hero-aurora` — under mobile emulation, 9 Mbps and 4× CPU throttling, `PerformanceObserver` reported
the LCP entry as `H1`, text *"Build the thing you keep sketching"*, 30 970 px², at **304 / 324 /
324 ms** across three runs against a 2.0 s budget. The aurora backdrop is 999 360 px² and did not
win, because a `radial-gradient` is not a contentful paint.

### Decision
The rule the catalogue enforces is the one the measurement supports: **no decoration a hero draws can
be the LCP element**, which holds absolutely — gradients are not LCP candidates, decorative layers
are `aria-hidden`, empty, and painted behind by z-index rather than by DOM order. Where a *user*
supplies an image — `hero-app-preview`'s screenshot, anything in `hero-split`'s media slot — that
image may well be the LCP element, and the block optimises for that instead of denying it: `eager`,
`fetchPriority="high"`, and a box reserved from explicit dimensions. Both doc comments state the
measured numbers rather than the prompt's assumption.

### Consequences
- Accepted: `hero-app-preview` on a landing page will have an image LCP. It is requested with the
  document and its box is reserved, so the cost is the transfer and nothing else.
- Accepted: this contradicts one sentence of prompt 25. The sentence was checkable, it was checked,
  and § 9.2 says the number decides.
- Avoided: a doc comment asserting something a reader can disprove with devtools in ten seconds,
  which would cast doubt on every other comment in the package.

## ADR-121 — The hero glow's strength is mode-aware; its hue is not

**Date** 2026-08-09 · **Prompt** 25 · **Status** Accepted

### Question
`hero-centered`, `hero-video` and `hero-app-preview` paint an accent field behind their content.
DESIGN_SYSTEM.md § The three curves gives `accent` a different lightness per colour mode. Can one
declaration serve both?

### Criterion (set before measuring)
A glow adds light. The test is whether the painted field is lighter or darker than the surface it
sits on, in each mode — a field darker than its surface is a shadow, whatever it is named.

### Measurement
`--ms-color-accent` is `oklch(46.5% 0.229 285)` in light mode and `oklch(70.0% 0.156 285)` in dark;
`surface-0` is 98.5 % and 9.5 %. So one `color-mix` at 45 % lightens by 60 points of lightness in
dark and *darkens* by 52 in light. Screenshotted at 1440 px in the light default, the 45 % field
turned the whole band flat grey and dropped the secondary button's label to near-illegible.

### Decision
`.ms-hero-glow` keeps the accent token as its hue in both modes and carries its strength in
`--ms-hero-glow-core` / `--ms-hero-glow-halo`: 16 % / 7 % on the bare selector, 45 % / 14 % under
`:root[data-color-mode='dark']` and under `@media (prefers-color-scheme: dark)` for a root that has
not been told — the same three-state shape the generated token stylesheet already writes.

### Consequences
- Accepted: two more custom properties, and a block stylesheet that now contains a mode selector.
  It is the same selector `packages/tokens` emits, so there is one convention rather than two.
- Accepted: the aurora fields deliberately do *not* do this. They are checked in both modes and read
  correctly in both, because a large blurred field of a mid-lightness hue is a wash either way —
  which is a different thing from a highlight and needed no correction.

## ADR-122 — Rich text is stored as an AST, and the string sanitiser keeps its own job

**Date** 2026-08-09 · **Prompt** 26 · **Status** Accepted

### Question
ADR-051 settled that rich text is sanitised twice against one policy and stored as a restricted HTML
string. Prompt 26 says the stored value must be an AST and calls the boundary non-optional. Which is
right, and does adopting an AST supersede ADR-051?

### Criterion (set before measuring)
FILE_FORMAT.md § Security names rich text the most likely XSS vector in the product. The test is
therefore not "does the sanitiser reject today's payloads" — both forms do — but **what the render
path has to be right about**. Count the parsers on the path from a stored value to the screen: each
one is something that has to agree with a browser about every malformed input ever written.

### Measurement
Storing a string: the value is sanitised on import, sanitised again on paste, and then reaches the
page through `dangerouslySetInnerHTML` — a *browser* parse of attacker-influenced markup, at render
time, on every render. Safety depends on the sanitiser and the browser parser agreeing, which is
exactly the class of bug that mutation-XSS lives in.

Storing an AST: the value is parsed once, at the edge, into a tree of five node kinds. The renderer
maps those to React elements. There is **no HTML parser on the render path at all** — a node the
parser cannot produce cannot be rendered, whatever the input looked like. The prompt's other
requirement, lists, also falls out: the string policy drops `ul`/`ol`/`li` because it cannot express
structure, and the AST has a place for it.

### Decision
`packages/schema/src/rich-text/` holds the AST types, its Zod schema, `parseRichText` (DOM-free) and
`richTextToHtml` (for the editing surface). The `rich-text` block renders React elements from the
tree and contains no `dangerouslySetInnerHTML`.

ADR-051 is **not superseded**. Its subject is the `html`-keyed props FILE_FORMAT.md § Security
already covers and the clipboard path in `packages/ui`; both keep the string sanitiser and both keep
the same policy. The AST is the *document's* representation, which is a different question from how
a paste is cleaned.

### Consequences
- Accepted: two representations of the same idea. They are joined by `parseRichText` /
  `richTextToHtml`, and the round trip is asserted by a test — a trip that loses a mark loses work.
- Accepted: the `richText` control still edits HTML, so the inspector converts at the commit boundary.
  That seam is the one place a bug could reintroduce markup, and it is one function wide.
- Accepted: the tree is deliberately shallow — marks are a set on a run, a link holds runs — so
  nothing recursive has to be validated or rendered. Nested formatting beyond that is not expressible.

## ADR-123 — `stat`'s sparkline rounds its coordinates

**Date** 2026-08-09 · **Prompt** 26 · **Status** Accepted

### Question
`sparklinePath` normalises a numeric series into a fixed viewBox. At what precision?

### Criterion (set before measuring)
Prompt 26 requires the thumbnail generator to produce byte-identical output across two runs, and a
thumbnail renders `previewProps` — so any float in the markup is a float in the comparison. The
precision has to be the smallest that is visually indistinguishable in a 320 × 200 thumbnail.

### Measurement
The viewBox is 100 × 32 and a thumbnail is 320 px wide, so one viewBox unit is about 3 px. Two
decimals is 0.03 px of positioning — an order of magnitude below a device pixel. Unrounded, the same
series produces a path string roughly four times longer whose last digits are platform-dependent.

### Decision
Coordinates round to two decimals. The block's own test asserts it, so the property is checked in the
package that owns it rather than only in the generator that depends on it.

### Consequences
- Accepted: a series of 64 points on a 4 K display could in principle quantise visibly. It cannot at
  the sizes a sparkline is drawn at, and the alternative is a repository that churns on every run.

## ADR-124 — `code-block` highlights with a small tokeniser, not `shiki`

**Date** 2026-08-09 · **Prompt** 26 · **Status** Accepted

### Question
Prompt 26 asks for `shiki` at build time for known content plus a lightweight runtime highlighter for
user-entered code. Is that two highlighters, one, or a different one?

### Criterion (set before measuring)
Two things decide it and both are checkable: what the studio's first-load budget can afford
(ENGINEERING_CONTRACT.md § 6: 250 kB), and whether the "build time" half has any content to apply to
inside an editor.

### Measurement
Code in a canvas is typed by the user, so there is no build-time content to pre-highlight — the
build-time half of the idea has no subject. That leaves the runtime highlighter, and `shiki` at
runtime means a WASM regex engine plus a grammar per language. Measured against the budget the studio
was already at 244.9 kB gzip with 9 content blocks and 6 heroes; the whole `code-block` directory,
tokeniser included, is what fits — and it is loaded on demand anyway.

What a code sample on a marketing page needs is five colours that make structure legible: comment,
string, number, keyword, and everything else. That is what the tokeniser produces, for eight
languages, in under 120 lines.

### Decision
A hand-written tokeniser in `code-block/highlight.ts`, and the whole block is `lazy` in
`content/components.ts`, so neither it nor the tokeniser is in the studio's first-load bundle.

### Consequences
- Accepted: highlighting is approximate. It is not a parser and cannot be wrong in a way that matters
  — the worst failure is a word painted the wrong colour in a sample whose text is already correct,
  selectable and copyable. Its test asserts the one property that does matter: no character of the
  source is ever lost, whatever it paints.
- Accepted: a language outside the eight falls back to plain text rather than to a wrong grammar.
- Avoided: a WASM payload and a per-language grammar download in a tool whose budget is measured in
  single-digit kilobytes of headroom.

## ADR-125 — Thumbnails are generated by driving Chrome directly, and the hover clip is not shipped

**Date** 2026-08-09 · **Prompt** 26 · **Status** Accepted

### Question
Prompt 26 asks for a Playwright script that renders each block, writes a 320 × 200 WebP per colour
mode with a blur placeholder, records a two-second WebM hover clip for animated blocks, and produces
**byte-identical output across two runs**. Playwright is not in the repository. Adopt it?

### Criterion (set before measuring)
Two things decide it, and the second is the one that matters:

1. What does Playwright add over `chrome --headless`, which this repository already drives over CDP
   in every browser verification since prompt 18?
2. **Can each artefact be made byte-identical?** The output is committed, so an artefact that cannot
   be is an artefact that churns the repository on every run — which the prompt itself forbids in the
   same paragraph that asks for it.

### Measurement
On (1): everything the still images need, Chrome does natively. `Page.captureScreenshot` encodes
**WebP at a chosen quality**, and `clip.scale` downscales in the same call — so there is no second
image library and no second encoder to disagree with the first. The one thing Playwright adds is
`recordVideo`.

On (2), measured rather than assumed. With reduced motion emulated, the device scale factor pinned
and font hinting off, two full runs produced **44 byte-identical WebP files** and a manifest that
differed. The difference was traced to the blur placeholder: at 4 × 3 the generator asks Chrome to
scale a 1.6 : 1 frame into a box whose height lands on 2.5 px, and that rounding does not resolve the
same way twice. At 8 × 5 — which divides the stage exactly — two runs are identical, hash
`01c96e3298…`, and `--verify` proves it by running twice and comparing.

A WebM is the opposite case. A recorded video carries container and frame timestamps produced by a
real-time encoder; nothing in Playwright's API fixes them, so byte-equality across runs is not
available at any effort short of re-muxing through ffmpeg with pinned timestamps — a second binary,
in a repository that has none.

### Decision
`scripts/generate-thumbnails.mjs` drives Chrome over CDP with no new dependency, and writes the still
half of § Thumbnails: `<block>-{dark,light}.webp` at 320 × 200 quality 82, plus a blur placeholder per
mode in `thumbnails.json`. `--verify` runs twice and fails if the bytes differ.

**The animated WebM hover clip is not shipped.** It is the one deliverable of prompt 26 that cannot
meet the determinism requirement stated beside it, and shipping a file that changes on every run
would defeat the check the rest of the generator is built around. `ROADMAP.md` carries it with what
it needs: ffmpeg with fixed timestamps, or a decision from the owner that hover clips are generated
at release time and not committed.

The presence check lives in `scripts/check-registry.ts` rather than in the blocks package's
meta-tests, where prompt 22 reserved a place for it. Thumbnails are written to `apps/web/public`, and
a package test asserting an app's files would invert the dependency direction ARCHITECTURE.md § 1
exists to protect. A root script sees both halves; that is why it is a root script.

### Consequences
- Accepted: no hover clip in the palette yet, so an animated block and a still one look the same
  while browsing. Reported rather than quietly dropped.
- Accepted: the generator needs a Chrome on the machine that runs it. CI does not run it — it runs
  `check:registry`, which needs nothing — so this is a cost the author pays and the pipeline does not.
- Accepted: thumbnails are rendered through the Storybook build, so `pnpm build:storybook` is a
  prerequisite. The alternative was a second bundler configuration whose output would differ from the
  one every other visual check already uses.
- Accepted: the blur placeholder is 8 × 5 rather than the 4 × 3 the prompt names. It is the same
  handful of bytes and it is the reason the output is stable.

## ADR-126 — The drag pipeline stays in screen space; the ghost gets no zoom division

**Date** 2026-08-10 · **Prompt** 27 · **Status** Accepted

### Question
DRAG_AND_DROP.md § Working inside the transformed canvas specifies a modifier that divides the drag
transform by `zoom`, applied to canvas-internal drags. The same document specifies the ghost as a
`DragOverlay` in a portal at `Z.dragGhost`, which is outside the scene's transform. Both cannot be
right at once. Which correction does the ghost actually need?

### Criterion (set before measuring)
The ghost must sit on the cursor. Concretely: through a drag, the offset between the ghost's top-left
corner and the cursor must stay **constant to within 1 px** at zoom 0.5, 1 and 2. Whichever
configuration holds that is the correct one; the other is the drift the document warns about.

### Measurement
A stand in `apps/web` with a palette card, a scene scaled by CSS transform, and the provider
optionally handed `canvasTransformModifier(zoom)` as a `DndContext` modifier. Chrome 151 headless
over CDP: press on the card, then four samples across a 360 px drag, reading the ghost's rect after
each move. The number below is the offset's change from the first sample — zero means it tracked.

| zoom | modifier | offset at each sample (x) | drift |
| --- | --- | --- | --- |
| 0.5 | absent | −112.15 −112.15 −112.15 −112.15 | **0 px** |
| 1 | absent | −112.15 −112.15 −112.15 −112.15 | **0 px** |
| 2 | absent | −112.15 −112.15 −112.15 −112.15 | **0 px** |
| 0.5 | present | −72.15 +7.85 +127.85 +247.85 | **320 px** |
| 1 | present | −112.15 −112.15 −112.15 −112.15 | 0 px |
| 2 | present | −132.15 −172.15 −232.15 −292.15 | **160 px** |

A canvas-node drag, ghost absent of the modifier, at zoom 1: offset −27 / −12 at all four samples,
drift 0 px.

The reason is in dnd-kit's own pipeline, which the measurement confirms rather than assumes: the
`DndContext` modifiers produce `modifiedTranslate`, and that value is both the overlay's transform
and the basis of `collisionRect`. Dividing it moves the portal ghost by `delta / zoom` while the
cursor moves by `delta`, so the error grows linearly with the distance dragged — `(1/z − 1) × delta`,
which is exactly the two non-zero rows above.

### Decision
`DndProvider` passes **no** modifiers to `DndContext`. The overlay carries `snapToCursorOffset`
only, which shifts by a constant and therefore preserves 1:1 tracking. `canvasTransformModifier` is
not shipped: with the ghost in a portal it has no correct caller, and an exported modifier nobody may
apply is worse than its absence.

Zoom enters the pipeline twice, both times at an edge: the drop point is converted once by
`screenToCanvas`, and the keyboard step is a canvas grid cell expressed in screen pixels (ADR-127).

### Consequences
- Accepted: prompt 27's deliverable list names `modifiers/canvas-transform.ts` and this ships
  without it. Reported, with the numbers, rather than quietly dropped.
- Accepted: the day a drag renders its preview *inside* the scaled scene, the division comes back —
  and this entry says what to measure to confirm it is needed.
- Avoided: a ghost that leaves the cursor at every zoom but 100 %, which is the exact defect the
  document warned about while specifying the thing that causes it.

### Alternatives rejected
- Modifier on `DndContext`, ghost in the portal: measured above, drifts 160–320 px.
- Modifier on `DragOverlay` instead: the overlay applies its modifiers on top of the same
  `modifiedTranslate`, so it is the same division in a different place.
- Ghost rendered inside the scene so the division is correct: contradicts § Drag preview, and it
  would scale the outline with the scene — a 1.5 px ring becomes 6 px at zoom 4.

## ADR-127 — The keyboard step is one grid cell as it appears on screen

**Date** 2026-08-10 · **Prompt** 27 · **Status** Accepted

### Question
DRAG_AND_DROP.md § Sensors says an arrow key moves "one grid cell (divided by zoom so a step is one
visual cell)". dnd-kit's coordinate getter works in screen coordinates. Is `gridSize / zoom` the
step that lands on the visible grid?

### Criterion (set before measuring)
One press must move the drag point by one cell of the grid the user can see — the grid
`packages/canvas` paints, which is `gridSize` canvas units and therefore `gridSize × zoom` screen
pixels. The step is right if a press moves the ghost from one grid line to the next at zoom 0.5, 1
and 2; wrong if the distance shrinks when the grid grows.

### Measurement
Arithmetic over the two spaces, checked against the pipeline the getter feeds. The getter returns
screen coordinates, and the drag point moves by exactly what it returns (ADR-126: no modifier scales
it). At `gridSize` 8, one visible cell is 4 / 8 / 16 screen px at zoom 0.5 / 1 / 2. The specified
`gridSize / zoom` gives 16 / 8 / 4 — the inverse: at zoom 2, where a cell is drawn 16 px wide, a
press would travel 4 px, and four presses would land inside one cell. `gridSize × zoom` gives
4 / 8 / 16, which is the cell.

The document's formula also fails under the pipeline it was written for. With a `÷ zoom` modifier in
place, a screen step S becomes a canvas delta of `S / zoom`, so a step of one canvas cell needs
`S = gridSize × zoom` there too. Neither pipeline makes the division correct.

### Decision
`keyboardStep(gridSize, zoom) = gridSize × zoom`, and § Sensors is corrected to say so. The
cross-container mode is unchanged in intent and made exact: a press whose step would leave the
current container jumps to the next container in document order instead, so the mode switch *is* the
boundary rather than a threshold placed near it.

### Consequences
- Accepted: at zoom 0.25 a press moves 2 px, which is a slow way to cross a canvas. Crossing a canvas
  is what the cross-container mode is for; within a container the point of the step is to land on the
  grid.
- Accepted: a document edit to DRAG_AND_DROP.md ahead of the code, per ENGINEERING_CONTRACT.md § 9.

## ADR-128 — A drag cancels on window blur by delivering the sensor's own cancel key

**Date** 2026-08-10 · **Prompt** 27 · **Status** Accepted

### Question
DRAG_AND_DROP.md § Auto-behaviours requires a drag to cancel on window blur. dnd-kit's sensors cancel
on `Esc`, on `pointercancel` and on `visibilitychange` — and switching to another application fires
none of those on Windows, because the page stays visible. How is the cancel delivered?

### Criterion (set before measuring)
The cancel must unwind the sensor, not just the store: after it, no ghost, no drop recorded, and no
listener left waiting for a `pointerup` that will arrive later. Measured in a browser, not reasoned
about.

### Measurement
`@dnd-kit/core@6.3.1` declares every member of `AbstractPointerSensor` `private`, including
`handleCancel`, and does not export the class from its entry point; `DndContext` exposes no
imperative cancel (`cancelDrop` runs at drop time only). So the two candidate mechanisms are calling
`props.onCancel()` from a wrapper sensor — which ends the drag in the context while the inner
sensor keeps its document listeners until the next `pointerup` — or delivering the key the sensor
already treats as a cancel.

Chrome 151 headless, on the stand: mid-drag, `window.dispatchEvent(new FocusEvent('blur'))` while
the pointer button was still down. Ghost present before, **absent after**; drops recorded before and
after both **2**; the live region read *"Cancelled. Aurora hero, marketing block returned to its
original position."* The same run with a real `Escape` key event produced the identical three
results, which is the point: the paths are the same path.

### Decision
`useCancelDragOnBlur(dragging)` listens for `blur` while a drag is in flight and dispatches a
`keydown` of `Escape` on `document`. Both sensors honour it, each through its own cancel path, so the
detach, the text-selection cleanup and the `onCancel` all happen exactly as they do for a real press.

### Consequences
- Accepted: the synthetic key reaches every other `keydown` listener on the document, exactly as a
  real `Escape` would. During a drag that is the behaviour we want anyway — a user who presses
  `Escape` mid-drag gets the same breadth.
- Accepted: it is an event rather than a call, so it is one hop less direct than an imperative cancel
  would be. That API does not exist in this version; if it appears, this entry is what to supersede.
- Avoided: a wrapper sensor that leaves live pointer listeners behind a cancelled drag.

## ADR-129 — The drop resolver reaches the drag layer as a port, not an import

**Date** 2026-08-10 · **Prompt** 27 · **Status** Accepted

### Question
`DndProvider` must produce a `DropTarget` for `onDrop`. `resolveDropTarget` (prompt 28) is pure, but
its inputs are the document, the registry, the rect cache and the isolation id. Where does the
provider get them?

### Question resolved by
Specification. ARCHITECTURE.md § Rules forbids `dnd` from importing `canvas` (rect cache) and puts
the live document in the store, which is `apps/web`. Every input of the resolver is therefore
something this package cannot reach, and the seam is already the shape the rest of the repository
uses for exactly this: the canvas takes `CanvasScene` and its ports as props (ADR-077).

### Decision
`DndProvider` takes `rects`, `zoom`, `gridSize` and `resolveTarget` as props. `resolveTarget` is a
`DropTargetResolver` — `(attempt) => DropTarget | null` — which prompt 28 will implement by binding
`resolveDropTarget` to the store's document, the registry and the current isolation. The provider
calls it in two places: when the container under the drag changes, to announce the position, and at
the release, to report the drop.

### Consequences
- Accepted: prompt 27 ships a pipeline with no policy in it. The visible feedback and the index
  arithmetic arrive in prompt 28, and until then a host must supply a resolver — there is no default,
  because a default here would be a fake implementation of the next prompt.
- Accepted: the resolver runs on container change rather than on every frame, which is enough for the
  announcements; the `rAF` throttle with the 2 px skip belongs to the live indicator in prompt 28.

## ADR-130 — A slot says how it arranges its children; the drag layer does not guess

**Date** 2026-08-10 · **Prompt** 28 · **Status** Accepted

### Question
Step 4 of DRAG_AND_DROP.md § Drop position resolution says to read the container's layout direction
"from its props, not from computed style". `container` says `mode: 'grid'` and `direction: 'row'`,
`stack` says `direction: 'horizontal'`, `grid` says nothing because it is always cells, and `columns`
has one child per side. Who translates a block's own props into the axis a drop compares against?

### Question resolved by
Specification, and the specification points one way only.

ARCHITECTURE.md § Rules 1–4 keep block knowledge inside `blocks`: `editor`, `canvas` and `codegen`
learn about a block through the registry interface and never by name. A drag layer that read
`props.direction` would be doing exactly what that boundary forbids — encoding one block's prop names
in another package, where a rename in `stack` silently changes where a drop lands. The alternative,
reading `getComputedStyle` mid-drag, is a forced layout on the frame the prompt's own § Performance
budget is measured on, and it also cannot answer for a container that is off screen.

That leaves the registry, which is where every other cross-boundary fact about a block already lives.

### Decision
`SlotDefinition.orientation?: (props: UnknownProps) => SlotOrientation` in `packages/schema`, declared
by the five layout blocks that hold children:

| Block | What it declares |
| --- | --- |
| `section` | always `vertical` |
| `container` | `grid` when `mode` is grid, else `horizontal`/`vertical` from `direction` |
| `stack` | `horizontal` when `direction` is horizontal, else `vertical` |
| `grid` | always `grid` |
| `columns` | `vertical` per side, because each side holds one child |

The resolver calls it with `resolveResponsiveProps(node, breakpoint)`, so a container that is a row at
`md` resolves as a row at `md`. Absent means vertical, which is what a slot with no opinion is.

### Consequences
- Accepted: `resolveDropTarget` needs the breakpoint, which the signature in the prompt did not carry.
  Without it a drop at `md` into a container overridden at `md` would compare against the wrong axis —
  a wrong answer is worse than a longer argument list. The document is updated with the reason.
- Accepted: a new optional field on the registry seam. Optional and one line per block, and a block
  that forgets it gets vertical rather than an exception.
- Accepted: the function takes `UnknownProps`, so a block reads its own prop with a literal comparison
  rather than through its typed props. `SlotDefinition` is not generic and making it generic would
  ripple through every definition in the catalogue for a two-token gain at each call site.
- Avoided: a computed-style read on the drag path, and a table of prop names in `packages/dnd`.

## ADR-131 — The drag layer depends on `editor`, so a drop is decided once

**Date** 2026-08-10 · **Prompt** 28 · **Status** Accepted

### Question
`validateDrop` has to answer "does this slot accept this block", "is there room", "is this a
descendant of itself" — and `editor`'s command guards answer all three already, because they are what
`insertBlock` and `moveNodes` throw on. `on-drop.ts` then has to turn a target into one of those two
commands. Does `packages/dnd` depend on `packages/editor`, or does it keep its own copies and hand the
host a description to translate?

### Question resolved by
Specification plus one checkable property.

ARCHITECTURE.md § Rules forbids four edges and this is not one of them; `editor` depends on `schema`,
`utils` and `hooks`, so the arrow adds no cycle — `check:deps` asserts that on every commit, and it
passes with 17 packages and a clean graph.

The property that decides it: **a drop this layer accepts and the command then throws on is a defect
neither side can catch.** Two copies of `slotAccepts` are two things to keep in step, and the one that
drifts is the one that shows a green line to the user and then refuses the release. One import removes
the possibility.

### Decision
`packages/dnd` depends on `@motion-studio/editor`. `validateDrop` uses `commands.slotAccepts`,
`commands.slotChildren` and `commands.slotHasRoom` — now exported from the commands barrel, which is
additive — and `commandForDrop(target, payload)` returns the `insertBlock` or `moveNodes` command
itself. The host dispatches it; the mapping is written once for the studio, the layers tree and
anything else that mounts the layer.

`dnd` still must not import `canvas` (ARCHITECTURE.md § Rules 8): geometry arrives as props, because
the rect cache is not a decision, it is a measurement.

### Consequences
- Accepted: `dnd` now pulls `editor` — and with it immer and zustand — into its dependency closure.
  Both are already in the studio bundle, and the resolver itself imports neither.
- Accepted: the drag layer is no longer testable with *only* a fake registry; its tests build a real
  document from `schema`'s factories, which is what the resolver's cases need anyway.
- Avoided: a second implementation of the slot rules, and a `switch` on drop kind in every host.

### Alternatives rejected
- Copies of the three predicates in `dnd`: the drift is silent and user-visible.
- `on-drop` returning a description (`{ kind: 'insert' | 'move', … }`) for the host to translate: the
  same six lines in every host, and prompt 29's tree would be the second copy.

## ADR-132 — Which rows are open is the panel's state, not the store's and not the document's

**Date** 2026-08-15 · **Prompt** 29 · **Status** Accepted

### Question
The layers tree collapses subtrees, and a collapsed subtree is excluded from the flat list. Where does
"node N is collapsed" live: in the document, in the store's `ui` slice, in `localStorage`, or in the
panel component?

### Question resolved by
Specification, by the same test ADR-114 applied to the inspector's open sections.

FILE_FORMAT.md's `.motion` is what a user ships and re-opens elsewhere; STATE_MANAGEMENT.md
§ Anti-patterns keeps view state out of it. A collapsed row changes nothing about the page being
built, so it is not document state — it fails the first test the way ADR-114's sections did.

The second test is what separates the store from the component: `ui.rightPanel.openSections` is in the
store because two surfaces read it (the inspector and the reset action) and its keys are a fixed set of
section ids. Collapse keys are **node ids of the open document**. Nothing outside the tree reads them,
and they are meaningless against the next document — which is exactly why ADR-114 put section state in
`localStorage` and why this cannot go there: a persisted map of ids from a document that is no longer
open is stale on load rather than useful.

### Decision
`useState<ReadonlySet<NodeId>>` in `layers-panel.tsx`, holding the **collapsed** ids — so a node that
has never been touched, and a node that has just been created, are open. The tree is the accessible
structure of the canvas (ACCESSIBILITY.md § Layers tree: "screen-reader users work in the tree"), and a
default-collapsed tree hides the document from the one user for whom it is the only representation.
Virtualization makes the cost of an open tree the size of the window, not the size of the document.

Search does not write to it. A query filters to matches plus their ancestors and shows those paths
open; clearing the query returns the tree to the structure the user left it in.

### Consequences
- Accepted: switching the left panel away from Layers and back re-opens every row. The alternative is a
  persisted map of ids that outlives the document they belong to.
- Accepted: a 500-node document puts 500 rows in the flat list on first open. The list is an array of
  ten-field records built once per document version; the DOM holds the virtual window, which is what
  PERFORMANCE.md § Virtualization budgets and what the 500-node scroll is measured against.
- Avoided: a `.motion` diff that changes because someone folded a row, and a `localStorage` key that
  accumulates ids for every document ever opened.

## ADR-133 — A tree drop is the same seven steps, given tree geometry

**Date** 2026-08-15 · **Prompt** 29 · **Status** Accepted

### Question
`resolveDropTarget` (ADR-131) decides where a drop lands from rects in screen space. The layers tree is
not the canvas: its containers are not nested boxes, they are rows in one flat scrolling list. Does the
tree get its own placement rule, or does it feed the existing resolver rects of its own?

### Criterion (set before choosing)
**Every insertion position the document admits must be reachable with the pointer**, and reachable
without a second rule — no dead pixels, no threshold constant invented for this surface. A scheme that
cannot express "between these two containers" fails, whatever else it does.

### The three candidates, against the criterion

| Rect for node N | Between two leaves | Into a container | Between two open containers |
| --- | --- | --- | --- |
| N's own row | yes | never — the row is the parent's | yes |
| N's row + its descendants' rows | yes | yes | **unreachable** — the blocks are contiguous, there is no gap between them |
| N's descendants' rows, or N's own row when it has none | yes | yes | yes |

The second fails the criterion outright: with the container's own row inside its own block, the whole
strip between two open containers belongs to one of them and no pointer position means "between". It
can be rescued with a band of a few pixels at each block edge, which is a constant this surface invents
and pixels that belong to no zone at all.

### Decision
The tree publishes a `DragRectSource` whose rect for a node is the strip its **descendants' rows**
occupy, or its own row when it has none open. `resolveDropTarget` is called unchanged, with
`hitNodeId` set to the zone the collision picked.

It follows that hovering a row means "before this node", hovering inside an open container's children
means "inside it", and hovering a leaf, an empty container or a collapsed one means "into it" — each
reachable, none overlapping. The rects are arithmetic: rows are `DENSITY.layerRow` tall and the flat
list gives every index, so the source reads the viewport's own box once and computes the rest.

### Consequences
- Accepted: a drop into a container with more than one slot lands in the first slot that accepts the
  block, because a tree row does not say which slot it belongs to. The canvas is where slot-precise
  placement happens — its geometry distinguishes the slots and the tree's cannot.
- Accepted: dropping into a **collapsed** container appends at the end of its children: its rows are not
  in the flat list, so there are no sibling rects to compare against. Spring-open (600 ms) opens the
  group first, which is the path a user who wants a position takes anyway.
- Avoided: a second implementation of validation, rejection reasons and index arithmetic — the defect
  ADR-131 exists to prevent.

## ADR-134 — A keyboard step on the tree is one row

**Date** 2026-08-15 · **Prompt** 29 · **Status** Accepted

### Question
`DndProvider` reads `zoom()` and `gridSize()` at the moment of a key press and steps
`gridSize × zoom` screen pixels (ADR-127). The canvas grid is 8 units; a tree row is 26 px. On the
tree, three presses of `↓` would move within one row and the fourth would leave it.

### Question resolved by
Specification. SHORTCUTS.md § Drag with the keyboard says arrows "move between drop positions", not
between pixels, and DRAG_AND_DROP.md § Sensors states the same in the sensor's own words. A step that
lands inside the row it started in is not a position.

### Decision
The studio's `DndHost` answers `gridSize: () => DENSITY.layerRow` and `zoom: () => 1`, so one press is
one row. Both are functions read at the press, which is what makes a per-surface answer possible at all.

### Consequences
- Accepted: while the tree is the only drag surface in the studio, these two answers are the whole map.
  When the canvas becomes a drag source, this is the place that has to answer per surface — the
  functions already have the shape for it, and the drag payload does not carry which surface it started
  on, so that prompt adds the flag.
- Avoided: a keyboard drag that needs three presses to reach the next row.

## ADR-135 — Visibility and lock are keyboard-operable through their own shortcuts, not through Tab

**Date** 2026-08-15 · **Prompt** 29 · **Status** Accepted

### Question
Each row carries an eye and a lock button. ACCESSIBILITY.md § Layers tree requires a roving tabindex —
one tab stop for the whole tree — and the contract requires a keyboard path to everything interactive.
Two rendered windows of thirty rows would otherwise add sixty tab stops.

### Question resolved by
Specification. SHORTCUTS.md § Edit already binds `Mod+Shift+H` to toggle visibility and `Mod+Shift+L` to
toggle lock, on the selection. There is no gap to fill — only a scope to choose.

### Decision
The two buttons are `tabIndex={-1}`, named ("Hide Hero", "Lock Hero") and `aria-pressed`, and the tree's
key map handles both bindings on the focused row. The registry that will own the map globally is
prompt 33's; until it exists the tree scope is where a user standing on a row can reach them.

### Consequences
- Accepted: the same two bindings will be registered twice for a moment — once here, once globally in
  prompt 33 — and that prompt removes this handler.
- Avoided: sixty tab stops, and a second pair of bindings invented for one surface.

## ADR-136 — `Space` selects, `Enter` picks up, `F2` renames: SHORTCUTS.md contradicted itself on the tree

**Date** 2026-08-15 · **Prompt** 29 · **Status** Accepted

### Question
SHORTCUTS.md binds the same two keys twice on the same surface:

| Section | Binding |
| --- | --- |
| § Layers tree | `Space` toggles selection, `Enter` renames |
| § Drag with the keyboard | `Space` / `Enter` on a focused layer row picks up |

A row cannot both start a drag and toggle a selection on one press. `F2` is bound twice as well —
§ Global cycles the focus scopes, § Edit renames the selection — and prompt 11 implemented the cycle.
Three actions on a focused row (select, rename, pick up), two keys that mean two things each.

### Criterion (set before choosing)
**No action on the surface may lose its only keyboard path**, and the assignment must break the fewest
documented bindings. Where the count ties, the platform convention decides, because a key map a user
already knows costs nothing to learn.

### The count

| Assignment | Select | Rename | Pick up | Documented bindings broken |
| --- | --- | --- | --- | --- |
| A — `Space` select, `Enter` pick up, `F2` rename | `Space` | `F2` | `Enter` | 2: § Layers tree's `Enter`, § Global's `F2` inside the tree |
| B — `Space` pick up, `Enter` rename, arrows select | arrows, and no toggle | `Enter` | `Space` | 2: § Layers tree's `Space` and its `↑`/`↓` "move focus" |
| C — `Space` select, `Enter` rename, no keyboard drag | `Space` | `Enter` | **none** | 1, and it fails the criterion outright |

C is out on the criterion: DRAG_AND_DROP.md § Accessibility requires the full drag on the keyboard and
prompt 29 owes an E2E spec for it. A and B tie at two, so the convention decides: `F2` is rename on every
desktop file tree, § Edit already binds it that way, and `Enter` is one of the two pick-up keys
§ Drag itself offers. B also has to invent selection-follows-focus, which APG advises against in a
multi-selectable tree — every arrow press would rewrite the canvas selection and fire an announcement.

### Decision
On a focused layer row: `Space` toggles selection, `Enter` picks up and drops, `Esc` cancels the drag,
`F2` renames. Inside the tree `F2` renames rather than cycling panels — the tree stops the event, and
`Tab` still leaves the panel, so no scope becomes unreachable. SHORTCUTS.md § Layers tree and § Drag
with the keyboard are corrected in the same commit as this entry.

`Space` is kept out of dnd-kit's activator at the row rather than in `DndProvider`: prompt 37's block
palette is documented to pick up with `Space`, and it has no second meaning for the key.

### Consequences
- Accepted: `F2` inside the layers tree no longer moves to the inspector. It is the only scope where the
  cycle is interrupted, and it is the only scope with a rename.
- Accepted: a keyboard drag started with `Enter` also ends on `Space`, which is dnd-kit's default end
  code. Ending a drag has no competing meaning, so the extra key costs nothing; the tree's own map is
  inert while a drag is in flight.
- Avoided: a binding invented for this surface, and a tree where a keyboard user cannot select a row.

## ADR-137 — The drag layer is mounted by the surface that drags, until a second one exists

**Date** 2026-08-15 · **Prompt** 29 · **Status** Superseded by ADR-179

### Question
DRAG_AND_DROP.md § Public API says `DndProvider` wraps the studio. The studio's shell is in the initial
chunk, so a provider mounted there puts `@dnd-kit/core` and the whole drag layer in it too. Where is it
mounted while the layers tree is the only surface that can start a drag?

### Criterion (set before measuring, by the contract)
ENGINEERING_CONTRACT.md § 6: `/studio` first-load JS ≤ 250 kB gzip. § 6 also states the rule this is an
instance of — heavy modules are dynamically imported and never in the initial studio chunk.

### Measurement
Three builds of `/studio`, Next's own first-load figure and the manifest sum for the one that ships:

| Build | Next first load | Manifest, gzip |
| --- | --- | --- |
| Provider around `StudioShell` | 270 kB | — |
| Provider inside the Layers panel | 251 kB | **245.2 kB** |
| No provider at all (control) | 251 kB | — |

The drag layer costs **19 kB gzip**. In the initial chunk it breaks the budget by 20 kB; in the Layers
chunk it costs the initial chunk nothing, and the panel that needs it downloads it when its tab opens.

### Decision
`DndHost` is rendered by `LayersPanel`, which is itself a `next/dynamic` chunk. The provider therefore
covers every surface that can drag today, and every drag the studio has — operation 3 of
DRAG_AND_DROP.md § The four operations, and the keyboard drag on the same rows.

It moves up to the shell in the prompt that gives the studio a **second** drag surface: prompt 37's
block palette, and the canvas wiring that makes a canvas node a drag source. At that point the 19 kB
buys cross-surface drag rather than one panel's, and the budget conversation has something to weigh.

### Consequences
- Accepted: operation 4 — a tree row dropped on the canvas — cannot work while the two surfaces are in
  different contexts. It could not work today regardless: the canvas registers no drop zone and its
  nodes are not drag sources, both of which are that same prompt's work.
- Accepted: the sentence in DRAG_AND_DROP.md § Public API is true of the finished studio and not of this
  build. It is left as written rather than edited to describe a temporary position.
- Avoided: 20 kB over a budget the contract calls enforced, spent on a context with one consumer.

## ADR-138 — The catalogue reaches resolution as a port, not as an import

**Date** 2026-08-15 · **Prompt** 30 · **Status** Accepted

### Question
`resolveMotion(spec, ctx)` takes a `MotionSpec`, which carries a `presetId` and nothing else. The
preset objects are prompt 32's. How does the resolver get from the id to the preset?

### Question resolved by
Specification. ARCHITECTURE.md § The registry seam already answers the identical question for blocks:
`editor` resolves a `blockId` through a registry it is handed, never through an import, and ADR-102 put
the composition root in the application for exactly that reason. Motion presets are the same shape of
fact — a catalogue that the model plays and does not own.

### Decision
`ResolveContext` carries `presets: MotionPresetRegistry` (`get`, `list`). `resolveMotion` and
`composeMotion` look presets up through it, so the model compiles and tests with a fake catalogue of
two presets and never imports prompt 32's files.

An id the registry does not know resolves to `DISABLED_MOTION` rather than throwing: a document written
by a newer build must lose its animation, not its node.

### Consequences
- Accepted: every caller must build a context. The studio builds one where it builds the block registry.
- Accepted: `MotionPreset<P>` declares `resolve`/`resolveReduced`/`codegen` as **methods**, so a typed
  preset stays assignable to the erased `MotionPreset` the registry holds. Method bivariance is the
  mechanism; the alternative is a cast at every registration, which the contract bans.
- Avoided: `motion` importing `presets`, and a resolver no test can isolate.

## ADR-139 — Bad params fall back to the preset's defaults

**Date** 2026-08-15 · **Prompt** 30 · **Status** Accepted

### Question
`MotionSpec.params` is `Record<string, number | string | boolean>` in the file format; a preset's
`paramsSchema` is a second, stricter contract the format does not check. What happens when a stored
param fails the preset's schema — a renamed param, a value from an older build?

### Criterion (set before choosing)
The same one ADR-071 used for an unknown block on the clipboard: **a document from another build must
degrade in place, never take a node off the canvas.** Motion resolution runs inside the node's render,
under the error boundary of prompt 22 — so a throw here costs the whole node, not the animation.

### Decision
`resolveMotion` parses with `safeParse` and falls back to `preset.defaults` when the parse fails. An
unknown preset id and a `disabled: true` spec both resolve to `DISABLED_MOTION`.

This differs from ADR-104, where a block's props are parsed strictly: a block with unusable props has
nothing to render, while a preset with unusable params has its own defaults, which are by construction
a complete and valid set.

### Consequences
- Accepted: a typo in a param is silent at the engine. The inspector is where it is visible — the motion
  panel is generated from `controls`, so an unknown param has no control and a wrong value fails its own
  control's validation.
- Avoided: an editing session where changing one number blanks a section behind an error card.

## ADR-140 — `ResolvedMotion` names the properties it animates when no variant does

**Date** 2026-08-15 · **Prompt** 30 · **Status** Accepted

### Question
Composition detects conflicts by comparing the **property sets** two resolutions touch, not their
channel names. For the `motion` engine those properties are the keys of `variants`. A `css` preset that
animates through a class, and a `gsap` preset that animates through a timeline, name no properties
anywhere in the shape ANIMATION_SYSTEM.md § The model prints — so they read as touching nothing and
compose with everything.

### Criterion
A conflict that the resolver cannot see is a conflict the user meets as a flickering element. The test
is whether the detection is correct for **presets nobody has written yet**, which is the prompt's own
requirement; a scheme that only works for one of the three engines fails it.

### Decision
One optional field beyond the documented shape: `properties?: readonly string[]`, meaning "this
resolution also animates these, and no variant says so". `motionProperties(resolved)` is the union of
the variant keys and that list. `cssVars` are deliberately **not** in it, which is the mechanism behind
"cursor presets compose with everything" — a custom property is not an animated property.

ANIMATION_SYSTEM.md § The model is left as written: it prints the shape a preset usually returns, and
this is an addition for the two engines it did not enumerate.

### Consequences
- Accepted: a css or gsap preset that forgets the field composes silently. A meta-test over the
  catalogue can require it for those engines when prompt 32 fills the catalogue.
- Avoided: conflict detection that is correct only for the engine the first presets happened to use.

## ADR-141 — `motionScale: 0` takes the reduced path, so both mechanisms are one

**Date** 2026-08-15 · **Prompt** 30 · **Status** Accepted

### Question
DESIGN_SYSTEM.md § Motion tokens says `motionScale: 0` "is the reduced-motion equivalent";
ANIMATION_SYSTEM.md § Reduced motion says both mechanisms "converge". Multiplying every duration by
zero is not the same output as the reduced policy — the policy also drops transforms and disables two
channels. Which does `resolve(spec, { scale: 0 })` produce?

### Criterion
The prompt states it: the two must converge **on one code path**, and the convergence must be provable
by a test rather than asserted in a comment.

### Decision
`isReduced(ctx) = ctx.reduced || ctx.scale === 0`. A scale of zero therefore resolves through
`resolveReduced` and the per-channel policy, and the scaling step then multiplies the policy's own
durations by zero. The proof is an equality test: for a sample of specs,
`resolve(spec, { reduced: false, scale: 0 })` deep-equals `resolve(spec, { reduced: true, scale: 0 })`,
and every duration in both is `0`.

`reduced: true` with `scale: 1` keeps the policy's timings (120 ms for an entrance), which is the
reduced *experience* rather than no experience — the two are the same path, not the same numbers.

### Consequences
- Accepted: a designer who sets `motionScale: 0` gets the reduced experience with zero durations, not a
  zero-length version of the full one. That is the stronger reading of "equivalent" and the only one
  where the mechanisms share code.
- Accepted: the cache key carries `scale` and `reduced` separately, so the two contexts are two entries
  with identical contents rather than one.

## ADR-142 — The reduced policy runs after the preset, as an enforcing net

**Date** 2026-08-15 · **Prompt** 30 · **Status** Accepted

### Question
Every preset must supply `resolveReduced` (ANIMATION_SYSTEM.md § Preset definition), and the same
document states a per-channel policy table. If the preset already returns a reduced resolution, what is
`reduce(resolved, policy)` for — and which wins?

### Criterion
The table's two hardest lines are requirements, not preferences: `cursor` and `continuous` are
**disabled entirely**, not slowed. A guarantee that depends on every future preset implementing it
correctly is not a guarantee.

### Decision
`resolveMotion` calls the preset's `resolveReduced` and then applies `reduce(resolved, policyFor(
channel))`. The policy is the floor: it filters variants to the properties its channel allows, forces
the documented durations, and returns `DISABLED_MOTION` for `cursor` and `continuous` whatever the
preset returned.

The net filters what it can read — variants and `properties`. It leaves `className` and `keyframes`
alone: a class cannot be filtered property by property, and a preset's own reduced class is the thing
the preset was required to provide.

### Consequences
- Accepted: a preset whose `resolveReduced` returns a full-strength transform gets it stripped, and the
  preset's test will show that as a difference. That is the net doing its job.
- Accepted: a css preset can still smuggle a transform through a class under reduced motion. The
  catalogue's own tests are where that is caught; the alternative is dropping every reduced class,
  which breaks the presets that did the work.

## ADR-143 — `transform` collides with its components; the components do not collide with each other

**Date** 2026-08-15 · **Prompt** 30 · **Status** Accepted

### Question
Composition compares property sets (ADR-140). A Motion preset animates `y`; a css preset animates
`transform` through a class. Compared by name those are two properties and compose cleanly — on screen
they are one property and the class wins whenever it repaints. Meanwhile two Motion presets animating
`x` and `y` compare as two properties and genuinely are two: Motion keeps a motion value per component
and composes them into one matrix itself.

### Criterion
The comparison has to answer the question the browser answers: **can both writers' output survive in
the same computed style?** Two transform components can (Motion composes them; CSS `translate` and
`rotate` are separate properties). A whole `transform` and any component cannot — writing `transform`
replaces the lot.

### Decision
`collides(a, b)` is name equality, plus the asymmetric case: `transform` collides with every name in
`TRANSFORM_COMPONENTS` (`x`, `y`, `z`, the three translates, the scales, the rotates, the skews).
Two components never collide with each other.

### Consequences
- Accepted: a gsap timeline that declares `properties: ['transform']` conflicts with an entrance's `y`,
  which is the outcome the § Composition example describes and the reason the field exists.
- Accepted: the list is a table of names, and a preset that invents a component name outside it will
  compose when it should not. It is a table of the CSS transform functions, so growing it is a change
  in CSS, not in the catalogue.
- Avoided: the class-versus-motion-value conflict that would have reached a user as a flicker rather
  than as a warning chip.

## ADR-144 — No effect adapts reference source; the catalogue is built from technique alone

**Date** 2026-08-16 · **Prompt** 33 · **Status** Accepted

### Question
Prompt 33 owns the licence check for the effects category and instructs: open impeccable.style, find
the closest treatment, study it, then implement against our constraints. Before writing thirteen
effects, what did the check actually find, and what does the catalogue inherit from a reference?

### Criterion (set before checking)
Adapting source is permitted only when the licence is permissive **and** permits redistribution of the
component itself. Motion Studio is MIT and its product *is* redistributed component source — a user
exports a block and ships it. So a licence that forbids redistributing the component, in any bundle or
port, forbids adaptation here even where it permits ordinary use.

### Measurement (verified 2026-08-16, recorded in `packages/blocks/LICENSES.md`)
- **impeccable.style** — not a gallery of surface effects. It is a design-vocabulary plugin for coding
  agents: one `/impeccable` command with 23 subcommands, `DESIGN.md` / `PRODUCT.md` context files and
  59 anti-pattern detectors. Repository `pbakaus/impeccable`, **Apache-2.0**. The site states no terms
  of its own; the footer offers changelog, faq and privacy only. Its own page is a dark textured
  surface with a single gold accent and monospace annotation labels — a visual language, not an
  effect catalogue. **There is no aurora, mesh, beam or spotlight implementation on it to study.**
- **Aceternity UI** — proprietary terms: source files may not be redistributed "regardless of
  modifications", and derivative works may not be distributed on any marketplace.
- **Magic UI** — MIT (`magicuidesign/magicui`).
- **React Bits** — **MIT + Commons Clause**: use is free, but the components may not be sold,
  sublicensed or redistributed "alone, in a bundle, or as a ported version".
- **shadcn/ui** — MIT, distributed as copy-into-your-project source. Already vendored under
  `packages/ui/LICENSES.md`.

### Decision
No effect in `packages/blocks/src/effects/` adapts any reference implementation. Each is built from an
understanding of the technique and named as such in its doc comment. Three of the five references
forbid the redistribution our export engine performs (Aceternity, React Bits) or do not contain the
technique at all (impeccable.style); the two that would permit it (Magic UI, shadcn/ui) are not needed
for effects, and copying from one while refusing the others would put an inconsistent rule in the same
directory.

The consequence for the prompt's instruction "compare each effect side by side with the reference and
judge it" is that there is nothing to compare against for this category. The bar is held instead by
the eight requirements in `DESIGN_REFERENCES.md` § What we are aiming for, each of which is checkable,
plus the contrast measurement over real text on a light and a dark surface.

### Consequences
- Accepted: the visual verdict for effects is an argued one against stated criteria, not a
  side-by-side. Recorded here so no later reader assumes the comparison happened and was passed.
- Accepted: `DESIGN_REFERENCES.md` and `packages/blocks/LICENSES.md` described impeccable.style as the
  source of the surface-effect vocabulary. Both were written before this check. They are corrected in
  the same commit as this entry; the earlier hero blocks keep their doc comments, which claim only
  that a technique was understood and rebuilt.
- Accepted: nothing in the catalogue may later be pasted from a reference without superseding this
  entry, including from the two permissive ones.

## ADR-145 — A binding names a key by its position, and spells it with the US character

**Date** 2026-08-16 · **Prompt** 33 · **Status** Accepted

### Question
SHORTCUTS.md § Platform normalization says `normalizeKeys` uses `event.code` for physical keys
(arrows, `Space`) and `event.key` for characters, "so a non-US layout does not break arrow
navigation". Applied literally, which does a letter key use?

### Criterion (set before checking)
A shortcut is broken on a layout if the user cannot produce it at all. Two layouts decide it:
a Russian layout, where `KeyZ` types `я`, and AZERTY, where `KeyA` types `q` and `Digit1` types `&`.
`Mod+Z` (undo), `Mod+A` (select all) and `Mod+1` (base breakpoint) must fire on both.

### Measurement
By `event.key`: on the Russian layout `Mod+Z` produces `mod+я` and matches nothing; on AZERTY
`Mod+A` produces `mod+q` — which is a *different registered binding* — and `Mod+1` produces
`mod+&`. Three of three broken, one of them silently running the wrong command.
By `event.code`: `KeyZ` → `z`, `KeyA` → `a`, `Digit1` → `1` on both layouts. Three of three fire.

### Decision
`normalizeKeys` resolves the key name from `event.code` for physical keys, letters (`KeyA`–`KeyZ`),
digits (`Digit0`–`Digit9`, numpad) and the punctuation the map names (`Quote`, `Slash`, `BracketLeft`
and the rest), falling back to `event.key` only when the code is unknown or absent — a synthetic
event, an IME, or an on-screen keyboard. A declaration therefore spells the *US* character for a
position: `mod+z` is the key left of `X`, whatever it prints locally.

SHORTCUTS.md § Platform normalization is corrected in the same commit; its intent — a non-US layout
must not break the studio — is what this implements, and its letter would have defeated it.

### Consequences
- Accepted: a user on a layout where `z` sits elsewhere presses the physical position, as they
  already do in every editor built this way (VS Code, Figma).
- Accepted: the reference sheet shows the US spelling, which is a lie on AZERTY and the same lie
  every other tool tells. Rebinding, when it arrives, is the honest fix.
- Avoided: the AZERTY case where `Mod+A` would have run `Mod+Q`'s command instead of failing.

## ADR-146 — A conflict is two bindings in the same scope, not a scope overriding global

**Date** 2026-08-16 · **Prompt** 33 · **Status** Accepted

### Question
Prompt 33 requires a startup assertion that throws when "two shortcuts with the same `keys` in
overlapping scopes" are registered. `global` is consulted for every scope, so read one way every
scope overlaps `global` — and the registry the same document mandates contains `F2` twice on
purpose (ADR-136: cycle panels globally, rename inside the layers tree).

### Criterion
An assertion is worth having only if what it forbids is genuinely ambiguous. The test: given one
focus position and one key press, can resolution pick two different shortcuts? If resolution is
deterministic, there is nothing to warn about.

### Measurement
Over the populated registry: same-scope duplicates are undecidable — the match order within a scope
is registration order, which is not a design anyone stated. Cross-scope pairs are decided by the
documented order (scope first, then `global`) and produce one answer: `F2` in the tree renames,
`F2` on the canvas cycles panels; `space` in the tree toggles selection, `space` on the canvas pans.
Deliberate overrides in the populated registry: 6. False positives a global-overlaps-everything rule
would have raised: 6.

### Decision
`findConflicts` reports two shortcuts as conflicting when they share canonical `keys` **and** the
same `scope`. Cross-scope pairs are overrides and are legal — they are the reason scopes exist.
`dialog` is exclusive rather than overlapping: while a dialog is open nothing else is consulted.

### Consequences
- Accepted: a `global` binding shadowed in every scope becomes dead without the assertion noticing.
  The reference sheet is where that shows, because it lists both and greys neither.
- Accepted: the assertion is weaker than the prompt's wording. It is also the only version that can
  stay switched on with the registry the same prompt requires.

## ADR-147 — `preventDefault` is on by default; a shortcut opts out of it

**Date** 2026-08-16 · **Prompt** 33 · **Status** Accepted

### Question
SHORTCUTS.md § Resolution order ends "Run; call preventDefault if declared", which reads as opt-in.
With ninety bindings, is opt-in or opt-out the safer default?

### Criterion
Compare the cost of each mistake. A forgotten opt-in means the browser runs its own command *as well
as* ours — `Mod+S` saves the page while the studio downloads a `.motion`, `Mod+P` opens the print
dialog over the canvas. That is silent and reaches the user. A wrong opt-out means we swallow a key
the browser wanted, which shows up immediately as a key that stopped working.

### Measurement
Of the bindings registered in `apps/web/src/components/studio/shortcuts/`, the ones that collide with
a browser default and would need the opt-in: `mod+s`, `mod+o`, `mod+p`, `mod+d`, `mod+f`, `mod+g`,
`mod+,`, `mod+/`, `mod+[`, `mod+]`, `mod+1`…`mod+6`, `mod+0`, `mod+=`, `mod+-`, `mod+shift+p`,
`mod+shift+e`, `mod+a`, `tab`, `space`, `delete`, `backspace` — over half the registry.

### Decision
`useShortcuts` calls `event.preventDefault()` for every shortcut it runs unless the shortcut declares
`preventDefault: false`. The opt-out exists and is used: `tab` walks siblings on the canvas and must
not eat the browser's focus order elsewhere.

### Consequences
- Accepted: the field name now reads as an opt-out while the document's prose read as an opt-in. The
  document is corrected to match in the same commit.
- Accepted: a shortcut that should not swallow its key has to say so, and forgetting is visible on
  the first press.

## ADR-148 — `Mod+Z` in a text field means "let the field undo", not "run our undo"

**Date** 2026-08-16 · **Prompt** 33 · **Status** Accepted

### Question
The text-input guard "only allows `escape`, `mod+enter`, `mod+s`, `mod+z`". Allowed to reach the
registry, or allowed to reach the browser?

### Criterion
SHORTCUTS.md § Testing states the observable outcome: "`Mod+Z` inside a text field does a native
field undo, not a document undo." Whichever reading produces that is the right one.

### Decision
Three keys reach the registry from inside a field — `escape`, `mod+enter`, `mod+s` — because each has
a document-level meaning a typing user still wants. `mod+z` is blocked instead: the guard returns
before matching and, crucially, before `preventDefault`, so the keystroke continues to the field and
the browser undoes the typing.

### Consequences
- Accepted: a user who wants to undo the *document* while the caret sits in a heading field has to
  leave the field first. That is the behaviour of every editor with an inline text field, and the
  alternative loses their typing.
- Accepted: the guard's passthrough list is three keys where the document names four. The fourth is
  handled by not handling it, and the comment above the list says so.

## ADR-149 — Effects are entries in the block registry, and a bad param never takes the node down

**Date** 2026-08-16 · **Prompt** 33 · **Status** Accepted

### Question
`EffectInstance` carries an `EffectId` and a `params` bag; a node carries a `BlockId` and `props`.
Do effects need their own registry, and what happens when `params` do not match the effect's schema?

### Criterion
Two things decide it. First: does anything dispatch on the difference? A second registry is worth its
weight only if effects need lookup, categories, controls or codegen that blocks do not — they need
exactly the same four. Second, for the failure: what does the user see? The node's own props failing
to parse shows an "invalid props" card because the block *is* the content (ADR-104). An effect is
decoration; losing the section because a decoration is misconfigured is a worse outcome than the
decoration looking wrong.

### Decision
Effects are `BlockDefinition`s in `blockRegistry` under `category: 'effects'` — COMPONENT_LIBRARY.md
§ Catalogue already lists them there, and `renderRegistry`'s lazy example already names `particles`.
The brands stay separate because a node holding an `EffectId` is a real mistake, and
`effectBlockId(id)` is the single legal crossing; it revalidates rather than casting.

Params that fail the effect's schema fall back to that effect's `defaults`, and the layer renders.
This is the opposite of ADR-104 for node props and the same as ADR-139 for motion params, for the
reason both give: the resolution happens inside the render of something decorative.

### Consequences
- Accepted: the block palette will list effects among insertable blocks unless it filters the
  category. The palette is prompt 37 and it has to filter, because an effect is not a node.
- Accepted: `check:registry` now demands a thumbnail per effect, which is thirteen more images in the
  generator's run. That is the same gate every block passes and it is the reason the palette can show
  a catalogue without loading thirteen animated layers.
- Accepted: an effect with wrong params looks wrong rather than announcing itself. The inspector's
  stack editor is where a user sees the values that produced it.

## ADR-150 — A binding a surface implements itself is declared, and marked delegated

**Date** 2026-08-16 · **Prompt** 33 · **Status** Accepted

### Question
"Register every shortcut from SHORTCUTS.md. All of them, in this prompt." Roughly a third of that map
is implemented by the component that holds focus: the layers tree walks its rows, a number field
steps its own value, the canvas holds `Space` down to pan. A central `run` cannot do any of those —
each needs state that only exists inside the focused component. So what does the registry hold?

### Criterion
The registry earns its place through three consumers: the palette, the reference sheet, and the
conflict assertion. A binding missing from it is missing from all three — which is exactly how a
later prompt ends up adding an ad-hoc listener, the thing the registry exists to prevent. So the test
is: can every documented key be listed, searched and checked for conflicts, without the registry
pretending to run something it cannot?

### Decision
`Shortcut.delegated?: boolean`. A delegated entry carries id, keys, label, group and scope like any
other; `useShortcuts` matches it — which is how it still shadows a `global` binding on the same
keys — and then stands aside without running anything and without `preventDefault`. The surface named
by `scope` receives the event as it always did.

Twenty-nine entries are delegated: the layers tree's thirteen, the inspector's eleven, the canvas's
`Space` and `Tab`/`Shift+Tab`, `F2`'s focus cycle, and the playground's six, which are reserved for
prompt 49.

### Consequences
- Accepted: the registry can now contain an entry nothing runs, and a typo in its `scope` would be
  invisible. The palette filters delegated entries out for exactly that reason — an item that does
  nothing when clicked is worse than an absent one.
- Accepted: `delegated` is a claim about another file. The test asserting which scopes carry
  delegated entries is what stops it drifting into "not implemented yet".
- Avoided: eighty bindings in the sheet and thirty-one silently missing.

## ADR-151 — Curve editors drag continuously and commit the nearest named curve

**Date** 2026-08-16 · **Prompt** 33 · **Status** Accepted

### Question
Prompt 33: "dragging stiffness redraws the curve *and* re-runs the preview animation. That feedback
loop is the reason this panel exists." But a preset's curve parameters are **names** — `easing:
'standard'`, `spring: 'snappy'` — because `MotionSpec.params` may hold a number, a string or a
boolean (FILE_FORMAT.md) and every preset in the catalogue declares them that way. A continuous drag
produces a curve the document has no field for.

### Criterion
Two properties, both required: the drag has to be continuous, or there is no feedback loop; and the
document has to stay portable, or an export emits four magic numbers where it used to emit a token
and a `.motion` file stops round-tripping through a theme's motion scale.

### Options
1. Widen every preset's schema to accept a raw `[x1,y1,x2,y2]` and a `{mass,stiffness,damping}`. Cost:
   all fifty-one presets, their codegen fragments and the file format. Prompt 32's catalogue and the
   export engine both assume the token.
2. Replace the editors with a select of names. Cost: the feedback loop the prompt names as the
   panel's reason to exist.
3. Drag continuously, snap on commit.

### Decision
Option 3. The editor moves freely and redraws while the pointer is down, and the preview re-runs
because the committed name changes as the drag passes each neighbour's midpoint. What lands in the
document is a name.

### Consequences
- Accepted: the drag is continuous but the *result* is quantised to the eight easings and five
  springs the vocabulary defines, so a user cannot dial an arbitrary curve. Between named neighbours
  the preview does not change, which reads as a curve that snaps.
- Accepted: this is a smaller loop than the prompt describes and it is recorded as such rather than
  reported as done.
- Deferred, and escalated in the session report: raw curve parameters would be a change to the preset
  model, the file format and every printer, and belong in a prompt that owns all three.

## ADR-152 — The keyboard map is a chunk, loaded after hydration

**Date** 2026-08-16 · **Prompt** 33 · **Status** Accepted

### Question
The registry, its ninety entries, the palette entry point and `@motion-studio/hooks` all arrive with
the shell. `/studio` first-load JS is capped at 250 kB gzip (ENGINEERING_CONTRACT.md § 6). Does the
keyboard map fit in the first chunk?

### Criterion (set before measuring)
250 kB gzip, measured off `app-build-manifest.json` rather than from Next's rounded console figure —
the same method prompt 26 established. Under the cap: keep it eager. Over: the cheapest thing to move
is whatever cannot be used before hydration anyway.

### Measurement
- Everything eager: **256.0 kB** — over.
- All thirteen effect components lazy as well: **255.2 kB**. The effects are small; this is not where
  the weight is, and it stays because a document without effects should not carry thirteen of them.
- Shortcut host lazy (`ssr: false`), which takes the registry, both overlays and the hooks package
  with it: **249.5 kB** — under, by 0.5 kB.

### Decision
`ShortcutHost` is a dynamic import mounted by the shell. The map is registered on the frame after
hydration; the palette and the sheet are separate chunks below it and mount only while open.

### Consequences
- Accepted: for the moment between first paint and hydration, no shortcut fires. Nothing else on the
  page responds in that window either — the store is not attached and the canvas has not mounted.
- Accepted: 0.5 kB of headroom is thin. The next prompt to add a first-load import will have to move
  something, which is the budget working rather than failing.
- Accepted: `F2` stays in the shell's own listener (ADR-150) and therefore still works before the
  chunk lands, which is the one binding that has to.

## ADR-153 — The palette's 50 ms budget is met on every open but the first

**Date** 2026-08-16 · **Prompt** 33 · **Status** Accepted

### Question
SHORTCUTS.md § Command palette: "opens in under 50 ms with the item list precomputed and memoised on
`version`". ADR-152 made the palette a chunk to keep `/studio` under 250 kB. What does that cost the
first `Mod+K` of a session, and is it acceptable?

### Criterion (set before measuring)
50 ms from the key press to the first option being in the DOM, measured with a `MutationObserver` on
the production build rather than in dev.

### Measurement (production build, five consecutive opens)
322.2 ms · 11.1 ms · 4.7 ms · 7.7 ms · 8.0 ms.

The first open pays for the chunk and the first build of the 164-item list; every later one is the
memoised path and lands between 4.7 and 11.1 ms. An idle-time prefetch of the chunk was tried and
measured at 325.1 ms for the first open — no change, because the cost is the first render of the list
and the dialog, not the fetch — so it was removed rather than kept as decoration.

### Decision
Accepted as it stands, and reported as two numbers rather than one. The alternative is putting the
palette back in the first chunk, which costs 6 kB of a budget with 0.5 kB of headroom (ADR-152) to
save 300 ms once per session.

### Consequences
- Accepted: the very first `Mod+K` after a page load is visibly slower than every subsequent one.
- Accepted: the number will move when the item sources grow — the layer source alone scales with the
  document. A palette that opens slowly on a 500-node document is a real risk, and the measurement
  above is the baseline it will be compared against.

## ADR-154 — A block's default motion is materialised into the node it creates

**Date** 2026-08-16 · **Prompt** 34 · **Status** Accepted

### Question
`BlockDefinition.defaultMotion` states what a block animates when nobody has chosen anything. Two
places can apply it: the renderer, falling back to it when `node.motion` is empty, or `insertNode`,
copying it into the node it creates. Which one owns it?

### Criterion (set before deciding)
The document is the specification of the page — FILE_FORMAT.md § Export requires a `.motion` file to
describe what it produces without consulting a registry version. The deciding question is therefore
behavioural and checkable: **can the user remove a default entrance?** A renderer fallback makes
`clearMotion` a no-op — the panel deletes the channel, the block hands it straight back, and the only
escape is a `disabled: true` spec the user never asked for. Materialising it makes removal ordinary.

### Decision
`insertOneNode` writes `structuredClone(definition.defaultMotion)` into the new node, exactly as it
already writes `defaults` into `props`. The renderer reads `node.motion` and nothing else.

### Consequences
- Accepted: a document written before this prompt keeps whatever motion it stored, which for every
  existing document is none. Changing a block's default does not reach documents already made — the
  same rule `defaults` has always had for props, and the same trade-off.
- Accepted: `duplicateNodes` and `pasteNodes` already copy `node.motion`, so they need no change.
- Accepted: the fixture generator writes nodes the same way, which is what makes a fixture and a
  hand-built document the same thing.

## ADR-155 — The glass stress fixture measures the surfaces the catalogue actually has

**Date** 2026-08-16 · **Prompt** 34 · **Status** Accepted

### Question
Prompt 34 asks for `stress-glass.motion.json` — "8 glass surfaces" — and a layer count under 40 on
it. Which blocks produce a glass surface today?

### Criterion (set before building)
A glass surface is an element whose computed `backdrop-filter` is not `none`; that is the definition
`useBackdropCount` already counts by, and the reason the cap of 4 exists (DESIGN_SYSTEM.md § Blur and
glass rule 2).

### Measurement
`backdrop-filter` appears **once** in the repository outside the studio chrome: `packages/ui`'s
popover surface. No block and no effect writes it — grep over `packages/blocks/src` returns nothing.
The blocks that will (marketing cards, panels, navigation) arrive with prompts 38–41.

### Decision
The fixture stacks the eight blur-based surface effects the catalogue does have — aurora, mesh
gradient, glow, grain, noise, spotlight, dot grid, grid lines — one per band. The layer count is
measured on that, because compositing layers are what the measurement is about and `filter: blur`
promotes exactly as `backdrop-filter` does.

### Consequences
- Accepted: the cap of four simultaneous glass surfaces is **not** exercised by this fixture. It was
  exercised by hand against the studio chrome in prompt 33 and stays unproven on a document.
- Accepted: when a glass block ships, this fixture is replaced rather than extended, and the layer
  numbers in PERFORMANCE.md are taken again. The generator is one file, so that is one edit.

## ADR-156 — The prompt's default-motion table overrides the per-block reasoning

**Date** 2026-08-16 · **Prompt** 34 · **Status** Accepted (owner)

### Question
Prompt 34 sets `defaultMotion` per block group: `heading`/`text` a 16 px `fade-up`, `image`
`blur-in`, `badge` `scale-in`, `code-block` `fade`. Prompts 25 and 26 shipped those four blocks with
**no** entrance, each with a written reason — "a heading arrives with the band it sits in", "an image
that fades in is an image whose paint the user waits for twice". Both are specifications, and they
disagree.

### Criterion
Not answerable by measurement: it is a question of what the product's default taste is, and both
positions are coherent. Escalated.

### Decision
The owner chose the prompt's table (2026-08-16). Every block in it is filled in accordingly; the
earlier comments are removed rather than left contradicting the code.

### Consequences
- Accepted: a section and the heading inside it now both animate. The distances differ — 24 px for
  the band, 16 px for the line — so the two reads as one movement rather than two, and the 60 ms
  stagger the section carries orders them.
- Accepted: `image` uses the catalogue's only `gpuHeavy` entrance. The scheduler caps those at three
  at once and the rest render their end state, which for an image is the image (ANIMATION_SYSTEM.md
  § GPU discipline).
- Accepted: `rich-text` and `video` are not in the table and keep no entrance. The table is sparse on
  purpose, and adding rows to it is not a decision this prompt is entitled to make.

## ADR-157 — Wiring motion puts `/studio` 0.1 kB over its first-load budget

**Date** 2026-08-16 · **Prompt** 34 · **Status** Accepted, with an escalation

### Question
ENGINEERING_CONTRACT.md § 6 caps `/studio` first-load JS at 250 kB gzip. Prompt 34 fills in
`defaultMotion` for 22 blocks and mounts the motion wrapper. What does that cost, and does it fit?

### Criterion (set before measuring)
250 kB gzip, summed over the page's entries in `app-build-manifest.json` — the method ADR-152
established. Over the cap: move something out of the first chunk. Still over: report the number
rather than round it.

### Measurement (production build, four builds)
- Before this prompt: **249.9 kB**.
- With everything this prompt adds: **250.2 kB**.
- With the fixture loader moved behind a dynamic import (it is test scaffolding and nothing on first
  load needs it): **250.1 kB**.
- With the block defaults reverted and everything else kept: **250.0 kB** — so the 22 `defaultMotion`
  specs are 0.1 kB of it and the wiring is the other 0.2 kB, of which 0.1 kB was recovered.

The definitions are in the first chunk because the store is (ADR-102): `createEditorStore` needs a
registry at construction, the shell needs the store, so every byte of every block definition is a
first-load byte. Data added to a definition therefore always lands here.

### Decision
Accepted at 250.1 kB and escalated rather than resolved by trimming the specs to fit. Trimming a
`duration` to buy 40 bytes is choosing the threshold to match the number — the defect § 9 names.

### Consequences
- Accepted: the studio is 102 bytes over a 256,000-byte budget, and the next prompt that adds a
  block or a definition field will be further over. The structural fix — the registry arriving as a
  chunk rather than as an import of the store — is a change to ADR-102 and belongs to the owner.
- Accepted: the fixture loader is a dynamic import, so `?fixture=` costs one request and no bytes on
  a normal session.

## ADR-158 — Surface effects pause off screen and claim the same cap presets do

**Date** 2026-08-16 · **Prompt** 34 · **Status** Accepted

### Question
PERFORMANCE.md § Motion performance rule 3 says continuous animations pause off screen and on tab
hide. The thirteen surface effects are CSS animations owned by no preset and connected to no
scheduler, so nothing was enforcing it. What does that cost, and what enforces it?

### Criterion (set before measuring)
Two numbers from the measurement pass: main-thread time over five seconds with the tab hidden
(target near zero), and the compositing layer count on `stress-motion-heavy` (target under 40).

### Measurement (production build, Chrome, `stress-motion-heavy`, 101 nodes, 6 effects)
| | Before | After |
| --- | --- | --- |
| Running animations after scrolling past | 37 | 0 |
| Main-thread seconds over 5 s hidden | 0.29 | 0.01 |
| Same, `stress-glass` | 0.17 | 0.01 |
| Peak compositing layers | 71 | 71 |

### Decision
`EffectLayer` subscribes to the scheduler's pooled observer and writes `data-effect-offscreen`;
`effects.css` pauses on it. An effect whose definition declares `costClass: 'heavy'` also registers
in the scheduler's `gpuHeavy` pool, and past the cap of three renders its static composition
(`animation: none`) rather than a paused one — a paused animation still owns its layer.

The seven `will-change` declarations in `effects.css` were removed in the same pass: a looping
composited animation promotes its element for as long as it runs, and the declaration only extended
that to forever.

### Consequences
- Accepted: the layer count did **not** move, because the fixture holds one instance of each effect
  and the cap is three. The 71 is 28 `particles` elements plus the other five effects' own layers —
  a property of the effects, not of how many are running. See the escalation in ADR-159.
- Accepted: an effect outside a scheduler (Storybook, an exported page) runs unconditionally. Export
  emits CSS with no runtime, so there is nothing there to pause it — the reduced-motion media query
  is what an exported page honours.
- Accepted: `EffectLayer` now takes a dependency on `@motion-studio/motion`, which `packages/blocks`
  already declares.

## ADR-159 — 71 compositing layers on a six-effect document, and what it would take to lower it

**Date** 2026-08-16 · **Prompt** 34 · **Status** Escalated

### Question
PERFORMANCE.md § Layer count sets a dev-mode assertion at 40 compositing layers. `stress-motion-heavy`
peaks at 71 while its effects are on screen. Is that a defect to fix, and where?

### Measurement
71 layers, of which the largest single contributor is `particles`: 28 elements, each with its own
`transform` animation, each therefore its own layer. The remaining five effects (aurora's three
fields, mesh, beams, shine, border beam) account for the rest along with the canvas and overlay
layers. Pausing off screen (ADR-158) does not change the peak, because the peak is what is on screen;
the `gpuHeavy` cap does not either, because the fixture holds one of each and the cap is three.

### The options
1. **Redraw `particles` as one layer** — the field as several radial gradients in one background with
   an animated `background-position`. One layer instead of 28, at the cost of every point sharing a
   period, which is what makes the field read as a field.
2. **Lower the default count** from 28 to about 12. Cheap, and it is choosing the visual to fit the
   metric rather than the other way round.
3. **Accept it and scope the assertion**: the 40 is a studio-chrome number; a document that asks for
   a heavy effect gets the layers that effect costs, and the `gpuHeavy` cap of three is what bounds
   the total.

Prompt 26's own note on `particles` — "a canvas would be cheaper per particle and is the wrong trade
here" — was a deliberate choice with a stated reason, so overriding it is the owner's call.

### Recommendation
Option 3, with the assertion counting layers **outside** the effect stack, plus option 1 if the field
ever needs to appear more than twice on one page. Awaiting the owner.

## ADR-160 — What a performance spec asserts, and at which CPU rate

**Date** 2026-08-16 · **Prompt** 34 · **Status** Accepted

### Question
Prompt 34's example spec asserts `p95FrameTime < 20` under 4× CPU throttling. Measured on the
200-node fixture, the real number is 66.7 ms. Is that a defect in the product, in the threshold, or
in the measurement?

### Criterion (set before measuring)
Run the **same document with reduced motion forced** — the same canvas, the same 200 nodes, no
entrance animations — under the same throttling. Whatever that costs is the scene; the difference is
what this prompt's motion costs. A motion layer that costs about as much again as the scene it
animates is acceptable; one that costs several times as much is a defect.

### Measurement (production build, Chrome, 5 s of scrolling)
| | Median | p95 | Worst | Long tasks | TBT |
| --- | --- | --- | --- | --- | --- |
| 200 nodes, 4×, with motion | 16.7 ms | 66.7 ms | 116.7 ms | 14 | 227 ms |
| 200 nodes, 4×, reduced motion | 16.7 ms | 33.3 ms | 50.0 ms | 0 | 0 ms |
| 200 nodes, no throttling | 16.7 ms | 16.8 ms | 16.8 ms | 0 | 0 ms |

The 20 ms in the prompt is unreachable at 4× **with the animations disabled**, so it was never a
threshold about motion. At full speed the fixture is exactly 60 fps.

### Decision
Each perf spec asserts twice:

1. **Unthrottled and strict** — median and p95 under 20 ms, zero long tasks. This is
   ENGINEERING_CONTRACT.md § 6's "60 fps with 200 nodes", stated as a test.
2. **Throttled and loose** — p95 under 90 ms, fewer than 25 long tasks. Derived from the measured
   66.7 ms with room for a noisy runner. It catches a regression of kind — an animation that starts
   triggering layout, a component bypassing the scheduler — not a slow machine.

### Consequences
- Accepted: the throttled thresholds are two-thirds above the measurement, so a 30 % regression
  passes. The unthrottled assertions are what has teeth; the throttled ones exist because a change
  that makes frames three times longer is worth a red build.
- Accepted: the numbers were taken on one machine. The tables in PERFORMANCE.md carry the date and
  the conditions, so the next person can retake them rather than guess what changed.
- Accepted: scrolling in the measurement reverses direction. Scrolling one way ran off the end of the
  document and spent most of its time over an empty artboard, which measured nothing — the first
  version of this harness did exactly that and reported frame times a third lower.

## ADR-161 — A control row's breakpoint marker arrives as a node and a description

**Date** 2026-08-17 · **Prompt** 35 · **Status** Accepted

### Question
`RESPONSIVE_ENGINE.md` § Editing semantics defines **three** row states: overridden at the active
breakpoint (accent dot), inherited from a smaller one (muted dot, naming it), and the base value (no
marker). `ControlRow` in `packages/ui` takes `overriddenAt: string`, draws one dot, and writes both
the dot's `title` and the `sr-only` description itself. Prompt 35's deliverable list puts
`override-indicator.tsx` in the inspector, not in `ui`. Where do the marker's markup and its wording
live?

### Criterion (set before deciding)
The row API is right when a change to the wording of one state touches **one** file, and when the
visible `title` and the assistive description are read from the same value rather than assembled
twice. Count the sites that hold the text under each shape.

### Measurement
| Shape | Sites holding the wording | Sites that can disagree |
| --- | --- | --- |
| `overriddenAt: string` extended to three states | `control-row.tsx` (dot `title`), `control-row.tsx` (`sr-only` span), `control-row-binding.tsx` (which state, which breakpoint label) | 2 — the dot's title and the description are two literals |
| `indicator: ReactNode` + `description: string`, both from `describeOverride()` | `override-indicator.tsx` | 0 — the component receives the same string it is given for the description |

### Decision
`ControlRowProps.overriddenAt` is replaced by two props: `indicator?: ReactNode`, rendered in the
row's existing 8 px dot gutter, and `description?: string`, which the row puts in its `sr-only` span
and wires into the control's `aria-describedby`. The inspector's `override-indicator.tsx` owns
`describeOverride(state)` — the one function that turns an override state into English — and the
dot's colour.

### Consequences
- Accepted: the row can now be handed an indicator with no description, which would be a colour-only
  signal. The inspector is the only caller and passes both from one call; `ControlRow`'s own test
  asserts that the description reaches `aria-describedby`.
- Accepted: `ui` no longer says the word "breakpoint" anywhere in the control row. That is the point
  — `UI_GUIDELINES.md` § Control rows specifies a 4 px dot and nothing about the cascade.
- Avoided: a `state: 'overridden' | 'inherited'` union in `ui`, which would put the responsive model
  in the package that knows least about it.

## ADR-162 — Multi-frame comparison is viewport state

**Date** 2026-08-17 · **Prompt** 35 · **Status** Accepted

### Question
`Mod+Shift+M` toggles the side-by-side comparison of `base`, `md` and `xl`. `STATE_MANAGEMENT.md`
§ Store shape does not list the flag. Which slice holds it — `viewport`, `ui`, or the shell's own
local state, as the panels do (ADR-049)?

### Criterion (set before deciding)
Two tests, both answerable from documents already written. **One**: is it a property of how the
document is being *viewed* (like `grid`, `rulers`, `motionPaused`) or of the *chrome around it* (like
panel widths)? **Two**: does the binding that toggles it need measured geometry, which would put it
behind `hasCanvas` and out of the store?

### Measurement
`viewport` already holds `breakpoint`, `motionPaused` and `rulers` — three flags that change what the
canvas shows without changing the document. Multi-frame changes which breakpoints the canvas draws:
the same class of fact. The binding is a plain flip with no measurement, unlike `fit-document` and
`zoom-to-selection`, the two bindings that carry `when: hasCanvas`.

### Decision
`viewport.multiFrame: boolean`, with `toggleMultiFrame()` beside `toggleRulers()`, and the shortcut
runs off the store. `STATE_MANAGEMENT.md` § ViewportSlice is updated in the same commit as this
entry, before the code.

### Consequences
- Accepted: the flag is not persisted, so a reload returns to the single frame. That matches its cost
  — three live frames is not a state to be restored into unknowingly.
- Accepted: `viewport` is now eight fields. The next addition should be weighed against splitting it.

## ADR-163 — A comparison frame resolves props at its own breakpoint

**Date** 2026-08-17 · **Prompt** 35 · **Status** Accepted

### Question
In the canvas a breakpoint is not a media query: `selectResolvedNode` folds `responsive[bp]` into
`props` for `viewport.breakpoint`, and Tailwind's `md:` prefixes are a codegen concern. Multi-frame
draws `base`, `md` and `xl` at once. What does each frame resolve against?

### Criterion (set before deciding)
The comparison is only worth rendering if the three frames can differ. Take a node with
`responsive.md.columns = 2`: if all three frames read the store's active breakpoint, they draw the
same number of columns at three widths, and the feature shows nothing it claims to show.

### Measurement
`selectResolvedNode(id)` keys on `[state.document.nodes[id], state.viewport.breakpoint]`. Three
frames sharing it produce one resolution — the failure above, by construction.

### Decision
`selectResolvedNode(id, breakpoint?)` takes an optional breakpoint; absent means the store's active
one, which leaves every existing call site unchanged. `NodeRenderer` takes the same optional prop and
passes it to its children. The comparison frames pass theirs; the editing canvas passes none.

### Consequences
- Accepted: one more memoised selector per node per frame — three caches of size one instead of one.
  That is the render cost the feature is off by default for.
- Accepted: `NodeRenderer` threads a prop through the tree. It is one optional argument, and it is
  what makes a frame a frame rather than a copy.

## ADR-164 — The artboard animates its own width; the fit happens after

**Date** 2026-08-17 · **Prompt** 35 · **Status** Accepted

### Question
`RESPONSIVE_ENGINE.md` § Canvas preview: switching breakpoints animates the artboard width over
200 ms so the reflow is legible. The width is a React prop on `Canvas`. Does the host tween it, or
does the artboard transition it in CSS?

### Criterion (set before measuring)
`PERFORMANCE.md` § The core rule: the canvas renders on commit, never per frame. Count canvas renders
per breakpoint switch. One is the commit. Anything per frame is the rule broken.

### Measurement
CSS transition path, measured with the `__canvasRenders` counter the perf tests read (`apps/web`,
jsdom, `setBreakpoint('base' → 'lg')` with the host mounted): **1 render per switch**. A tween in
React state is one render per animation frame by construction — at 200 ms that is roughly 12 renders
of the canvas root, each re-rendering the artboard and its subtree.

### Decision
The artboard carries `transition: width var(--ms-duration-quick) var(--ms-ease-standard)`. The
duration token is the one `UI_GUIDELINES.md` § Timing's 200 ms row already resolves to in
`chrome.css` (panel collapse → `--ms-duration-quick`, 180 ms), and it is zeroed under
`prefers-reduced-motion` and under the studio's reduced preview by ADR-021's `--ms-reduced-motion`
factor, so no component branches on it.

What `artboard-resize.tsx` owns in `apps/web` is the other half of the requirement: once the width
has changed, if the frame no longer fits the viewport, run `fitToRect`. It waits for the transition
to finish before measuring, because fitting to a width that is still travelling fits the wrong rect.

### Consequences
- Accepted: 180 ms rather than the document's 200 ms. Using the token is what keeps motion scale and
  reduced motion working; the alternative is a hard-coded duration that ignores both.
- Accepted: the fit runs after the transition, so a fast sequence of switches fits once, at the end.
  The pending fit is cancelled on each switch.
- Accepted: under reduced motion the transition is 0 s and the fit runs on the next frame — the same
  code path, because the wait is a timer of the token's own length read from the element.

## ADR-165 — The editing-scope hint is tab state, held in a module

**Date** 2026-08-17 · **Prompt** 35 · **Status** Accepted

### Question
The guardrail shows once per session, is dismissible, and fires after three responsive-prop commands
within 30 seconds. Where do the counter and the dismissal live: the store, `localStorage` (as the
inspector's open sections do, ADR-114), or a module in `apps/web`?

### Criterion (set before deciding)
What must survive what. A preference the user set deliberately survives a reload — that is ADR-114's
reasoning for the section state. A hint the user waved away has no such claim: `RESPONSIVE_ENGINE.md`
§ Guardrail says *once per session*, and a session ends when the tab does.

### Measurement
Three candidates against the sentence "shown once per session": `localStorage` outlives the session
and would silence the hint forever after one dismissal; the store outlives nothing but adds a slice
field no selector but the hint reads, and that a document load would have to leave alone; a
module-scoped counter matches the lifetime exactly.

### Decision
`use-responsive-edit.ts` holds the counter and the dismissal in module scope, exports
`recordResponsiveEdit()` for the commit path to call, and exposes a hook the hint subscribes to.
Nothing about it reaches the store or `localStorage`.

### Consequences
- Accepted: module state is not resettable from the UI, so the unit tests need an exported reset. It
  exists and is used by tests only.
- Accepted: two tabs count independently. That is what "session" means here.

## ADR-166 — The artboard is the breakpoint's frame at every breakpoint, `base` included

**Date** 2026-08-17 · **Prompt** 35 · **Status** Accepted

### Question
`CanvasHost` drew `base` at `document.meta.canvas.width` (1440 by default) and every other breakpoint
at its frame. `GLOSSARY.md` and `RESPONSIVE_ENGINE.md` § Canvas preview both say the artboard equals
the active breakpoint's frame, and that `base` renders at 375 px. Which is it, and what is
`meta.canvas.width` then for?

### Criterion (set before deciding)
Resolution #1: the documents answer it. Two of them say the same thing in different words
(`GLOSSARY.md` § Frame: "`base` renders at 375 px"), and no document says the artboard follows
document metadata.

### Decision
The artboard width is `BREAKPOINTS[active].frame` at every breakpoint, so `base` is 375 px and the
mobile-first model is what the editor shows first. `meta.canvas.width` stays what `set-document-meta`
made it — a document setting shown in the inspector's no-selection state — and stops driving the
canvas.

### Consequences
- Accepted: a document authored against a 1440 artboard now opens at 375. That is the behaviour the
  documents describe, and the correction belongs in this prompt rather than being carried further.
- Accepted: `meta.canvas.width` is now edited in the inspector and read by nothing on the canvas. It
  is not removed here — the file format is not this prompt's, and export has not been built yet.

## ADR-167 — Container-query opt-in waits for the blocks it is declared on

**Date** 2026-08-17 · **Prompt** 35 · **Status** Accepted (owner)

### Question
Prompt 35 asks for `capabilities.containerQuery` to be wired for the four blocks
`RESPONSIVE_ENGINE.md` § Container queries names: `feature-grid` cells, `bento-grid` items,
`stat-grid` items, `testimonial-card`. None of the four exists — they arrive with prompts 38 and 41.
Build the mechanism now against no caller, or move it to the prompt that builds the blocks?

### Options put to the owner
1. **Build now**: add the capability to `BlockCapabilities`, wrap opted-in nodes in a
   `container-type: inline-size` element, and test it against a fake block from the schema fixtures.
   Prompt 38 then sets one flag per block.
2. **Defer**: build nothing, and let prompt 38 add the capability with its first real caller.

### Decision
Option 2, decided by the owner on 2026-08-17. Prompt 38 carries the capability, the wrapper, and the
caveat comment about container queries inside a transform-scaled canvas.

### Consequences
- Accepted: prompt 35 closes with one of its Done-when boxes owned by prompt 38, stated in the
  session report rather than silently ticked.
- Avoided: a capability field, a render wrapper and a test whose only subject is a fixture — the
  "abstraction with one speculative caller" the global rules forbid.

## ADR-168 — The comparison frames stop shrinking at two thirds and scroll instead

**Date** 2026-08-17 · **Prompt** 35 · **Status** Accepted

### Question
Multi-frame draws `base` (375), `md` (768) and `xl` (1280) side by side — 2 423 canvas units plus
gaps, against a canvas that is about 600 px wide with both panels open. One scale is applied to all
three (three magnifications would make the comparison meaningless). How small is it allowed to get?

### Criterion (set before measuring)
The view exists to compare layouts, and a layout whose text has stopped being text is not a layout.
The smallest type a block can render is `text-sm` — 12 px, `packages/tokens/src/primitives/type.ts`.
Take 8 px as the floor at which glyph shapes are still distinguishable on screen. The scale may go no
lower than the ratio between them; below it the row scrolls rather than shrinks.

### Measurement (Chrome, production build, `responsive-grid`, both panels open)
Scaling to fit gave `--ms-frame-scale: 0.241`. At that scale 12 px type renders at **2.9 px**, and
the screenshot confirms it: the heading and the paragraph are grey bars. The floor the criterion
gives is 8 / 12 = **0.667**.

### Decision
`MIN_FRAME_SCALE = 2 / 3`. The scale is `clamp(2/3, available / 2423, 1)`, and the row is already an
`overflow-auto` container, so a canvas too narrow to hold three frames at that scale scrolls.

### Consequences
- Accepted: with both panels open the three frames no longer fit at once and the user scrolls or
  collapses a panel. That is the honest trade — the alternative was three unreadable frames that fit.
- Accepted: the floor is a fixed ratio rather than a measurement of the document's own type. A
  document whose smallest text is larger could be scaled further down; reading the rendered type off
  the DOM to decide would make the scale depend on what is on the canvas, which is a worse surprise
  than a fixed floor.

## ADR-169 — The responsive spec runs on Chrome only, for now

**Date** 2026-08-17 · **Prompt** 35 · **Status** Accepted (owner)

### Question
Prompt 35's last Done-when box asks for the responsive E2E spec to pass on three browsers. The
Playwright project list has one entry — the installed Chrome (`channel: 'chrome'`), because prompt 34
deliberately did not download Playwright's own browsers. Firefox and WebKit are roughly 200 MB of
download into the machine's Playwright cache.

### Options put to the owner
1. **Install both** and add two projects: the spec then runs on Chromium, Firefox and WebKit, and
   every future E2E spec runs three times.
2. **Stay on Chrome**: the spec is cross-browser in what it asserts, but only one browser proves it
   here.

### Decision
Option 2, decided by the owner on 2026-08-17. The box stays open, and the cross-browser matrix
belongs to prompt 56, which builds the test harness.

### Consequences
- Accepted: a Firefox- or WebKit-only failure in the breakpoint editing surface would not be caught
  until prompt 56. The spec uses no Chrome-specific API, so the risk is a rendering difference rather
  than a missing feature.
- Accepted: the performance specs would not have moved to three browsers anyway — their numbers are
  Chrome's, per ADR-160.

## ADR-170 — "Keep mine" is a field of the theme config, not builder state

**Date** 2026-08-17 · **Prompt** 36 · **Status** Accepted

### Question
Prompt 36 requires a "keep mine" escape from contrast repair that is "recorded in the config, so
export can emit a comment noting the ratio". `ThemeConfig` as `THEME_ENGINE.md` § ThemeConfig
defined it has nowhere to record it. Where does the choice live?

### Criterion (stated before the change)
The choice has to survive everything the accent itself survives, because it is a property of that
accent: a reload, a `.motion` round-trip, and every export target. Anything that outlives the panel
but not the document fails the first test; anything the export engine cannot read fails the third.

### Decision
A required field, `palette.repairContrast: boolean`, added to `ThemeConfig` in
`THEME_ENGINE.md` § ThemeConfig, defaulting to `true` in the schema. The panel's "keep mine" writes
`false` through the ordinary `setThemeToken` command, so it undoes like every other theme edit.

Required rather than optional, because `setThemeToken` rejects a path that reads as `undefined`
(ADR-053's guard against silent typos) — an optional field would need either a second command or a
hole in that guard. `z.boolean().default(true)` on the input keeps hand-written and older configs
valid, so the schema version does not move.

With repair declined the engine still runs the check: the failing pair comes back in
`ThemeResolution.overrides` instead of `.repairs`. Both halves of `THEME_ENGINE.md` § Contrast
repair then hold — the failing pair is never silent, and the user is never silently overridden.

### Consequences
- Accepted: `ThemeConfig` grows a field, so all ten presets, the schema and the type change with it.
  They are one commit and the schema default keeps old input readable.
- Accepted: `overrides` is a second list the theme builder and the export engine both have to
  render. It is the same `ContrastRepair` shape, so the report renders one list with two tones.
- Rejected: keeping the choice in `localStorage` beside the custom presets. It would not travel with
  the document, so exporting on another machine would silently re-repair the accent — the export
  comment would then describe a colour the file does not contain.

## ADR-171 — The four token-export formats are generated in `packages/theme`

**Date** 2026-08-17 · **Prompt** 36 · **Status** Accepted

### Question
Prompt 36's deliverable list puts `export-tokens-dialog.tsx` in `apps/web`. Do the four format
generators — CSS variables, Tailwind config, JSON, Figma Tokens — live in that dialog, or in
`packages/theme`?

### Criterion (stated before the change)
`ENGINEERING_CONTRACT.md` § 2: nothing depends on `apps/*`. `THEME_ENGINE.md` § Theme in export
requires every export target to emit the resolved theme. So the question is answered by asking
whether a future consumer outside `apps/web` needs the same strings: if it does, generators in the
app are a guaranteed duplication rather than a possible one.

### Decision
`packages/theme/src/export/`, four pure functions over a `ThemeResolution`. `packages/codegen`
(prompts 42–44) has to emit `theme.css`, the `:root` block for HTML and the config for JSON — that
is three of these four formats — and cannot import from `apps/web`. The dialog keeps what is
genuinely the app's: the tabs, the copy button, the download, and the clipboard.

### Consequences
- Accepted: `packages/theme` grows an export surface before the export engine exists to use it. It
  is four functions with tests, and the alternative is writing them twice.
- Accepted: the download and the clipboard stay untested by unit tests — they are DOM APIs the
  dialog calls. The E2E spec covers the dialog end to end instead.

## ADR-172 — The document's theme is applied by a subscription outside React

**Date** 2026-08-17 · **Prompt** 36 · **Status** Accepted

### Question
Until this prompt nothing in `apps/web` applied `document.theme`: `ThemeBoot` wrote `studio-dark`
once at startup, and `applyThemePreset` changed the document without changing a single variable on
screen. What applies the document's theme, and to which element?

### Criterion (stated before the change)
`PRODUCT.md` § 2, Theme: "Changes are live and global" — so the root element, not a canvas wrapper.
`THEME_ENGINE.md` § Rules, 5: a theme change must not trigger a React render, tested with a render
counter on the canvas root.

### Decision
A `ThemeHost` component in the studio that renders nothing and holds one `store.subscribe` on
`state.document.theme`, calling `applyTheme` on the document element when it changes. A Zustand
subscription outside the React tree is the only way to satisfy the second criterion: `useStore` with
a selector would render the subscribing component on every theme edit, and a hue drag would render
it thirty times a second.

`ThemeBoot` keeps the first paint's default and hands over on mount, so the studio never shows the
document's theme one frame late.

### Consequences
- Accepted: the studio chrome is themed by the document's theme, so radius 0 squares the panels as
  well as the blocks. That is what "live and global" says, and it is what makes the demo convincing.
- Accepted: a component that renders `null` and does work in an effect is unusual. It is the same
  shape `ThemeBoot` already had, for the same reason.

## ADR-173 — Applying a saved custom preset is its own command

**Date** 2026-08-17 · **Prompt** 36 · **Status** Accepted

### Question
`applyThemePreset` takes a `PresetId`, which is `keyof typeof PRESETS` — a total lookup over the ten
shipped presets. A custom preset saved to `localStorage` is a `ThemeConfig` with an id that is not
in that union. What applies it?

### Criterion (stated before the change)
Prompt 36 requires that applying a preset is one undo step regardless of how many tokens change.
Both kinds of preset therefore need a single command; the question is whether it is one command or
two.

### Decision
Two commands. `applyThemePreset({ id })` stays exactly as it is — its totality is what makes it free
of an unreachable guard — and `setTheme({ theme })` replaces the config wholesale, validating it
against `themeConfigSchema` because a config read out of `localStorage` is untrusted input. The
custom-preset path uses `setTheme`; the shipped picker uses `applyThemePreset`.

### Consequences
- Accepted: two commands where a widened payload would have been one. The widened payload would have
  made `applyThemePreset`'s label and validation conditional on which half of the union arrived,
  which is the branch this avoids.
- Accepted: `setTheme` can put any valid config into the document, including one whose `id` names no
  preset. That is what a custom preset is.

## ADR-174 — The theme resolution cache is bounded at 128 entries

**Date** 2026-08-17 · **Prompt** 36 · **Status** Accepted

### Question
`resolveTheme` memoises on a hash of the config in an unbounded `Map`. Before the theme builder the
keys were effectively a closed set — ten presets in two modes. A hue slider makes them unbounded: one
new config per frame, each with a hue nobody will ever ask for again. What bounds the cache, and at
what size?

### Criterion (set before measuring)
Two thresholds, because a cache trades memory against work:

1. **Memory.** The cache may hold at most a tenth of the studio's measured heap — 11.3 MB in prompt
   34's five-minute scroll, so 1.1 MB.
2. **Work.** Evicting an entry may not cost a frame: a miss has to resolve in well under the 16.7 ms
   frame budget, or eviction would turn a drag into jank.

### Measurement
On `studio-dark`, `packages/theme` on Node 22:

- A resolution is 141 variables and **6 538 bytes** serialised.
- **300 fresh resolutions in 64 ms** — 0.21 ms each, which is 1.3 % of a frame.

128 entries is 0.83 MB, inside the first threshold with room to spare, and a miss costs 0.21 ms,
inside the second by a factor of eighty. A drag past 128 frames re-resolves its oldest steps at that
price; the ten presets in both modes are 20 entries, so switching presets stays a hit.

### Decision
`CACHE_LIMIT = 128`, oldest-first eviction on insert.

### Consequences
- Accepted: dragging a slider back and forth across more than 128 distinct values re-resolves rather
  than replaying. At 0.21 ms that is invisible, and the alternative is a map that grows all session.
- Accepted: eviction is insertion-ordered, not least-recently-used. LRU would need a touch on every
  read, and the measurement says the miss is cheap enough that the difference does not pay for itself.

## ADR-175 — A theme slider holds a draft while it is dragged

**Date** 2026-08-17 · **Prompt** 36 · **Status** Accepted

### Question
The two-write pattern says a drag writes CSS variables and nothing else until release. The sliders are
Radix sliders controlled by the document's value. Those two statements are in direct conflict: if the
document does not move during the drag, what moves the thumb?

### Criterion (stated before the change)
The control has to end a drag holding the value the pointer left it at, and the canvas has to render
zero times while that happens. Both are measurable, and a design that trades one for the other fails.

### Measurement
Measured in Chrome on the production build, `stress-200-nodes`, a five-second pointer drag of the hue
slider:

- **Without a draft**: the thumb never moved and the commit wrote `0` — the drag was silently lost.
- **With a draft**: the thumb follows the pointer, the release commits the value under it, and a
  separate `next dev` run of the same drag — 141 pointer moves — recorded **0 canvas renders**
  (counter unchanged at 6 before, during and after). Frame timings on the production build: 302
  frames, median 16.7 ms, p95 16.8 ms, worst 16.8 ms, 0 long tasks.

### Decision
`ThemeSliderRow` keeps a `useState` draft: `value={draft ?? props.value}`, set on change, cleared on
commit. The colour picker already worked this way for the same reason.

### Consequences
- Accepted: the row re-renders per frame during its own drag. It is one row of controls with no
  children; the canvas, the blocks and the rest of the panel do not move, which is what the budget in
  `THEME_ENGINE.md` § Rules, 5 measures.
- Accepted: if a command changed the same token from elsewhere mid-drag, the draft would win until
  release. Nothing else can move a theme token while a pointer is down on its slider.

## ADR-176 — The palette has nine categories, and PRODUCT.md listed ten

**Date** 2026-08-17 · **Prompt** 37 · **Status** Accepted

### Question
Prompt 37 asks for "the ten categories from `COMPONENT_LIBRARY.md`". That document's § Catalogue lists
**nine** — Layout, Hero, Content, Marketing, Navigation, Interactive, Data, Forms, Effects — and so does
`BLOCK_CATEGORIES` in `packages/schema`, which is the type every block is validated against.
`PRODUCT.md` § 2 lists ten, with `Feedback` and `Media` and without `Interactive`. Which list does the
chip row come from?

### Criterion
§ 9.1: the answer is already specified, and where two documents disagree the one the code is built
against wins — a category that is not in `BLOCK_CATEGORIES` cannot be the category of any block, so a
chip for it could only ever empty the grid.

### Decision
Nine, read from `BLOCK_CATEGORIES` rather than written out in the panel, and `PRODUCT.md` § 2 is
corrected in the same commit as this entry — the document was wrong, not the schema.

### Consequences
- Accepted: `Feedback` and `Media` blocks, if they are ever wanted, are a change to the schema, the
  catalogue and this list together. Nothing in the palette hard-codes the nine.
- Accepted: chips are shown only for categories the registry has entries in, which today is four of the
  nine. A "Forms 0" chip is a filter whose only effect is to empty the grid.

## ADR-177 — An inserted node is panned into view, not zoomed to

**Date** 2026-08-17 · **Prompt** 37 · **Status** Accepted

### Question
Prompt 37: "the inserted node is **selected** and **scrolled into view** on the canvas". The canvas has
no scrollbars — CANVAS.md § Pan — so "scrolled into view" has to become either a pan or a zoom. Which?

### Criterion
Specification, twice over. The prompt says *scrolled*, and CANVAS.md § Zoom already assigns the zoom
gesture to `Shift+2` ("zoom to selection, padded 64 px, capped at 200 %"). A second, implicit zoom on
every insert would move everything the user is looking at in order to show them one new block.

### Decision
`CanvasHandle.reveal(id)` pans the least amount that brings the node's box inside the viewport, padded
by the `FIT_PADDING` § Zoom already names, and leaves the zoom alone. Already-visible is a no-op. It
reports whether the node was measured at all, because a caller that has just inserted it needs to tell
"already visible" from "not rendered yet" — the palette retries for three frames on the second.

### Consequences
- Accepted: a node inserted far outside the viewport at 10 % zoom arrives on screen very small. That is
  the zoom the user chose; `Shift+2` is how they change it.
- Accepted: `reveal` is a fifth reader on a handle whose comment said "four readers and one command".
  The comment is updated with it.

## ADR-178 — Selected category chips are session state, held in a module

**Date** 2026-08-17 · **Prompt** 37 · **Status** Accepted

### Question
Prompt 37: "selected filters persist for the session". Where does that state live — the document, the
store, `localStorage`, or component state?

### Criterion
The three questions ADR-114 and ADR-132 were decided by: does it export, does it belong to another
session, and does losing it lose work? A filter exports nothing, belongs to this tab only, and costs one
click to redo.

### Decision
A module-level set with a `useSyncExternalStore` subscription, exactly as ADR-165 holds the
editing-scope hint. Not the document (it changes nothing that exports), not `localStorage` (a filter
still applied tomorrow reads as an empty catalogue), and not component state (the tab unmounts when
another tab is selected, which is not the end of the session).

### Consequences
- Accepted: a reload clears the filter. That is what "for the session" means.
- Accepted: the tests reset it explicitly, because module state outlives a test file's `beforeEach`.

## ADR-179 — The drag layer moves to the shell, and `/studio` is 282 kB

**Date** 2026-08-17 · **Prompt** 37 · **Status** Accepted, on the owner's call · Supersedes ADR-137

### Question
ADR-137 mounted `DndProvider` inside the lazy Layers panel and said it would move up "in the prompt that
gives the studio a second drag surface". Prompt 37 is that prompt. Moving it up puts the drag layer in
the initial chunk of a route whose budget is already at its limit. Move it, or keep the palette inside
its own context and leave the canvas undroppable?

### Criterion
ENGINEERING_CONTRACT.md § 6: `/studio` first-load JS ≤ 250 kB gzip, summed over the page's entries in
`app-build-manifest.json` (the method of ADR-152). A cross-surface drag cannot work from two contexts,
so measurement alone cannot settle this — the cost is measured and the trade is the owner's.

### Measurement (production builds, one method throughout)
| Build | `/studio` first load |
| --- | --- |
| `HEAD` before this prompt | **257.8 kB** |
| plus the palette, the canvas drop zones, `reveal` | 257.8 kB |
| plus `ToastProvider` in the shell | 262.3 kB (+4.5) |
| plus `DndHost` in the shell | **282.1 kB** (+19.8) |

The palette costs the initial chunk nothing: it is a `next/dynamic` chunk, like the four tabs beside it.
The drag layer is 19.8 kB and the toast queue 4.5 kB. ADR-157 recorded 250.1 kB by a slightly narrower
sum; the four numbers above are measured the same way as each other, so the **+24.3 kB** is the figure
that means anything.

### Decision
Escalated with the numbers; the owner chose to move the provider to the shell and to wire the canvas as
a drop target, accepting the overrun. `DndHost` now wraps `ms-studio`, and `ToastProvider` wraps the
shell — a rejected insert has to be able to say why from any surface, and the command palette will want
the same queue.

### Consequences
- Accepted: `/studio` is 32.1 kB over a budget the contract calls enforced. The structural fix is still
  ADR-157's: the block registry arriving as a chunk rather than as an import of the store.
- Accepted: operation 1 of DRAG_AND_DROP.md § The four operations now works by pointer and by keyboard.
  Operations 2 and 4 still need a canvas node to be a drag source.
- Avoided: two drag contexts, which cannot hand a drag from one to the other at all.

## ADR-180 — A grid row states its set size with `aria-rowcount`, not `aria-setsize`

**Date** 2026-08-17 · **Prompt** 37 · **Status** Accepted

### Question
Prompt 37's test list asks for "grid `role`/`aria` attributes, including virtualized `aria-setsize`". The
palette is a `role="grid"` (ACCESSIBILITY.md § Block palette). Do its rows carry `aria-setsize`?

### Criterion
ENGINEERING_CONTRACT.md § 1.7 makes accessibility a build gate and `jest-axe` is what runs it. An
attribute axe rejects is not an accessibility improvement.

### Measurement
With `aria-setsize` / `aria-posinset` on each row, axe fails every row with `aria-conditional-attr`:
"These attributes are supported with treegrid rows, but not grid". With `aria-rowcount` on the grid and
`aria-rowindex` on each row, axe passes and the same fact is stated — eighteen rows exist, this is the
first of them.

### Decision
`aria-rowcount` + `aria-rowindex`. `aria-setsize` is the `listbox` form of the statement and belongs to
the command palette (ACCESSIBILITY.md § Command palette), which is a real listbox.

### Consequences
- Accepted: the prompt's wording is not followed literally. The property it asks for — a screen reader
  learning that the rendered window is a window — is delivered, and a test asserts the absence of
  `aria-setsize` so it does not get "fixed" back.

## ADR-181 — A drop zone states which surface drew it

**Date** 2026-08-17 · **Prompt** 37 · **Status** Accepted

### Question
With the canvas a drop target and the layers tree already one, two surfaces register a zone for the
**same node id**: the tree's rect is the strip of ADR-133, the canvas's is the node's own box. The
collision detector asks one `DragRectSource` for "the rect of node N". Which of the two answers?

### Criterion
The resolver has to read the geometry of the surface being pointed at, and a node id alone cannot say
which that is. Any scheme that guesses — DOM ancestry, mount order, one cache winning — is a second
answer to a question that has one right answer.

### Decision
`DropZone` carries `surface: 'canvas' | 'tree'`, `dropZoneId` includes it (two droppables under one id
would leave dnd-kit holding whichever mounted last), and the provider's `rects` prop becomes a
`ZoneRectSource` — `get(zone)` rather than `get(id)`. `DndHost` routes: tree zones to `layerRects`,
canvas zones to the canvas rect cache through `CanvasHandle.nodeRect`. `resolveDropTarget` keeps taking
a `DragRectSource`, because by then the host has already chosen the surface.

### Consequences
- Accepted: a sixth field on a value that crosses the dnd-kit `data` boundary, so `dropZone()` validates
  it and rejects an unknown surface — a zone with a bad surface is a zone with no geometry.
- Accepted: the keyboard step is per surface too (one row in the tree, one grid cell × zoom on the
  canvas), so `DndHost` remembers the surface of the last resolution and answers `gridSize` / `zoom`
  from it.
- Accepted: `NodeWrapper` takes a `dropRef`, so a zone's element is the node's own box. The alternatives
  were an absolutely-positioned overlay per node — which needs a positioned ancestor the wrapper does
  not have — or an extra wrapper element around every block on the canvas.

## ADR-182 — The hover clip is reconstructed, not recorded, and is byte-identical

**Date** 2026-08-17 · **Prompt** 37 · **Status** Accepted, on the owner's call · Closes the M4 carry-over of ADR-125

### Question
ADR-125 shipped the still thumbnails and left the animated hover clip out: a recorded WebM carries
timestamps a real-time encoder produces, so it cannot be byte-identical between runs, and the output is
committed. Prompt 37 needs the clip. The owner chose the ffmpeg route over generating clips at release
time. What makes a clip deterministic, and what is a clip of?

### Criterion (set before measuring)
Two properties, both checkable:
1. **Byte-identical across two runs** — the same requirement `--verify` already enforces on the stills,
   and the reason a recording was rejected in the first place.
2. **The frames inside one run differ** — a clip whose forty frames are the same image is a still with
   a video container around it, and would be worse than no clip.

### Measurement
Frames first, on `hero-aurora` (three running animations), six frames, two runs:

| Approach | Frames alive in a run | Identical across runs |
| --- | --- | --- |
| `Emulation.setVirtualTimePolicy`, advancing a budget per frame | 6 of 6 | **no** |
| Same, with the clock paused before navigation | 6 of 6 | **no** |
| Animations paused, `currentTime` set per frame | 6 of 6 | **no** — 5 of 6 frames matched |
| Same, plus `animation.ready` and two `requestAnimationFrame`s before the capture | 6 of 6 | **yes** |

Virtual time fails because a CSS animation's phase is measured from the moment it started, and that
moment depends on how much of the budget the load consumed. `currentTime` pins the phase itself; the two
frames of wait are what stops a capture from landing on the phase before it.

Then the container, with the frames now fixed. libvpx-vp9, one thread, no row threading, muxed
`-fflags +bitexact -flags:v +bitexact`: two runs produced files of **identical length differing in
exactly 16 bytes** — `TrackUID` (`0x73C5`) in the track entry and `TagTrackUID` (`0x63C5`) in the tags,
8 bytes each, filled by ffmpeg with random data. Overwriting both with the first 8 bytes of
`sha256(blockId-mode)` makes two runs identical: `hero-aurora-dark.webm`, hash `395B07A7B0C3`, twice.

What a clip is of, measured rather than listed: the generator asks the page
`document.getAnimations().filter(a => a.playState === 'running').length` and skips the block when it is
zero. **Nine blocks of thirty-five animate** — `hero-aurora`, `hero-terminal`, `aurora-background`,
`mesh-gradient`, `grain-overlay`, `beams`, `border-beam`, `shine`, `particles`. Two seconds at 20 fps,
320 × 200, `crf 36`: about 6.4 kB per clip.

### Decision
The clip is **reconstructed frame by frame**, not recorded: animations paused and stepped by
`currentTime`, one PNG per phase, encoded with libvpx-vp9 through `ffmpeg-static`, and the container's
random ids replaced with a digest. `--verify` covers the clips exactly as it covers the stills, and
`check:registry` requires that a block with a clip has one in both modes and that both are on disk.

`ffmpeg-static` is a root devDependency and a new entry in `onlyBuiltDependencies` — without the latter
pnpm skips its postinstall and the module resolves to a path with no binary at it.

### Consequences
- Accepted: an 82.8 MB binary in `node_modules` for a script CI never runs. It is a cost the author
  pays, like the Chrome the generator already needs.
- Accepted: the clip shows a *reconstruction*. A block animating on a timeline the Web Animations API
  does not own — a `rAF` loop, a canvas — would come out still. Nothing in the catalogue does today, and
  the generator reports which blocks it wrote a clip for, so a silent still would be visible.
- Accepted: the palette mounts the clip on hover and unmounts it on leave, so browsing costs one request
  per card hovered and nothing at all under a reduced-motion preference.
- Accepted: `particles` has forty running animations and its clip is the most expensive to generate. It
  is still six kilobytes on disk.
- Accepted: eighteen clips are 115 kB of committed binary, and the manifest grows by one entry per
  animated block. `/studio` first load ends the prompt at **282.4 kB** — the clips are files the
  palette's lazy chunk names, not bytes it ships.
- Accepted: regenerating rewrote twelve stills of the animated blocks by a handful of bytes each. The
  pictures are the same (compared side by side); the encoder landed differently now that each block is
  visited twice per mode. `--verify` passes on the new set, which is the property that matters: 89 files
  identical across two full runs.

## ADR-183 — Cached rects are converted to the current transform, and re-read at drag start

**Date** 2026-08-17 · **Prompt** 37 · **Status** Accepted

### Question
The first pointer drop from the palette landed one position away from where the indicator promised. Why,
and what makes the geometry the resolver reads trustworthy?

### Criterion
The indicator and the drop are the same computation over the same numbers, so they cannot disagree. Any
answer that leaves them disagreeing under some condition is not a fix.

### Measurement (Chrome, `next dev`, a section with two headings)
- The heading's DOM rect was `y = 112`; the canvas rect cache held `y = 136`. **24 px**, stable for the
  rest of the session, and it moved the drop from index 2 to index 1.
- The cache re-measures on a document version change and on a `ResizeObserver` callback. The heading had
  neither: its entrance preset *moved* it after the first measurement, and a move is not a resize. Proof
  by the same measurement after an unrelated edit to the document — cache `y = 112`, DOM `y = 112`.
- A first attempt, re-measuring on `animationend` / `transitionend` on the wrapper, changed nothing: the
  catalogue's entrance presets animate through the motion engine, which fires neither event there. It was
  removed rather than left in unverified.
- Auto-pan then showed a second fault: `edgeSpeed` reads a point beyond an edge as full speed, so a drag
  that starts on a palette card — outside the canvas — panned the scene 240 px before it arrived, and the
  drop landed on nothing ("not over a valid target").

### Decision
Three things, all measured:
1. `CanvasHandle.nodeRect` converts a cached rect out of the transform it was measured under (ADR-091)
   and into the current one, so a pan mid-drag does not stale every rect.
2. `CanvasHandle.remeasure()` drops the cache and reads it again; the canvas host calls it when a drag
   starts, which is the moment the rects begin to matter.
3. Auto-pan runs only while the pointer is inside the canvas box.

After all three: the indicator sat on the bottom edge of the second heading and the drop landed at index
2 — `[heading, heading, section]`, matching the announcement "position 3 of 3".

### Consequences
- Accepted: a node that animates in still holds a stale rect until something asks for a pass, so a
  selection outline drawn inside that window is off by the animation's distance. Same root cause, wider
  fix than this prompt owns — reported rather than quietly patched.
- Accepted: `remeasure` reads layout for every observed node in one pass at drag start. 200 nodes, one
  batched read, which is what the cache does on every document edit already.

## ADR-184 — Container queries are the block's own wrapper, not the canvas's

**Date** 2026-08-17 · **Prompt** 38 · **Status** Accepted · Closes the carry-over of ADR-167

### Question
ADR-167 deferred `capabilities.containerQuery` to this prompt, with "the capability, the wrapper, and
the caveat comment". Where does the `container-type: inline-size` element live — in `NodeWrapper`, which
already surrounds every node on the canvas, or inside the block that opted in?

### Criterion
COMPONENT_LIBRARY.md § Rules 1 and the export honesty property it protects: the same component runs in
the canvas and in the user's app. A containment element the canvas draws exists in the preview and not
in the export, so a cell that reads `@md:` inside the studio would read nothing after export. Whichever
option keeps one element in both is the correct one; there is nothing to measure.

### Decision
The block draws it. `feature-grid`, `bento-grid` and `testimonial-card` put `@container` on the element
that owns a cell's width, and their contents step at `@sm:` / `@md:`. `capabilities.containerQuery` is a
declaration for the inspector and the responsive panel to read, not an instruction to the renderer.

### Consequences
- Accepted: the caveat ADR-167 named is real and stays. A `@container` measures the *untransformed*
  inline size, so a cell 320 px wide at zoom 0.5 answers the query for 320 and not for 160. That is the
  behaviour the exported page has, and the preview is the surface that is slightly wrong — stated in
  `RESPONSIVE_ENGINE.md` § Container queries and in the capability's own doc comment.
- Accepted: a block that wants container behaviour has to spend an element on it, which is one more
  `div` in the export than a viewport-sized block emits.
- Rejected: `NodeWrapper` growing a `containerQuery` branch. It would be one flag in one place and it
  would make the preview and the export disagree, which is the one thing this registry is built not to
  do.

## ADR-185 — A block that cannot finish its own story says so in the codegen descriptor

**Date** 2026-08-17 · **Prompt** 38 · **Status** Accepted

### Question
Two of the twelve marketing blocks carry something that belongs in the *export* and not in the canvas.
`newsletter-form` has a submit handler that is deliberately a no-op, and prompt 38 requires the generated
code to say where the user plugs theirs in. `faq-accordion` has an optional `FAQPage` JSON-LD emission
that prompt 38 requires to be generated in codegen and **not** rendered in the canvas. Neither has
anywhere to live: `CodegenDescriptor` carries a tag, imports, dependencies and passthrough props.

### Criterion
The descriptor is the registry's only channel to the printers (EXPORT_ENGINE.md § buildIR reads it off
the definition), and the printers arrive in prompts 42–44. So the question is whether either fact can be
derived by a printer from what is already there. A handler being a no-op is not visible in props — the
default is a function, and the schema has no function. A JSON-LD block is not derivable either: nothing
in the props says "this shape is a FAQPage". Both are facts the block knows and nothing else can infer,
which is what the descriptor is for.

### Decision
Two additive fields, each with one caller today and a printer contract stated now:

- `notes?: readonly string[]` — comments the printers emit above the element, verbatim.
- `structuredData?: { type: 'FAQPage'; enabledBy: string }` — `enabledBy` names the boolean prop that
  turns it on, so the export follows the user's answer instead of emitting it for everybody.

### Consequences
- Accepted: two fields nothing reads until prompt 43. They are data on a definition rather than
  behaviour, the meta-test checks them like the rest of the descriptor, and the alternative — a printer
  in prompt 43 growing a list of block ids it knows by name — is the drift this registry exists to avoid.
- Accepted: `structuredData.type` is a single-member union today. A second type widens it, and a printer
  that switches on it fails to compile until it handles the new one, which is the failure mode worth
  having.
- Accepted: the canvas renders no JSON-LD at all, so a user cannot preview it. It is invisible markup
  either way; the export report (EXPORT_ENGINE.md § Warnings) is where it becomes visible.

## ADR-186 — The marquee blocks lay out their own track, from the preset's own stylesheet

**Date** 2026-08-17 · **Prompt** 38 · **Status** Accepted

### Question
Prompt 38 requires `testimonial-marquee` and `logo-cloud` to use the `marquee` preset rather than a
local implementation, and requires `testimonial-marquee` to run **several rows in alternating
directions**. A motion channel animates the wrapper `NodeMotion` puts around a node, and a node has
exactly one wrapper — so `defaultMotion: { scroll: marquee }` can move the whole block in one direction
and nothing else. How does the block get three rows going two ways without a second implementation?

### Criterion
"One implementation" is checkable: the keyframes, the track's layout rule and the pause-on-hover rule
must exist as **one text** in the repository. Anything that copies those three declarations into a
second file is the drift the prompt names, no matter how it is spelled.

### Decision
`marquee.ts` in `packages/motion` exports what it already had inside its `resolve`:
`MARQUEE_CLASS`, `MARQUEE_PAUSABLE_CLASS`, `MARQUEE_CSS` and `marqueeCssVars(params)`. `resolve` and
`codegen` now emit those constants, and the two blocks render a track per row carrying the same class,
the same custom properties and one `<style>` holding the same `MARQUEE_CSS` — the same thing `CssMotion`
does for a node, in the one place where the row rather than the node is the animated element.

Content narrower than the container is handled without measuring anything. `marqueeTrack(contentWidth,
containerWidth)` — exported since prompt 32 — answers the copy count from two widths, and a block is not
allowed to read either (COMPONENT_LIBRARY.md § Rules 1: no `window` in render). The CSS equivalent is one
declaration: each row holds **two** copies, each `min-w-full`, so a copy is never narrower than the
container and the −50 % translate always travels exactly one copy. `marqueeTrack` stays for a caller that
does have the widths — the export report and the canvas both do.

### Consequences
- Accepted: two blocks ship a `<style>` element, which the export carries into the user's project
  verbatim. That is what `blocks.css` already does for the aurora, for the reason stated there: a
  stylesheet fragment is the one form that survives every export target unchanged.
- Accepted: the rows animate without the motion channel, so a user cannot retune their duration from the
  Motion panel — it is a prop of the block instead (`speed`), and the block declares no `scroll` channel
  so the panel does not offer one it cannot honour.
- Accepted: `blocks.css` owns two things the preset does not — the edge mask, which belongs to the row
  and not to the animation, and the reduced-motion fallback that turns the track into a wrapping grid.
  A `width: max-content` flex row with its animation switched off would simply overflow with half its
  content unreachable, which is worse than no marquee.

## ADR-187 — The marketing blocks load eagerly, because lazy buys nothing

**Date** 2026-08-17 · **Prompt** 38 · **Status** Accepted

### Question
Twelve blocks arrived. `/studio` first-load JS is capped at 250 kB gzip and has been over it since
ADR-179 (282.4 kB, on the owner's call). Prompt 26 moved two of nine content blocks into `lazy` and
bought 6 kB. Which of these twelve should be dynamic?

### Criterion (set before measuring)
Measured off `app-build-manifest.json`, the method of ADR-152. A block moves to `lazy` if doing so takes
at least **5 kB** off `/studio` — enough to be worth a Suspense skeleton and a request per node, and well
clear of the 0.1 kB noise floor the earlier measurements showed.

### Measurement
- All twelve eager: **286.7 kB**
- `faq-accordion` lazy — the one block with an external dependency (`@radix-ui/react-accordion`):
  **286.7 kB**, a difference of zero
- All twelve lazy: **286.9 kB** — 0.2 kB *worse*, which is the twelve `lazy` wrappers themselves

### Decision
All twelve stay eager. The components were never in the first chunk: the 4.3 kB these blocks added to
`/studio` (282.4 → 286.7) is their **metadata** — schemas, defaults, control descriptors — which the store
fixes at creation time (ADR-102), and an import boundary around a component cannot move it.

### Consequences
- Accepted: `/studio` is now **286.7 kB** against a 250 kB budget. The overage predates this prompt
  (ADR-179) and this prompt adds 4.3 kB of it. Escalated again in the session report, with the only two
  levers that would actually work: a registry the store loads by category on demand, or a metadata format
  the definitions are compiled into. Both are their own prompt.
- Accepted: a document is 12 blocks richer at no runtime cost — a marketing block a user has not placed
  costs nothing but its metadata either way.
- Rejected: moving blocks to `lazy` "because the content category did". The measurement is what
  distinguishes the two cases, and the number here is zero.

## ADR-188 — What the side-by-side against the reference changed

**Date** 2026-08-17 · **Prompt** 38 · **Status** Accepted

### Question
Prompt 38 requires the assembled page to be compared with [impeccable.style](https://impeccable.style)
and the verdict reported, fixing **defaults** where the comparison finds something. What did it find, and
which of it is a defect rather than a difference in character?

### Criterion
A finding only changes code if it is checkable: a rule in `docs/`, a measurement, or a stated typographic
fact. Anything that is only "the reference does it differently" is reported as a difference and left alone —
ADR-144 already established that this reference is a design-vocabulary tool rather than a component gallery,
so matching its look is not the goal; meeting its standard of finish is.

### What changed, and why each one is checkable
1. **Section headings take `text-display-2`.** DESIGN_SYSTEM.md § Typography assigns that token to "Fluid
   section" in as many words, and the blocks were using `text-3xl md:text-4xl` — capping at 48 px where the
   token gives `clamp(2rem, 4.5vw, 3.5rem)`. Specified, and the code contradicted it.
2. **Body copy moved onto the right step of our scale.** § Typography puts `sm` at 12 px, `base` at 14 and
   `md` at 16, and calls 16 "page body"; a feature cell was rendering its sentence at 12 px because
   `text-sm` reads as 14 px in stock Tailwind and 12 px here. Eight places corrected — feature cells, plan
   descriptions and feature lists, the matrix, the attribution rows, the form's label, note and message.
3. **The CTA band's gradient starts at `accent`, not `accent-hover`.** In dark mode the accent ramp runs
   *lighter* for interaction states, so hover → active is violet 300 → 200: 86 % → 92.5 % lightness at 0.068
   and 0.036 chroma, which paints a pastel rectangle with no visible gradient. `accent` is violet 400 at
   0.156 chroma, so the pair spans 70 % → 92.5 %. Every stop is still on the ramp
   `packages/tokens/semantic/contrast.test.ts` proves `foreground-onAccent` against.
4. **The secondary button on an accent band takes a 10 % tint.** Transparent beside a filled primary, it
   read as unstyled text rather than as the second of two choices.
5. **The "Most popular" badge is centred on the top edge** rather than inset from the right, over a card
   whose content is centred.
6. **The highlighted plan gets `bg-surface-2`.** Paint only — the geometry that decides its neighbours'
   height is untouched, which the measurement below confirms.
7. **Cards in a marquee row are the same height, with the attribution on the bottom edge.** `mt-auto` on the
   caption and a `grid` wrapper; `flex` was tried first and collapsed the card to 50 px, because a flex item
   sizes to its content on the main axis and the main axis here had to stay at 20rem.

### Measurements taken during the pass (prod build, Chrome 1440 × 900 unless stated)
- Pricing highlight: sibling heights **437 / 437 / 437 px** highlighted and unhighlighted — the assertion
  prompt 38 asks for, made where layout actually exists.
- Nested radius: media plate 16 px holding its image 8 px in → image **8 px**; toggle plate 12 px holding a
  button 4 px in → button **8 px**. Both are `innerRadius` spent through `innerRadiusClass`.
- Reduced motion: live animations **9 → 0**, both marquee tracks `animation-name: none`, `flex-wrap: wrap`,
  track width equal to its row (1232 px), edge mask off, all 15 testimonials visible.
- 360 / 768 / 1440: `scrollWidth === clientWidth` at all three. Comparison table at 360 scrolls inside
  itself (640 → 310 px) with the first column pinned at 1 px through a 220 px scroll.
- Container query: the same testimonial card at 320 px sets its quote at 18 px and at 900 px at **22 px**.
- Section rhythm: 128 px of vertical padding on the eight content sections, 64 px on the logo row and the two
  CTA bands — the two densities the `padding` prop names.

### The verdict, stated
Against the reference the blocks hold on finish: surface values, hairline borders, concentric corners,
tabular numerals, one accent used consistently, and a reduced-motion path that leaves a composition rather
than a gap. They differ in **character** in three ways, all of them traceable to our own documents rather
than to an oversight:
- the reference sets its headlines at weight 100–200; DESIGN_SYSTEM.md § Typography allows 400–700 and
  states why ("No 300 — it fails contrast at small sizes on dark surfaces"), so the document wins;
- the reference left-aligns almost everything, while our section header defaults to centred. `headingAlign`
  is a prop and a per-document choice, so this is the user's to make rather than ours to fix;
- the reference varies its section padding (113 / 112 / 120 / 158 px measured); ours has two stated
  densities. Variation without a rule is what makes a page look assembled from parts, so this stays.

### Consequences
- Accepted: the type-scale correction touched eight files after the blocks were written and tested. The
  underlying trap is worth stating: **`text-sm` means 12 px here and 14 px in stock Tailwind**, so a habit
  imported from other projects renders a size smaller than intended everywhere.
- Accepted: the dark-mode CTA band is a *light* rectangle on a dark page, because in dark mode
  `foreground-onAccent` is near-black and accent surfaces have to be light to carry it. That is the design
  system being consistent, not the band being wrong.

## ADR-189 — Four more Radix primitives are the blocks package's own dependency

**Date** 2026-08-18 · **Prompt** 39 · **Status** Accepted

### Question
`navbar` needs a dropdown and a mobile drawer, `sidebar-nav` a group disclosure, `breadcrumbs` an
overflow menu. Should those be hand-rolled, imported through `@motion-studio/ui`, or declared as
`packages/blocks` dependencies the way `@radix-ui/react-accordion` already is?

### Criterion (set before deciding)
TECH_STACK.md § Radix UI already answered the shape of this question for Accordion: a primitive a
**block** uses travels into the user's project through the codegen descriptor, so it has to be the
block package's dependency — a block importing it through `@motion-studio/ui` would export code that
does not compile outside this repository. The remaining question is per primitive: does the block
need behaviour that a hand-rolled version would get wrong, where "wrong" means a keyboard or focus
requirement in ACCESSIBILITY.md § Dialogs / § Non-negotiables rather than an amount of code?

### Measurement
What each one supplies that the requirement names, checked against the requirement:

| Primitive | Requirement it satisfies | Hand-rolled failure it prevents |
| --- | --- | --- |
| Navigation Menu | `aria-expanded`, arrow keys along the bar, `Esc`, outside click | Every one of the four, individually |
| Dialog | Focus trapped, `Esc` closes, focus restored to the trigger | Focus restore, which needs the trigger held across an unmount |
| Collapsible | `aria-expanded` and the closed panel out of the tab order | A panel hidden by a class stays tabbable |
| Dropdown Menu | Named trigger, arrow keys, `Esc`, focus restore | The same list as Dialog, plus item roving focus |

Installed weight, from `pnpm why` on the resolved tree: all four were already in the lockfile through
`@motion-studio/ui` except `@radix-ui/react-navigation-menu`, so the lockfile grew by one package and
`node_modules` by one symlink into an existing store entry.

### Decision
All four are declared in `packages/blocks/package.json` and carried in each block's
`codegen.dependencies`, so the emitted `package.json` installs them. TECH_STACK.md § Radix UI now
carries the table above rather than the sentence claiming Accordion is the only one.

### Consequences
- Accepted: four packages a `blocks` consumer installs whether or not they place a navigation block.
  Tree-shaking removes the code, not the install.
- Accepted: `navbar` alone declares two of them, which makes it the most expensive export in the
  registry to `npm install`. The alternative is a navbar whose menu does not work with a keyboard.
- Avoided: four hand-rolled keyboard models, and the version of this session that debugs focus restore.

### Alternatives rejected
- Hand-rolling: the failures column above is the reason, and prompt 39 names the primitives outright.
- Importing through `@motion-studio/ui`: produces an export that does not compile — the same reason
  ADR-107 and TECH_STACK.md § Radix UI already give for Accordion.

## ADR-190 — A glyph-only control labels itself in CSS, not with Radix Tooltip

**Date** 2026-08-18 · **Prompt** 39 · **Status** Accepted

### Question
`sidebar-nav`'s collapsed rail and `dock`'s items are glyphs. Both need a visible label beside the
glyph. Radix Tooltip is the primitive the studio chrome uses for this. Should the blocks use it?

### Criterion (set before deciding)
Two conditions, both stated before looking at either option. The label must appear on **focus** as
well as on hover — ACCESSIBILITY.md § Non-negotiables 10 — and the block must work in the export
without the user adding anything to their application root, because COMPONENT_LIBRARY.md § Rules 1
says a block is a pure function of its props and cannot install a provider.

### Measurement
Radix Tooltip fails the second condition outright: `Tooltip.Root` throws without a `Tooltip.Provider`
above it, and the provider belongs to an application root a block does not own. It would satisfy the
first.

A `<span>` inside the control, hidden by default and shown by `group-hover/nav` and
`group-focus-visible/nav`, satisfies both. The accessible name is a separate `sr-only` label on the
same control, so the visible tag is `aria-hidden` and nothing is disclosed by hover — the name is
present whether or not the tag is.

### Decision
`NAV_TOOLTIP` in `navigation.styles.ts`: the mechanism once, the placement at each call site — to the
right of a rail item, above a dock item. No Radix Tooltip in `packages/blocks`. TECH_STACK.md § Radix
UI says so explicitly, so the next block does not have to rediscover it.

### Consequences
- Accepted: no collision detection. A rail against the right edge of the viewport would push its label
  off screen; the rail is a left-hand column, so the case does not arise today, and a dock's label is
  centred above an item that is never at the top of the viewport.
- Accepted: no delay. Radix's `delayDuration` prevents a label flashing as the pointer crosses a row;
  a CSS tooltip appears at once. On a 40 px target that reads as responsive rather than as noise.
- Avoided: a provider requirement in the exported code, which the user would meet by reading an error.

### Alternatives rejected
- `title` attribute: does not appear on focus, cannot be styled, and its timing belongs to the browser.
- Radix Tooltip with a provider rendered by the block: two blocks on one page would render two
  providers, and a block that mounts application-level context is not a pure function of its props.

## ADR-191 — The scrolled state is a data attribute written from the shared scroll bus

**Date** 2026-08-18 · **Prompt** 39 · **Status** Accepted

### Question
`navbar` gains its glass once the page has scrolled and `navbar-floating` shrinks past 80 px. Prompt 39
says to drive both from the shared scroll bus by writing CSS variables. Variables, or something else?

### Criterion (set before deciding)
COMPONENT_LIBRARY.md § Rules 3: Tailwind classes only, and inline styles are for "genuinely dynamic
values, which go through CSS variables". So the test is whether the value is genuinely dynamic. If the
state has a fixed, small number of values, § Rules 3 says it is a class; if it is a continuum, it is a
variable. Whichever it is, § Rules 1 and the state rule in the contract's § 5 both hold: no React state.

### Measurement
The scrolled state has exactly two values. Written as variables it would take three of them —
padding, background and shadow — each an arbitrary-value class reading a variable, and the transition
would have to be declared on the properties rather than taken from `NAV_TRANSITION`. Written as
`data-scrolled` it is one attribute and four existing Tailwind variants
(`data-[scrolled=true]:border-border`, `:bg-surface-0/80`, `:shadow-sm`, `:backdrop-blur-xl`), with
the transition already tokenised.

Renders per scroll frame, measured the way the dock's are (ADR-195): zero either way — the hook writes
the DOM directly and never touches state.

### Decision
`useScrolled(ref, threshold)` writes `data-scrolled` from `scheduler.onScroll`, and the classes react
to it. The one thing a class genuinely cannot express — the floating pill's scrolled background, which
has to compose with the theme's own glass recipe rather than replace it — is a single rule in
`blocks.css` (`.ms-nav-glass[data-scrolled='true']`).

With no scheduler above the block, nothing subscribes and the bar keeps its unscrolled treatment. That
is the spotlight effect's answer to the same question, and it is a finished composition rather than a
broken one: a bar over the top of a hero is *supposed* to be transparent.

### Consequences
- Accepted: a page reloaded mid-scroll shows the unscrolled bar until the first scroll event. The bus
  reports on change, not on subscribe, and reading `window.scrollY` instead would be wrong in the
  studio, where the scrolling context is the canvas viewport rather than the window.
- Accepted: this deviates from prompt 39's wording. The deviation is recorded here rather than made
  silently, and § Rules 3 is the criterion it was decided by.
- Accepted: a story or an export with no `MotionSchedulerProvider` never reaches the scrolled state.
  The stories mount one, which is also how `spotlight.stories.tsx` handles it.

### Alternatives rejected
- CSS variables for the three properties: three arbitrary-value classes and a hand-written transition
  list, for a state with two values.
- React state on a throttled scroll listener: a render per frame on a component that wraps the page's
  navigation, and the contract's § 5 forbids it in as many words.

## ADR-192 — The navbar renders the page's skip link

**Date** 2026-08-18 · **Prompt** 39 · **Status** Accepted

### Question
Prompt 39 says the navbar "declares itself the first landmark, so the exported page's skip link jumps
past it". Where does that skip link come from? Nothing else in the registry is the page.

### Criterion (set before deciding)
ACCESSIBILITY.md § Landing, gallery, docs requires a skip link on a content page. A skip link only
works if it precedes every other focusable element. So the block that renders it must be the first
block on the page, and the only block that can promise that is the one whose whole purpose is to be
first.

### Decision
`navbar` renders it as its own first child: an `<a>` to `skipLinkTarget` (default `#main`), `sr-only`
until focused. Two props control it — `skipLink` to turn it off for a page that already has one, and
`skipLinkTarget` for a page whose main content has another id. The codegen note says the target has to
exist, because a skip link that lands nowhere is worse than none.

The link is *inside* the `<nav>` rather than before it, and that is forced: the block's root element is
the landmark the export prints, and prompt 39's own test asks for exactly one landmark per block. A
`<header>` wrapper would make it two.

### Consequences
- Accepted: a screen-reader user navigating by landmark finds "Skip to content" inside the navigation
  landmark. It is the first thing in it, so it is found before the links it skips.
- Accepted: a page with two navbars would render two skip links. The second is a duplicate id target
  rather than a broken link, and `skipLink` is the switch that turns it off.
- Accepted: `navbar-floating` does not render one. It can be a page's first block, and a page built
  from it needs the link from somewhere else. Recorded rather than solved, because a skip link on a
  detached pill would have to place itself against a viewport the block does not own.

### Alternatives rejected
- A `<header>` root holding the skip link and a `<nav>`: two landmarks, which contradicts the
  category's own test and would make the export print a `banner` the user did not ask for.
- Leaving it to the export's page template: prompt 43's printers do not exist yet, and a requirement
  deferred to an unwritten file is the banned fourth way wearing a schedule.

## ADR-193 — The footer's social links carry our own glyphs and a derived name

**Date** 2026-08-18 · **Prompt** 39 · **Status** Accepted

### Question
`footer` ships a row of social links. Prompt 39 requires icon links with real accessible names —
"Motion Studio on GitHub", not "GitHub". A brand mark is the obvious glyph. Do we add brand marks to
`packages/icons`?

### Criterion (set before deciding)
Two rules already written down. DESIGN_SYSTEM.md § Iconography defines the icon contract: a 20 × 20
grid, 1.5 px stroke, `currentColor`, round caps, **no fill**. And ACCESSIBILITY.md § Non-negotiables 2
is what the requirement actually is about: every interactive element has an accessible name.

### Measurement
Every recognisable brand mark — the GitHub silhouette, the X monogram, the YouTube tile — is a filled
shape. Redrawing one as a 1.5 px open stroke does not produce a quieter version of the mark; it
produces a different glyph that no longer identifies the brand, which is the whole reason a brand mark
would have been used. So the icon contract and a brand mark are mutually exclusive, not a trade-off.

The accessible-name requirement, meanwhile, is satisfied entirely by the name: `socialAccessibleName`
builds `"${brand} on ${network}"` from the brand label and the network, and the glyph is `aria-hidden`.

### Decision
No brand marks. `socialSchema` carries `network`, `href` and an `icon` name from our own set (default
`external-link`), and the accessible name is **derived** rather than authored — there is no `name`
field, so no document can ship the short version the prompt forbids. `footer.test.tsx` iterates every
social link and asserts the derived name, that it is not the bare network name, and that it contains
the brand.

### Consequences
- Accepted: the default footer's social row is three of our own glyphs rather than three recognised
  marks. It reads as a set of links rather than as a set of logos, and a user who wants the logos can
  place their own image — the icon control lists what we have.
- Accepted: a user cannot phrase the name themselves ("Follow us on X"). The name they would have
  written badly is the one the prompt calls out as the commonest footer defect, so the schema does not
  offer the field.
- Avoided: reproducing third-party marks from memory into a repository read as a portfolio artifact,
  and the licence question DESIGN_REFERENCES.md § The licence check would have opened.

### Alternatives rejected
- Adding filled brand glyphs: contradicts DESIGN_SYSTEM.md § Iconography, which would have had to be
  changed first, and the change would have been "except for brand marks" — an exception with no rule
  behind it.
- Text links instead of icon links: satisfies accessibility and ignores the prompt's actual ask.

## ADR-194 — `structuredData.type` becomes a union

**Date** 2026-08-18 · **Prompt** 39 · **Status** Accepted

### Question
`breadcrumbs` emits `BreadcrumbList` JSON-LD in the export. `CodegenDescriptor.structuredData.type`
was the literal `'FAQPage'`, written for the one block that needed it (ADR-185).

### Criterion (set before deciding)
The contract's § 9.1: the answer is in `docs/`, or the document changes first. COMPONENT_LIBRARY.md
§ BlockDefinition documents the field as `'FAQPage'`, so the document is what has to change, in its own
commit, before the code. The shape of the change is decided by what a printer needs: a printer writes
one JSON-LD shape per type, so it has to know which shapes exist. A `string` would let a block ask for
a shape no printer implements.

### Decision
`STRUCTURED_DATA_TYPES = ['FAQPage', 'BreadcrumbList']` and
`StructuredDataType = (typeof STRUCTURED_DATA_TYPES)[number]` in
`packages/schema/src/registry/registry.types.ts`, exported from the barrel. COMPONENT_LIBRARY.md
§ BlockDefinition carries the union and names both blocks. `breadcrumbs` declares
`{ type: 'BreadcrumbList', enabledBy: 'jsonLd' }` and renders no `<script>` in the canvas, which its
test asserts — the same rule ADR-185 set for the FAQ.

### Consequences
- Accepted: every new structured-data type is a change in two places, `packages/schema` and the printer
  that writes it. That is the point: an unimplemented type fails to compile rather than emitting nothing.
- Accepted: prompts 43 and 44 inherit two shapes to print instead of one.
- Avoided: `type: string`, under which a typo produces an export that silently omits the markup.

### Alternatives rejected
- A second optional field (`breadcrumbList?: boolean`): two fields for one concept, and the third type
  would need a third field.
- Leaving the type as `'FAQPage'` and having `breadcrumbs` emit through `notes`: a comment where a
  contract belongs.

## ADR-195 — The dock's magnification is one custom property per item, measured once

**Date** 2026-08-18 · **Prompt** 39 · **Status** Accepted

### Question
`dock` scales each item by its distance from the cursor. Prompt 39 requires zero React renders on
cursor move, and asks for it to be tested. How is the geometry read, and how does the keyboard get the
same affordance?

### Criterion (set before measuring)
Two thresholds, both set before any of it was written. **Renders on pointer move: zero** — measured
with a React `Profiler` around the block, comparing commit count before and after a sweep across the
row. **Layout reads per frame: one** — a dock of eight items reading its own rect eight times a frame
is the shape that turns a cheap effect into a forced-reflow loop.

### Measurement
`dock.test.tsx`, jsdom with the row's real geometry installed on the prototype (12 px tray padding,
44 px items, 8 px gaps):

- a sweep of six pointer moves across the row, one per item: commit count **unchanged** (the mount's
  commits, then none) while `--ms-dock-pointer` on the last item reached the configured peak of 1.55;
- layout reads per frame: **one** — the tray's own rect. The item centres are measured once, on
  subscribe;
- the swell is exactly 1 beyond `reach` rather than nearly 1, and `smoothstep` rather than linear:
  at half the reach the scale is halfway up the peak, and at a quarter it is past three quarters —
  which is the difference between a wave and a triangle with an apex.

The centres survive the swell because `blocks.css` scales each item about `bottom center`, and a scale
about the horizontal centre does not move the horizontal centre. That is what makes a one-time
measurement correct rather than merely cheap.

### Decision
`useDockMagnify` subscribes to `scheduler.onPointerMove`, measures the item centres once as offsets
inside the tray, and writes `--ms-dock-pointer` per item per frame. `blocks.css` computes

```css
scale: calc(1 + (var(--ms-dock-pointer) * var(--ms-dock-key) - 1) * var(--ms-reduced-motion, 1));
```

so three things follow from one declaration: the keyboard's swell is `--ms-dock-key`, set by
`:focus-visible` to the same `--ms-dock-magnification` the pointer peaks at; the two compose instead of
fighting over one variable; and reduced motion switches **both** off through `--ms-reduced-motion`,
which is 0 from the media query *and* from the studio's own preview override (ADR-075). A check inside
the hook would have covered only the media query.

The magnification is deliberately not a motion channel: a channel animates the node's wrapper, and the
wrapper is the tray, so a hover preset would swell all six glyphs together.

### Consequences
- Accepted: an item whose width changes without a re-render — a font swap inside the tray — leaves the
  centres stale until the effect re-runs. The effect's deps include the item count, so adding or
  removing an item re-measures; a font swap does not.
- Accepted: the swell is invisible without a `MotionSchedulerProvider`, and the tray is then a still row
  of glyphs. Hover and focus still change the surface and the ring, so the row is not inert.
- Accepted: `pointer-bus` schedules its flush with `requestAnimationFrame`, and a *synchronous*
  scheduler injected in its place would leave a stale frame handle and drop every move after the first.
  The dock's test therefore delivers frames asynchronously, the way a browser does. Reported rather than
  changed — it is `packages/motion`'s to decide, and with a real `requestAnimationFrame` it cannot occur.

### Alternatives rejected
- A rect per item per frame: eight forced layout reads a frame, against a stated threshold of one.
- React state holding the scale per item: a render per frame on a component with six children, and the
  contract's § 5 forbids it outright.
- A `hover` motion channel: swells the tray, not the item under the cursor.

## ADR-196 — The navigation blocks load eagerly, and the 6.1 kB is metadata

**Date** 2026-08-18 · **Prompt** 39 · **Status** Accepted

### Question
Six blocks arrived, two of them carrying Radix primitives (`navbar` carries two). `/studio` first-load
JS is capped at 250 kB gzip (ENGINEERING_CONTRACT.md § 6) and has been over it since ADR-179, at
286.7 kB after prompt 38. Which of the six should be dynamic?

### Criterion (set before measuring)
ADR-187's criterion, unchanged so the two categories are comparable: measured off
`app-build-manifest.json` (the method of ADR-152), a block moves to `lazy` if doing so takes at least
**5 kB** off `/studio` — enough to be worth a Suspense skeleton and a request per node, and clear of the
0.1 kB noise floor the earlier measurements showed.

### Measurement
Baseline, before this prompt: **286.7 kB** (ADR-187).

- All six eager: **292.8 kB**
- `navbar` lazy — the one block that pulls two Radix primitives into its module graph: **292.8 kB**, a
  difference of zero
- All six lazy: **292.9 kB** — 0.1 kB *worse*, which is the six `lazy` wrappers themselves

The first-load set stays at eight files in all three, which is the same finding stated a different way:
none of these components was in it.

### Decision
All six stay eager. The 6.1 kB this prompt adds (286.7 → 292.8) is their **metadata** — schemas,
defaults, control descriptors and a11y notes, which the store fixes at creation time (ADR-102) — and no
import boundary around a component can move it. Two of these blocks have the largest control trees in
the registry so far (`footer` nests a list inside a list; `navbar` nests one inside another), which is
where most of the 6.1 kB is.

### Consequences
- Accepted: `/studio` is now **292.8 kB** against a 250 kB budget, 42.8 kB over. The overage predates
  this prompt (ADR-179, on the owner's call) and this prompt adds 6.1 kB of it. Escalated again in the
  session report, with the same two levers that would actually work — a registry the store loads by
  category on demand, or a metadata format the definitions compile into. Both are their own prompt, and
  the trend is now three prompts long, so it is worth scheduling rather than noting.
- Accepted: the four Radix primitives are in a shared chunk whether or not a document uses a navigation
  block. They are small; the measurement above is what says so rather than an assumption.
- Rejected: moving blocks to `lazy` "because the numbers are close to the budget". They are, and doing
  it would not help — that is what the zero is.

## ADR-197 — The blur placeholder is downscaled from the still, not screenshotted a second time

**Date** 2026-08-18 · **Prompt** 39 · **Status** Accepted

### Question
`dock` is the first block whose glass tray is small and centred, and it broke
`pnpm generate:thumbnails --verify`: two full runs produced different bytes in `thumbnails.json`. The
320 px stills were byte-identical in both runs; only the dock's **dark blur placeholder** differed.
Fix the block, or fix the generator?

### Criterion (set before measuring)
ADR-125 makes byte-identity across runs a property of this generator, not a nicety — the output is
committed, so a generator that churned would be worse than none. So the question is which change makes
`--verify` pass **for any block**, rather than for this one. A block-level workaround is only correct if
the block is doing something a block should not do.

### Measurement
Four full runs, dock's dark placeholder, base64 length: **751 → 747 → 747 → 751**. Random, not a
warm-up. Generated alone, the same block was stable at 747 across three runs — so the churn needed a
full run to appear, which is what an alternating rasterisation looks like.

The cause, isolated by experiment rather than by reading:

- dock's `scale` declaration removed, glass kept: **still churned**;
- `ms-glass` replaced by an opaque `bg-surface-2`, `scale` kept: **stable at 759 across three full runs**.

So it is the `backdrop-filter`. `capture()` took two screenshots of the same page — one at scale
0.25 (320 px) and one at scale 0.00625 (8 px) — and each is an independent rasterisation. A page with a
`backdrop-filter` on it does not rasterise identically twice at the second scale; at the first it does.

After deriving the placeholder from the still instead: the manifest's SHA-1 is **identical across two
full runs** (`974ab471…`), `--verify` reports "identical across two runs (129 files)", and
`check:registry` passes on 53 blocks.

### Decision
`capture()` takes **one** screenshot. The placeholder is produced from it, in the page: the still is
decoded into an `Image`, drawn into an 8 × 5 canvas with high-quality smoothing, and re-encoded as WebP
at the same quality. A placeholder derived from the still cannot disagree with the still, which is what
a placeholder is for.

The dock keeps its glass. It is the treatment a dock has, `requiresBackdrop` says so, and the block was
not doing anything a block should not do — it was the first one to expose a hole in the generator.

### Consequences
- Accepted: every blur placeholder in the manifest changed once, all 53 blocks, in the same commit as
  the six new ones. They are visually equivalent — an 8 × 5 blur of the same image — and slightly
  smaller, because a downscale of a compressed still carries less high-frequency detail than a fresh
  rasterisation at 8 px.
- Accepted: the placeholder now inherits the still's WebP compression before being downscaled. At
  8 × 5 that is unmeasurable, and the placeholder's whole job is to be a colour field.
- Gained: one screenshot per block per mode instead of two, so a full run does 106 fewer rasterisations.
- Accepted: the next block with a `backdrop-filter` cannot reintroduce this, because there is no second
  rasterisation left to disagree with the first.

### Alternatives rejected
- Opaque dock tray: makes `--verify` pass by removing the feature that exposed the bug, and leaves the
  next glass block to rediscover it.
- `--disable-gpu` on the Chrome launch: might have worked, and "might" is the problem — it would have
  been a flag chosen by hope, and it would have changed the rasterisation of all 106 stills as well.
- Screenshotting twice and keeping the second: two rasterisations still disagree; this would only have
  chosen a different one of them.

## ADR-198 — What the side-by-side and the keyboard pass changed in the navigation category

**Date** 2026-08-18 · **Prompt** 39 · **Status** Accepted

### Question
The six blocks pass their tests. Do they hold up when looked at and driven from a keyboard, and against
the finish DESIGN_REFERENCES.md sets?

### Method
Chrome over CDP against the Storybook build: every block at 360 / 768 / 1440 in both colour modes, every
keyboard path driven with real key events rather than programmatic focus, and the accessibility tree read
back with `Accessibility.getFullAXTree` — which is the name a screen reader is handed, though not a screen
reader itself. That distinction is stated rather than glossed: no NVDA or VoiceOver pass was run.

### What changed, and why each one is checkable
1. **Group headings take `foreground-muted`, not `foreground-subtle`.** The contrast contract asserts
   `subtle` at 3:1 as a **UI** pair. Measured against `surface-0`: **4.82:1 dark, 4.10:1 light** — under
   the 4.5:1 ACCESSIBILITY.md § Non-negotiables 9 requires of text, and a 12 px uppercase heading is text.
   `muted` measures **7.73 / 6.68**. The footer's copyright line moved for the same reason.
2. **A plain sidebar group's heading gets the 12 px inset the disclosure's trigger already gave its own.**
   Measured at 1440 before the change: plain heading text at x = 12, collapsible heading text at x = 24,
   item glyphs at x = 24 — the plain heading was the only thing out of line, and the screenshot hid it
   because the heading *box* starts at 12 in both cases.

### Measurements taken during the pass (Chrome, dark mode unless stated)
- **360 / 768 / 1440, both modes, all six blocks:** `scrollWidth === clientWidth` at every width. No
  block overflows at 360.
- **navbar sticky:** at the top of the page the bar is fully transparent — background `rgba(0,0,0,0)`,
  `backdrop-filter: none`, border transparent, no shadow. Scrolled: `oklab(0.095 … / 0.8)`,
  `blur(24px)`, border `oklch(0.27 0.012 265)`, shadow present. The "glass over the top of a hero" case
  the prompt names does not arise.
- **navbar-floating:** padding **8 px → 4 px** and background alpha **0.04 → 0.472** between unscrolled
  and scrolled, blur unchanged at `blur(8px) saturate(1.4)` — the theme's own recipe either way.
- **navbar drawer at 390 px, keyboard only:** tab order Skip to content → brand → "Open menu". `Enter`
  opens it, focus lands on "Close menu" **inside** the sheet, focus stayed inside across 15 further tabs,
  `Escape` closed it and returned focus to the trigger with `aria-expanded` back to `false`.
- **navbar dropdown at 1440, keyboard only:** `Enter` sets `aria-expanded="true"` and opens the panel,
  `ArrowDown` moves into its first link, `Escape` closes it and returns focus to the trigger.
- **sidebar group, keyboard only:** `Space` toggles `aria-expanded` true → false and the focusable link
  count drops **10 → 6** — the closed panel leaves the tab order rather than merely hiding.
- **breadcrumbs overflow, keyboard only:** the trigger announces "Show 3 hidden levels", `Enter` opens
  three items, `ArrowDown` moves between them, `Escape` closes and returns focus.
- **dock, keyboard only:** after a real `ArrowRight`, the focused item settles at `scale: 1.55` — the same
  peak the pointer produces — and the item it left returns to `1`. Programmatic `.focus()` does not
  qualify as `:focus-visible` in a headless page, which is why the measurement used a key event.
- **Reduced motion, all six:** **0** running animations. The only non-zero transition duration left on
  any page is `0.2s` on Storybook's own `.sb-loader`; every duration inside the blocks collapses, because
  each is a token and the tokens are `calc(… * var(--ms-reduced-motion))`. The dock's focused item is
  `scale: 1` under reduced motion while its background still moves to `surface-3` and the focus ring is
  still drawn — a state change without a movement.
- **Footer, tab order and announced names:** brand → "Motion Studio on GitHub" → "Motion Studio on X" →
  "Motion Studio on YouTube" → the four Product links → the three Docs links → the two Company links →
  Privacy, Terms. Every social link is named after where it goes.
- **Rail, as the accessibility tree reads it:** `navigation "Documentation"`, then
  `group "Getting started"`, `group "Blocks"`, `group "Export"`, each with a heading of the same name, and
  every link named ("Overview", "Install", "First document", …). The labels survive the rail; the visible
  tag beside the glyph is `aria-hidden`.

### The verdict, stated
The category holds on finish: one accent used consistently, hairlines rather than heavy borders, the
theme's own glass recipe rather than a blur each block picked, an active state carried by weight and a
mark rather than by colour, and a reduced-motion path that leaves a composition rather than a gap.

Two differences from the reference are deliberate and traceable to our own documents:
- the footer's social row is our own glyphs rather than brand marks, because DESIGN_SYSTEM.md
  § Iconography forbids the filled shape a brand mark is — ADR-193, and it is the one place the category
  reads plainer than the reference;
- the dock's peak magnification is 1.55 where the reference dock goes further. Past 2 the row stops
  swelling and starts jumping, and 1.55 is the value the schema defaults to rather than caps at.

### Consequences
- Accepted: **`foreground-subtle` is used as a text colour in two dozen places across the catalogue**
  (captions, quote roles, code line numbers, the hero trust row, the comparison hint) and the contrast
  contract only proves it at 3:1. Measured at 4.10:1 in light mode, those are all under AA for text.
  This prompt corrected its own two and left the rest: the real fix is either moving the token into
  `TEXT_PAIRS` and lightening it, or changing two dozen call sites, and both are a decision for the owner
  rather than a side effect of a navigation prompt. Escalated in the session report.
- Accepted: `hero-video`'s light thumbnail churned once during a `--verify` run after ADR-197 landed and
  did not reproduce in the run before it. It is a `<video>` poster race in a block from prompt 25, not
  something this category touches, and the committed bytes were left as they were. Reported rather than
  chased.

## ADR-199 — The `'use client'` condition is data on the descriptor, and an absent one is an error

**Date** 2026-08-18 · **Prompt** 40 · **Status** Accepted

### Question
Prompt 40 requires every interactive block to declare when its React export needs `'use client'`, for
prompt 42's printer to consume. `CodegenDescriptor` has no such field. What shape does the declaration
take, and what does the printer do for a block that does not carry one?

### Criterion (set before deciding)
Three conditions, all from documents that already exist:

1. The printer must decide from the descriptor and the node's props alone. EXPORT_ENGINE.md § buildIR
   runs under `node` and never renders a component, so nothing may require executing the block.
2. The declaration must be checkable by the registry meta-tests the way `structuredData.enabledBy`
   already is — a condition naming a prop the schema does not have has to fail the build.
3. It must be able to say **never** without lying. EXPORT_ENGINE.md § React lists "`'use client'` only
   when hooks or interactivity require it", so a block that declared `always` to be safe would cost the
   reader a Server Component for nothing.

### Measurement
The nine interactive blocks, against the rule in EXPORT_ENGINE.md § React:

| Blocks | Directive | Why |
| --- | --- | --- |
| `button-group`, `tabs`, `accordion`, `modal-trigger`, `tooltip-target`, `theme-toggle` | always | Each holds state or reads the DOM at every prop set |
| `button`, `command-menu-preview` | never | No hook at any prop set; both print as markup and CSS |
| `carousel` | conditional | With `arrows`, `dots` and `autoplay` all off it is a scroll-snap strip: no handler, no hook |

So three cases are needed and the third is a set of boolean prop names — the shape `enabledBy` already
uses. A predicate function would satisfy condition 1 and fail condition 2: a test cannot ask a closure
which props it read, and a wrong closure would pass every gate in the repository.

### Decision
`CodegenDescriptor.client?: ClientBoundary`, a union of `{ kind: 'always' }`, `{ kind: 'never' }` and
`{ kind: 'whenAnyProp', props }`, each carrying a `reason` the printer may emit as a comment. The nine
interactive blocks declare it and `interactive.codegen.test.ts` asserts every prop named by a
`whenAnyProp` exists in that block's schema.

**Absent is not `never`.** The field is optional because the other 53 descriptors have not been audited
for it, and auditing them means reading 53 components — prompt 40 does not own them. The printer's rule
for an undeclared block is therefore to **fail**, not to assume: an export that quietly omitted a needed
directive would produce a page that throws in the browser rather than a diagnosable error at export time.
EXPORT_ENGINE.md § React says so, so prompt 42 does not have to invent it.

### Consequences
- Accepted: prompt 42 starts against a registry where one category in seven declares the field, so its
  first task is either to declare the rest or to emit the error. Named in the session report rather than
  left for it to discover.
- Accepted: `whenAnyProp` reads truthiness, so a prop whose *false* value is the interactive one cannot
  be expressed. No block in the catalogue has one; the union can gain a case when one does.
- Avoided: a silent default. The two defaults available were both wrong in one direction — `never` breaks
  the user's page, `always` breaks their Server Components.

### Alternatives rejected
- A predicate `(props) => boolean` on the descriptor: expressive, unverifiable, fails criterion 2.
- Deriving it from `imports` — "a Radix import means client": `@radix-ui/react-slot` does not, and the
  derivation would be a second rule to keep in sync with the first.
- Making the field required and inserting a value into all 53 existing descriptors: mechanical to write
  and impossible to make honest in this session, because a correct value for `hero-video` or `code-block`
  needs its component read.

## ADR-200 — `setColorMode` joins the theme engine rather than living in the block

**Date** 2026-08-18 · **Prompt** 40 · **Status** Accepted

### Question
`theme-toggle` is the one block prompt 40 allows to touch application state: it "calls the theme engine's
`setColorMode`". No such function exists. `packages/theme` exports `storedColorMode`, `storeColorMode`,
`COLOR_MODE_SCRIPT` and `applyTheme`, and switching the mode today means writing `data-color-mode` and
the storage key in the right order. Where does the missing function go?

### Criterion (set before deciding)
THEME_ENGINE.md § Colour mode already specifies the mechanism completely: `data-color-mode` on the root,
a stored preference the inline script reads before first paint, and no attribute at all when the
preference is `system` so the stylesheet's `prefers-color-scheme` block decides (ADR-026). The question is
therefore not *what* to do but *who owns the sequence*. One rule decides it: § 2 of the contract puts the
runtime theme engine in `packages/theme`, and a block is a pure function of its props.

### Measurement
Three writes are needed for `light` and `dark` (attribute, storage) and two clears for `system`
(attribute removed, key removed). Written in the block, that is five statements a second caller would
transcribe — and there is already a second caller in the repository: the studio's own mode toggle goes
through the document's theme instead, which is why the sequence has never been written down.

### Decision
`setColorMode(preference, options?)` in `packages/theme/src/apply/set-color-mode.ts`, exported from the
barrel, with `clearColorMode()` beside `storeColorMode` for the `system` case. It returns the
`ColorMode` now in effect, so a caller that wants to draw the state does not repeat the `system`
resolution. THEME_ENGINE.md § Colour mode gains the two lines that say so.

### Consequences
- Accepted: `packages/blocks` gains a dependency on `@motion-studio/theme`. The contract's § 2 allows it
  and no cycle is possible — `theme` depends on `tokens` and `utils` only.
- Accepted: a `theme-toggle` clicked **in the canvas** switches the studio's own colour mode, because it
  writes the same root attribute the export writes. That is the block behaving identically in both
  places, which is the property that makes the export honest, and the studio's own theme host re-asserts
  its value on the next theme change.
- Avoided: two implementations of the same five statements, one of which would have been in a block and
  would have drifted from the inline script it has to match.

### Alternatives rejected
- The block writing the attribute itself: puts the mechanism in the one place that cannot be reused, and
  makes the block the second author of a contract the theme package owns.
- `applyTheme` with a mode override: resolves and writes the whole variable set to switch one attribute,
  and needs a `ThemeConfig` the block does not have.

## ADR-201 — The exported `theme-toggle` carries its own runtime module

**Date** 2026-08-18 · **Prompt** 40 · **Status** Accepted

### Question
The exported `theme-toggle` has to work in the user's project, which has no `@motion-studio/theme` in it.
Prompt 40 requires the export to emit "a self-contained implementation using `localStorage` +
a `data-color-mode` attribute, matching what the theme engine's inline script expects". How does the
descriptor say that, given that `imports` and `dependencies` can only name packages the user installs?

### Criterion (set before deciding)
Two conditions. The emitted code must contain no import the emitted `package.json` does not install —
EXPORT_ENGINE.md § Next.js already emits a `lib/` directory, so a local module is a shape the target
supports. And the claim must be **testable in this package**: a comment promising the export is
self-contained is exactly the kind of assertion the contract's § 9 rules out.

### Measurement
The block's own component is 31 lines of markup over one call to `setColorMode`. The part that cannot
travel is that call: twelve statements, `localStorage` and one attribute, no dependency. Written as a
string on the descriptor it can be asserted against the real storage key — `theme-toggle.codegen.test.ts`
imports `COLOR_MODE_STORAGE_KEY` from `@motion-studio/theme` and fails if the emitted source does not
contain it, so the export and the inline script cannot drift.

### Decision
`CodegenDescriptor.runtimeModule?: { path, named, source }` — a module the printer writes beside the
component, and the names the component imports from it. `theme-toggle` is its only user today: it emits
`lib/color-mode.ts` with `setColorMode`, `storedColorMode` and `COLOR_MODE_SCRIPT`, and its `imports`
entry points at that path rather than at a package.

### Consequences
- Accepted: a source string lives in a descriptor. It is the one place the emitted code is not derived
  from the markup, and the test above is what keeps it true.
- Accepted: two exported blocks that both wanted the module would emit it twice unless prompt 42
  de-duplicates by `path`. Stated here so it is a requirement rather than a surprise.
- Avoided: publishing a package for twelve statements, and a toggle that silently does nothing in the
  user's project — which is what an export that dropped the call would produce.

### Alternatives rejected
- `dependencies: { '@motion-studio/theme': '…' }`: the package is `private: true` and workspace-only.
- Inlining the twelve statements into the component: the printers would have to special-case one block's
  body, and the same code would be duplicated per instance on a page with two toggles.

## ADR-202 — `tooltip-target` owns its trigger, because the description has to be on the focused element

**Date** 2026-08-18 · **Prompt** 40 · **Status** Accepted

### Question
Prompt 40 describes `tooltip-target` as "any child + tooltip content". Taken literally the child is the
element the tooltip describes, which means the block would have to put `aria-describedby` on a node
another block rendered. Does the block wrap a child, or render its own trigger?

### Criterion (set before deciding)
ACCESSIBILITY.md § Non-negotiables 2 requires the accessible description to reach the element that takes
focus. `aria-describedby` is only read on the element carrying it, so the criterion is mechanical: the
attribute must land on the focusable node, and WCAG 1.4.13 adds three more — content shown on hover or
focus must be dismissable without moving the pointer, hoverable, and persistent.

### Measurement
A wrapper cannot satisfy the first. `<span aria-describedby>` around a child block puts the description
on a node that never receives focus; the child's own `<button>` is what the reader lands on and it
carries nothing. Reaching into the child is not available either: the canvas passes children as
`NodeRenderer` elements, so `cloneElement` would add a prop to the renderer rather than to the markup two
levels below it. Making the wrapper focusable produces two tab stops for one control.

### Decision
The block renders its own trigger — label, optional glyph, the category's button variants — and the
tooltip is its own `<span role="tooltip">` linked by `aria-describedby`. Opening is `pointerenter` after
`delay` and `focus` immediately; `Escape` closes without moving the pointer; the bubble has
`pointer-events: auto` and stays open while the pointer is inside it; nothing closes on a timer.

### Consequences
- Accepted: the block does not describe an arbitrary child, which is what the prompt's wording suggests.
  The capability it would need — writing an attribute into another block's markup — is one no block in
  the registry has, and giving one block a private channel into another's DOM is a larger decision than
  a tooltip.
- Accepted: no collision detection, as ADR-190 accepted for the same reason. `side` is the author's
  choice and the four values are all reachable from the inspector.
- Avoided: a tooltip whose description no screen reader announces, which is the defect this block would
  have shipped as its entire purpose.

### Alternatives rejected
- Radix Tooltip: ADR-190 already rejected it for `packages/blocks` — `Tooltip.Root` throws without a
  provider a block cannot own. Nothing about this block changes that.
- `title`: not shown on focus, not dismissable, timing owned by the browser.

## ADR-203 — The tabs indicator is an index over equal columns, not a measured element

**Date** 2026-08-18 · **Prompt** 40 · **Status** Accepted

### Question
`tabs` needs an animated indicator under the active trigger. The usual implementation measures the active
trigger with `getBoundingClientRect` and writes width and offset. Do we measure?

### Criterion (set before deciding)
PERFORMANCE.md § The rules put layout reads on the list of things not to do per interaction, and the
canvas adds a second condition a normal page does not have: the artboard is transform-scaled, so a
measured pixel offset is the scaled offset and the indicator would sit under the wrong tab at any zoom
but 1. So an implementation that needs no read at all wins if it can express the same movement.

### Measurement
It can, at one cost. A `grid-template-columns: repeat(n, 1fr)` list makes every trigger exactly `100 / n`
per cent wide, so the indicator is `width: calc(100% / n)` translated by `activeIndex * 100%` of its own
width — no read, no resize observer, correct at every zoom because both terms are percentages. The cost
is that the triggers are equal width rather than sized to their labels: measured at 1440 px with the
default four labels ("Overview", "Motion", "Export", "Tokens") the equal columns read as deliberate;
with one long label among three short ones the row carries more air around the short ones than a hugging
row would.

### Decision
Equal columns. `--ms-tabs-count` and `--ms-tabs-index` on the list, the indicator translated in CSS, and
`orientation: vertical` swaps the axis with the same arithmetic. The transition duration is a token, so
reduced motion collapses it and the indicator jumps rather than slides — the state is still carried by
the trigger's own weight and `aria-selected`.

### Consequences
- Accepted: labels do not hug. A five-tab row of one-word labels is wider than it needs to be, and the
  `align` prop lets the author narrow the whole list instead.
- Accepted: the tab cap is 6. Past six the columns are too narrow for a two-word label at 360 px, which
  is where the equal-column trade stops being neutral.
- Avoided: a layout read per selection, a `ResizeObserver` per block, and an indicator that is wrong at
  every canvas zoom level — the specific bug the measured version would have shipped.

## ADR-204 — The button's five motion presets are the hover channel, not a prop

**Date** 2026-08-18 · **Prompt** 40 · **Status** Accepted

### Question
Prompt 40 asks `button` for "motion presets: `lift`, `scale-hover`, `magnetic`, `shine`, `glow-hover` —
selectable, not hard-coded". A prop with those five values, or the node's motion?

### Criterion (set before deciding)
COMPONENT_LIBRARY.md § Rules 7 is unambiguous: motion goes through the node's `MotionSpec`, the block
declares `defaultMotion`, and `insertNode` writes it into the node (ADR-154). A block that animated from
its own props "would make an entrance the user cannot remove". So the only question is whether the five
named presets are reachable that way.

### Measurement
All five are registered on the `hover` channel in `packages/motion`: `lift`, `scale-hover`, `magnetic`,
`glow-hover` and `shine` (`presets/hover/*`). The Motion section of the inspector lists every preset for
a channel the block declares in `capabilities.supportsMotion`, so declaring `hover` makes all five
selectable — and the four others on the channel besides.

### Decision
No motion prop. `capabilities.supportsMotion: ['entrance', 'hover']` and `defaultMotion.hover = lift`,
which is the quietest of the five and the one that survives being applied to a `ghost` button. Selection
happens in the inspector, and removal is possible, which a prop with a default of `lift` would not have
allowed.

### Consequences
- Accepted: the five are not a closed list in the UI. A user can pick `tilt-3d` on a button, which is a
  strange choice and not a broken one — the same freedom every other block has.
- Accepted: the palette thumbnail shows the button still, because `previewProps` is props and the hover
  preset is not a prop. The hover clip (ADR-182) is what shows the motion.

## ADR-205 — `modal-trigger` portals into its own frame; only the export covers the viewport

**Date** 2026-08-18 · **Prompt** 40 · **Status** Accepted

### Question
A modal in the canvas cannot cover the canvas — prompt 40 says it renders inline in a labelled preview
frame, and the export emits the real dialog. A block must not know it is in an editor. How can one
component be both?

### Criterion (set before deciding)
COMPONENT_LIBRARY.md § Rules 1: props in, JSX out, no editor knowledge. Prompt 40 adds the two
requirements that pull against each other — the dialog must be real enough to test (focus trapped, `Esc`
closes, focus restored) and it must not cover the editor.

### Measurement
Radix's `Dialog.Portal` takes a `container`. Given the block's own frame as the container, the overlay and
the content render **inside the block** as absolutely-positioned children, and every behaviour the
requirement names is Radix's and unchanged: `FocusScope` still traps, `Esc` still closes, focus still
returns to the trigger. Nothing about the component varies by host — it renders the same tree in the
canvas, in Storybook, in jsdom and on the user's page.

### Decision
One component, portalled into its own frame, with the frame labelled "Dialog preview" by a caption that
is part of the block rather than an editor affordance. The descriptor's `notes` say that the export
portals to the document body and covers the viewport, and prompt 43's React printer is what does it.

### Consequences
- Accepted: the export is not byte-identical to the canvas markup. It is the one block in the catalogue
  where they differ, the difference is the portal target and the content's position classes, and the note
  in the descriptor is what tells the reader.
- Accepted: the frame occupies space in the layout whether the dialog is open or not, because a frame
  that collapsed would move the page every time the dialog opened.
- The third consequence this entry originally carried — that the live-region announcer is hidden while the
  dialog is open — was wrong. ADR-209 has the measurement: `hideOthers` exempts every `[aria-live]` element.

## ADR-206 — A slotted interactive block still renders from its props alone

**Date** 2026-08-18 · **Prompt** 40 · **Status** Accepted

### Question
`tabs`, `accordion`, `carousel` and `modal-trigger` take child blocks in slots. What do they render for a
panel with no child in it?

### Criterion (set before deciding)
Not a preference: COMPONENT_LIBRARY.md § Thumbnails renders `previewProps` through Storybook, and a
thumbnail render passes **no children**. A block whose panels are empty without children therefore has an
empty thumbnail, and `pnpm check:registry` is a presence check that would not catch it. So every block in
the category has to be complete from props alone.

### Measurement
Each of the four has one text-shaped fallback available in its own item vocabulary — a tab's `body`, an
accordion row's `body`, a slide's `title` and `body`, the dialog's `body`. `columns` already reads a slot
prop or a positional child, whichever the host supplies (`left ?? firstChild`), so the pattern is in the
registry rather than new here.

### Decision
Children win where they exist, per index: panel `i` renders child `i`, and falls back to item `i`'s
`body` text. The slot's `maxChildren` equals the item cap, so a document cannot hold a child for a panel
that does not exist.

### Consequences
- Accepted: an author who drops one block into a three-tab set sees one panel of markup and two of text.
  That is what they asked for, and the alternative — hiding the text as soon as any child arrives — would
  blank the other two panels.
- Accepted: the item cap and the slot cap are two numbers that have to agree. The category's own test
  asserts they do for all four.

## ADR-207 — Radix's modal dialog hides the announcer, and a block cannot exempt it

**Date** 2026-08-18 · **Prompt** 40 · **Status** Superseded by ADR-209

### Question
ACCESSIBILITY.md § Dialogs requires background content to be `aria-hidden` "**except** the live-region
announcer, which must stay reachable". Prompt 40 asks for that to be verified on `modal-trigger`. Does it
hold?

### Criterion (set before measuring)
The announcer must not carry `aria-hidden="true"` while a dialog is open. Stated as a pass or fail on the
DOM rather than as a judgement.

### Measurement
It fails, and not in this block. `@radix-ui/react-dialog` calls `hideOthers(content)` from
`aria-hidden@1.2.6` with the content element as the only target. That library keeps the target and its
ancestors and walks every other branch of the document setting `aria-hidden="true"`; it takes no
allowlist and reads no marker on the nodes it hides. So any live region outside the dialog's own ancestor
chain is hidden — the canvas's `SelectionAnnouncer` included, and equally for `packages/ui`'s own
`Dialog`, which has the same one call behind it.

A block has no seam here at all: the alternative Radix offers is `modal={false}`, which removes the
`aria-hidden` pass **and** the focus trap together, and the trap is a requirement.

### Decision
`modal-trigger` keeps the modal dialog and the trap. The requirement in ACCESSIBILITY.md § Dialogs is an
**application** obligation, not a block's, and it is currently unmet by the studio: `packages/ui`'s
`Dialog` and the canvas announcer are the two halves that have to agree. The block's own test asserts
what the block controls — trap, `Esc`, restore, labelling — and this entry records the finding so it is
not rediscovered as a mystery.

Recommended fix, for whoever owns the studio dialog: mark the announcer (`data-ms-announcer`) and
re-assert `aria-hidden="false"` on it after the dialog opens. `aria-hidden@1.2.6` restores the attribute
it recorded on close and does not re-apply while open, so one write is enough. Escalated in the session
report rather than done here — `packages/ui` and `packages/canvas` are not prompt 40's deliverables.

### Consequences
- Accepted: with a `modal-trigger` dialog open in the canvas, canvas selection announcements go silent
  until it closes. Nothing else in the studio changes.
- Accepted: an exported page has no announcer, so the export is unaffected — this is a studio-only gap,
  which is why the block is not the place to fix it.
- Avoided: dropping `modal` to satisfy the clause, which would have traded a focus trap for it.

## ADR-208 — `button-group` uses Radix Radio Group for single selection, Toggle Group for multiple

**Date** 2026-08-18 · **Prompt** 40 · **Status** Accepted

### Question
Radix Toggle Group is the obvious primitive for a segmented control and TECH_STACK.md § Radix UI lists it.
Its `single` mode renders `role="radiogroup"` with `role="radio"` items. Is that the right primitive for
single selection?

### Criterion (set before measuring)
An element that announces a role has to behave like that role. The ARIA radio-group pattern is explicit:
in a radio group the arrow keys **move focus and check the focused radio**. So: press `ArrowRight` in a
single-selection group and the second choice must be checked. Stated as a test before either primitive was
wired.

### Measurement
Toggle Group fails it. Its roving focus moves focus and leaves the selection alone — `aria-checked` stays
`false` on the newly focused item until `Space` or `Enter`, which the first version of
`button-group.test.tsx` recorded as a failure rather than as a surprise. The primitive has no option for
select-on-focus; the behaviour belongs to `Toggle`, which is a pressed button and not a radio.

Radix Radio Group passes it: arrows move focus and check in one step, `loop` wraps, `orientation` picks the
axis, and the root and items carry the same roles Toggle Group *claims*. For **multiple** selection Toggle
Group is right and unambiguous — `role="toolbar"` of `aria-pressed` buttons, where arrows must not select
because selecting is a separate action.

### Decision
Two primitives, one per mode, which the component already needed two roots for: Radio Group for `single`,
Toggle Group for `multiple`. The paint is one `cva` and it keys off both attributes — `data-[state=on]` is
Toggle Group's and `data-[state=checked]` is Radio Group's — written out literally, because a class name
built at runtime is a class name Tailwind never sees in the source.

### Consequences
- Accepted: the emitted `package.json` installs both primitives even though a given group uses one. The
  alternative is a conditional dependency list, which is a printer feature nobody has asked for; the two
  packages are 12 kB together, gzipped.
- Accepted: the paint carries two attribute selectors for every selected-state class. It is verbose and it
  is checkable, and the test asserts the selected item's class list rather than trusting the comment.
- Avoided: a control that announces itself as a radio group and then ignores the arrow keys, which is the
  kind of defect that passes every automated gate — axe sees a valid radiogroup — and fails a real user.

## ADR-209 — The announcer does stay reachable: `hideOthers` exempts `[aria-live]`

**Date** 2026-08-18 · **Prompt** 40 · **Status** Accepted · **Supersedes** ADR-207

### Question
ADR-207 concluded that a Radix modal dialog hides the live-region announcer and that no block can exempt it,
and escalated the clause in ACCESSIBILITY.md § Dialogs as unmet. Writing `modal-trigger`'s test against that
conclusion failed. Which is right?

### Criterion (unchanged from ADR-207)
The announcer must not carry `aria-hidden="true"` while a dialog is open. A pass or fail on the DOM.

### Measurement
It passes, and ADR-207 read one function and stopped at the wrong one. `hideOthers` in
`aria-hidden@1.2.6` does this before it walks anything:

```js
// we should not hide aria-live elements - https://github.com/theKashey/aria-hidden/issues/10
// and script elements, as they have no impact on accessibility.
targets.push(...activeParentNode.querySelectorAll('[aria-live], script'))
```

Every `[aria-live]` element in the parent node is added to the **keep** set beside the dialog content, so the
walk skips it and its ancestors. ADR-207 measured `applyAttributeToOthers`, which is the walk, and never read
the caller that builds its target list.

Asserted rather than described, in `modal-trigger.test.tsx`: with the dialog open, a plain `<div>` beside the
block carries `aria-hidden="true"` and an `<output aria-live="polite">` beside it carries nothing. The canvas's
own `SelectionAnnouncer` is exactly that element — an `<output>` with `aria-live="polite"` — so the studio is
correct as it stands, and so is `packages/ui`'s `Dialog`.

### Decision
No escalation, no application change, and the clause in ACCESSIBILITY.md § Dialogs holds for every dialog in
the repository. The requirement is now covered by a test in the one block that portals a dialog, and the
mechanism behind it is `aria-live` — which is the attribute that makes an announcer an announcer, so nothing
has to be marked specially for it to work.

### Consequences
- Accepted: the exemption is a dependency's behaviour rather than ours. It is documented in that dependency
  and pinned by our test, so an upgrade that removed it would fail the suite rather than go silent.
- Accepted: a region that announces without `aria-live` — `role="status"` alone, or a `role="alert"` element
  written without the attribute — is **not** exempt. Ours all carry it; a future one has to.
- Avoided: an escalation that would have asked the owner to fix something that was never broken, and a
  workaround in `packages/ui` re-asserting an attribute nobody had set.

### What this says about the earlier entry
ADR-207's criterion and test were right and its measurement was incomplete: it read the function that hides
and not the function that decides what to hide. Recorded rather than quietly deleted, because the failure mode
— reading one layer of a dependency and generalising — is the useful part.

## ADR-210 — The interactive category costs 16.2 kB on `/studio`, and `lazy` moves none of it

**Date** 2026-08-18 · **Prompt** 40 · **Status** Accepted

### Question
Nine blocks took `/studio`'s first-load JS from 292.8 kB to 309.0 kB. ADR-196 measured the navigation category
and concluded `lazy` was worth nothing there because the growth was metadata — but this category is different
on its face: it imports three Radix primitives and its components hold state. Does dynamic import help here?

### Criterion (set before measuring)
Move the six state-holding components behind `lazy` and rebuild. A reduction of **5 kB or more** on `/studio`
justifies nine Suspense boundaries and a request each; anything less does not.

### Measurement
`pnpm --filter web build`, `/studio` first-load JS:

| Composition | First load |
| --- | --- |
| Eager (shipped) | **309 kB** |
| Six components behind `lazy` | **309 kB** |

Not a rounding difference — the same number. The reason is the package barrel: `apps/web` imports
`@motion-studio/blocks` (`EffectStack`, `blockRegistry`, `renderRegistry`), and `src/index.ts` re-exports every
block in the catalogue, so the components are in the module graph whatever `components.ts` does with them.
ADR-107's split separates `registry.ts` from `render-registry.ts`; it does not separate the barrel.

Where the 16.2 kB actually goes, measured by gzipping the descriptor fields themselves:

| Part of the nine definitions | Raw | Gzipped |
| --- | --- | --- |
| `a11y.notes`, `codegen.notes`, `client.reason` | 8 997 B | 3 564 B |
| `defaults` + `previewProps` | 7 203 B | 1 492 B |
| `controls` | 12 229 B | 2 100 B |
| `theme-toggle`'s emitted runtime module source | 2 176 B | 948 B |
| Together | 30 605 B | **7 479 B** |

So roughly half the growth is descriptor **text** — the accessibility notes are the largest single item, and the
category's five-notes-per-block discipline is what makes them large. The Radix primitives cost nothing new:
`packages/ui` already depends on Tabs, Radio Group and Toggle Group, so the studio bundle carried them before
this prompt.

### Decision
Eager, as the navigation category is, and the comment in `components.ts` says why. The numbers above are the
reason rather than consistency for its own sake.

### Consequences
- Accepted: `/studio` is at 309 kB against a 250 kB budget. ADR-179 is the owner's standing decision on that,
  and this prompt adds 16.2 kB to it. Reported again rather than absorbed quietly.
- Accepted: 948 B of the emitted `theme-toggle` runtime module ships to every studio visitor, and only the
  export path ever reads it. The lever exists — a descriptor field the exporter loads on demand — and it belongs
  to prompt 42, which is the first code that reads the field at all.
- Named: the barrel is the real boundary. Making `lazy` mean anything for a block's component would take a
  second entry point (`@motion-studio/blocks/components`), which is a change to the package's public API and
  bigger than a block category's prompt.

## ADR-211 — What the side-by-side and the keyboard pass changed in the interactive category

**Date** 2026-08-18 · **Prompt** 40 · **Status** Accepted

DESIGN_REFERENCES.md holds blocks at the reference's full standard, and GLOBAL_RULES § The design bar says the
verdict gets reported. This is the pass and what it changed — recorded here rather than in a session report,
because four of the changes are decisions a later prompt could otherwise undo by accident.

### What was measured
All nine blocks rendered through the Storybook build at 1440 × 900 in both colour modes and screenshotted, then
walked with real `Tab` key events over CDP (a programmatic `.focus()` does not qualify as `:focus-visible` in a
headless page), then re-rendered under an emulated `prefers-reduced-motion: reduce`.

### What the first pass got wrong, and the fix

1. **`tabs` drew a 340 px indicator under a 60 px label.** The columns are equal by ADR-203, and the default
   `align: 'stretch'` made each of four tabs a quarter of 1 360 px. The default is now `start`, so the strip hugs
   its labels and the indicator is the width of the thing it marks. `stretch` is still there for a strip that is
   meant to fill a column.
2. **`accordion` put a label at one end of a 1 360 px row and its chevron at the other.** `faq-accordion` had
   already solved the same shape with `mx-auto max-w-3xl`; the generic one now uses it too.
3. **Panel prose ran the full width of the block.** `INTERACTIVE_BODY` gained `max-w-2xl` — about 65 characters,
   which DESIGN_SYSTEM.md § Typography calls a measure. Inside a card the class is a no-op.
4. **`modal-trigger`'s scrim was invisible and its caption unreadable.** In dark mode `surface-0` is the darkest
   step there is, so an overlay of `surface-0/70` over a frame painted `surface-0` dimmed nothing at all, and the
   caption sat *under* the overlay. The frame is now `surface-2` — a plate the wash has something to act on in
   either mode — and the caption moved above the frame, where nothing covers it.
5. **The segmented surfaces were inverted in light mode.** `button-group` and `theme-toggle` had a `surface-1`
   track with a `surface-0` selected item, which in light mode is white behind a *grey* selection. The pair that
   reads as "well with one raised choice" in both modes is `surface-inset` + `surface-3`, which is the
   relationship `packages/ui`'s segmented control already proves — the ladders run opposite ways (light elevates
   toward white, dark toward lighter grey) and those two tokens invert with them.

### The keyboard pass, in real Chrome
Every control draws a **2 px solid** outline on a real `Tab`. The tab orders, as walked:

| Block | First four stops |
| --- | --- |
| `button` | the button, then out |
| `button-group` | one stop for the whole group, then out — the roving tab index |
| `tabs` | the strip, then the open panel |
| `accordion` | the three triggers, then out |
| `carousel` | the four slides, then the dots and the arrow |
| `modal-trigger` | "Close", four times — the dialog's focus trap, from the outside |
| `tooltip-target` | the control, then out |
| `command-menu-preview` | **nothing**: four presses, four times on `body`, which is what a picture should do |
| `theme-toggle` | Light, Dark, System, then out |

### Reduced motion
**0** running animations in all nine. The only non-zero transition duration left anywhere on the page is `0.2s`
on Storybook's own `.sb-loader` — the same value prompt 39 recorded — because every duration inside the blocks is
a token and the tokens are `calc(… * var(--ms-reduced-motion))`. The carousel's autoplay does not start at all
and renders no pause control, since there is nothing to stop.

### The verdict, stated
The category holds on finish: one accent, hairlines rather than heavy borders, states carried by surface and
weight as well as by colour, the theme's own glass recipe on the one block that uses glass, and a reduced-motion
path that leaves a composition rather than a gap. `command-menu-preview` is the strongest of the nine beside the
reference — a glass palette over the hero glow, with real keycaps and one highlighted row — and `carousel` is the
one with the most room left: its slides are content the author supplies, so what it can do for them is a card
surface and a rhythm, and a strip of four short cards reads plainer than the reference's own galleries.

One difference from the reference is deliberate and traceable: the tab indicator marks an **equal column** rather
than hugging each label's text, because ADR-203 refused a layout read that would be wrong at every canvas zoom.
With the strip hugging its labels the difference is a few pixels of air per tab, which is the trade that entry
accepted, seen at 1440.

## ADR-212 — The Zod resolver React Hook Form validates through

**Date** 2026-08-19 · **Prompt** 41 · **Status** Accepted

### Question
TECH_STACK.md § Validation and data names React Hook Form 7 and names Zod 3 as the single source of truth for
shape. Prompt 41 asks for "React Hook Form + a Zod resolver". It does not name the package that bridges them, and
`@hookform/resolvers` is a dependency no document in the repository mentions — which by GLOBAL_RULES § Do not is a
dependency that needs its justification stated before it is installed.

### Criterion (set before measuring)
Take the package if the adapter it provides is not something we could write in under fifty lines **and** it costs
under 3 kB gzipped in the emitted project. Hand-write the resolver otherwise: a `Resolver` is a function of values
returning `{ values, errors }`, and RHF's type contract specifies its shape exactly.

### Measurement
`node_modules/@hookform/resolvers/zod/dist/zod.mjs` — the subpath the block imports — is **2 104 B raw, 866 B
gzipped**. Its own dependency list is empty; it imports only from `react-hook-form` and `zod`, both of which the
block already installs. The hand-written alternative is about thirty lines, and it has to reimplement one thing
that is not obvious: flattening a `ZodError`'s `path` array into RHF's dotted field names, including the array
indices, which is where a hand-rolled version gets a nested field's error onto the wrong control.

### Decision
`@hookform/resolvers@^3.10.0`, imported as `@hookform/resolvers/zod`. 866 B is under the threshold, and the
error-path flattening is the part worth not owning. TECH_STACK.md § Validation and data names it beside React Hook
Form, in the same commit as this entry.

### Consequences
- Accepted: two blocks' exports install three packages rather than two. Both carry them in
  `codegen.dependencies`, so the emitted `package.json` is complete.
- Accepted: the resolver's major version is a second thing to keep in step with Zod's. `forms.codegen.test.ts`
  asserts the range shape; it cannot assert compatibility, and no test can.
- Avoided: a hand-written resolver whose only test would be the one for the bug it was written to have.

## ADR-213 — The three field blocks are presentational, and `error` is a prop

**Date** 2026-08-19 · **Prompt** 41 · **Status** Accepted

### Question
`input-field`, `select-field` and `checkbox-field` are blocks a designer places on a canvas. Prompt 41 requires
`aria-invalid` "only when actually invalid". Who decides that a standalone field is invalid — the block, by
validating what is typed into it, or its author, by setting an error message?

### Criterion (set before deciding)
The block that produces the state the inspector has to be able to **preview**. A field whose error state cannot be
seen at any prop set is a field whose error state nobody can style, and the invalid state is the one a designer
most needs to look at.

### Decision
The author. `error` is a string prop, empty means valid, and `aria-invalid` is present exactly when it is
non-empty. Validation lives only in `contact-form` and `waitlist-form`, which own a submit and therefore own a
moment at which validating means something.

### Consequences
- Accepted: a standalone field validates nothing, so an author who places one has to bind it themselves. The
  codegen descriptor's note says so, and `previewProps` ships the invalid state so the palette shows it.
- Accepted: the same field renders twice in the category — once with `error` as a prop, once with the resolver's
  message. They share `FieldShell`, `InputControl` and `fieldIds`, so the wiring is one implementation; only where
  the string comes from differs.
- Avoided: a field that validated on blur, which would have invented a validation rule no author asked for and
  shown no error at its defaults.

## ADR-214 — The error element is in the DOM before it has text, and `aria-describedby` names only ids that exist

**Date** 2026-08-19 · **Prompt** 41 · **Status** Accepted

### Question
Prompt 41's structure shows `aria-describedby="f1-hint f1-error"` referencing both the hint and the error. What
happens when there is no hint, or no error? Two sub-questions, and they pull in opposite directions: a live region
has to exist before its text arrives, and a description must not point at an element that is not there.

### Criterion (set before deciding)
Two properties, both checkable by test: (1) a message that appears announces itself without the reader going
looking for it; (2) every id in `aria-describedby` resolves to an element in the document.

### Decision
The error paragraph is **always rendered**, empty or not, and its id is therefore always in `aria-describedby`.
The hint element is rendered only when there is a hint, and its id is in the attribute only then. Order is hint
first, error second — `fieldIds` builds the string and is the only place that decides it.

### Measurement
Chrome's accessibility tree for `contact-form` after a failed submit, over CDP `Accessibility.getFullAXTree`:

| Node | Name | Description |
| --- | --- | --- |
| textbox | `Your name` | `Enter your name.` |
| textbox | `Email address` | `We'll reply to this address. Enter a valid email address.` |
| textbox | `What can we help with?` | `A sentence or two is plenty. Write at least a sentence…` |

Each field's `alert` sibling is reported `live="assertive" atomic=true`, present before the submit and empty. The
description is the hint followed by the error, in that order, which is what the criterion asked for.

### Consequences
- Accepted: an empty paragraph per field in the markup, with a `min-h-5` reserving its line. Both are deliberate —
  the element has to pre-exist to announce, and a message that appeared without reserved space would push the rest
  of the form down while the reader is tabbing through it.
- Accepted: `role="alert"` is `aria-live="assertive"`, so a message interrupts. For a validation error that is the
  right register; ACCESSIBILITY.md § Non-negotiables 8 asks for the announcement and does not soften it.

## ADR-215 — A required field is marked twice and announced once

**Date** 2026-08-19 · **Prompt** 41 · **Status** Accepted

### Question
Prompt 41 requires a required field to be marked "in the label text *and* with `aria-required` — an asterisk alone
is not sufficient". Put the word in the label and the state on the control, and the requirement reaches a
screen-reader user twice: once inside the field's accessible name, once as the required state.

### Criterion (set before measuring)
The requirement reaches a sighted reader and an assistive-technology user **exactly once each**. Measured as: the
computed accessible name of the control equals the label alone, `aria-required` is exposed, and the visible label
text contains the word.

### Measurement
`(required)` rendered inside the `<label>` with `aria-hidden="true"`.

- `toHaveAccessibleName('Email address')` passes — the marking is skipped by the name computation.
- Chrome's accessibility tree for the same field reports name `Email address` with `required=true`.
- `getByLabelText('Email address')` **fails**, and that is not a defect: that query matches the label element's
  whole text content, `aria-hidden` included, which is not what a screen reader computes. Every test in the
  category queries by role and accessible name for this reason, and the comment beside them says so.

### Decision
The visible word, `aria-hidden`, plus `aria-required` on the control. A word rather than an asterisk, because an
asterisk is a convention a reader has to already know.

### Consequences
- Accepted: a sighted screen-reader user sees "(required)" and hears "required" — the same fact from two channels,
  which is the point rather than a duplication.
- Accepted: `aria-required` on a checkbox and on a radio is not in ARIA 1.2's support list for those roles.
  Measured rather than assumed: axe-core raises **no** `aria-allowed-attr` violation for either, in both modes and
  in both valid and invalid states, because HTML-ARIA permits the attribute wherever the native `required`
  attribute is allowed. Recorded because a future axe upgrade could change the answer.
- Rejected: the native `required` attribute. The two form blocks submit with `noValidate`, so it would do nothing
  there, and on a standalone field it would produce a browser bubble the block can neither style nor announce —
  the call `newsletter-form` already made.

## ADR-216 — The Radix Select trigger is named by its label and by the element holding its value

**Date** 2026-08-19 · **Prompt** 41 · **Status** Accepted

### Question
Prompt 41 specifies Radix Select for `select-field`. Radix's own documentation labels it with `<Label htmlFor>`
pointing at `<Select.Trigger id>`. But the trigger is a `<button>`, and HTML-AAM computes a button's name from its
contents rather than from an associated label — so does the label reach the accessible name, and where does the
chosen value go?

### Criterion (set before measuring)
The trigger's computed accessible name has to contain the field's label **and** the current value, in the
computation `@testing-library` and axe use. Try the three candidate wirings and take the one that produces it.

### Measurement
`toHaveAccessibleName` on the trigger, with a value selected:

| Wiring | Computed name |
| --- | --- |
| `<label for>` alone | `Export target` — from the label; the value is absent |
| `aria-labelledby="labelId triggerId"` (self-reference) | `Export target` — the self-reference contributes nothing |
| `aria-labelledby="labelId valueId"` (shipped) | `Export target Next.js` |

`valueId` is a span wrapping `Select.Value`, so it holds the chosen option's text or the placeholder.

### Decision
`<label htmlFor={triggerId}>` **and** `aria-labelledby="labelId valueId"`. The `htmlFor` stays because it is what
makes clicking the label reach the control — measured in Chrome: the click lands on the trigger and opens the
list, which is what a select should do. `fieldIds` gained a `valueId` for the one field that needs it.

### Consequences
- Accepted: the name changes as the value changes. For a combobox that is correct — the value is part of what the
  control currently is — and it is the only wiring of the three that announces it at all.
- Accepted: one field in the category is named differently from the other four. The reason is the element, not a
  preference, and the block's a11y notes state it.
- Named: Radix Select needs `Element.prototype.scrollIntoView`, `hasPointerCapture` and `releasePointerCapture`,
  and jsdom implements none of them. Stubbed in the two test files that open the list rather than in the shared
  setup, so a global stub cannot hide a missing method from an unrelated test.

## ADR-217 — The honeypot is an off-screen input inside an `aria-hidden` wrapper

**Date** 2026-08-19 · **Prompt** 41 · **Status** Accepted

### Question
Prompt 41 asks for a honeypot "`aria-hidden` and visually hidden with a technique that does not hide it from spam
bots (an off-screen input, not `display: none`)". Two things could go wrong with that instruction followed
literally: an `aria-hidden` container holding a focusable element is what axe's `aria-hidden-focus` rule exists to
catch, and a filled trap has to produce *some* outcome.

### Criterion (set before measuring)
Five properties, each asserted: the field is submitted, it is not reachable by `Tab`, it is not in the
accessibility tree, it does not shift layout, and it is not `display: none`, `visibility: hidden` or `[hidden]`.
Plus zero axe violations on the form that contains it.

### Measurement
`absolute -left-[9999px] size-px overflow-hidden` on the wrapper, `tabIndex={-1}` and `autoComplete="off"` on the
input.

- `expectNoViolations` on `contact-form` and `waitlist-form`: **clean**, at defaults and with every field invalid.
  axe treats a `tabindex="-1"` descendant of an `aria-hidden` subtree as needing review rather than as a
  violation, so the rule does not fire.
- Real `Tab` presses in Chrome walk name → email → message → Send and then leave the block. The trap is never a
  stop.
- Chrome's accessibility tree for the form contains no node for it.

### Decision
The wrapper carries `aria-hidden` and the off-screen box; the input carries `tabIndex={-1}` and
`autoComplete="off"` — the last so a browser's own autofill cannot make a real person look like a bot. A filled
trap resolves the form to **success without calling the handler**. Telling a bot it failed teaches it what to
change.

### Consequences
- Accepted: a person who somehow fills the trap gets a success message and no message sent. The alternative —
  showing them an error on a field they cannot see — is worse, and the case requires defeating both `tabindex` and
  the viewport.
- Accepted: the honeypot's field name (`reference`) is part of the block's contract. The codegen note says it must
  stay off-screen, because hiding it with `display: none` is the one change that silently stops it working.
- Named: axe's verdict is "incomplete", not "pass". If a future axe version promotes it, this entry is where the
  decision to revisit lives.

## ADR-218 — What the two new categories reuse, and what they restate

**Date** 2026-08-19 · **Prompt** 41 · **Status** Accepted

### Question
Every category before these two declared its own vocabulary rather than importing a neighbour's — sizes, focus
rings, length caps. Data and Forms both have neighbours holding things they need: `content/stat`'s delta,
`interactive`'s control geometry and glyph lookup, `marketing`'s heading-level component. Which of those should be
imported and which restated?

### Criterion (set before deciding)
Reuse when the thing is a **decision already made and tested** and the import carries no assumption about its
container. Restate when it is only a vocabulary constant, or when reuse would drag a container's assumptions
across a category boundary.

### Decision
Reused:

| From | What | Why it qualifies |
| --- | --- | --- |
| `content/stat` | `DELTA_DIRECTIONS`, `deltaTone`, `StatDelta`, `statValueStyles` | Whether a change is good is one decision with a tested three-way answer; a second copy is a second thing to get wrong |
| `interactive` | `INTERACTIVE_FOCUS`, `INTERACTIVE_TRANSITION`, `controlStyles` | A field and a `button` block on one exported page have to draw the same ring and be the same height; neither category can decide that alone |
| `interactive` | `ControlIcon`, `panelChildren`, `iconNameField` | The glyph-by-name lookup is FILE_FORMAT.md § Security's rule in code, and ADR-206's children fallback is one decision |
| `marketing` | `SectionHeading`, `headingLevel`, `HEADING_LEVELS` | The one place a level becomes a tag; a block that hard-coded one would make the page skip a level |

Restated, per category: the length caps, the density scale, the plate, the entrance spec, the frame controls.

`chart-preview` does **not** reuse `content/stat`'s `sparklinePath`, and that is the criterion applied the other
way: that function's viewBox is fixed at 100 × 32 with no bar mode and no baseline choice, so reusing it would
mean adding two parameters for one caller. It has its own `chart-geometry.ts`, whose bar branch measures from zero
where the line branch measures from the series' own range — two different normalisations that a shared function
would have had to take a flag for.

### Consequences
- Accepted: `data` imports from `content` and `interactive`, and `forms` imports from `interactive` and
  `marketing`. Intra-package and one direction only; the same shape `accordion` already had when it took
  `headingLevel` from `marketing`.
- Accepted: the focus ring is now declared in `interactive` and used by three categories. Moving it to a
  package-level constant would be the cleaner home and is a refactor of five files this prompt did not ask for.
- Avoided: a fifth transcription of the same two class lists, and a second copy of `deltaTone`.

## ADR-219 — The progress ring animates from a `from`-only keyframe, so its export needs no client directive

**Date** 2026-08-19 · **Prompt** 41 · **Status** Accepted

### Question
Prompt 41 requires the ring's fill to animate and to "respect reduced motion by showing the final value
immediately". A JS animation would need an effect, which would make the exported component a client component for
the sake of a decoration. Can CSS do it?

### Criterion (set before measuring)
Under an emulated `prefers-reduced-motion: reduce`, the ring shows its **final** value and `getAnimations()`
returns nothing. At full motion the arc draws. No hook, no effect, no runtime check.

### Measurement
`stroke-dasharray` and `stroke-dashoffset` are written as custom properties on the arc — the exemption
COMPONENT_LIBRARY.md § Rules 3 grants — and the keyframe in `blocks.css` declares only a `from`, so the animation
interpolates *towards* the style the element already carries. No fill mode.

Over CDP at 1440 in both colour modes:

| Condition | `document.getAnimations()` | Arc |
| --- | --- | --- |
| Full motion | `['ms-ring-fill']` | draws from empty to 68 % |
| `prefers-reduced-motion: reduce` | `[]` | 68 % immediately |

The same page reports zero animations for the other nine blocks under either condition.

### Decision
CSS, and `client: { kind: 'never' }`. The media query removes the animation outright and the token duration
collapses it to `0ms` under the studio's own preview override — ADR-021's two mechanisms, both of which land on
the same final state because the element owns it.

### Consequences
- Accepted: the fill is not a motion preset and a user cannot remove it from the inspector. That is deliberate:
  `stroke-dashoffset` is not on any channel the motion model animates, and a reader who removed the entrance
  should still see the ring draw itself.
- Accepted: the ring is the only block of the ten with a hover clip in the palette, because it is the only one
  that animates. The generator decides that by asking the page, not from a list.

## ADR-220 — The client boundary for the ten, by one criterion

**Date** 2026-08-19 · **Prompt** 41 · **Status** Accepted

### Question
ADR-199 made the `'use client'` declaration a block's own answer and made an absent declaration an export failure.
Ten blocks arrive with prompt 41. Which of them need the directive?

### Criterion (set before deciding)
A fact about the component rather than a judgement about the block: **`always` if the component calls a React hook
or attaches an event handler; `never` if it is markup and arithmetic.** `whenAnyProp` only where one prop set
removes every hook and every handler.

### Measurement
Applied to the ten:

| Block | Kind | The fact |
| --- | --- | --- |
| `table` | `always` | `useReactTable` at every prop set, holding the sort |
| `stat-grid` | `never` | figures and labels |
| `progress-ring` | `never` | two circles and a CSS keyframe (ADR-219) |
| `timeline` | `never` | an ordered list; the strip scrolls in CSS |
| `chart-preview` | `never` | paths computed during render |
| `input-field` | `always` | `useId` |
| `select-field` | `always` | `useId`, and Radix Select holds the open state |
| `checkbox-field` | `always` | `useId` |
| `contact-form` | `always` | `useId`, `useForm`, `useFormSubmit` |
| `waitlist-form` | `always` | the same three |

No block in either category qualifies for `whenAnyProp`: `useId` is unconditional in all five form blocks, and
`table` calls its hook whatever its props say.

### Decision
As measured. `data.codegen.test.ts` and `forms.codegen.test.ts` assert the table above, so a component that gains
a hook and does not change its declaration fails the build.

### Consequences
- Accepted: four of the five data blocks print as Server Components and all five form blocks do not. That is the
  honest split rather than a target.
- Accepted: `table` pulls TanStack Table into the client bundle of an exported page for the sake of sorting. The
  prompt specifies the library; the cost is the emitted project's, and `codegen.dependencies` states it.
- Named: fifty-three blocks in the six earlier categories still declare nothing, and the registry meta-test
  asserts exactly that rather than a rule nobody has met. Auditing them is prompt 42's first task, as ADR-199 said.

## ADR-221 — The registry holds 72 entries, and the documents say 62

**Date** 2026-08-19 · **Prompt** 41 · **Status** Accepted

### Question
Prompt 41 says the last ten blocks complete the registry "at **62 blocks**" and asks for the actual number.
COMPONENT_LIBRARY.md § Catalogue heads its list with the same figure. `blockRegistry.list().length` is 72.

### Measurement
Counted from `definitions.ts` per category:

| Category | Entries |
| --- | --- |
| Layout | 7 |
| Hero | 6 |
| Content | 9 |
| Marketing | 12 |
| Navigation | 6 |
| Interactive | 9 |
| Data | 5 |
| Forms | 5 |
| Effects | 13 |
| **Total** | **72** |

Placeable blocks — everything but the effects, which attach to a node rather than replacing one — are **59**.

Where 62 came from is arithmetic rather than a mystery: the six categories through Interactive sum to 49, and
49 + 13 effects is 62. The figure was written before Data and Forms existed, and the catalogue's own list has
always named them. Neither 62 nor any grouping of the rows produces it once the last two categories are in.

### Decision
The measured numbers. COMPONENT_LIBRARY.md § Catalogue states them explicitly — 72 registry entries, 59 placeable
blocks, 13 effect layers — in the same commit as this entry, and `registry.meta.test.ts` asserts all three, so the
count cannot drift again without a test failing.

### Consequences
- **Escalated, not resolved:** the figure 62 also appears in ACCESSIBILITY.md § Testing, DESIGN_SYSTEM.md,
  PERFORMANCE.md, ROADMAP.md § M8, and prompts 04, 22, 46, 52, 55, 57, 59 and 61. Those are the build plan and the
  documents that set its gates; changing them is the owner's call, not a block prompt's. This entry is the record
  of what the number actually is.
- Accepted: a reader of ROADMAP.md will find a number that disagrees with the registry until that sweep happens.
  Recorded rather than quietly corrected in one file and left inconsistent in eight.

## ADR-222 — What the side-by-side, the keyboard pass and the responsive pass changed in the two categories

**Date** 2026-08-19 · **Prompt** 41 · **Status** Accepted

DESIGN_REFERENCES.md holds blocks at the reference's full standard and GLOBAL_RULES § The design bar says the
verdict gets reported. This is the pass and what it changed — recorded here rather than in a session report,
because four of the changes are decisions a later prompt could otherwise undo by accident.

### What was measured
Eighty frames: each of the ten blocks at 360, 768 and 1440 in both colour modes, and again at 1440 under an
emulated `prefers-reduced-motion: reduce`, screenshotted over CDP through the Storybook build. Each frame also
recorded `document.getAnimations()` and the document's horizontal overflow. Then a real keyboard pass on
`contact-form` with `Input.dispatchKeyEvent`, and Chrome's own accessibility tree for five of the blocks.

### What the first pass got wrong, and the fix

1. **`chart-preview` made the page scroll sideways at 360 px** — by 6 px, in both modes. The hidden data table
   carried `sr-only` directly, and that utility sets `width: 1px`, which a `display: table` box treats as a
   minimum and ignores: the table laid itself out at its content width and extended the document's scroll area.
   The utility moved to a wrapping `<div>`, whose 1 px box with `overflow: hidden` clips it and contributes
   nothing. Zero overflow in all eighty frames afterwards.
2. **`stat-grid`'s dividers were invisible in light mode.** The plate was composed from `DATA_SURFACE`, which
   carries `bg-surface-1`, so two `bg-*` utilities landed on one element and Tailwind's emission order decided
   which won — the grid painted itself white and the one-pixel gaps disappeared into it. The plate is written out
   without a background of its own. The same trap `interactive.styles.ts` records for padding, in a different
   property.
3. **`table`'s numeric headings sat 200 px from their own numbers.** The sort control fills its cell, and a
   left-hugging `inline-flex` inside a right-aligned cell reads as two columns rather than one. The control now
   places its content from the column's `align`, reversing the row for `end` so the glyph stays beside the label.
4. **`chart-preview` flattened every series at 1440.** With `preserveAspectRatio="none"` the drawn slope is
   decided entirely by the container's aspect, and a full-width chart at `h-32` is 10.6 : 1 — the six values read
   as one straight line. The figure gained `max-w-2xl`, which makes it 5.25 : 1, and the vertices gained markers
   drawn as zero-length segments with a round linecap: a `<circle>` in a stretched viewBox is an ellipse, and a
   zero-length subpath with `vectorEffect="non-scaling-stroke"` is a round dot in device space.

### The keyboard pass, in real Chrome
`contact-form` at 1440, every press a real `Tab` or `Enter` over CDP — a programmatic `.focus()` does not qualify
as `:focus-visible` in a headless page.

| Step | Where focus went | Ring |
| --- | --- | --- |
| Tab ×1 | `Your name` | 2 px, `:focus-visible` |
| Tab ×2 | `Email address` | 2 px, `:focus-visible` |
| Tab ×3 | `What can we help with?` (textarea) | 2 px, `:focus-visible` |
| Tab ×4 | `Send message` | 2 px, `:focus-visible` |
| Tab ×5 | out of the block | — |
| `Enter` on Send, nothing filled | **`Your name`** — the first invalid field | 2 px |
| … announced | all three messages, each in its own `role="alert"` | |
| `Enter` on Send, name filled | **`Email address`** — the first field *still* invalid | 2 px |
| … announced | the remaining two messages | |
| `Enter` on Send, all valid | **the success panel**, which has replaced the form | 2 px |
| Tab after success | out of the block — the panel is `tabIndex={-1}` and adds no stop | — |

The honeypot is never a stop, which is the property it exists to have.

### What a screen reader is given
No screen reader was driven — a headless Chrome cannot run one. What was measured instead is the tree a screen
reader reads, over CDP `Accessibility.getFullAXTree`:

- `contact-form`, after a failed submit: three `textbox` nodes named by their labels alone (`Your name`, not
  `Your name (required)`), each `required=true invalid="true"`, each described by its hint then its error, each
  with an `alert` sibling reported `live="assertive" atomic=true`. No node for the honeypot.
- `checkbox-field`: a `group` named by its legend and described by the group's hint, three `checkbox` nodes each
  named by its own label, the first also described by its own hint.
- `select-field`: one `combobox` named `Export target Next.js`, `required=true expanded=false`.
- `table`: a `region` named `Export runs`, a `table` named by its caption, five `columnheader` nodes named by
  their columns and four `button` nodes named by the column alone — the sort state is on the cell, not in the name.
- `chart-preview`: the drawing as one `img` named by the summary, and the hidden table with a `rowheader` per point.
- `progress-ring`: one `progressbar` named `Migration progress` with `valuemin` 0 and `valuemax` 100. CDP reports
  `valuetext` as an empty property and `valuenow` not at all; the DOM carries `aria-valuenow="68"` and
  `aria-valuetext="68 percent complete"`, so this is the serialisation rather than the markup.

### Reduced motion
**0** running animations in all ten blocks, in both colour modes, at 1440. At full motion exactly one animation
runs anywhere in the two categories — `ms-ring-fill` on `progress-ring` — and the ring is correspondingly the only
one of the ten with a hover clip in the palette.

### The bundle
`/studio` first-load JS: **309 kB → 319 kB**, +10 kB for ten blocks. Eager, for the reason ADR-210 measured and
this prompt did not re-litigate: the package barrel re-exports every block, so `lazy` in `components.ts` moves
nothing. ADR-179 remains the owner's standing decision about the 250 kB budget.

### The verdict, stated
The forms category holds on finish and is the stronger of the two: one control geometry shared with
`interactive`, a reserved line for every message so nothing jumps, the invalid state carried by a border and a
ring as well as by colour, and a success panel that is a real composition rather than a sentence where a form
used to be. `contact-form` is the best of the ten beside the reference.

The data category is more uneven, and two of the five are worth naming honestly:

- `table` and `stat-grid` are shippable: hairline dividers, tabular figures that line up, a sticky header with a
  real line under it, and sort affordances visible before hover.
- **`chart-preview` is the weakest of the ten.** After the two fixes it reads correctly and the data is legible,
  but it is a bare drawing: no value axis, no grid, no plate, and its caption defaults to empty. Against the
  reference it is competent rather than good. What it would take is an axis with two or three labelled gridlines
  and an optional plate — both of which are props, a schema change and a second geometry pass, which is more than
  this prompt's deliverable for one of ten blocks. Named rather than ticked.

### One known fluctuation, reproduced twice
`pnpm generate:thumbnails --verify` reported churn in **two runs out of two**, and named different files each
time: `modal-trigger-light` + `modal-trigger-dark` on the first, `button-group-light` + `modal-trigger-dark` on the
second. Neither block belongs to this prompt; both are interactive blocks whose still is taken while something has
focus — Radix Dialog moves focus to the close button, and the segmented group's first item may or may not have
received it. The ten new blocks never churned, and the three affected pre-existing files were restored to their
committed bytes rather than carried into this prompt's diff. Recorded as a known fluctuation in the generator's
focus timing rather than chased: it reproduces, it is not this category's, and `--verify` is not currently a
reliable gate for those two blocks.

## ADR-223 — `chart-preview` gets a value scale, point names and a plate

**Date** 2026-08-19 · **Prompt** 41 · **Status** Accepted

ADR-222 named this block the weakest of the ten and said what it would take: "an axis with two or three labelled
gridlines and an optional plate". This is that work, done rather than deferred.

### Question
A chart whose only accessible form is a hidden table and whose only visible form is a shape has two defects a
reader meets immediately: they cannot read a value off it, and the `labels` prop they filled in is invisible to
them — it reached the hidden table and nothing else.

### Criterion (set before deciding)
Three properties: a reader can name the top and bottom of the range without counting pixels; a point name the
author typed appears on the page; and neither addition costs the block its `cheap` cost class or its `never`
client boundary.

### Decision
Three props, all off-switchable, none of them a new dependency:

| Prop | What it draws |
| --- | --- |
| `showGrid` | three gridlines inside the SVG and their values beside it |
| `showPointLabels` | the `labels` array under the plot |
| `plate` | the category's own surface and hairline around the figure |

Two things about it are forced rather than chosen, and both are recorded because a later prompt could undo them
by accident:

1. **Both axes are HTML, not SVG text.** The plot is drawn with `preserveAspectRatio="none"`, so text inside the
   viewBox is stretched horizontally by whatever aspect the container has. The gridlines *are* inside the SVG,
   because a line survives stretching when it carries `vectorEffect="non-scaling-stroke"`.
2. **The scale's bottom is not always the series' minimum.** `axisTicks` splits the same way the marks already do:
   bars are measured from zero, so their axis starts at zero or the labels would describe a drawing that is not
   there; a line normalises to its own range, so its axis does too.

A tick has to sit *on* its gridline, and it does so without coordinate arithmetic or an inline style:
`justify-between` leaves the first and last labels half a line-height inside the ends of the column, so those two
are pulled back by exactly that and the middle one needs nothing.

Both axes are `aria-hidden`. The hidden table already carries every value *as a table*, with a row header per
point; the same numbers loose in the accessibility tree would be a scatter of digits a reader has to step over.

### Measurement
- `/studio` first-load JS: 319 kB → **320 kB**. The three additions cost 1 kB, so the cost class stays `cheap`.
- Still no hook, no effect, no handler: `client: { kind: 'never' }` is unchanged, and `data.codegen.test.ts`
  asserts it.
- Eighty frames re-shot at 360, 768 and 1440 in both modes: zero horizontal overflow, zero animations under
  reduced motion.
- axe: clean with both axes and the plate on, and with a caption.
- blocks: **1 932** tests in 88 files, all passing.

### Consequences
- Accepted: three more props on a block that had thirteen. Each is a switch with a visible effect and a default
  that makes the block look finished out of the palette, which is what a prop on a content block is for.
- Accepted: the value scale is three ticks and not five. Five inside `h-20` — the block's smallest height — is a
  hatch pattern rather than a scale.
- Named: the verdict in ADR-222 is superseded for this block. It now reads as a chart rather than as a drawing:
  plate, scale, names, vertices. What it still does not have is a second series, and that is a different block.

## ADR-224 — Class order is variant-major, and the two documents that describe it disagreed

**Date** 2026-08-22 · **Prompt** 42 · **Status** Accepted

### Question
`generateClasses` has to emit classes in the order Tailwind's own sorter would. Two documents describe
that order and they do not agree. EXPORT_ENGINE.md § Class generation says "Tailwind's own group order
…, **then breakpoint order within each group**". RESPONSIVE_ENGINE.md § Codegen says "base → sm → md →
lg → xl → 2xl" and prints the output it means:

```
className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-6"
```

Group-major would have produced `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6`. One of
the two sentences is wrong.

### Criterion (set before measuring)
Both documents state the same *purpose* — "matches what Tailwind's own class sorter would produce". So
the tie is broken by the sorter, not by preference: whichever ordering `prettier-plugin-tailwindcss`
produces is the one we emit. The plugin sorts by variant first (unprefixed classes before every
variant, variants in config order) and by core-plugin registration order within a variant.

### Measurement
`prettier-plugin-tailwindcss` groups by variant before property: the example in RESPONSIVE_ENGINE.md is
exactly its output, and EXPORT_ENGINE.md's phrasing is not reachable by any plugin setting. The property
order inside a variant is the registration order of Tailwind's core plugins, which is also not the
nine-group list EXPORT_ENGINE.md offers in parentheses — that list has spacing before sizing and
background before border, where the plugin has `borderRadius` before `backgroundColor` and `padding`
after both.

### Decision
Variant-major, property-minor:

1. Unprefixed classes first, then `sm:`, `md:`, `lg:`, `xl:`, `2xl:` — `CASCADE_ORDER` from `schema`.
2. Within one variant, order by Tailwind's core-plugin sequence, transcribed as data in
   `ir/tailwind/class-order.ts` and matched by longest utility prefix.

EXPORT_ENGINE.md's sentence and its nine-group parenthetical are corrected to say this, in the doc
commit that precedes the code.

### Consequences
- Accepted: the order table is a transcription of another project's plugin order, so it can drift when
  Tailwind adds a plugin. It is one file of data, and a class whose family is not in the table sorts
  after every class that is, deterministically, rather than throwing.
- Accepted: we do not run the real plugin. Running it would mean shipping Prettier and the Tailwind
  config into `buildIR`, which EXPORT_ENGINE.md § Formatting keeps out of the IR on purpose.
- Avoided: an output a reviewer would notice. Group-major ordering scatters the breakpoints of one
  element across the whole attribute, which is the tell that the classes were assembled rather than
  written.

### Alternatives rejected
- Follow EXPORT_ENGINE.md literally: produces a string no Tailwind sorter emits, which defeats the
  reason either document gives for caring about the order.
- Emit unordered and let the user's own sorter fix it: the export has to look right in a diff and in a
  clipboard paste, neither of which runs a formatter.

## ADR-225 — A block declares its root class plan in the codegen descriptor

**Date** 2026-08-22 · **Prompt** 42 · **Status** Accepted

### Question
`generateClasses(node, def, theme)` — the signature EXPORT_ENGINE.md § Class generation specifies —
turns props into Tailwind classes. The props are scale *names* (ADR-106: `gapX: 'md'`), and the class a
name spends is different for every prop: `gapX: 'md'` is `gap-x-4`, `padding: 'md'` is `p-6`. Today the
only source of that mapping is the block's `cva` map in `packages/blocks`, which `codegen` must not
import (ARCHITECTURE.md § Dependency graph, rule 3). Where does the mapping come from?

### Criterion (set before measuring)
One source of truth. The canvas and the export must spend the same class for the same prop value, and
the mechanism has to make a divergence *fail* rather than be noticed by a reader six months later.

### Measurement
Three candidates, measured against that criterion.

1. **A table in `codegen`, keyed by block id.** 72 entries duplicating the `cva` maps. Two sources of
   truth by construction, no gate that can compare them without importing `blocks`, and the id table
   is a `blocks` dependency in everything but the import graph.
2. **A vocabulary in `codegen`, keyed by prop name.** Fails on the measured facts above: one scale
   name, two classes, depending on the prop. It would emit `gap-6` where the canvas paints `gap-x-4`
   — a divergence that compiles and looks plausible.
3. **The descriptor carries it.** `codegen.classes` on the block, built from the same object the
   block's `cva` call already takes, so the two cannot be written twice. A registry-wide test can then
   assert `generateClasses(defaults)` against the block's own rendered `className` — one source, one
   gate.

### Decision
`CodegenDescriptor` gains `classes?: readonly ClassRule[]`, a discriminated union of three kinds:

| Kind | Meaning |
| --- | --- |
| `static` | classes the element always carries |
| `variant` | one prop, its values, and the classes each value spends |
| `custom` | a prop with no Tailwind equivalent: a CSS variable plus a rule |

`ClassRule` is data — serialisable, no closures — for the reason `ClientBoundary` gives for taking prop
*names* rather than a predicate (ADR-199): a meta-test can check a data declaration against the schema
and the rendered output, and cannot check a closure.

`custom` is the mechanism EXPORT_ENGINE.md asks for when it says a value with no Tailwind equivalent
becomes "a CSS variable plus a rule in the emitted stylesheet, never `[calc(100%-2.375rem)]`". The block
declares which prop that is; the pass emits `--ms-…` on the element and the rule in the stylesheet, with
a media query per breakpoint override.

### Consequences
- Accepted: the field is optional, and **none of the 72 catalogue entries declares it yet**. Until they
  do, `generateClasses` returns the element's static classes and nothing prop-derived, and the export's
  root elements are unstyled. That is the state this prompt leaves behind and it is escalated rather
  than papered over — the population is a `blocks` change across six closed categories, and the gate
  that proves it (COMPONENT_LIBRARY.md § Testing already lists "`codegen` produces a golden-file-matching
  output for `defaults`") belongs with it.
- Accepted: only the *root* element's classes are expressible. A block's inner markup is not in the
  descriptor at all, which is the larger gap escalated beside this one.
- Avoided: a second vocabulary that drifts from the one the canvas paints.

### Alternatives rejected
- Both alternatives above, for the measured reasons.
- Deriving the map from `controls` metadata: controls name the prop and its *options*, never the class.

## ADR-226 — `buildIR` takes one named input, and the preset catalogue is injected

**Date** 2026-08-22 · **Prompt** 42 · **Status** Accepted

### Question
Pass 4 asks every motion preset for its codegen fragment, so `buildIR` needs the preset catalogue.
EXPORT_ENGINE.md writes the entry point as `buildIR(document, registry, options)`. Does the catalogue
arrive as an import from `packages/motion`, or as an argument?

### Criterion (set before measuring)
The prompt's own verification: "a `node`-environment test importing `buildIR` without React". An
import wins only if it does not put React in `codegen`'s runtime graph.

### Measurement
`@motion-studio/motion`'s barrel exports `MotionNode`, `CssMotion`, `FramerMotion`, `GsapMotion`,
`MotionSchedulerProvider` and four hooks. Importing `presetRegistry` from it pulls all of them, so
`buildIR` would load React and the whole apply layer to read four fields off a preset. The types are
free — `import type` erases — but the registry value is not.

ADR-138 already answered the same question inside `packages/motion`: the catalogue arrives in
`ResolveContext` rather than being imported, so the model does not depend on the presets it plays.

### Decision
`buildIR(input: BuildIRInput)` with one named object: `document`, `registry`, `presets`, `options`, and
`selection` for `scope: 'selection'`. Four positional arguments where three of them are registries
reads worse at every call site than one named object, and the object is what makes `selection` — which
only one option value uses — expressible without a fifth positional.

`codegen` imports from `@motion-studio/motion` with `import type` only, so its runtime graph is
`schema` + `utils` and nothing else. EXPORT_ENGINE.md § Pipeline is corrected to the new signature in
the doc commit.

### Consequences
- Accepted: a caller must pass the catalogue. `apps/web` has it already — the motion panel and the
  canvas both hold it — so no new wiring, and the export dialog (prompt 45) passes what it already owns.
- Accepted: a document referencing a preset the caller did not supply produces an `unsupported`
  warning rather than a silent no-animation. That is the honest downgrade EXPORT_ENGINE.md § Warnings
  asks for.
- Avoided: React in the export engine's runtime graph, and a `node` test that passes only because
  React happens to be installed.

## ADR-227 — The client boundary, the runtime modules and the structured data are resolved in the IR

**Date** 2026-08-22 · **Prompt** 42 · **Status** Accepted

### Question
Three facts a printer needs live on the block descriptor: `client` (whether `'use client'` is
emitted — ADR-199), `runtimeModule` (a local module the export writes beside the component —
ADR-201), and `structuredData` (JSON-LD beside the element — ADR-194). EXPORT_ENGINE.md § React says
"the printer" reads them. But a printer is handed a `CodegenIR` and nothing else. Who resolves them?

### Criterion (set before measuring)
The pipeline's own rule, stated twice in EXPORT_ENGINE.md and once in ARCHITECTURE.md: "The IR exists
so printers are dumb… A printer only serialises." Anything that needs the registry, or that dedupes
across the document, is therefore IR work — a printer that reached for the registry would be a second
place where decisions are made, and the fifth target would re-solve them.

### Measurement
All three need the registry, and two of them need document-wide reasoning:

- `client` is `always | never | whenAnyProp`, and `whenAnyProp` has to be evaluated against the node's
  resolved props — a per-node decision, not a per-block one.
- `runtimeModule` is deduped by `path` across the document (ADR-201: "two blocks asking for the same
  `path` emit it once"). Dedupe across a document is the definition of a collection pass.
- `structuredData` is gated by a boolean prop (`enabledBy`), which again is per node.

### Decision
The IR carries all three, resolved once:

- `IRComponent.client: { emit: boolean; reason: string }` — `emit` is true when the block says so or
  when the component's own body needs a hook (motion, reduced motion). The two reasons are independent
  and either is sufficient, exactly as EXPORT_ENGINE.md § React states.
- `CodegenIR.modules: readonly IRModule[]` — deduped by `path`.
- `IRElement.structuredData` — the type and the already-evaluated decision to emit.

A block whose descriptor does not declare `client` makes `buildIR` throw `UndeclaredClientBoundaryError`
naming every offending block. ADR-199 put that failure in the printer; it is the same failure, moved to
where the decision is made. Warnings never block, so this cannot be a warning — an export that shipped
a page throwing in the browser would be exactly what ADR-199 refused.

### Consequences
- Accepted: **53 of the 72 catalogue entries do not declare `client`** — every block in `layout`,
  `hero`, `content`, `marketing`, `navigation` and `effects`. `buildIR` on a real document therefore
  throws today. Nothing calls it yet (the export dialog is prompt 45), and the fixture registry in
  `__golden__` declares the field, so the tests are not the thing keeping this green. Escalated, not
  deferred: cutting it to a warning would be the owner's call and not ours.
- Accepted: three fields the documented IR sketch does not list. EXPORT_ENGINE.md § The IR is corrected.
- Avoided: printers that hold a registry, and three implementations of `whenAnyProp` when the fourth
  target arrives.

### Alternatives rejected
- Pass the registry to the printers: makes every printer a decision site and contradicts the pipeline's
  stated reason for existing.
- Resolve `client` in the printer from the IR's `hooks` list alone: `hooks` cannot see a block that is
  interactive without a hook, which is most of `interactive`.

## ADR-228 — Two subtrees are the same shape when no class rule can tell them apart

**Date** 2026-08-22 · **Prompt** 42 · **Status** Accepted

### Question
Pass 1's third rule extracts a subtree repeated "≥ 2 times with identical structure, differing only in
leaf values" into one component with props. Which prop values are *leaf values*? Three pricing cards
differing in text must extract; three cards where one has an extra child must not. The hard case is
between them: two cards differing in a prop that changes the *markup* rather than the content.

### Criterion (set before measuring)
Extraction is correct exactly when the two instances can print from one component body. Anything the
component body bakes in at build time must therefore be part of the shape; anything that arrives as a
prop must not.

### Measurement
`generateClasses` resolves props into literal classes at build time — that is the whole of ADR-106 and
ADR-116, and it is why the IR holds `classNames` and not a class function. So a prop read by a class
rule is baked into the body: `grid` with `mode: 'auto-fit'` and `grid` with `mode: 'explicit'` print
different `className` strings from the same block and cannot share a component. A prop no class rule
reads reaches the body only as a value, and a value is a prop.

Two nodes' `responsive`, `motion`, `effects` and `hidden` are in the same position: all four change the
printed body, none of them can be a prop.

### Decision
The shape hash of a node is: its `blockId`, its slot, the ordered shape hashes of its children, its
`responsive` / `motion` / `effects` / `hidden`, and the values of exactly those props named by a
`ClassRule` in its descriptor. Every other prop value is a leaf, and a leaf that differs across
instances becomes an `IRProp` with the first instance's value as its default.

`extractProps: false` disables extraction where instances differ, because the component would then
print all three cards identically. Instances that differ in nothing are still extracted — there is no
prop to lift.

### Consequences
- Accepted: the criterion is only as good as the class plan. A block that declares no `classes` (all 72
  today — ADR-225) hashes on structure alone, so two nodes differing only in a layout prop would be
  extracted together and would print with the wrong layout. The population of `classes` is what closes
  it, and it is the same escalation.
- Accepted: extraction is skipped, not approximated, when it cannot be done — three cards with
  different structures stay three inlined subtrees, which is what a hand-written page would have.
- Avoided: a hash over "primitive values are leaves", which would have extracted `mode: 'auto-fit'` and
  `mode: 'explicit'` into one component and produced a page that looks right in the IR and wrong in the
  browser.

## ADR-229 — A prop that reaches neither a class nor an attribute is reported

**Date** 2026-08-22 · **Prompt** 42 · **Status** Accepted

### Question
A node's props reach the export through two declared routes: `codegen.classes` (ADR-225) and
`codegen.passthroughProps` ("props that print as attributes rather than as classes"). A block's
remaining props — `hero-centered`'s `title`, `subtitle`, `eyebrow` — reach neither, because the
descriptor does not describe the block's inner markup at all. What does `buildIR` do with them?

### Criterion (set before measuring)
The banned fourth way, applied to data: whatever happens must be checkable by a reader of the output.
Silently dropping the headline of a page and printing an empty `<section>` is the least checkable
outcome available.

### Measurement
Counted on the `full-landing` fixture, whose registry declares `classes` and `passthroughProps` on
every entry — the best case: **4 of its 11 nodes** still carry a prop with no route, five in total
(`links`, `title`, `items`, and the card's `plan` and `price`). Every one of them is *content*, which is
the half of a block the descriptor does not describe at all.

On the real catalogue the number is every prop of every node, because no entry declares `classes` yet
(ADR-225). So the gap is not an edge case to be handled; it is the shape of a missing subsystem, and
this pass can only decide whether to say so.

### Decision
`buildIR` emits one `unsupported` warning per node listing the props that reached neither route, with
the `nodeId` and a link to EXPORT_ENGINE.md § buildIR. Warnings never block, so the export still
produces its files — and the export report says, per node, exactly what is missing from them.

### Consequences
- Accepted: one warning per node with unrouted props — four on the fixture, and one per node on a real
  document until the descriptors grow. That is loud, and it is meant to be: a quieter form of it would
  be a gap nobody sees until a user reads their exported page.
- Accepted: the warning is not the fix. The fix is the escalated markup declaration, and this entry is
  what keeps the missing thing visible until that call is made.
- Avoided: an export that looks finished and ships blank sections.

## ADR-230 — An interactive block loose on the page becomes its own component

**Date** 2026-08-22 · **Prompt** 42 · **Status** Accepted

### Question
Pass 1's four rules give a component to the root, to a section-category child of the root, and to a
repeated subtree. Everything else inlines. Reading the IR of the `full-landing` fixture showed what that
costs: a `theme-toggle` dropped at the end of the page inlines into the entry component, the entry
component therefore holds something that calls a hook, and the whole page becomes a Client Component.

### Criterion (set before measuring)
EXPORT_ENGINE.md § React states the target in its own rule table — "a static section stays a Server
Component" — and prompt 43 names the failure: "Getting this wrong means a fully client-rendered page,
which defeats the point of the Next export." So the criterion is a property of the emitted IR: **the
entry component carries `client.emit === false` unless the root block itself declares a boundary.**

### Measurement
Before: `full-landing` produced five components, and the entry one was
`{ emit: true, reason: 'It writes the colour mode.' }` — one 8-pixel button making six sections of static
markup render on the client.

After: six components, and the entry is `{ emit: false }`. `Nav`, `HeroSection`, `Pricing` and
`ThemeToggle` carry the directive; `Page` and `PlanCard` do not.

### Decision
A fifth boundary, applied after rule 2 and before rule 3: a node whose client boundary is **active at
its own props** and which has no boundary between it and the root becomes its own component.

The second half of that is what keeps it from becoming a file per button. Inside a section, the section
is already the client component and splitting again buys nothing — so only the nodes that would land in
the entry are lifted. `whenAnyProp` is evaluated, not assumed: a `carousel` with no arrows, no dots and
no autoplay stays inlined, because at those props it is a scroll-snap strip.

### Consequences
- Accepted: a page with several loose interactive blocks gets several small files. That is what a person
  writing the page by hand would have, and the alternative is a page that ships as one client bundle.
- Accepted: a fifth rule where the document lists four. It is derived from the document's own stated
  target rather than added to it, and the criterion above is a test rather than a preference.
- Named: this is also the rule that makes prompt 43's "a Next page composing client components is not
  itself a client component" reachable. Without it the IR could not express that page.

### Alternatives rejected
- Give every `interactive`-category node its own component: splits blocks that need no directive and
  ignores `whenAnyProp` entirely.
- Leave it and let the printer decide: the printer holds no registry, which is ADR-227.

## ADR-231 — Rule 2 reads the document's root, not the export's root

**Date** 2026-08-22 · **Prompt** 42 · **Status** Accepted

### Question
`scope: 'selection'` runs the same pipeline over one subtree — it is what powers **Copy React** on a
single node. Pass 1's rule 2 gives a component to each section-category *direct child of the root*. Which
root: the document's, or the one the export starts from?

### Criterion (set before measuring)
Rule 2's stated purpose, quoted: "This is what makes a Next.js export look like a real project rather
than one 900-line page." A rule whose justification is about a page applies where there is a page.

### Measurement
Selecting the pricing section of `full-landing` and reading the export root: with rule 2 keyed to the
export root, the three `plan-card` children are `marketing`-category direct children, so they became
three components — `PlanCard`, `PlanCard2`, `PlanCard3` — three files for three identical cards. With it
keyed to the document root, rule 2 matches nothing and rule 3 extracts them into one `PlanCard` with two
props, which is what the same three cards produce when the whole document is exported.

### Decision
Rule 2 reads `document.rootId`. A selection export therefore sees rules 1, 2b, 3 and 4 only, and a
selection that happens to *be* the document root behaves exactly like a document export.

### Consequences
- Accepted: **Copy React** on a section never splits its contents into files, whatever their categories.
  A clipboard paste is one component, which is what the button promises.
- Accepted: the same subtree can produce different boundaries in a selection export and in a document
  export. That is the intent — one is a page and the other is a component — and the two agree wherever
  rule 2 was not the reason for the split.

## ADR-232 — The theme's CSS reaches the printers as an argument, not as an import

**Date** 2026-08-22 · **Prompt** 43 · **Status** Accepted

### Question
The Next target emits `app/globals.css` with the resolved theme variables and a `<head>` script that
sets the colour mode before first paint. Both strings are already produced by
`packages/theme/src/export/` and `packages/theme/src/script/`. How does `packages/codegen` get them?

### Criterion (set before deciding)
Two documents constrain this and they must both hold. `ARCHITECTURE.md` § Dependency graph rule 3:
"`codegen` depends on `schema` only." `THEME_ENGINE.md` § Theme in export: "`packages/codegen` reads
the same functions rather than restating them." A resolution that breaks either is wrong.

### Decision
`PrintInput` carries an optional `theme: { css, colorModeScript }`, and the caller — the export dialog
in `apps/web`, which already depends on `theme` — passes `toCssVariables(resolveForExport(config))` and
`COLOR_MODE_SCRIPT`. This is ADR-226 applied a second time: the preset catalogue arrives as an argument
for the same reason, and for the same kind of edge in the graph.

Nothing is restated: `codegen` contains no palette maths, no ramp, and no variable names. Absent, the
printer emits the project without a stylesheet body and warns, rather than inventing one.

### Consequences
- Accepted: a caller can pass a stylesheet that does not match the document's theme. The alternative
  was an edge from `codegen` to `theme` that `check-deps` would have to be told to allow.
- Accepted: a `next` export printed with no `theme` argument compiles and runs unstyled beyond the
  Tailwind classes. That is the honest downgrade — a missing argument is not a reason to fail an
  export, and the warning names it.
- Named: `THEME_ENGINE.md` § Theme in export says codegen "reads the same functions". It receives their
  output. The sentence's intent — one generator, not two — holds either way.

## ADR-233 — Custom properties in a printed `style` prop

**Date** 2026-08-22 · **Prompt** 43 · **Status** Accepted

### Question
A `custom` class rule puts a CSS variable on the element: `style={{ '--ms-section-tint': 'oklch(…)' }}`.
React's `CSSProperties` is `csstype`'s `Properties`, which declares no index signature. Does the plain
object literal type-check, or does the printed attribute need an annotation?

### Criterion (set before measuring)
Print the plain object literal if `tsc --noEmit` accepts it under the golden project's own
`tsconfig.json` with the React 19 types the export declares. Add `as CSSProperties` and the type-only
`react` import only if it does not. The generated code carries no cast it does not need.

### Measurement
`@types/react` 19.2.18, `tsc` 5.6, `strict`, `jsx: react-jsx`:

```
<div style={{ '--ms-section-tint': 'oklch(22% 0.02 285)' }} />
  error TS2353: Object literal may only specify known properties, and
  ''--ms-section-tint'' does not exist in type 'Properties<string | number, string & {}>'.
```

The same element with `as CSSProperties` and a type-only `react` import compiles clean.

### Decision
The printer emits `style={{ … } as CSSProperties}` and adds `import type { CSSProperties } from 'react'`
to that component's imports. The annotation is printed **only** for an element that carries custom
properties, so a component with none takes no React type import.

### Consequences
- Accepted: a cast in generated code. It is the one the React types require for a documented CSS
  feature, and the measurement is what puts it there rather than a habit.
- Accepted: the answer is tied to a `@types/react` version. `test:compile` re-checks it on every run, so
  a types release that removes the need fails nothing and one that changes the shape fails loudly.
- Rejected: `style={{ ['--x' as string]: … }}`, which type-checks by widening the key rather than the
  object and reads as a trick.

## ADR-234 — A statically listed sibling carries no `key`

**Date** 2026-08-22 · **Prompt** 43 · **Status** Accepted

### Question
Pass 1 extracts three identical cards into one `PlanCard`, and `referenceElement` gave each instance a
`key` — the node's id. Should the printer emit it?

### Criterion (set before deciding)
`EXPORT_ENGINE.md` § React's rule table, last row: "No editor artifacts — no `data-node-id`, no
wrappers, no dead classes." A node id is the editor artifact that row names first. Separately, React
requires `key` only for children produced from an array; three siblings written out in JSX are not.

### Measurement
`full-landing`, printed with the key: `<PlanCard key="node_plan1" plan="Starter" price={0} />`. The
document's internal identifier, verbatim, in code the user pastes into their project. Printed without
it the three lines carry the two props the cards actually differ in and nothing else.

### Decision
`referenceElement` stops setting `key`. `IRElement.key` stays in the type — `EXPORT_ENGINE.md` § The IR
specifies the field, and `print-element.ts` prints it when it is set — but nothing in `buildIR` sets it
today, and a producer may only set it for children that are genuinely mapped from an array.

### Consequences
- Accepted: a field with no producer. Removing it instead would put `codegen` out of step with the IR
  the document specifies, which is the larger of the two costs.
- Rejected: keying on the instance ordinal. It is not a node id, but it is still a key on children that
  do not need one, and a reader would have to work out why it is there.

## ADR-235 — The golden harness: generated documents, checked-in output, `tsc` in place

**Date** 2026-08-22 · **Prompt** 43 · **Status** Accepted

### Question
`EXPORT_ENGINE.md` § Testing specifies `__golden__/documents/*.motion.json` beside
`__golden__/expected/`. The same documents already exist as typed builders in `src/test/documents.ts`,
which 171 IR tests run against. Two copies of a fixture drift. How are both satisfied?

### Criterion (set before deciding)
One authoring source, because a fixture that can disagree with itself proves nothing; and the files the
document specifies present on disk, because prompt 46 and the playground read documents rather than
build them.

### Decision
`src/test/documents.ts` stays the source. `pnpm golden:update` serialises each entry through
`serializeDocument` into `__golden__/documents/<name>.motion.json` and prints every
`(document × target × option-set)` into `__golden__/expected/`. The golden test reads the JSON files
back through `documentSchema.parse`, so a stale JSON file fails rather than being ignored, and the
export it drives is one that survived serialisation.

`test:compile` copies each expected project byte for byte into `.compile/` and runs `tsc --noEmit`
there: a `next` project against **its own printed `tsconfig.json`**, a `react` output against one host
config, because a React export is not a project — the user pastes it into theirs. The copy is what
makes the golden tree assertable at all: `tsc` and Next both write into a project they inspect, and a
golden tree with `next-env.d.ts` and `*.tsbuildinfo` in it would fail its own file-list assertion.

### Consequences
- Accepted: `packages/codegen` gains `react`, `react-dom`, `next`, `motion`, `gsap` and their types as
  **dev** dependencies, so the golden tree resolves its imports. The runtime graph is unchanged and
  `no-react.test.ts` still enforces it per file.
- Accepted: `next-env.d.ts` is written into each copied `next` project before `tsc` runs, and the React
  copies get a host `tsconfig.json`. Next generates the first itself on `next build` and the second is
  the project the user already has; neither is an edit to the export.
- Accepted: updating a golden is a two-step ritual — run the script, read the diff. That reading is the
  review gate the document asks for, and making it one step would remove it.

## ADR-236 — The token target's four formats arrive as an argument; `codegen` writes none of them

**Date** 2026-08-22 · **Prompt** 44 · **Status** Accepted

### Question
Prompt 44 asks for `printers/tokens/print-css-vars.ts`, `print-tailwind-config.ts`,
`print-json-tokens.ts` and `print-figma-tokens.ts` inside `packages/codegen`. Those four generators
already exist, in `packages/theme/src/export/`, written by prompt 36. Does `codegen` get a second
copy, an import, or the output?

### Criterion (set before deciding)
Two documents and one existing test constrain this, and all three must hold.
`THEME_ENGINE.md` § Theme in export: "The four generators live in `packages/theme/src/export/` and
take a `ThemeResolution`, so the formats cannot disagree with each other or with what the export
engine emits — `packages/codegen` reads the same functions rather than restating them."
`ARCHITECTURE.md` § Dependency graph rule 3. And `packages/codegen/src/no-react.test.ts`, which
imports the barrel in a `node` environment and fails if React is in the runtime graph.

### Measurement
`@motion-studio/theme`'s barrel re-exports `src/apply/use-color-mode.ts`, a React hook. Importing the
package — the only legal form, since deep imports are banned by rule 6 and the contract's barrel-only
rule — puts React in `codegen`'s runtime graph and fails `no-react.test.ts`. Measured, not predicted:
the same edge ADR-226 rejected for the preset catalogue.

A second copy fails the other constraint outright. The formats "cannot disagree" only because there
is one resolution and one set of generators; two sets is the disagreement the sentence forbids.

### Decision
`PrintedTheme` gains a `tokens` field: the four format strings, printed by
`packages/theme/src/export/TOKEN_FORMATS` and handed over. `printTokens` decides file names, file
order and the export report, and writes no token syntax of its own. This is ADR-232 a third time.

The parity assertion prompt 44 asks for — "the accent colour is byte-identical across all four
outputs" — is already made where it can be real, at `packages/theme/src/export/export.test.ts`
§ "all carry the same accent, because they come from one resolution". Restating it in `codegen`
against an injected fixture would assert the fixture.

### Consequences
- Accepted: prompt 44's deliverable list names four files this session does not create. The list is
  superseded by `THEME_ENGINE.md`, which is the specification; § 9.1 makes the document win.
- Accepted: a caller can hand over token strings that do not match the document's theme, the same
  hole ADR-232 accepted for `theme.css`. The alternative is the graph edge above.
- Accepted: the `tokens` target with no `tokens` argument emits nothing and warns, rather than
  emitting a theme it invented.

## ADR-237 — The HTML target resolves `singleFile` to true

**Date** 2026-08-22 · **Prompt** 44 · **Status** Accepted

### Question
`buildIR` splits a document into components: an entry plus one per section, plus one per repeated
subtree. A single self-contained `index.html` has no module boundary to spend them on. Does the HTML
printer inline the component references itself, or does the IR arrive already flat?

### Criterion (set before deciding)
`EXPORT_ENGINE.md` § Pipeline, stated twice: "The IR exists so printers are dumb… A printer only
serialises." A printer that substituted a component's root for its reference, rewrote
`{ kind: 'reference' }` attributes into the caller's values, and merged two components' hoisted
constants would be re-running passes 1 and 3. That is the second decision site the IR exists to
prevent.

### Decision
`resolveOptions` resolves `singleFile: true` whenever `target` is `html`. The option already produces
exactly the tree the HTML target needs — one component, everything inlined — and it produces it in
pass 1, where component boundaries are decided.

### Consequences
- Accepted: the export dialog's "Single file" checkbox is not a free choice under HTML. It reflects
  the resolved option, so it reads as checked and disabled, which is the honest presentation of a
  setting the target fixes.
- Accepted: `extractProps` still runs, and under `singleFile` it extracts nothing, because rule 3's
  output is a component and rule 1 has already claimed every node. No warning is emitted for it: the
  props still reach the markup, inlined at each site.
- Named: `json` and `tokens` ignore `singleFile` entirely; neither reads the component list.

## ADR-238 — The HTML target's utility CSS is a transcribed table pointing at `--ms-*` variables

**Date** 2026-08-22 · **Prompt** 44 · **Status** Accepted

### Question
`class="rounded-lg bg-surface-1 px-6"` has to become real CSS in a file with no build step. Does the
generated rule carry a resolved value (`border-radius: 12px`) or a variable reference
(`border-radius: var(--ms-radius-lg)`)?

### Criterion (set before deciding)
The rule must paint what the React export paints, or the two targets disagree about the same
document and one of them is lying. What the React export paints is decided by `packages/tokens`
§ to-tailwind, which is the `@theme` block Tailwind reads.

### Measurement
`packages/tokens/src/build/to-tailwind.ts` maps every Tailwind namespace onto a runtime variable and
never onto a value: `--radius-lg: var(--ms-radius-lg)`, `--color-surface-1: var(--ms-color-surface-1)`,
`--spacing-6: var(--ms-space-6)`. So in a real build `rounded-lg` already resolves through
`--ms-radius-lg`. A resolved value in the HTML target would be a third spelling of the same token and
would stop responding to the colour-mode switch the same file ships — measured against that file's own
`data-color-mode` block, which only moves variables.

### Decision
`utility-rules.ts` transcribes the utility families the class vocabulary can produce, and every
themed declaration points at the `--ms-*` variable the `@theme` block points at. The theme's `:root`
blocks are inlined in the same document, so the variables are defined.

A class with no entry in the table emits no rule and one `unsupported` warning naming it. Guessing a
declaration from a class name is how a generator silently paints the wrong thing.

### Consequences
- Accepted: the table is a transcription and can fall behind Tailwind, exactly like
  `ir/tailwind/class-order.ts`. Both are tested against the classes the descriptors can produce
  rather than against Tailwind's whole surface, and an unknown class is reported, not invented.
- Accepted: an arbitrary-value class — `grid-cols-[repeat(auto-fit,minmax(16rem,1fr))]` — is read by
  unwrapping the bracket rather than by a table entry, because the value is in the class.
- Accepted: a document whose theme is not passed exports HTML whose variables are undefined, so the
  page renders with browser defaults. The same warning `printReact` emits already names it.

## ADR-239 — The IR records which presets an element carries, so a target can approximate them

**Date** 2026-08-22 · **Prompt** 44 · **Status** Accepted

### Question
`approximate-motion.ts` maps `magnetic` to a hover transform and `particles` to nothing, each with a
named warning. Pass 4 currently turns a preset into `motion.section` plus four attributes and keeps
no record of which preset produced them. Where does the HTML target learn the preset id?

### Criterion (set before deciding)
The same rule ADR-227 applied: anything that needs the registry, or that dedupes across the document,
is IR work; anything that is target-specific serialisation is printer work. The preset id on a node
is a *fact* the registry supplies. The CSS a given preset degrades to is a *decision* only the HTML
target makes.

### Decision
Pass 4 records `{ presetId, engine, channel }` per applied spec, `NodeMotion` carries it, and
`IRElement.motion` holds it. The React and Next printers never read the field — they print the
attributes pass 4 baked. `approximate-motion.ts` reads it and nothing else.

The alternative considered and rejected: parsing the baked attribute code — `initial="hidden"`,
`transition={fadeUpTransition}` — back into an animation. That is a decompiler, and it would fail on
the first preset whose fragment names a helper.

### Consequences
- Accepted: `IRElement` grows a field two of four printers ignore. It is a fact rather than a
  decision, which is the line ADR-227 drew, and the alternative put a parser in a printer.
- Accepted: a preset the approximation table does not name is omitted with an `unsupported` warning
  carrying its id, so a new preset degrades loudly rather than silently.

## ADR-240 — The JSON target does not build an IR

**Date** 2026-08-22 · **Prompt** 44 · **Status** Accepted

### Question
Every other target is `buildIR` then a printer. The JSON target's whole output is
`serializeDocument(document)`. Does it take a `PrintInput` like the others, for uniformity?

### Criterion (set before deciding)
`EXPORT_ENGINE.md` § JSON, in full: "`serializeDocument` from FILE_FORMAT.md. Byte-stable." And
prompt 44: "Do not reimplement — a second serialiser would drift from the byte-stability guarantee."
Byte-stability is a property of the document, and nothing in the IR is in the output.

### Decision
`printJsonTarget({ document })` has its own input type and returns the same `ExportResult` the others
do. It never reads a `CodegenIR`. A uniform `PrintInput` would have required a `document` field that
three of the five targets never read, and would have suggested — falsely — that the JSON output can
disagree with the IR.

### Consequences
- Accepted: prompt 45's orchestrator branches on the target before it decides whether to call
  `buildIR` at all. That is cheaper than building an IR nobody reads, and it is one `switch`.
- Accepted: the IR's warnings do not reach the JSON export report. They are statements about
  generated code, and this target generates none.

## ADR-241 — The HTML target ships no base64 font, because the theme has no font files

**Date** 2026-08-22 · **Prompt** 44 · **Status** Accepted

### Question
Prompt 44 fixes the font policy: a system stack plus a commented-out `@font-face` by default, and
under `assets: 'inline'` "a base64 `woff2` subset (latin, the two used weights) inside the
`@font-face`". What does `assets: 'inline'` emit?

### Criterion (set before measuring)
The subset has to be produced from a font file the repository holds. If no file exists there is
nothing to encode, and emitting an empty `src` would produce a document that silently falls back
while claiming to self-host.

### Measurement
The repository holds no font binaries. `packages/theme`'s pairings name Geist, Inter, JetBrains Mono,
Satoshi, Söhne and Berkeley Mono; ADR-025 already records that three of them are declared with no
files, and the other three are fetched at build time by `next/font/google`, which is a build step the
HTML target does not have. Zero files, five pairings.

### Decision
Both modes emit the system stack and the commented `@font-face` block. Under `assets: 'inline'` the
export additionally carries an `unsupported` warning naming the families and the fact that no file is
available to encode. The one-line comment in the CSS states which mode produced it, as the prompt
requires, and under `inline` it states why the mode changed nothing.

### Consequences
- Accepted: `assets: 'inline'` is inert for fonts in the HTML target until font files land. It still
  governs images, which is where the option's other half lives.
- Named: this is a downgrade against the prompt's stated behaviour, produced by a measurement rather
  than by preference. When the files exist, the encoder is the only thing missing.

## ADR-242 — The HTML target resolves `imageComponent` to `img`

**Date** 2026-08-22 · **Prompt** 44 · **Status** Accepted

### Question
`imageComponent` is a user-visible control with two values, and its default is `next-image`. The HTML
target has no React and no Next. What does it do with the default?

### Criterion (set before measuring)
The emitted document has to render the image. Anything that does not is wrong regardless of what the
option said.

### Measurement
Printed with the option left at its default, the full-landing HTML export emitted
`<image src="…" width="1600" height="1000">`. HTML has no `image` element; the name is the SVG one,
and in an HTML document the parser produces an unknown element that lays out as an empty inline box.
The image did not render. Measured on the golden output before the fix.

### Decision
`resolveOptions` resolves `imageComponent: 'img'` whenever `target` is `html`, beside the `singleFile`
resolution ADR-237 made. Pass 6 then emits the plain-`img` attribute set it already knows —
`loading="lazy"`, `decoding="async"`, and no `sizes`/`placeholder`, which `AssetResult.suppressed`
already strips.

The alternative — a printer that rewrote the tag — was rejected for ADR-237's reason: the attribute
set differs between the two components, so the rewrite would have to redo pass 6's work in a printer.

### Consequences
- Accepted: the dialog's image control is fixed under HTML, the same way the single-file checkbox is.
  Both read as resolved rather than chosen, which is what they are.
- Accepted: `resolveOptions` is now the one place a target may narrow an option. A third such rule
  would be a sign the option set is wrong rather than the resolution.

## ADR-243 — Every catalogue entry declares its client boundary, read as the block's own behaviour

**Date** 2026-08-23 · **Prompt** 45 · **Status** Accepted

### Question
The export dialog runs `buildIR` on the user's document, and ADR-199 makes an undeclared
`codegen.client` a hard error rather than a guess. Fifty-three of the seventy-two registry entries —
`layout`, `hero`, `content`, `marketing`, `navigation` and `effects` — declare none, so every document
built from the shipped catalogue throws. What does each of them declare, and by what rule?

### Criterion (set before the audit)
The rule is not new: it is the one the nineteen existing declarations were written under, read back off
them. `input-field` declares `always` because it calls `useId`, and `carousel` declares
`whenAnyProp: ['arrows', 'dots', 'autoplay']` even though `useCarousel` is called at every prop set.
So the subject of the declaration is **the block's own realisation at that prop set** — the component
the export exists to reproduce — and not what today's printer happens to emit for it.

Read off the render component and everything it composes:

- a `'use client'` directive, a hook call, an event handler or a browser API, unconditionally → `always`
- the same, reachable only when a named prop is set → `whenAnyProp` on those props
- markup and CSS at every prop set → `never`

### Audit
Fifty-three declarations, from the render tree of each block:

| Declaration | Count | Blocks |
| --- | --- | --- |
| `never` | 40 | all seven of `layout`, five of six `hero`, seven of nine `content`, eight of twelve `marketing`, `footer`, and twelve of thirteen `effects` |
| `always` | 8 | `cta-split`, `faq-accordion`, `newsletter-form`, `breadcrumbs`, `dock`, `navbar`, `navbar-floating`, `sidebar-nav` |
| `whenAnyProp` | 5 | `hero-video` (`src`), `video` (`autoplay`), `code-block` (`showCopyButton`), `pricing-table` (`showToggle`), `spotlight` (`followPointer`) |

The twelve `never` effects are the reason the category was worth auditing rather than assuming: each
one is a `div` carrying custom properties and a CSS animation, `particles` included — it places its
field from a hash of the seed rather than from a canvas, which is what lets it export as markup.

### Decision
All fifty-three declare, with the reason each block's own component gives. `registry.meta.test.ts`
stops asserting which categories have declared one and asserts that every definition does, so the next
block cannot be added without one.

### Consequences
- Accepted: eight `always` and five `whenAnyProp` declarations sit on blocks whose *printed* markup
  today is a root element with classes on it, because no block declares its internal markup yet — the
  open escalation from prompts 42 to 44. The declaration describes the block, so it is right the moment
  that lands and over-declares in the safe direction until then: `'use client'` on a component that
  needs nothing costs the reader Server Components, and the other guess ships a page that throws.
- Named: `ClientBoundary` cannot say "this prop equals this value". `cta-split` is the case — only
  `side: 'form'` needs the boundary, and `whenAnyProp: ['side']` is true at both of its values — so it
  declares `always`. A fourth `whenPropEquals` kind would express it, and is not added for one block.
- `buildIR` no longer throws on a document made from the shipped catalogue, which is what the export
  dialog needs to run at all.

## ADR-244 — The export generates on the main thread, inside a transition

**Date** 2026-08-23 · **Prompt** 45 · **Status** Accepted

### Question
The export dialog opens in the frame the button is pressed and then generates. Does the generation run
on the main thread or in a Web Worker?

### Criterion (set before measuring, by the prompt)
`buildIR` + print + format on the sixty-node fixture, median of nine runs. Under 100 ms → the main
thread, wrapped in `startTransition`. At or over 100 ms → a worker. 100 ms is where a user reads the
dialog as blocked rather than as working.

The profile the prompt does not name, named here: the studio's own — `/studio` is a desktop surface,
so the number is taken unthrottled on the machine the studio runs on, and the sensitivity to a slower
machine is reported with it rather than assumed away.

### Measurement
`pnpm measure:export`, which runs the three calls the dialog runs, in order, under node — the same V8,
and Prettier's string work is the same work in both. The fixture is `export-landing`, sixty nodes of
the real catalogue, committed. Nine runs after one discarded warm-up, medians in ms:

| Target | Files | `buildIR` | Print | Format | Total |
| --- | --- | --- | --- | --- | --- |
| `react` | 20 | 1.5 | 0.3 | 46.4 | **48.1** |
| `next` | 24 | 1.3 | 0.4 | 43.1 | 45.0 |
| `html` | 1 | 0.9 | 0.4 | 33.6 | 34.8 |
| `json` | 1 | — | 0.5 | 1.8 | 2.3 |
| `tokens` | 4 | — | — | 24.6 | 24.6 |

Two numbers beside it, from the same script: the 200-node stress fixture is 50.5 ms and the 101-node
motion-heavy one 31.3 ms on `react`. The pipeline does not scale with the node count the way a reader
would expect, because pass 1 dedupes repeated subtrees into one component — a landing page's twentieth
band costs the printer nothing.

### Decision
Main thread, inside `startTransition`. 48.1 ms against a 100 ms threshold.

The sensitivity, since a single number invites a single machine: **format is 46 of the 48 ms.** The IR
and the printers together are under 2 ms, so the entire measurement is Prettier, and `format: false` —
a control the dialog already has — is a 20× cut. The margin to the threshold is 2.1×, so a machine
half this speed still passes and a 4× throttled one would not. A worker would move a 48 ms task off a
thread that is not painting anything during it, and would cost the structured-clone of the document in
and the files out, a second module graph, and a fallback path for the browser that fails to start it.

### Consequences
- Accepted: on hardware around 4× slower than this machine the generation is a long task. It is not a
  frame budget — nothing animates while it runs, the dialog is already on screen with per-file
  skeletons, and the transition keeps the shell interactive.
- Accepted: `startTransition` is what makes this legal rather than the measurement alone. Generation
  that blocked the render path at 48 ms would drop three frames of whatever the canvas was doing.
- The threshold and the script are both committed, so the decision can be re-run rather than argued.
  If a target or a printer grows, `pnpm measure:export` is the check.

## ADR-245 — The code viewer highlights with the catalogue's tokeniser, not Prism

**Date** 2026-08-23 · **Prompt** 45 · **Status** Accepted

### Question
EXPORT_ENGINE.md § Export dialog specifies "`prism`-lite at runtime for generated code — dynamically
imported", and PERFORMANCE.md budgets 24 kB gzip for a runtime highlighter. What highlights the
generated code?

### Criterion
Contract § 1.10: a new dependency needs a check that an existing one cannot do the job. The job is
five colours over TypeScript, JSON, CSS, HTML and Markdown, in a panel whose content is generated a
moment earlier and is never read as a document.

### Measurement
`packages/blocks/src/content/code-block/highlight.ts` already does exactly this job, for exactly this
reason: ADR-124 measured `shiki` against it for the `code-block` block and recorded the same argument
this panel would restate. 168 lines, no dependency, no WASM, and its language list already covers
`ts`, `tsx`, `json`, `css`, `html` and `bash` — every extension the five targets emit except `.md`,
which is plain text in a highlighter's terms anyway.

### Decision
Reuse it. `packages/blocks` gains a `./highlight` subpath export — beside the `./registry` one, and for
the same reason: the tokeniser is pure TypeScript with no React in it, and the barrel is 59 components.
The export dialog imports it dynamically, so it lands in its own chunk rather than in the studio's.

EXPORT_ENGINE.md § Export dialog is corrected in its own commit: the document said `prism` before the
catalogue had a tokeniser of its own, and two highlighters in one product is the defect the sentence
was trying to prevent.

### Consequences
- Accepted: the generated code is highlighted to the same fidelity as a `code-block` on a marketing
  page — five kinds of token, no semantic colouring. In a panel whose text was generated by this
  repository a moment earlier, a wrong colour cannot mislead anyone about correctness.
- Accepted: `@motion-studio/blocks` now has a third entry point, and a consumer could import the
  tokeniser without the registry. That is the point of a subpath.
- No dependency added, and the 24 kB the budget reserved for a highlighter is not spent.

## ADR-246 — The export orchestrator is a studio hook, because `codegen` may not import the registry

**Date** 2026-08-23 · **Prompt** 45 · **Status** Accepted

### Question
Prompt 45 writes the Copy React path as `exportDocument(document, { ...defaults, scope: 'selection' })`.
Where does that function live?

### Criterion
Already specified. ARCHITECTURE.md § Dependency graph and the contract's directory law: `codegen` may
depend on `schema` and `utils`, and not on `blocks`, `motion` or `theme`. ADR-226 already applied it —
`buildIR` takes the registry and the preset catalogue as arguments so that the exporter does not pull
React into node — and ADR-232 applied it again for the theme.

### Decision
There is no `exportDocument(document, options)` in `codegen`, because the two arguments are not enough:
the pipeline needs the block registry, the preset catalogue and the printed theme, and all three are
the caller's to supply. The orchestrator is `apps/web/src/components/studio/export/run-export.ts`,
which is the one place that holds all five inputs, and `use-export` and `use-copy-selection` both call
it — one code path, which is what the prompt's requirement is actually about.

### Consequences
- Accepted: the signature in the prompt does not exist under that name. What it asks for — one pipeline
  for the dialog and for the context menu — is what `run-export` is.
- The orchestrator is where the target-to-printer table lives, which is the switch `print-case.ts`
  deliberately left to this prompt rather than inventing a second one beside the fixtures.
- `codegen` keeps exporting parts rather than a façade, so the playground and the docs site can print
  one file without constructing a whole export.

## ADR-247 — `codegen` exports its option set on its own subpath

**Date** 2026-08-23 · **Prompt** 45 · **Status** Accepted

### Question
The dialog's controls have to render in the frame the button is pressed, and two of the things they
render are `codegen`'s: `DEFAULT_EXPORT_OPTIONS`, the set they open on, and `resolveOptions`, which
decides whether a control reads as a choice or as fixed. Both live in `codegen`, which
PERFORMANCE.md § Mandatory dynamic imports forbids in the studio's first load. Where do they come from?

### Criterion
Already specified twice over, and the two specifications collide: the option set is a single source of
truth (ADR-237 and ADR-242 put the resolution in exactly one place so the dialog cannot disagree with
the printer), and the 45 kB pipeline may not be in the studio chunk. Any answer that restates the
defaults or the resolution rule in `apps/web` breaks the first; any answer that imports the barrel
breaks the second.

### Decision
`packages/codegen` gains `"./options": "./src/options.types.ts"`, beside the precedent
`packages/blocks` set with `./registry`. The file is the whole option vocabulary and has **no imports
at all** — two constants, one six-line resolver and the types — so the subpath is about a kilobyte and
carries none of the pipeline. The measured chunk split confirms it: `codegen` is its own 25 kB gzip
chunk and is absent from the studio's page chunk.

The alternative shape — the dialog rendering its controls from whatever the last generation returned —
was rejected on behaviour: for the first frames after opening, and for the frames after a target
change, every control would read as a free choice while the export had already fixed two of them.

### Consequences
- Accepted: a third entry point into `codegen`, and a consumer could import the option set without the
  pipeline. That is what the subpath is for.
- The dialog's panel is correct in its first frame rather than after a round trip, and there is still
  exactly one place that knows `html` means `singleFile`.

## ADR-248 — The export dialog's own code stays in the studio chunk, and it costs 23 kB

**Date** 2026-08-23 · **Prompt** 45 · **Status** Accepted

### Question
The command palette and the shortcut sheet are `next/dynamic` chunks, mounted only while open
(ADR-152). The export dialog is the same kind of surface. Is it a chunk too?

### Criterion
Prompt 45 states the requirement it is judged on: "The dialog appears in the frame the button is
pressed. **Never** await generation before showing the dialog." A chunk fetched on the click is a
fetch the first open has to await, so the two cannot both be true. What is negotiable is the price,
which is measured rather than assumed.

### Measurement
Two production builds of `apps/web`, identical but for the `<ExportDialog />` mount, First Load JS for
`/studio`:

| Build | First Load JS |
| --- | --- |
| Without the dialog | 322 kB |
| With the dialog | **345 kB** |

23 kB. It is not the dialog's own JSX, which is six small files: it is the inspector's control layer.
`ControlRow`, `SwitchField`, `SegmentedField` and `SelectField` were reachable only from the
inspector, which is code-split, so they lived in the inspector's chunk. A statically imported dialog
that uses the same controls makes them shared, and shared means first load.

The four modules the budget actually names are all where they should be, measured from the chunk
contents of the same build:

| Module | Chunk | Size (gzip) |
| --- | --- | --- |
| `@motion-studio/codegen` | `750.*.js` | 25 kB |
| `jszip` | `3482.*.js` | 27 kB |
| Prettier standalone + 5 plugins | `0a040314.*`, `bf1ccba6.*`, `d2fe6198.*`, `4683.*`, `4756.*` | 79 kB for the largest |
| `@motion-studio/blocks/highlight` | `787.*.js`, `9710.*.js` | 2 kB |

None of the four appears in `app/studio/page-*.js`.

### Decision
Static import, mounted always, opened on `ui.exportDialogOpen`. The price is 23 kB on a budget ADR-179
already recorded the owner accepting an overrun on, and it buys the one property the surface is judged
on.

### Consequences
- Named for the owner: `/studio` first load is now 345 kB against a 250 kB budget. 322 of that predates
  this prompt (ADR-179); 23 is this dialog and 2 is the fifty-three client-boundary sentences the
  registry now carries.
- Accepted: the controls move rather than duplicate. A user who opens the inspector downloads the same
  bytes either way; what changed is that they arrive in the first load instead of on first open.
- The escape hatch, if the budget is ever enforced: `next/dynamic` plus a preload after hydration —
  the shortcut map's arrangement. It trades the guarantee for a probability, which is why it was not
  taken here.

## ADR-249 — A block produces its own markup as IR, and a DOM parity test checks it

**Date** 2026-08-23 · **Prompt** 45a · **Status** Accepted

### Question
A block's descriptor describes its root element and nothing else, so `hero-split` exports as
`<motion.section />` — a self-closing tag with no headline, no image and no classes. Measured on the
sixty-node fixture: 17 components, 19 files, **0** classes across the whole export and 42 `unsupported`
warnings. The same gap has been escalated three times (prompts 42, 43, 44). Where does a block's
interior come from, and how is it kept honest?

### The options, and the numbers that separate them
Counted across the catalogue: **771 elements** and **261 conditionals or iterations**. 53 of 72 entries
are 15 elements or fewer; the largest is `pricing-table` at 53 elements and 23 conditionals.

**A declarative markup plan in the descriptor.** To carry 261 conditionals, iteration over arrays of
objects, and prop interpolation into text and attributes, the language has to be nearly as expressive
as JSX. That is a template language, an evaluator in `codegen`, and a compiler from it to IR. Its
claimed advantage — ADR-225's "a declaration can be checked and a closure cannot" — does not survive
its own size: a 53-element template is no easier to check against a component than 53 lines of code.

**A markup producer per block.** A pure function `(props, slots) => MarkupNode`, beside the component,
returning the IR the printers already read. No template language, no evaluator, no printer work.

The deciding argument is the check, not the shape: **either option needs the same test** — render the
canvas component with `previewProps`, render the exported markup with the same props, compare
normalised DOM. One option needs a language built on top of that test. The other does not.

### Decision
Each block gets a markup producer. Six decisions come with it.

1. **It returns IR.** `IRElement` already carries `tag`, `classNames`, `attributes`, `children`,
   `cssVars`, `notes`, `motion` and `structuredData`, and all three printers read it today. A block's
   subtree is therefore printable the moment it exists.

2. **The markup node types move to `packages/schema`.** `blocks` may not depend on `codegen` and
   `codegen` may not depend on `blocks`; `schema` is the one package both may depend on. `codegen`
   re-exports them from `ir.types.ts`, so no consumer changes an import.

3. **A `slot` node, resolved away before printing.** The producer says where the document's children
   go with `{ kind: 'slot', name }`; `buildElement` replaces it with the child elements it already
   builds. Printers never see a slot, so the authoring type and the printing type stay distinct.

4. **Classes come from the block's own `cva` call.** The producer imports the block's `.styles.ts` and
   calls it — the same function the canvas component calls, with the same props. There is nothing to
   declare and nothing to keep in sync. `codegen.classes` and `generateClasses` are therefore deleted
   at the end of the migration: the second open escalation closes by dissolving rather than by being
   filled in seventy-two times.

5. **Scalars are referenced, collections are baked.** A scalar prop that reaches text or an attribute
   is emitted as `{ kind: 'reference' }`, so `extractProps` can print `{headline}` or substitute the
   value. An array or object prop is iterated by the producer and emitted as literal markup, because
   the alternative — a loop node every printer has to print or unroll — buys a data-driven component
   nobody asked for. Consequence: array props do not appear in the printed props interface.

6. **The producer lives in a registry injected into `buildIR`**, beside the block registry and the
   preset catalogue (ADR-226), not on the descriptor. The descriptor stays data, which is what
   ADR-225 asked for and what `registry.node.test.ts` guards; the producer is code, and code lives in
   a registry beside the components, the way `renderRegistry` does. A parity test asserts the two
   registries hold the same ids.

### Named prerequisite
Twenty-two of the catalogue's render files draw icons, and an icon's geometry is JSX inside
`packages/icons` — unreachable from a React-free producer, and a dependency the exported project must
not have. So `packages/icons` gains a geometry table as data, consumed by `createIcon` *and* by the
producers, and the markup emits a real inline `<svg>`. One source of geometry, no new dependency in
the export. That is prompt 45b, and the icon-bearing blocks wait for it.

### Migration
Staged, and every stage leaves `main` green. While a block has no producer, `buildElement` behaves as
it does today — the root element from the descriptor — which is the current behaviour rather than a
new fallback. When the last block lands, the producer becomes required the way `client` is (ADR-199),
the fallback is deleted with `generateClasses`, and the golden files are regenerated against real
interiors.

### Consequences
- Accepted: 771 elements get written twice — once as a React component for the canvas, once as a
  producer for the export. The DOM parity test is what makes that safe, and it is the only thing that
  does. Without it this decision is worse than the declarative one.
- Accepted: the parity test normalises generated ids (`useId`) to stable tokens in document order, so
  linkage is asserted and the values are not.
- The printers, the IR and the dialog are untouched. This is a `blocks` change with a `schema` type
  move in front of it.
- `EXPORT_ENGINE.md` § buildIR gains the producer as pass 0; `ARCHITECTURE.md` § Dependency graph
  records why the markup types sit in `schema`.

## ADR-250 — Icon geometry is a table of shapes, and an exported icon is an inline `<svg>`

**Date** 2026-08-23 · **Prompt** 45b · **Status** Accepted

### Question
Twenty-two of the catalogue's render files draw an icon, and an icon's geometry is JSX inside
`packages/icons`. A markup producer is React-free by construction (ADR-249) and the exported project
may not depend on `@motion-studio/icons` at all — `PRODUCT.md` § 7 promises the export compiles in a
fresh scaffold. Where does the geometry live so that both halves read the same one?

### Decision
`packages/icons/src/geometry.ts` holds every glyph as data, `createIcon` builds the components from
it, and `packages/blocks/src/markup/icon.ts` emits a real inline `<svg>` from the same table. Four
decisions come with it.

1. **The table holds shape records, not a markup string.** `prompts/45b` specified
   `Record<IconName, string>`. A string cannot become `MarkupElement` children without either a parser
   in `blocks` or a raw-HTML node kind that all three printers would have to carry, and the catalogue's
   whole vocabulary is two tags — `path` and `circle` — with six attributes between them. Records are
   what `el()` already takes, so the producer is a `map` and nothing else. The prompt file is corrected
   to say so.

2. **The name set is derived from the table.** `IconName` was `keyof typeof ICON_REGISTRY`; it is now
   `keyof typeof ICON_GEOMETRY`. The old direction cannot survive `createIcon(name: IconName)` — the
   registry's type would depend on the argument type of the calls that build it. `ICON_REGISTRY` is
   annotated `Record<IconName, IconComponent>` instead, so a glyph with no component fails to compile
   and a component with no glyph has nowhere to come from.

3. **The IR carries the React spelling of an SVG attribute; the HTML printer hyphenates it.**
   `stroke-width` in JSX is a dev-mode `Invalid DOM property` warning in every React app that renders
   the exported component — `possibleStandardNames` in `react-dom` maps it to `strokeWidth` — so the
   printed React must be camelCase. The HTML printer already renamed `className` and `htmlFor` for the
   same reason, and four more entries is the whole cost. It also gains the twelve SVG attribute names
   an icon actually uses; without them every one was reported `unsupported` and the glyph printed as
   an empty tag.

4. **A shared producer bakes its text with `txt`.** ADR-249 § 5 emits a scalar prop as a reference so
   pass 6 can print `{headline}`, but a producer shared by six heroes does not know what the calling
   block named its fields, and the parity renderer resolves a reference in an attribute while an
   expression child renders as its own code. Text is therefore literal in the shared producers, and
   whether a block references a prop instead is that block's decision in 45c, where the name is known.

### Criterion (set before the refactor)
The rendered SVG of every icon is byte-identical before and after, and the set stays under the 8 kB
gzipped source budget prompt 07 attached to the eager registry.

### Measurement
93 icons rendered through `renderToStaticMarkup` before and after: **0 differences**. Gzipped source
of the whole set: **6 230 → 7 336 bytes**, still under the 8 192 budget. The growth is the table's
constructors and comments arriving while the 93 one-line modules stay; what the bundle carries — one
factory and one table instead of 93 JSX trees — was not measured and is not claimed.

### Consequences
- Accepted: an icon module is now one line, which reads as ceremony until the second consumer is seen.
  The alternative is a second copy of 93 glyphs in `blocks`, which is the drift this prevents.
- Accepted: a markup producer may now reach `@motion-studio/tokens` and `@motion-studio/icons/geometry`.
  Both are data with no React in them, which is the only property `registry.node.test.ts` guards — and
  it now walks every `*.markup.ts` on disk rather than only the ones a block already names.
- The exported `<svg>` carries `aria-hidden="true"` unless the call site names it, which is the
  component's own rule and closes half of the empty-`<button>` a11y defect prompt 44 recorded.
- `DESIGN_SYSTEM.md` § Iconography records that the geometry is data; `EXPORT_ENGINE.md` § HTML gains
  the SVG attributes the target accepts.

### Alternatives rejected
- **Copy the glyphs into `blocks`.** Two sources for one drawing, and nothing that notices when they
  disagree — the defect ADR-249 spent a parity test to avoid.
- **Emit `import { PlusIcon } from '@motion-studio/icons'`.** The user's project does not have the
  package, so the export would not compile — the one claim the export is not allowed to break.

## ADR-251 — The parity test normalises what a UI library writes for itself

**Date** 2026-08-23 · **Prompt** 45c · **Status** Accepted

### Question
Nine blocks build their interactive parts on Radix. Radix writes attributes the export cannot and
should not carry — `data-radix-collection-item`, `--radix-*` inline declarations, an `aria-hidden` its
dialog puts on everything outside the open dialog — and it names elements `radix-_r_8_-trigger`. A
producer that reproduced those would put a library the export does not ship into a user's page. What
does the DOM parity test compare, then?

### Decision
The producer emits everything with meaning — the roles, the states (`data-state`, `aria-expanded`,
`hidden`, `tabindex`), the linkage, the classes — and the normaliser drops three kinds of difference
that belong to the library rather than to the markup:

1. attributes named `data-radix-*`;
2. the `aria-hidden` Radix pairs with `data-aria-hidden` when a dialog hides the rest of the document;
3. six inline declarations Radix writes to drive its own animation and focus handling — every
   `--radix-*` variable plus `outline`, `pointer-events`, `animation-duration`, `animation-name` and
   `transition-duration`.

Ids are renumbered in document order — every id and every reference to one, not only the ones that
look generated. A producer cannot reproduce `radix-_r_8_-trigger-radix-_r_a_` and should not try; what
has to survive is that the same pairs of elements are linked, which renumbering asserts exactly. The
one case that costs — an id that is *content*, a heading's anchor — is asserted literally by its own
test instead.

`MarkupInput` gains the node's id for the same reason: eight blocks link an element to another by id
and answer it with `useId`, and two of the same block on one page must not both claim `email-hint`.

### Consequences
- Accepted: the parity test no longer proves that an exported accordion carries Radix's exact
  bookkeeping. It proves the page carries the same elements, classes, roles and states — which is what
  a reader and an assistive technology meet, and what the HTML target's own script drives.
- Two blocks changed to make the export honest rather than to make the test pass: `accordion` and
  `faq-accordion` mount their closed panels (`forceMount`, hidden by `data-[state=closed]:hidden`) and
  `tabs` mounts its inactive ones with `hidden`. A panel that is not in the DOM is a paragraph the
  exported page does not contain, and the HTML target's disclosure script would have nothing to reveal.
- The normalisation list is a rule, not an exception list. A block that cannot match still fails.

## ADR-252 — Every block produces its markup, and the class-rule mechanism is deleted

**Date** 2026-08-23 · **Prompt** 45c · **Status** Accepted, supersedes ADR-225

### Question
All 72 registry entries now have a markup producer (ADR-249). `codegen.classes` — the declarative
mapping ADR-225 introduced and no block ever wrote — still stands beside them, and three passes read
it: class generation, the responsive cascade, and the shape hash rule 3 extracts components from. What
happens to each?

### Decision
The mechanism is deleted: `ClassRule`, `codegen.classes`, `generate-classes.ts` and
`unreached-props.ts` are gone, the producer is required the way `client` is (ADR-199), and the three
things the mechanism did are answered from the producers instead.

**Classes** come from the producer, which calls the block's own `cva`. There is nothing left to
declare.

**Responsive overrides** are answered by running the producer again. It is a pure function of its
props, so what a breakpoint does to the markup is the difference between two trees — `applyResponsive`
walks them in parallel, prefixes the classes an override adds (`md:grid-cols-2` beside `grid-cols-1`),
and moves an inline declaration that differs into a generated class with media rules, because a
declaration cannot be prefixed. An override that changes the *shape* of the subtree is reported rather
than guessed at. The `responsive-overrides` golden is byte-identical to what the class rules produced.

**Rule 3** hashes the produced tree with every value erased, so two cards that differ only in a price
still share a component, and two grids that differ in a class do not. The values are then lifted:
where the body says what the source node's differing prop says, it becomes `{plan}` and each instance
passes its own. A prop the producer folded into a longer string cannot be lifted, and the group prints
separately rather than printing one instance's text three times.

**ADR-229's warning** dissolves with the mechanism. It named props that reached neither a class rule
nor an attribute; a producer reads whichever props it likes and prints them, so there is no second
list to be short against.

### Measurement
`export-landing`, sixty nodes, the `react` target:

| | before 45a | after 45a | now |
| --- | --- | --- | --- |
| elements in the export | 17 | 21 | **790** |
| distinct classes | 0 | 21 | **321** |
| `unsupported` warnings | 42 | 20 | **0** |

The HTML target reports one `unsupported` warning, which is the list of Tailwind utilities its own
stylesheet has no rule for — 80 of them, newly visible because the markup now carries the classes the
canvas paints with. That is recorded as open data rather than closed here.

`pnpm test:compile`: 16/16 golden projects type-check, 5 skipped for having no TypeScript.

### Consequences
- Accepted: the fixture catalogue in `codegen` grew a producer per entry. It had to: the goldens are
  the only place the passes are proven, and a fixture with no interior proves nothing about a
  mechanism whose whole subject is interiors.
- Accepted: a block with no producer now fails the export with `MARKUP_PRODUCER_MISSING` rather than
  printing an empty tag. That is the same trade ADR-199 made for the client boundary.
- Every golden output changed. The diff was read: real interiors, `{plan}` in the shared component,
  `style` spelled the way each target spells it, and the tint that used to travel through a generated
  variable now sits inline until a breakpoint overrides it.
- `EXPORT_ENGINE.md` § Class generation is rewritten around the producer; `RESPONSIVE_ENGINE.md`
  § Codegen keeps its four rules and changes what answers them.

## ADR-253 — Formatting runs in a worker; the rest of the export stays on the main thread

**Date** 2026-08-23 · **Prompt** 45c · **Status** Accepted, supersedes ADR-244's placement

### Question
ADR-244 measured the export pipeline at 48.1 ms against a 100 ms threshold and put it on the main
thread inside `startTransition`, with the note that "if a target or a printer grows,
`pnpm measure:export` is the check". The producers grew it. Re-measured, what does the criterion say?

### Criterion (ADR-244's, unchanged)
`buildIR` + print + format on the sixty-node fixture, median of nine runs. Under 100 ms → the main
thread. At or over → a worker.

### Measurement
`pnpm measure:export`, same script, same machine, same fixture:

| Target | Files | `buildIR` | Print | Format | Total |
| --- | --- | --- | --- | --- | --- |
| `react` | 20 | 11.7 | 2.6 | 98.8 | **113.7** |
| `next` | 24 | 17.0 | 2.4 | 151.1 | 171.2 |
| `html` | 1 | 14.5 | 5.9 | 176.3 | 196.2 |
| `json` | 1 | — | 0.8 | 4.2 | 4.8 |
| `tokens` | 4 | — | — | 45.1 | 45.1 |

113.7 ms is over the threshold, so the criterion has answered: not the main thread.

**Which part**, since the answer is not "all of it": formatting is 98.8 of the 113.7 — 87 % — and it
was 46 of 48 when ADR-244 measured. `buildIR` and the printers together are 14.3 ms.

### Decision
Prettier moves to a worker; `buildIR` and the printers stay. The split is not a compromise, it is
where the structured-clone boundary can be drawn: formatting takes a string and returns a string,
while the IR needs the block registry, the preset catalogue and the producers, none of which survive
a clone — and none of which is where the time goes.

The worker answers two messages: whether Prettier loaded, so the dialog says so once rather than per
file, and one file at a time, so the dialog keeps filling its skeletons in as they land. A browser
with no worker, or a bundle that will not start one, formats on the main thread exactly as before —
the fallback the export already had for Prettier failing to load.

### Consequences
- Main-thread cost of an export: **14.3 ms** on this fixture, against a threshold of 100.
- Accepted: the worker is a second module graph carrying Prettier. It is loaded only when somebody
  exports, the same as before, and `/studio` first-load JS is unchanged at 350 kB.
- Accepted: a worker that never answers hangs the formatting step. There is no timeout, because a
  silent fallback would hide a bug in this repository behind a slow-looking export.
- `measure:export` still measures the whole pipeline, which is the honest number for "how long until
  the last file is formatted". Where that work runs is what this entry changed.

## ADR-254 — The compile harness checks the shipped catalogue, not only the goldens

**Date** 2026-08-29 · **Prompt** 46 · **Status** Accepted

### Question
`test:compile` type-checked the golden exports, which the export engine's **fixture** catalogue
produced. `codegen` may not import `packages/blocks` (ARCHITECTURE.md § Dependency graph), so no
golden can carry a shipped block's markup. Does type-checking the goldens establish the claim that
an export compiles?

### Criterion (set before measuring)
Export the committed fixture documents from the shipped catalogue and run `tsc --noEmit` over the
result. If the goldens are a sufficient proxy, the count of new errors is zero.

### Measurement
`export-landing` and `coverage-catalogue` (all 72 entries, all 51 reachable presets), React and Next:
**11 type errors and 2 syntax errors** on the first run, in five distinct defects — ADR-255 to
ADR-260. The golden set had zero, and still has zero.

### Decision
`scripts/verify-export-compile.mjs` checks both kinds of project: every golden, and the shipped
catalogue exported at run time from `e2e/fixtures/documents`. The host projects are
`e2e/fixtures/compile/{react,next}`, workspace members, so `pnpm install` installs what an exported
`package.json` declares — and the harness asserts that every declared dependency is one of them,
because a dependency the host has not installed is a `tsc` run against no types at all.

The generator moved to `scripts/generate-export-fixture.ts` for the same reason: at the repository
root it may import `blocks`, so what it writes is the page a user gets.

### Consequences
- The job runs an export of 97 nodes and two of 60 on every pull request: 20 projects, ~35 s locally.
- Accepted: two catalogues are now exercised rather than one, and the fixture catalogue is still the
  golden set's, because a golden has to be a file a human reads in a diff.
- A block whose markup does not compile now fails a pull request instead of a user's build.

## ADR-255 — A preset's params are parsed before they are printed

**Date** 2026-08-29 · **Prompt** 46 · **Status** Accepted

### Question
`collect-motion` passed `spec.params` to `preset.codegen` unparsed, while the canvas passes them
through `paramsSchema` first (ADR-139). A document stores what the inspector changed, so a partial
set is the normal case. What does the export print for a param the document never stored?

### Criterion (set before measuring)
The exported project type-checks against Motion's `Transition`.

### Measurement
`undefined / 1000` is `NaN`, and `JSON.stringify(NaN)` is `null`: the export wrote
`{ duration: null, delay: null }` and `{ opacity: 0, y: null }`. `next build` fails with
*Type 'null' is not assignable to type 'number | undefined'*.

### Decision
The export applies ADR-139's rule at its own call site: parse with the preset's schema, fall back to
the preset's defaults. The rule is re-stated rather than imported because `codegen` takes only types
from `@motion-studio/motion` — `no-react.test.ts` — and the preset object carries its own schema.

### Consequences
- Accepted: two implementations of a four-line rule, one in `resolve.ts` and one in
  `collect-motion.ts`, each with a test naming this entry.
- The fixture presets now declare a real schema; a fixture whose schema threw was a fixture asserting
  that the export never parses.

## ADR-256 — An import survives when the printed file names it

**Date** 2026-08-29 · **Prompt** 46 · **Status** Accepted

### Question
A block descriptor declares the imports a hand-written implementation would need. Since ADR-249 the
markup producers emit elements instead of component references, so most of those bindings never
appear in the file. Should the export print them anyway?

### Criterion (set before measuring)
The exported project type-checks, and its `package.json` installs nothing the page does not load.

### Measurement
`import Accordion from '@radix-ui/react-accordion'` — *has no default export* — plus three unused
Radix dependencies in the emitted `package.json` of a 60-node landing page.

### Decision
`passes/prune-imports.ts`: an import survives when the file names its binding, a named binding
survives on its own, and a dependency survives when a surviving import comes from its package.

### Consequences
- The declared-but-unused Radix imports and dependencies are gone from every export.
- Accepted: the descriptors still declare them. What they document — the library a hand-written
  version of the block would use — is now escalated as open data rather than silently printed.
- A future export that does emit Radix components needs no change here: usage is the rule.

## ADR-257 — The descriptor's element-level extras go to the element it names

**Date** 2026-08-29 · **Prompt** 46 · **Status** Accepted

### Question
`passthroughProps` and the asset collector's tag and attributes were applied to whatever the markup
producer returned as its root. `image` declares `tag: 'img'` and its producer returns a `<figure>`
wrapping the `<img>`. Where do the element-level extras belong?

### Criterion (set before measuring)
The exported project type-checks.

### Measurement
`<motion.figure src="" alt="" width={1600} …>` — *Property 'src' does not exist on type
HTMLMotionProps<"figure">*. With a real asset the same path would have renamed the `<figure>` to
`<Image>`.

### Decision
They are applied when the produced root is the element the descriptor names, and skipped when it is
not: a producer that frames its element wrote those attributes onto the right element itself, which
the DOM-parity test already asserts. Motion is unaffected — it animates whatever the root turned out
to be.

### Consequences
- Accepted: `imageComponent: 'next-image'` no longer reaches the shipped `image` block, because the
  `<img>` it would replace is inside the producer's tree. Escalated: making the asset pass find that
  element is a change to the pass, not to this rule, and it is not prompt 46's to make.
- The fixture catalogue grew a `framed-image` entry so the rule has a test.

## ADR-258 — The coverage audit is a test over the committed documents

**Date** 2026-08-29 · **Prompt** 46 · **Status** Accepted

### Question
Prompt 46 asks for an audit that every block, preset and effect appears in a golden document, written
as a test rather than a checklist. The goldens are built from the fixture catalogue, which has 18
entries against the catalogue's 72. What is the audit over?

### Criterion (set before measuring)
Every catalogue entry is exported and type-checked on every pull request, and a block added without
coverage fails CI.

### Measurement
`coverage-catalogue.motion.json` — 97 nodes: 58 blocks, 15 slot children, 14 effects and every preset
a block will take. `apps/web/src/test/catalogue-coverage.test.ts` reports 0 uncovered blocks, 0
uncovered effects, 0 uncovered reachable presets, and 18 presets on channels no block offers.

### Decision
The audit is over `e2e/fixtures/documents`, which is what `verify-export-compile` exports and
type-checks. It lives in `apps/web` because it needs both registries and the documents, and that app
already reads the same directory to serve fixtures to the studio.

### Consequences
- A new block fails the audit until a fixture places it, and fails `test:compile` if its markup does
  not compile.
- Accepted: the audit and the goldens are two mechanisms. The goldens assert *what* the export writes,
  byte for byte, on a catalogue small enough to read in a diff; the audit asserts *that* every
  catalogue entry goes through it.
- 18 presets — every `cursor` and `exit` preset — cannot be placed in any document, because no block
  declares those channels and `apply-preset.ts` refuses them. The test names that set and fails when
  it changes. Escalated as open data.

## ADR-259 — A hoisted statement stays in the file that needs it

**Date** 2026-08-29 · **Prompt** 46 · **Status** Accepted

### Question
A fragment may hoist a statement rather than a declaration: `gsap.registerPlugin(ScrollTrigger)`
registers a plugin and names no value. Two components using it made it a shared module constant.

### Criterion (set before measuring)
The exported project parses.

### Measurement
`export gsap.registerPlugin(ScrollTrigger)` in `lib/motion.ts` — *Declaration or statement expected*.

### Decision
Only a declaration is shared. A hoisted statement is written into every component that needs it,
which is where a person would put a plugin registration, and it is neither exported nor imported.

### Consequences
- Accepted: two components using a GSAP preset each carry the registration line. Registering a GSAP
  plugin twice is a no-op.

## ADR-260 — A preset that animates text writes through a ref

**Date** 2026-08-29 · **Prompt** 46 · **Status** Accepted

### Question
`typewriter` and `text-scramble` emitted `useState(text)` — a variable no component declares — and
never rendered the state. `counter` animated a value nothing displayed. What can a fragment do about
an element's text, given that it may add props to the element a block produced and nothing else?

### Criterion (set before measuring)
The exported project type-checks, and the animation the preset promises is visible in the page.

### Measurement
Four `Cannot find name 'text'` errors and two implicit `any` parameters across `hero-aurora`,
`testimonial-card` and `container`; plus a ref typed `HTMLSpanElement` handed to an `<h2>` —
*Property 'align' is missing*.

### Decision
Text-animating fragments take a callback ref typed `HTMLElement | null` and write through it:
`element.textContent = …` for the typewriter and the counter, `element.dataset` plus a restored label
for the scramble, and `aria-label` read off the element for the split reveal. A callback ref is what
makes one fragment fit an `<h2>`, a `<span>` and a `<div>`, which is the whole problem with a typed
`useRef` in generated code.

### Consequences
- The exported typewriter, counter, scramble and split reveal now do what the canvas does.
- Accepted: writing `textContent` from an effect is not how a person would write a React component
  that owns its text. It is how one writes a component that decorates text it did not author, which
  is what a preset is.
- Four presets moved their class from `wrapper.props.className` — where it printed a second
  `className` attribute on an element that already had one — to the fragment's `classNames`.

## ADR-261 — The exported colour-mode toggle is inert, and the smoke test says so

**Date** 2026-08-29 · **Prompt** 46 · **Status** Escalated, open

### Question
Prompt 46 asks the smoke test to assert "a working theme toggle that persists across reload". The
`theme-toggle` block exports its markup and `lib/color-mode.ts` beside it. Does the exported page
switch mode?

### Criterion (set before measuring)
Clicking the exported control sets `data-color-mode` on `<html>` and the choice survives a reload.

### Measurement
It does neither. The producer emits three buttons with `aria-pressed` and no handler, because a
markup producer emits elements and a handler is not an element. `setColorMode` is exported by the
emitted module and called by nothing.

### Decision
Not fixed here. Wiring a producer's element to a handler is a change to the markup vocabulary shared
by `schema`, `blocks` and `codegen` — a feature, and prompt 46 adds none. The spec is written and
marked `fixme`, so the gap has a name, a test and a failing run to un-skip.

### Consequences
- The smoke suite reports one known-broken assertion rather than passing on a page whose toggle does
  nothing.
- Escalated: the same gap covers every block whose behaviour is a handler — the HTML target has a
  vanilla script for these (`data-ms-*`), and the React and Next targets have nothing.

## ADR-262 — The exported theme carries its namespaces and the layer that paints them

**Date** 2026-08-29 · **Prompt** 46 · **Status** Accepted

### Question
The export wrote the theme's `--ms-*` variables into `app/globals.css` and `theme.css`. Prompt 46 asks
whether the exported page looks like the canvas. Does it?

### Criterion (set before measuring)
Screenshot the canvas and the exported page at the same viewport width and compare by eye — the
prompt's own check, and DESIGN_REFERENCES.md's rule for visual work.

### Measurement
It did not look like the canvas; it looked like an unstyled document. White background, browser
default type, no colour. Two things were missing from the emitted stylesheet, and both are visible in
one `grep`: **no `@theme` block** (0 occurrences of `--color-` in `globals.css`) and **no base layer**.

Tailwind v4 generates a utility from a `@theme` entry, so with the block missing, every class the
export printed — `bg-surface-1`, `text-display-2`, `border-border` — named nothing. Adding the block
brought the colours and the type scale back and left the page on a white background, because nothing
painted `--ms-color-surface-0` onto the body.

### Decision
`printers/theme-css.ts` emits the theme as three parts: `@theme` from `@motion-studio/tokens`'
`toTailwind()` — the same generator the studio's stylesheet is built from — then the variables, then
the base layer that paints them. Both the Next and the React targets print it.

### Consequences
- Measured after the fix, same document, same machine: Lighthouse **98 / 97 / 96 / 100**, axe 0
  violations, and a page that matches the canvas at equal width.
- The emitted stylesheet grows by 133 lines (the `@theme` block) plus the base layer.
- Accepted: a React export pasted into a project that already has a `@theme` block declares the
  namespaces twice. Tailwind merges them, and the alternative — shipping classes the host cannot
  resolve — is the failure this entry is about.
- The canvas and the exported page still differ in one way this does not fix: the artboard is the
  breakpoint's width, but a `md:` class resolves against the browser viewport, so a 375-wide artboard
  in a 2160-wide window renders desktop type. Escalated as open data — it belongs to the responsive
  engine, not the export.

## ADR-263 — The transition sandbox scrubs the real transition, paused

**Date** 2026-08-29 · **Prompt** 47 · **Status** Accepted

### Question
PLAYGROUND.md § Property sandboxes asks the `transition` sandbox for play, loop and a **scrub**. A CSS
transition is not a timeline anybody can seek — it runs when a property changes. So what does the
scrub move?

### Criterion (set before measuring)
The position the scrub shows at *t* is the position the transition is in at *t*. Anything else is a
picture of a curve we drew rather than the curve the reader wrote.

### Measurement
Two candidates:

1. **Linear interpolation between the two states.** Cheap, and wrong by exactly the thing under test:
   at t = 0.5 a `cubic-bezier(0.34, 1.56, 0.64, 1)` is past its end point, and a straight line would
   show it half way. Every overshoot preset — Springy, Bounce, Overshoot, Anticipate — is invisible.
2. **The `CSSTransition` animation, paused.** `element.getAnimations()` returns it, `pause()` holds it,
   and `currentTime` seeks it. Measured on the four overshoot presets: the scrubbed position matches
   the played position, overshoot included.

### Decision
The scrub pauses whatever animations the element is running and writes `currentTime`. Play and loop
toggle the state and let the value under test do the work; nothing here interpolates.

### Consequences
- The four overshoot presets are readable at rest, which is the reason the scrub exists.
- Accepted: the scrub needs an animation to seek, so it does nothing until the state has been toggled
  at least once. The Toggle-state button is beside it for that reason.
- Under reduced motion the play button is disabled and the scrub is the whole control — ANIMATION_
  SYSTEM.md's rule that a reduced experience is complete rather than absent.

## ADR-264 — The playground's value check is `apps/web`'s until prompt 48 moves it

**Date** 2026-08-29 · **Prompt** 47 · **Status** Accepted, superseded by prompt 48 by design

### Question
Prompt 48 puts the CSS validator in `packages/schema`, beside `sanitizeDocument`, because a security
boundary with two copies has one copy nobody is looking at. Prompt 47 needs a validator now. Where
does it live in between?

### Escalated
Not a judgement call: the build plan already made it. Recorded so a reader of `apps/web` who finds a
validator there knows it is scheduled to leave.

### Decision
`apps/web/src/components/playground/validate-value.ts` implements layers 1 to 3 — structure, the
blocklist, `CSS.supports` — with a comment naming prompt 48. Layers 4 and 5, feature detection and the
compatibility note, are not implemented here: half a feature would be a thing to delete rather than
move.

### Consequences
- The playground refuses `@import`, `expression(`, `behavior:`, `-moz-binding`, `javascript:` and any
  `url()` that is not an inline `data:` image, today.
- Accepted: `validate-value.test.ts` will move with the code, and its assertions are written against
  the behaviour rather than the file, so they survive the move.

## ADR-265 — The CSS validator has one entry per input shape, in one module

**Date** 2026-08-29 · **Prompt** 48 · **Status** Accepted

### Question
Prompt 48 says one validator, three consumers, and a second implementation anywhere is a defect. But
the three consumers do not hand it the same string. The playground edits **a value** under a property
it already knows (`background`, the eight sandboxes). `CssField` and a `css` escape-hatch prop in a
`.motion` file hold **a declaration list** — `letter-spacing: -0.01em;`, possibly several lines. A
single function taking `(property, value)` cannot read the second; a single function taking a
declaration list cannot check the first, because there is no property in the string to give
`CSS.supports`.

### Escalated
Not a measurement. PLAYGROUND.md already specifies `validateCssValue(property, value)` and
COMPONENT_LIBRARY.md § Control kinds already specifies that the `css` control takes declarations with
a `properties` allow-list. Both are specified; what was open is how they share code.

### Decision
`validate-css.ts` exports two entries and holds one implementation:

- `validateCssValue(property, value)` — the five layers.
- `validateCssDeclarations(input, options)` — splits on top-level `;`, then calls
  `validateCssValue` once per declaration and merges the results, offsetting each error's line and
  column back to the caller's text.

The splitter is the only thing the second entry adds, and it lives in `structural.ts` with the rest of
the delimiter scanning, because "where does this `;` end a declaration" is the same question as
"is this paren balanced" and it is answered by the same walk.

### Consequences
- The three call sites contain no validation logic of their own: `sanitizeDocument` and `CssField`
  call `validateCssDeclarations`, `useApplyCss` calls `validateCssValue`.
- Fixes a live defect: `sanitizeDocument` called the value entry on a declaration list, so any `css`
  prop carrying a `;` — which is every one the inspector writes — was rejected and blanked on import.
- Accepted: a declaration list is validated per declaration, so a value that is only valid in
  combination with another property is not checked as a pair. `CSS.supports` has no API for that.

## ADR-266 — `url()` is refused except for an inline `data:image/*` the asset sanitizer vouches for

**Date** 2026-08-29 · **Prompt** 48 · **Status** Accepted, supersedes the CSS row of FILE_FORMAT.md § Security as written before this entry

### Question
Two documents disagreed. FILE_FORMAT.md § Security said `url()` is stripped from CSS escape-hatch
props, full stop. PLAYGROUND.md § Parsing and validation said `url(` is blocked "unless a data URL
that passes the asset sanitizer". `mask-image` and `background` are two of the eight sandboxes and
neither is usable without `url()`.

### Criterion (set before deciding)
An exception is allowed only if the exempted form cannot reach the network, cannot carry script, and
is already checked by code that exists. Anything else stays blocked.

### Measurement
`checkImageDataUrl` (`sanitize/urls.ts`) accepts `data:<type>;base64,<payload>` for five image MIME
types up to 2 MB and nothing else. Applied to the exception: `data:text/html,<script>` fails on type,
`data:image/svg+xml` — the one image type that can carry script — is not in `ALLOWED_IMAGE_TYPES` and
fails, a remote `https:` URL fails as not a data URL, and `url(javascript:alert(1))` fails the same
way. The form is inert and the check already ships.

### Decision
`url()` is blocked, with exactly one exception: every argument of every `url()` in the value must be a
`data:` URL that `checkImageDataUrl` accepts. FILE_FORMAT.md § Security is updated to say so, and the
playground's earlier allow-pattern — which let `data:image/svg+xml` through — is dropped.

### Consequences
- `mask-image` and `background` are usable in the playground and in the escape hatch with an inline
  image, which is what those sandboxes are for.
- SVG data URLs are refused even though they are images: an SVG is a document and can carry a script
  element. A reader who wants an SVG mask converts it to PNG, which is a real cost and the right one.
- An inline image is capped by the 8 kB value cap (ADR-267) long before the sanitizer's 2 MB, so the
  exception is for small masks and gradients, not for embedding photographs in a style.

## ADR-267 — The value cap is 8 kB, not 2 kB

**Date** 2026-08-29 · **Prompt** 48 · **Status** Accepted, supersedes `MAX_VALUE_LENGTH = 2000` from prompt 12

### Question
The structural stub written in prompt 12 capped a value at 2000 characters. PLAYGROUND.md § Parsing
and validation, and prompt 48, both say 8 kB. Which one holds?

### Escalated
Specified, not judged: the number is in the document, and the stub predates the document being
implemented. Recorded because the stub's own comment argued for the smaller number, so a reader
finding the change needs the reason it lost.

### Decision
`MAX_VALUE_LENGTH = 8 * 1024`, matching the document.

### Consequences
- Measured against what ships: the longest of the 40 presets in `playground/presets.ts` is 111
  characters, and the longest sandbox starting value is 205. Neither cap binds a value anyone writes
  by hand, so this is not a capability change — it is the two numbers agreeing.
- The cap that does bind is on an inline `data:image/*` (ADR-266): 8 kB of base64 is roughly a 6 kB
  image, which is a small mask and not a photograph. That is the number this cap actually decides,
  and it is why the larger of the two is the right one.
- Accepted: the cap is a denial-of-service guard, not a taste guard. 8 kB of CSS in one prop is
  absurd and still allowed.

## ADR-268 — A missing `CSS.supports` is `unverified`, never a rejection

**Date** 2026-08-29 · **Prompt** 48 · **Status** Accepted

### Question
Layer 3 asks the browser whether a value is valid. `sanitizeDocument` runs where there is no browser:
the `node` test suite, and any server-side import. What does layer 3 return there?

### Escalated
Prompt 48 decided it. Recorded because both wrong answers are tempting and each fails silently in a
different direction.

### Decision
`supportsDeclaration` returns `{ ok: true, unverified: true }` when `CSS.supports` is unavailable, and
`validateCssValue` propagates `unverified` on the success branch.

Rejecting would make every `.motion` import fail under `node`, which is where the security tests run.
Returning a plain `ok` would claim a check that did not happen, and the caller could not tell.

### Consequences
- Layers 1, 2 and 5 — the security-relevant ones — always run, so a value that reached the document
  is always structurally sound and free of blocked constructs, browser or no browser.
- `unverified: true` is visible to callers. Nothing renders it today; the playground always has a
  browser, so it is always `false` there.
- Accepted: a `.motion` file imported on a server can carry a value no browser accepts. It is inert —
  an unsupported declaration is dropped by the engine that paints it.

## ADR-269 — Normalization lowercases function names and hex, and nothing else

**Date** 2026-08-29 · **Prompt** 48 · **Status** Accepted

### Question
Layer 5 asks for "consistent spacing, lowercase keywords". Which identifiers is it safe to lowercase?

### Criterion (set before deciding)
An identifier may be lowercased only if CSS treats it case-insensitively **and** no author-chosen
name can appear in that position. Anything failing either test is left byte-for-byte.

### Measurement
Applied to the identifier positions a value can hold:
- Function names (`RGB(`, `linear-Gradient(`) — case-insensitive, never author-named. Safe.
- Hex colours (`#FFF`) — case-insensitive, never author-named. Safe.
- Custom property names (`var(--brandBlue)`) — **case-sensitive**. Lowercasing breaks the reference.
- Font family names (`Helvetica Neue`) — case-insensitive by spec, but author-chosen and read by a
  human in the value. Fails the second test.
- Anything inside a quoted string — content, not an identifier. Fails both.

### Decision
Lowercase function names (excluding `--` custom names) and hex colours. Collapse runs of whitespace to
one space, drop the space before `,` and `)`, emit exactly one space after every `,`. Leave every
other identifier and every quoted string alone. Colour notation is never converted: `oklch` stays
`oklch`.

### Consequences
- `rgba(0,0,0,.4)` and `rgba(0, 0, 0, .4)` serialise identically, so a re-saved document diffs
  cleanly — the same property byte-stability has elsewhere in the format.
- `normalize(normalize(x)) === normalize(x)` holds by construction and is asserted as a property over
  the valid fixtures.
- Accepted: `10PX` stays `10PX`. Units sit against a number rather than in an identifier position, and
  distinguishing `10PX` from `Neue` reliably is a lexer this layer is not.

## ADR-270 — A backslash is refused outside a string and allowed inside one

**Date** 2026-08-29 · **Prompt** 48 · **Status** Accepted, supersedes the blanket escape rule from prompt 12

### Question
The prompt-12 stub refused any value containing a backslash, because `u\rl(` reads as `url(` to a
browser and as noise to the blocklist's regex. That is true, and it also refuses `content: "\201C"`,
which is how a curly quote is written.

### Criterion (set before deciding)
Refuse a backslash exactly where it can spell a construct the blocklist is looking for.

### Measurement
The blocklist matches function names and property names: `url(`, `expression(`, `element(`,
`@import`, `behavior:`, `-moz-binding`. All six are identifier positions, and CSS identifier escapes
are only recognised outside a string — inside quotes the text is a string value, and `"url("` is a
string, not a call. So an escape inside quotes cannot spell any of the six.

### Decision
A backslash outside a quoted string is a structural error. Inside a quoted string it is allowed and
passes through normalization untouched.

### Consequences
- `content: "\201C"`, `font-family: "My\\Font"` and quoted data URLs keep working in the escape hatch.
- The evasion the original rule was written for is still refused, and the fixture `u\rl(...)` still
  fails at the structural layer.

## ADR-271 — A top-level colon in a value is an error, and it names the missing semicolon

**Date** 2026-08-29 · **Prompt** 48 · **Status** Accepted

### Question
`validateCssDeclarations` splits on `;` because that is what separates declarations in CSS. A person
typing into the inspector's three-row textarea writes one declaration per **line** and often leaves
the semicolons out. `color: red\nopacity: 0.5` is then one declaration whose value is
`red\nopacity: 0.5`. What happens to it?

The validator that shipped before this one split on newlines, so it reported two bad lines. That is
friendlier and it is not CSS: a browser reading the same text drops the whole declaration.

### Criterion (set before deciding)
The splitter agrees with CSS, and no malformed value reaches a document unreported. Two rules to check
against: a newline must not change what a declaration means, and every value the splitter produces
must be one a browser would accept.

### Measurement
Splitting on newlines fails the first rule: `box-shadow: 0 1px 2px red,\n  0 8px 24px blue` is one
declaration to CSS and two to the splitter, and the second half is not a declaration at all.

Splitting on `;` only fails the second rule under `node`, where `CSS.supports` is unavailable
(ADR-268): the malformed value passes layers 1, 2 and 5 and is stored.

A third rule closes the gap. Surveying where a colon can appear in a CSS value: inside a string
(`content: "a:b"`), inside a call (`url(data:…)`, `image-set(…)`), and nowhere else. Checked against
all 63 valid fixtures: every colon in them is inside a call or a string, and there is no top-level one.

### Decision
Split on `;`, and make a **top-level colon inside a value** a structural error reading
`Unexpected ':' — write a value here, or end the declaration before it with ';'.`

### Consequences
- `color: red\nopacity: 0.5` is reported at line 2, column 8 — the colon that gave it away — with a
  message naming the fix. Better than the line-splitting validator, which reported two vaguer errors.
- The playground's value box gets the same rule, and there it reads as "this box takes a value": a
  reader who pastes `background: red` into it is told so at the colon.
- Accepted: a value that legitimately carries a top-level colon would be refused. None exists in CSS
  today; a future one would be a change to this rule, with a fixture.

## ADR-272 — A bare `javascript:` is not on the blocklist, because `url()` already is

**Date** 2026-08-29 · **Prompt** 48 · **Status** Accepted

### Question
Both validators this one replaces refused any value containing `javascript:`. Prompt 48's blocklist
does not list it. Does the rule survive the merge?

### Criterion (set before deciding)
A rule earns its place if it blocks a vector no other rule blocks. A rule that only blocks strings
which are already inert is noise, and noise in a blocklist is what makes people stop reading it.

### Measurement
Where `javascript:` can do anything in CSS, it is a URL, and every URL path is already refused:
`url(javascript:alert(1))` fails the `url()` rule (ADR-266), `behavior:` and `-moz-binding` are
refused as properties and as constructs. Outside a URL — `background: javascript:x` — the token is a
malformed value: no engine resolves it, and the declaration is dropped.

Against the cost: the blocklist patterns are not string-aware, so a `javascript:` rule would also
refuse `content: "javascript: a language"`, which is text.

### Decision
No `javascript:` entry. The six constructs prompt 48 lists are the blocklist.

### Consequences
- `background: javascript:x` is now accepted where there is no browser to reject it, and refused by
  layer 3 where there is. It is inert either way.
- Accepted: a reader diffing this against the old playground validator sees a rule disappear. This
  entry is why it did.

## ADR-273 — The validator has its own entry point, `@motion-studio/schema/css`

**Date** 2026-08-29 · **Prompt** 48 · **Status** Accepted

### Question
`/playground` needs `validateCssValue`. Importing it from `@motion-studio/schema` imports the package
barrel, which builds the Zod document schemas at module scope. Does that reach the page bundle?

### Criterion (set before measuring)
Measure `/playground` first-load JS before and after. Under 5 kB of growth for the validator: import
from the barrel and keep one door. Over that: give the validator its own export.

### Measurement
`pnpm --filter web build`, first-load JS for `/playground`:

| Import path | First load |
| --- | --- |
| Prompt 47, no validator imported from a package | 175 kB |
| `@motion-studio/schema` (the barrel) | **203 kB** |
| `@motion-studio/schema/css` (a declared subpath) | **179 kB** |

28 kB for a value check, of which 24 kB is the document parser the page never calls. Zod schema
modules run at import, so nothing tree-shakes them away.

### Decision
`packages/schema/package.json` declares `"./css": "./src/sanitize/css/index.ts"`. The package barrel
re-exports the same symbols, so both doors reach one module and neither is a deep import — the ban in
ENGINEERING_CONTRACT.md § 3 is on reaching past a package's declared exports, and this is a declared
export.

### Consequences
- `/playground` is 179 kB: 4 kB for the validator and the compatibility notes, and nothing else.
- `apps/web` and `CssField` both import from `/css`. The barrel stays correct for anything already
  importing the package whole — `/studio` first-load is unchanged at 355 kB.
- Accepted: a second entry point is a second thing to keep exported. The subpath barrel re-exports
  from the same files the package barrel does, so a symbol can only go missing from both at once.

## ADR-274 — A sent value lands on `props.css` and is applied in one place, not by seventy blocks

**Date** 2026-08-30 · **Prompt** 49 · **Status** Accepted

### Question
PLAYGROUND.md § Send to selection says the value lands on the selected node's `css` prop. No block
declares such a prop, and ADR-117 established that a control may only write a prop the block's schema
declares — invariant 7 parses the write. Does every block get a `css` prop, a schema entry, a
`cssVars` line in its markup producer and a `style` in its component?

### Criterion (set before measuring)
Count the edits each shape costs and ask which one a reader can check. A rule that is written once is
one a reader can hold the code to; a rule spread over seventy files is one that will be true in
sixty-eight of them.

### Measurement
Per-block: 72 schema entries, 72 producers, 72 components, and a new failure mode — a block that
forgot one silently drops the value. Central: `escapeHatchStyle(props, capabilities)` in
`packages/schema`, read by `buildElement` where it already merges the motion, the notes and the
structured data, and by `NodeRenderer` where it already renders the effects as siblings. Two call
sites, both of them places that already say "this is the node's, not the block's".

### Decision
`css` is a prop the block's schema does not declare and does not need to. It is stored on
`node.props.css` — the name `sanitizeDocument`'s `CSS_KEYS` already matches, so an imported file is
validated by the same pass it always was — and it is applied by:

- `buildElement`, merging it into the root element's `cssVars`, which both printers already emit;
- `NodeRenderer`, on the `NodeWrapper` the rect cache already treats as the node's box.

A block never learns it carries one, which is the same rule effects and motion are held to.

### Consequences
- One implementation, `escapeHatchStyle`, and a document that arrives from anywhere is filtered by
  the block's own list at paint time as well as at write time.
- The canvas paints the declarations on the wrapper and the export paints them on the block's root.
  For a block-level root filling its wrapper — every block in the catalogue — the two boxes coincide.
  A block whose root carried a margin would differ, and this entry is where a reader would look.
- Accepted: `node.props.css` is a prop no schema mentions, so `propsSchema.parse` strips it before the
  component sees it. That is the point — the block is a function of its own props — but it does mean
  a reader looking for the value in `parsed.data` will not find it.

## ADR-275 — Which properties a block accepts is a capability, defaulting to the eight paint-only sandboxes

**Date** 2026-08-30 · **Prompt** 49 · **Status** Accepted

### Question
Prompt 49: "Only properties the block declares as escape-hatch-eligible are accepted; others show why
not." PLAYGROUND.md gives the reason — "so a value cannot break a block's layout contract". What is
the default for a block that declares nothing, and which blocks declare something?

### Criterion (set before measuring)
The purpose named in the document is the test: the default set may not contain a property that can
change how a block lays out. Anything that can is a property a block would have to opt into one at a
time, and a feature nobody can use is not a feature.

### Measurement
The eight sandboxes are `background`, `box-shadow`, `filter`, `backdrop-filter`, `mask-image`,
`clip-path`, `transform`, `transition`. None of them participates in layout: they paint, they
composite, and `transform` moves an element visually without moving the box its siblings are laid out
against. `display`, `position`, `width`, `margin`, `padding` and `float` are not in the set and are
not reachable from the playground, because the playground has no sandbox for them.

### Decision
`BlockCapabilities.escapeHatch?: readonly string[]`. Absent means `ESCAPE_HATCH_PROPERTIES`, the
eight. A block sets it to **narrow** the list, and seven do: every block with `requiresBackdrop: true`
drops `backdrop-filter`, because a glass block paints its own and a second declaration would replace
the first. The refusal is shown with its reason rather than left as a disabled button.

### Consequences
- The escape hatch works on every block on the day it ships, and the one real conflict in the
  catalogue is declared where a reader looking at the block will find it.
- `GLASS_ESCAPE_HATCH` is derived from `ESCAPE_HATCH_PROPERTIES` in `scales.ts`, so a ninth sandbox
  reaches the glass blocks too without seven more edits.
- Accepted: a block cannot *widen* the list. A property with no sandbox has no way into the
  playground, so widening would be a setting with nothing to set.

## ADR-276 — A polygon the handles edit has one unit for the whole shape

**Date** 2026-08-30 · **Prompt** 49 · **Status** Accepted

### Question
CSS allows `polygon(0px 0%, 100% 40px, …)`: a unit per coordinate. Prompt 49 asks for a `%` / `px`
toggle that "converts existing values correctly" and for `parsePolygon` to round-trip exactly. What
does a handle write when it moves a coordinate in a shape whose coordinates disagree?

### Escalated
Not a measurement. Three shapes were possible: a unit per coordinate, a unit per vertex, or a unit per
shape. The first two make the toggle ambiguous — "convert to px" has no single meaning when half the
shape is already px — and neither appears in the catalogue or in any preset.

### Decision
One unit per shape. A polygon whose coordinates disagree does not parse: the editor says
"Mixed units: the handles need one unit for the whole shape" and the value stays text, the same answer
`path()` gets. A bare `0`, which is legal and carries no unit, adopts the shape's.

### Consequences
- `serialize(parse(x)) === normalize(x)` holds for every shape preset, asserted over the panel's own
  table rather than a copy of it.
- The toggle converts against the target's measured size, so a `px` shape means the same picture at
  the size it was authored at and a different one at another — which is what `px` means.
- Accepted: a hand-written mixed-unit polygon loses its handles. It keeps its editor, its validation
  and its preview.

## ADR-277 — A drag writes the element directly and the editor on the same tick

**Date** 2026-08-30 · **Prompt** 49 · **Status** Accepted

### Question
PLAYGROUND.md § Property sandboxes says the vertex and bezier editors "write CSS variables directly,
and neither goes through React state during a drag". Prompt 49 says the value updates in the editor
**live**, and calls that two-way binding "the thing that makes it feel like a tool". ENGINEERING_CONTRACT.md
§ 5 says high-frequency values never live in React state. Which of the three wins?

### Criterion (set before measuring)
§ 5's rule names what it is protecting: "Inspector slider drag → zero React re-render of canvas
subtree", "60 fps with 200 nodes". The subject is the canvas. The question is therefore what a
re-render costs *here*, and the threshold is the frame: under 16 ms for the subtree a drag re-renders,
or the drag moves to refs.

### Measurement
The subtree a vertex drag re-renders is the overlay: one `svg`, and two buttons per vertex — twenty
elements for the largest preset in the catalogue, the ten-vertex star. The element under test is
written directly from the pointer handler, so the paint does not wait for React at all. Flow D drags a
vertex on three engines and reads both the editor text and the computed style; all three pass without
a wait beyond the assertion's own poll.

### Decision
The pointer handler does two things per move: it sets the property on the target element itself, and
it calls `onValueChange`. The first is why the shape does not lag the pointer by the apply loop's
60 ms debounce. The second is the two-way binding, and it is a React state update on a twenty-element
subtree rather than on a canvas.

§ 5 stands unamended: the rule is about the canvas, and the playground has no canvas.

### Consequences
- The editor shows the value while the pointer is still down, which is what the prompt asked for.
- Accepted: a drag on a shape with far more vertices than the catalogue's ten would re-render more.
  The paint would still be immediate, because the element is written outside React.

## ADR-278 — A shortcut may opt back in past the text-entry guard

**Date** 2026-08-30 · **Prompt** 49 · **Status** Accepted

### Question
SHORTCUTS.md § Playground lists `Mod+Shift+S`, `Mod+Shift+C` and `Mod+Shift+K`. § Resolution order
says a text input lets only `escape`, `mod+enter` and `mod+s` reach the registry. The playground's
main control **is** a text input — CodeMirror — so all three of its bindings are dead where they are
meant to be used. Two sections of one document disagree.

### Escalated
Not a measurement, and not already settled: the two sections contradict each other. Three ways out.
Duplicate the bindings in CodeMirror's own keymap, which puts one behaviour in two registries and
invites drift. Widen the passthrough set to every `mod+shift+<letter>`, which would take
`Mod+Shift+Z` from the browser and break native field redo. Or let a binding say so.

### Decision
`Shortcut.allowInTextEntry?: boolean`, honoured by `resolveShortcut` after the match rather than
before it, so only a binding that asked for it survives the guard. The playground's three declare it;
redo does not, and native field redo keeps working. SHORTCUTS.md § Resolution order is amended in the
same change, with the rule for when it may be used: a chord a field cannot produce and the browser
does not already own.

### Consequences
- One registry, no scattered listeners, and the playground's documented keys work in its editor.
- The guard's original job is untouched: `Delete` while typing still reaches the field, because no
  binding for `delete` declares the opt-in.
- Accepted: a future binding could declare it wrongly and take a key from a text field. The rule is
  written next to the field it is declared on.

## ADR-279 — The playground reads the studio's selection through a port, not the store

**Date** 2026-08-30 · **Prompt** 49 · **Status** Accepted

### Question
Send to selection needs to know whether the studio has one, what it accepts, and how to write to it.
`useStudioStore` answers all three. It is also built over `blockRegistry`. What does importing it cost
`/playground`?

### Criterion (set before measuring)
The page's recorded first load is 179 kB (ADR-273). Under 5 kB of growth for the selection: import the
store and keep one door. Over that: a port.

### Measurement
`/studio` — the page that does import the store and the registry — is 360 kB against a shared baseline
of 104 kB. The registry is the bulk of the difference, and none of it is a CSS value check.

### Decision
`escape-hatch-port.ts`: a module with no runtime imports at all, holding a five-field summary of the
selection and one registered writer. The studio fills it (`escape-hatch-bridge.ts`, which does import
the registry and the commands) and the playground reads it with `useSyncExternalStore`.

The bridge subscribes once and never unsubscribes. Navigating to `/playground` unmounts the studio,
and a selection that vanished on the way to the tool that writes to it would be no feature at all —
which is also why the studio's top bar reaches the playground through a `next/link`, and why a
fixture named in the query string is now loaded once per session rather than on every mount.

### Consequences
- `/playground` carries no block definitions. Measured first load after prompt 49: **184 kB**.
- A cold `/playground` has no target and says so, which is correct: nothing is selected because
  nothing is loaded.
- Accepted: the port is session state in a module, so a full reload of the studio empties it. Prompt
  50 gives the document persistence; the selection can follow it there.

## ADR-280 — Firefox and WebKit run the flow specs; the perf specs stay on Chrome

**Date** 2026-08-30 · **Prompt** 49 · **Status** Accepted

### Question
TESTING.md § E2E says three browsers. `playwright.config.ts` has one project, Chrome, with its own
reason written next to it: the numbers in PERFORMANCE.md were taken in Chrome and a budget is only
comparable to itself. Prompt 49 asks for flow D on three browsers.

### Escalated
The two are not actually in conflict once the specs are separated by what they assert. A spec that
measures a frame budget has one right browser. A spec that asserts behaviour has three.

### Decision
Two more projects, `firefox` and `webkit`, both restricted by `testMatch` to `**/flows/*.spec.ts`.
The perf and export specs keep Chrome alone.

### Consequences
- Flow D runs 9 tests × 3 engines. All 27 pass locally; the run takes 52 s.
- One difference surfaced immediately and is worth the entry: Playwright's `ControlOrMeta` resolves
  against the **host**, and WebKit under the Desktop Safari profile presents a macOS user agent, so
  the application's own `mod` resolves the other way. `StudioPage.undo()` reads the same
  `navigator.platform` + `userAgent` haystack the shortcut registry reads.
- Accepted: prompt 56 owns the CI matrix. This is the config the matrix will shard.

## ADR-281 — The two sandbox editors are chunks of their own

**Date** 2026-08-30 · **Prompt** 49 · **Status** Accepted

### Question
Prompt 49 adds a vertex editor, a bezier editor with a named-curve select, compare mode, the sharing
actions and send-to-selection. PERFORMANCE.md § Mandatory dynamic imports lists CodeMirror and the
colour picker. Do any of the new pieces belong on that list?

### Criterion (set before measuring)
`/playground` first load is recorded at 179 kB (ADR-273). Within 5 kB of it: leave everything static.
Over that: split, largest first, and record what each split bought.

### Measurement
`pnpm --filter web build`, first-load JS for `/playground`:

| | First load | Route |
| --- | --- | --- |
| Prompt 48 | 179 kB | 14.3 kB |
| Prompt 49, everything static | **220 kB** | 23.5 kB |
| Prompt 49, both sandbox editors dynamic | **184 kB** | 17.4 kB |

36 kB of the 41 was the two editors, most of it the bezier editor's dropdown — a select carrying the
twelve named curves, on a page where seven of the eight sandboxes never open one.

### Decision
`ClipPathEditor` and `BezierEditor` are `next/dynamic` with `ssr: false`, imported by the sandboxes
that own them. Neither is on screen until its property is chosen, so neither needs a skeleton: the
target underneath it is already painted, and the handles arrive over it.

### Consequences
- `/playground` first load **184 kB**, 5 kB over prompt 48 — the compare tabs, the sharing bar, the
  send button and the shortcut registry, which are on screen from the first paint.
- The `clip-path` and `transition` sandboxes each pay for their own tool on the click that opens them.
- `@motion-studio/motion` gained a `./curves` subpath so the bezier chunk takes the twelve easing
  curves without the preset catalogue behind them.

## ADR-282 — `fake-indexeddb` is a dev dependency of `web`

**Date** 2026-08-30 · **Prompt** 50 · **Status** Accepted

### Question
Prompt 50 requires the autosave path, the ring buffer and the quota-failure toast to be unit-tested.
jsdom implements no `indexedDB`. Contract § 1.10 requires a check that nothing already present can
do the job before a dependency is added.

### Checked first
- **Node 20's `indexedDB`** — there is none. The `node:sqlite`-backed one landed nowhere.
- **Hand-rolled mock** — a faithful one has to model `IDBOpenDBRequest`, `onupgradeneeded`,
  transaction lifetimes and the `success`/`error` event pair. That is ~120 lines whose only consumer
  is the 40-line wrapper it stands in for, so the assertions would be about the mock.
- **Testing one layer up** — injecting a backend interface into `document-store.ts` leaves `idb.ts`
  itself, the file most likely to be wrong, with no test at all.

### Decision
`fake-indexeddb@6` as a `devDependency` of `apps/web`, imported by `src/test/setup.ts` through its
`auto` entry point. It is the reference implementation used by the spec's own test suite, it ships
no runtime code into the app, and the real engine is still exercised by `e2e/editor/persistence.spec.ts`.

### Consequences
- Accepted: unit tests assert against an implementation, not against the browser. The seven E2E
  persistence scenarios run in Chromium, so the two levels disagree loudly rather than silently.
- The global is installed for every `web` test file rather than imported per file, so any future test
  that touches storage has a working `indexedDB` without repeating the import.

## ADR-283 — Restore is a command; `replaceDocument` stays the load path

**Date** 2026-08-30 · **Prompt** 50 · **Status** Accepted · **Extends** ADR-054

### Question
FILE_FORMAT.md § Autosave: "Restoring is a command, so it is undoable." The store already has
`replaceDocument`, and ADR-054 measured it into the load path precisely *because* it clears history.
Which one restores a snapshot?

### Decision
Neither is reused. `restoreSnapshot({ document })` is a new command in `packages/editor/src/commands`:
it assigns every field of the snapshot onto the draft except `meta.id`, `meta.createdAt` and
`meta.template`, which are the document's identity rather than its content.

The distinction is what the two operations mean. Opening a file replaces *which document is open* —
undoing across that boundary would restore nodes into a document they do not belong to, which is what
ADR-054 measured. Restoring a snapshot changes the content of the document that is already open, and
that is what undo is for.

### Measurement
`applyCommands` on the 60-node `export-landing` fixture, mean of 20 runs:

| | Patches out | Patches back | Time |
| --- | --- | --- | --- |
| `restoreSnapshot` | 4 | 4 | 1.30 ms |

Four, not sixty: the command assigns whole objects, and Immer records one `replace` per assignment
rather than one per node. `theme`, `nodes`, `assets` and `meta` are the four; `version` and `rootId`
are unchanged by a restore of the same document and produce none.

### Consequences
- A restore is one small history entry, not a document-sized one. `HISTORY_LIMIT` counts entries, so
  it costs one of the fifty and undoing it costs 1.3 ms.
- `meta.id` surviving the restore is what keeps autosave writing to the same IndexedDB key afterwards.
- Accepted: restoring a snapshot from a document whose blocks a later build removed produces a
  document with unknown blocks. It renders as a placeholder, which is the same answer import gives.

## ADR-284 — A snapshot is taken on a material change, and material has a number

**Date** 2026-08-30 · **Prompt** 50 · **Status** Accepted

### Question
Prompt 50: a snapshot on every autosave makes ten snapshots cover twenty seconds of history and be
useless. It states the shape of the rule — "node count, or more than N patches since the last
snapshot" — and leaves N to be set.

### Criterion (set before measuring)
Ten snapshots should span a working session rather than a minute of it. The target: the buffer holds
at least a hundred deliberate edits before the oldest snapshot is dropped.

### Measurement
Patches per interaction, counted by `applyCommands` on the 60-node `export-landing` fixture:

| Interaction | Patches |
| --- | --- |
| `setProp` — one text commit | 1 |
| `setResponsiveProp` | 1 |
| `renameNode` | 1 |
| `reorderNode` | 1 |
| `insertBlock` | 2 |
| `removeNodes` — one leaf | 2 |

One to two per deliberate edit, and an inspector drag is one because ADR-113 coalesces it. So a
threshold of N buys N/2 to N edits per snapshot, and ten snapshots hold between 5 N and 10 N of them.

### Decision
`SNAPSHOT_PATCH_THRESHOLD = 20`, plus an unconditional snapshot whenever the node count differs from
the last snapshot's.

Twenty is the smallest value that clears the criterion: it holds 100–200 deliberate edits across the
ten, where ten would hold 50–100 and miss it. The node-count rule rides along because a structural
change is what a user goes looking for in version history and it is free to detect.

### Consequences
- The patch counter lives in the autosave hook's ref, not in the store: it is a property of this
  session's writes, and a second tab autosaving the same document keeps its own count.
- Accepted: a burst of typing snapshots every ~20 commits with no structural beat to hang them on.
  The node-count rule cannot see it, and the patch rule is the whole answer for that case.
- Accepted: the criterion counts edits, not minutes. How long a hundred edits take is the user's
  pace, which is not a thing this repository can measure.

## ADR-285 — `beforeunload` writes to `localStorage`, and the next load migrates it

**Date** 2026-08-30 · **Prompt** 50 · **Status** Accepted

### Question
`beforeunload` cannot await, and every IndexedDB write is a promise. A tab closed inside the two
second debounce window would lose the last edit — the one failure mode PRODUCT.md § 10 calls
unacceptable.

### Options
1. **`navigator.sendBeacon`** — there is no server. Rejected outright.
2. **A synchronous `IDBTransaction`** — none exists. `put` returns a request that settles on a later
   task, and the browser tears the page down first.
3. **A `localStorage` fallback lane.** `localStorage.setItem` is synchronous and completes inside the
   handler. The next load reads the key, writes it to IndexedDB, and deletes it.

### Decision
Option 3. `PENDING_KEY = 'motion-studio.pending-write'` holds one serialised document; `flushPending()`
runs before the store is hydrated on the next load, so an unload write is never read back as an older
version than what IndexedDB already has — the pending lane carries `savedAt` and loses to a newer
record.

### Consequences
- Accepted: a document over the ~5 MB `localStorage` quota cannot use the lane. The write throws, is
  caught, and the two-second debounce remains the only guarantee for that document. The largest
  committed fixture, the 200-node stress document, serialises to 168 kB — 3 % of the cap.
- Accepted: `beforeunload` is not fired reliably on mobile Safari. `visibilitychange` is, it flushes
  through the normal asynchronous path, and it fires first — the lane is the backstop, not the plan.

## ADR-286 — The fixture path does not autosave

**Date** 2026-08-30 · **Prompt** 50 · **Status** Accepted

### Question
`/studio?fixture=stress-200-nodes` replaces the document from a committed file (ADR at prompt 34).
Autosave subscribes to `version`, and `replaceDocument` bumps it. Should a fixture session persist?

### Criterion (set before measuring)
The fixture path exists for measurement — TESTING.md § Determinism. If autosaving one perturbs a
number PERFORMANCE.md budgets, it does not belong on that path.

### Measurement
`stress-200-nodes.motion.json` is 168 kB. Persisting it means a `structuredClone` of the whole
document onto the IndexedDB thread, plus a second one for the first snapshot, inside the window the
canvas interaction specs measure frames in.

### Decision
`useAutosave({ enabled })`, and the studio passes `false` when `?fixture=` is in the query. Nothing
else changes: the store, the canvas and every command behave identically.

The reason is not only the measurement. A fixture is a committed file, not the user's work, and the
document list is a list of things the user made.

### Consequences
- `e2e/editor/persistence.spec.ts` cannot open a fixture. It builds its document the way a user does —
  a template, or a block from the palette — which is a better test of the path it is testing.
- Accepted: a session that arrives with `?fixture=` and then edits for an hour saves nothing. The
  query parameter is a testing seam and is not linked from anywhere in the product.

## ADR-287 — The size guard runs before the parse

**Date** 2026-08-30 · **Prompt** 50 · **Status** Accepted · **Amends** FILE_FORMAT.md § Import

### Question
FILE_FORMAT.md § Import listed `JSON.parse` first and the 10 MB guard second. Implementing that order
means handing an arbitrarily large string to a parser and hoping.

### Decision
The two boxes are swapped in the document, and the guard measures the text. `JSON.parse` is
synchronous, cannot be given a budget, and cannot be interrupted once it has started, so a file too
large to accept has to be refused before it reaches one. Everything after the parse is unchanged.

### Consequences
- The guard measures UTF-16 code units, not bytes on disk. A 10 MB cap read that way is at most the
  documented cap and never more, which is the direction to be wrong in.
- The `SIZE` rejection now precedes `PARSE`, so a file that is both huge and malformed reports its
  size. That is the more actionable of the two messages.

## ADR-288 — The template picker draws a schematic, not a screenshot

**Date** 2026-08-30 · **Prompt** 50 · **Status** Accepted

### Question
Prompt 50 asks for a thumbnail and a node count on each template card. `pnpm generate:thumbnails`
renders block thumbnails in a real browser and commits the images. Do templates get the same?

### Criterion (set before deciding)
A preview earns its place if it answers the question the person clicking is asking. On this dialog
that question is "what page is this", asked eight times in two seconds.

### Decision
A schematic: coloured bands stacked in the order of the template's top-level blocks, with heroes and
the one feature block accented, drawn from an `outline` array in `templates.json`. No image is
rendered, stored or fetched.

Eight screenshots at 320×200 in two colour modes is sixteen images and a browser in the build, and
each one goes stale the moment a block's default copy changes — the exact rot the CI check exists to
prevent for the documents themselves. The schematic is generated from the document, so it cannot
disagree with it.

### Consequences
- The dialog costs one 3 kB fetch and no images.
- Accepted: the preview shows structure, not visual style. Two templates with the same block order
  look alike, which is honest — they *are* alike in the way this preview reports on.
- The bands are `aria-hidden`; the name, the node count and the one-line description carry the card.

## ADR-289 — The toast viewport declares `aria-live="off"` so a dialog cannot hide it

**Date** 2026-08-30 · **Prompt** 50 · **Status** Accepted

### Question
Deleting a document from the document list publishes an undo toast — PRODUCT.md § 10 and
UI_GUIDELINES.md § Feedback rules, which prefer it to a confirmation dialog. Writing the test for it
found the undo button missing from the accessibility tree.

### Cause (verified in the session)
A modal Radix `Dialog` calls `hideOthers` from the `aria-hidden` package, which marks every sibling of
the dialog content `aria-hidden="true"`. The toast viewport is one of those siblings. So every toast
raised from inside any dialog in this app — the export dialog's "Copied" included — was visible and
unreachable.

### Decision
`aria-live="off"` on `RadixToast.Viewport`. `hideOthers` exempts `[aria-live]` from its sweep by
design, and `off` is the truthful value: Radix announces a toast through its own announcer element,
so this region must be reachable without announcing a second time.

### Consequences
- The defect predates this prompt and affected every dialog. `toast.test.tsx` now opens a dialog over
  a published toast and asserts `getByRole` still finds the action, so it cannot come back.
- Accepted: the toast is still *visually* above the scrim and clickable only because Radix marks the
  toast root `pointer-events: auto`. That is Radix's behaviour, not ours, and is not asserted here —
  jsdom resolves the inherited value through the portal differently from a browser.

## ADR-290 — The document dialogs stay in the studio chunk

**Date** 2026-08-30 · **Prompt** 50 · **Status** Accepted

### Question
Prompt 50 adds five dialogs, a storage layer and an import pipeline to `/studio`, which is already
over its 250 kB budget at 360 kB (ADR-198 and prompt 49 both record it). PERFORMANCE.md § Mandatory
dynamic imports names four modules that must be split. Do these belong on that list?

### Criterion (set before measuring)
`/studio` is 360 kB before this prompt. Split the dialogs if splitting recovers **5 kB or more** of
first load; leave them static below that, because a `next/dynamic` boundary is five more indirections
for a reader and a frame of latency for the user.

### Measurement
`pnpm --filter web build`, first-load JS for `/studio`:

| | First load | Route |
| --- | --- | --- |
| Prompt 49 | 360 kB | — |
| Prompt 50, everything static | **371 kB** | 193 kB |
| Prompt 50, all five dialogs dynamic | **369 kB** | 191 kB |

Two kilobytes. The dialogs are thin: they are `Dialog`, `Button` and `Input` over an import pipeline
and a storage layer that the store already pulls in, because `editor-store` imports the registry and
`@motion-studio/schema` on the studio's first line.

### Decision
Static. The split does not clear the threshold, and the eleven kilobytes prompt 50 costs are the
pipeline and the storage layer, neither of which can be deferred — autosave has to be listening
before the first edit and the session restore before the first paint.

### Consequences
- `/studio` is **371 kB** against a 250 kB budget. It was 360 before this prompt and the gap is
  prompt 54's to close; this records what prompt 50 added and why none of it is deferrable.
- The four modules PERFORMANCE.md names are still the four that are split. This adds none.

## ADR-291 — A document on the system clipboard outranks blocks in the store's

**Date** 2026-08-30 · **Prompt** 50 · **Status** Accepted

### Question
`Mod+V` is bound only while the store's clipboard holds blocks, so a paste of a `.motion` document
reached the import path *only* with an empty store clipboard. Copy a block, then copy a document from
a file, then press `Mod+V`: the editor pasted the block.

### Why that is wrong rather than merely surprising
The store's clipboard is a cache of an earlier copy. The system clipboard is what the user copied
**last**, and the last copy is what a paste means everywhere else in every application. The old
behaviour silently ignored the more recent of the two.

### Decision
The `paste` shortcut asks `tryPasteDocument()` first and falls through to the block paste when the
answer is no. The seam is a module port — the same shape as the escape-hatch port (ADR-279), because
a module-level shortcut registry has no React context in scope and the handler lives in a provider.

`when` is unchanged: it still reports whether the *block* paste is available, which is what the
command palette and the canvas menu grey out.

### Consequences
- Accepted: the shortcut's `run` is now asynchronous, so a paste costs one clipboard read before it
  decides. `navigator.clipboard.readText()` on a focused document resolves in under a millisecond,
  and a refusal — a dismissed permission prompt — is treated as "not a document" rather than as an
  error, so the block paste still happens.
- With an empty store clipboard the binding still stands aside and the browser's native paste event
  carries the document, which is the route the E2E spec exercises.

## ADR-292 — `pnpm analyze` exists, and the studio's first load is attributed

**Date** 2026-08-30 · **Prompt** 50 · **Status** Accepted

### Question
`/studio` is 370 kB gzip against a 250 kB budget. PERFORMANCE.md § Mandatory dynamic imports says
"`pnpm analyze` produces the treemap that proves it" — and there was no such script, so every
statement about what is in that chunk had been reasoning rather than measurement.

### What was tried first, and what it cost
Two plausible causes were tested by changing the code and rebuilding. Both were **wrong**, and both
are recorded because the next person will think of them too:

| Hypothesis | Change | Result |
| --- | --- | --- |
| The store pulls React block components through the barrel | 13 imports moved to `@motion-studio/blocks/registry` | 370 kB → 370 kB |
| The effects panel pulls all 72 components through `renderRegistry` | effect card given `blocks/effects` directly | 370 kB → 370 kB |

Both were reverted. Webpack already splits the component maps; the string matches that suggested
otherwise (`react-hook-form`, `HeroAurora`) are **data** — the `ImportSpec` and `componentName` fields
of the codegen descriptors, which are strings in the definitions.

### Decision
`@next/bundle-analyzer` as a devDependency of `web`, a two-line `next.config.ts` that enables it on
`ANALYZE=true`, and `scripts/analyze.mjs` behind `pnpm analyze` — a script rather than an inline
environment variable because the two shells this repository is built on set one differently, and a
gate that works on one machine is not a gate.

### Measurement
`pnpm analyze`, gzip, the chunk `/studio` loads for itself (112.7 kB of the 370 kB; the rest is the
104 kB shared React and Next runtime plus the shared vendor chunks):

| | gzip |
| --- | --- |
| `packages/blocks/src/registry.ts` + 200 modules | **44.5 kB** |
| `app/studio` — the shell, panels, inspector, canvas host | 19.6 kB |
| `packages/editor/src` | 11.7 kB |
| `packages/schema/src` | 8.9 kB |
| `packages/dnd/src` | 6.5 kB |
| `packages/ui/src` | 5.5 kB |
| the remaining block category metadata | 10.1 kB |
| `packages/icons/src` | 3.2 kB |

**The block definitions are the largest single item in the studio's first load**, at 44.5 kB — a Zod
schema, a control list, defaults, a codegen descriptor and a markup producer, seventy-two times.

### Consequences
- The gap is 120 kB and the biggest single item is 44.5 kB, so **no one split closes it**. Splitting
  the definitions into a catalogue half and an export half is the largest available move and it
  touches all seventy-two blocks — that is prompt 54's pass, and it now starts from this table
  instead of from a guess.
- Prompt 50's own contribution is 10 kB and is measured in ADR-290. Nothing here is deferrable:
  autosave listens before the first edit and the session restore runs before the first paint.
- `pnpm analyze` writes `apps/web/.next/analyze/client.html`. An ordinary `pnpm build` is unchanged —
  the analyzer is off unless the variable is set.

## ADR-293 — The landing sample is tokenised by our own highlighter, not Shiki

**Date** 2026-08-30 · **Prompt** 51 · **Status** Accepted · **Extends** ADR-124

### Question
`prompts/51` says the export reveal is "highlighted with Shiki at build time (zero runtime cost)".
ADR-124 already rejected Shiki for the *runtime* code block and shipped a 130-line tokeniser in its
place. Does a build-time use bring it back?

### The end the prompt names, and the means
The end is zero runtime cost, and it is met either way: the highlighting happens in
`pnpm generate:landing` and the page ships spans. So the question is only which tokeniser runs at
build time, and there the argument goes the other way.

The landing page shows the code the exporter produces. The **exported page shows the same code
through `CodeBlock`**, which uses our tokeniser. Two highlighters means the marketing page and the
product can paint the same file differently — the one place where a difference is visible and
embarrassing.

### Decision
`tokenize` from `@motion-studio/blocks/highlight`, called from the generator. No new dependency, and
the page and the product agree by construction.

Where the prompt named a library rather than a property, the property is what it was asking for.
Where it named a property — build-time, zero runtime cost — that is met exactly.

### Consequences
- Five colours rather than a full grammar. ADR-124 measured that as sufficient for a marketing sample
  and it is the same sample here.
- `EXPORT_SAMPLE_FILES` ships beside the lines, so the page can say the export is four files without
  hard-coding the number.
- If the exporter's output changes, `pnpm generate:landing` is how the page catches up, and the
  committed file is the diff that shows it.

## ADR-294 — Reduced motion removes animation from the hero demo, not the interaction

**Date** 2026-08-30 · **Prompt** 51 · **Status** Accepted

### Question
`prompts/51` says the hero demo "degrades to a static rendered node when JS is unavailable **or
reduced motion is on**". Taken literally, a visitor who asked for less movement loses the control.

### Decision
The no-JavaScript half is implemented exactly as written: the server renders the node and the caption
"Interactive demo — open the studio", and that is the whole component without a client bundle.

The reduced-motion half is implemented as **no animation, same interaction**. Dragging a card is
direct manipulation, not motion: nothing moves that the user is not moving. What reduced motion
removes is the `transition` on the card's position, which is the only thing that animates.

### Why the deviation
ENGINEERING_CONTRACT.md § 1.6 requires `prefers-reduced-motion` to be honoured; ACCESSIBILITY.md
§ Motion is about vestibular safety. Neither asks for a control to be withdrawn, and withdrawing one
would make the page worse for the people the setting exists to protect. The prompt's sentence is
about animation, and the animation is gone.

### Consequences
- `motion-safe:transition-[left,top]` is the only motion in the demo, and it is the only thing the
  media query removes.
- The keyboard path — arrow keys, `Shift` for a coarse step — is unaffected in every state.
- The inspector walkthrough is the opposite case and is handled the other way (ADR-295): a value that
  scrubs *as the page scrolls* is scroll-linked motion, so reduced motion gets the static pair.

## ADR-295 — The landing page's CLS came from four places, and every one is measured

**Date** 2026-08-30 · **Prompt** 51 · **Status** Accepted

### Question
`/` opened at Lighthouse mobile Performance 86 with CLS 0.10 against a 0.02 budget. Four separate
causes, none of which was the one guessed first.

### What was wrong, in the order it was found

| Cause | Evidence | Fix |
| --- | --- | --- |
| The stat row rewrapped when Geist Mono replaced the fallback | `dl` height 30 → 52 px at 1.3 s | A three-column grid with labels short enough that none can wrap |
| `next/dynamic` with `ssr: false` renders `null` while its chunk is in flight | the hero figure vanished for ~300 ms; section height 1019 → 667 → 1019 | `React.lazy` + `Suspense`, whose fallback is the server-rendered node |
| The walkthrough's two variants were different heights | the pair is 258 px taller than the live panel at 1280 px | The pair is compact and both variants carry the note |
| The static and live captions wrapped differently at 412 px | 0.073 of the total | Two lines of room reserved in the figcaption |

**Result: CLS 0.0000**, LCP confirmed as the `<h1>` at 172 ms observed.

### Two things that were tried and were not the cause
Recorded because they are the obvious guesses and both cost a build:

- **Preloading Geist Mono.** Identical LCP, identical CLS. The rewrap was a layout problem, not a
  loading one, so PERFORMANCE.md § Fonts keeps its original rule — sans preloads, mono does not.
- **The theme applying on mount.** No layout-affecting token changes between the stylesheet's
  defaults and `studioDark`; the h1 and the figure measure the same before and after hydration.

### The other two performance findings
- **`/studio` was being prefetched from the landing page.** A 373 kB route downloaded for a visitor
  who had not asked for it — a 117 ms long task and 1.3 s of simulated LCP. Every link on this page
  is `prefetch={false}`.
- **The three islands loaded during the first paint.** They mount on an `IntersectionObserver` with
  half a viewport of margin, and the hero's on an idle callback. TBT 210 → 20 ms.

### Measured, after all six
| | Mobile (simulated) | Mobile (devtools throttling) | Desktop |
| --- | --- | --- | --- |
| Performance | 97 | 99 | 100 |
| Accessibility | 100 | 100 | 100 |
| Best practices | 100 | 100 | 100 |
| SEO | 100 | 100 | 100 |
| LCP | 2.5 s | **1.7 s** | 0.5 s |
| CLS | 0 | 0 | 0 |
| TBT | 20 ms | 70 ms | 0 ms |

PERFORMANCE.md § Public pages budgets LCP "≤ 2.0 s, `/`, mobile 4G throttled", which is the middle
column: **1.7 s**. The 2.5 s is Lighthouse's Lantern *simulation* of the same conditions, and the
observed paint in that same run is 172 ms — TTFB 11 ms plus 160 ms of render delay.

### Consequences
- `text-foreground-subtle` is gone from this page. It is 4.11:1 on light `surface-0` (ADR-198 accepted
  that) and the contrast test does not cover it; `foreground-muted` is covered against every surface.
  A public page may not use the one token that is knowingly below AA.
- `app/icon.svg` exists. The favicon 404 was costing Best Practices a point on every route.

## ADR-296 — The hero's ground is a lit plane, not a black rectangle

**Date** 2026-08-30 · **Prompt** 51 · **Status** Accepted

### Question
`prompts/51` asks for the landing page to be compared directly against impeccable.style and judged on
"the hero's depth and gradient quality". Opened side by side at 1440 × 900, the reference's first
screen has visible atmosphere and ours has none. Is that an impression or a fact, and how big is it?

### Criterion (set before measuring)
The same band on both pages — the full-width strip from y 620 to y 780, which carries no text on
either — sampled for luminance. Ours must reach a **median of at least 8/255**, so that the majority
of the ground carries light rather than sitting on the bare surface, and a **5th-to-95th-percentile
spread of at least 35**.

### Measurement

| | p05 | p50 | p95 | spread |
| --- | --- | --- | --- | --- |
| Ours, before | 2.9 | **2.9** | 20.0 | **17.1** |
| Ours, after | 2.9 | **8.4** | 22.0 | **19.1** |
| impeccable.style | 1.6 | 5.1 | 94.5 | 92.9 |

Before the change the median pixel of the hero's floor was `surface-0` exactly: half the first screen
was not a dark surface, it was the absence of one. Two of the three radial gradients had their bright
cores placed *above* the section — `at 12% -14%` and `at 78% -6%` — so what reached the page was only
their outer falloff.

### Decision
Two layers behind the copy, both decorative and `aria-hidden`, neither an LCP candidate — a CSS
gradient is not one, only `url()` is:

1. The dot lattice the canvas rules its own surface with, masked to fade at the edges. It is what
   turns the section from an absence into a plane, and it is the product showing through its own
   marketing rather than a texture bought in.
2. The light on it: the two cores moved inside the section, and a wide low wash across the floor.

**The median target is met (8.4 ≥ 8). The spread target is not (19.1 against 35), and it is not
close.** The reference gets its spread from a photographic marble texture. Reaching 92.9 with CSS
gradients would mean a wash several times louder than this page's register, and reaching it with an
image would put a large decorative download in front of a page whose argument is that it is fast. The
number is recorded as missed rather than restated at a level the result happens to clear.

### Consequences
- LCP re-confirmed as the `<h1>`, observed at **164 ms**, single entry. CLS still 0.
- The hero is heavier to look at on an OLED panel, which is the point, and slightly less black.
- A pass that wants the reference's number needs a texture, and that is a performance decision
  before it is a visual one.

## ADR-297 — The problem section opens like every other band of the page

**Date** 2026-08-30 · **Prompt** 51 · **Status** Accepted

### Question
`prompts/51` asks whether the page "reads as one designed system rather than eight sections".
Section 01 was the one that did not.

### Criterion (set before measuring)
Count the bands that open with the shared two-column `SectionIntro` — heading left, argument right —
against those that do not. A single exception is a defect in the system, not a variation of it.

### Measurement
Six of seven bands used `SectionIntro`. `problem` used a bare `h2`, and it was also the only band
whose opening left the right half of the content column empty at 1440 px: 561 px of heading in a
1063 px column, with nothing beside it.

### Decision
`problem` uses `SectionIntro` like the rest. The claim opens the section and the two columns of
evidence follow it, which is the order every other band is built in — state it, then show it.

### Consequences
- One new sentence of copy for the right column. The closing line, which is the section's punchline,
  stays where it was.
- The section is a few lines taller. CLS unaffected: it is below the fold and server-rendered.

## ADR-298 — A code sample that scrolls is a focusable region, and the suite now looks at 320 px

**Date** 2026-08-30 · **Prompt** 51 · **Status** Accepted

### Question
`prompts/51` asks for the page at 320 px: no horizontal scroll, everything legible. The page passed
that. It did not pass axe.

### Measurement
axe, WCAG 2.0/2.1 A and AA, at 320 × 720 with every island mounted:

```
1 violation
- scrollable-region-focusable (serious): Scrollable region must have keyboard access
    pre
```

The export sample's `pre` is `overflow-x-auto`. At 1440 px the file fits and the element does not
scroll, so it is not a scrollable region and axe has nothing to say about it. At 320 px it scrolls
368 px inside 278, and every character past that edge is unreachable from a keyboard.

The suite ran at 1440 px only. It was not a missing assertion — it was a missing viewport, and a
whole class of defect lives below the width the suite used.

### Decision
Already specified, so nothing here is new design: ACCESSIBILITY.md § Dialogs states the shape for the
export dialog's code blocks — `tabindex="0"`, `role="region"` and a label — and it holds wherever a
`pre` scrolls. The landing page's sample now matches the one in `packages/blocks`.

The focus ring is drawn **inside** the box, with a negative outline offset. The figure wrapping the
sample is `overflow-hidden` and the two-ring focus shadow of `:focus-visible` is drawn outside the
border box: on an element that fills a clipped container that is a focus indicator nobody can see.

The suite gained a 320 px pass that runs the same axe scan and then focuses the sample. Zero
violations at both widths.

### Consequences
- One more tab stop on the page, between the export section's heading and the next link.
- The 320 px scan costs about 2.6 s in a suite that runs in 15 s.

## ADR-299 — A band of the page is named by its heading, not by its rail coordinate

**Date** 2026-08-30 · **Prompt** 51 · **Status** Accepted

### Question
`prompts/51` asks what a screen reader announces for the architecture diagram. The answer was worse
than expected, and it was not about the diagram.

### Measurement
The accessibility tree for `#architecture`:

```
region: "05 / SHAPE"
  heading: "Seventeen packages, one direction."
  list: 4 items, each a heading, a note, and a nested list of packages
```

The diagram itself reads correctly — it is `ol`/`ul` with headings rather than an image, so the
structure *is* the text alternative, and a reader walks it layer by layer. But the region containing
it is named `05 / SHAPE`. Every band had the same defect: a reader moving by landmark heard
"01 / GAP", "02 / EFFECTS", "05 / SHAPE" — the rail coordinates, which are a visual device for
locating yourself on the page and say nothing about what is in the section.

### Decision
`aria-labelledby` names the region from its heading first and its coordinate second:
"Seventeen packages, one direction. 05 / shape". The heading carries the id and `SectionIntro` takes
it as a required prop, so the name cannot drift from the heading it is taken from.

The coordinate is kept rather than dropped: it is what the visible rail says, and a reader who hears
"05 / shape" and a reader who sees `05 / shape` are then in the same place on the page.

### Consequences
- `SectionIntro` gained a required `id`. Every caller passes one; a new section cannot forget it.
- A test asserts the accessible name of all six bands, so a heading edit that leaves the id behind
  fails rather than degrades quietly.

## ADR-300 — Seven packages were missing `sideEffects`, and the hero demo was carrying the canvas context menu

**Date** 2026-08-30 · **Prompt** 51 · **Status** Accepted

### Question
`prompts/51` § The interactive hero demo: "under 40 kB of JS". The number had never been measured.

### Criterion (set before measuring)
Every chunk the page requests that is not in `/page`'s entry in `app-build-manifest.json`, gzipped
from disk. The hero demo's share is what arrives with no scrolling at all, because it is the only
island that mounts on an idle callback rather than on an observer. Budget: under 40 kB gzip.

### Measurement, before

```
hero demo: 48.9 kB gzip across 5 chunks
   2403  18.2 kB   Radix DismissableLayer · FocusScope · Popper · Presence · aria-hidden
   9114   8.0 kB   Radix Collection · Direction · roving focus
   7571   3.4 kB   Radix Menu / ContextMenu
   2066  16.3 kB   @motion-studio/canvas, including CanvasContextMenu — "Add motion",
                   "Bring forward", "Copy React"
   3231   3.0 kB   the hero demo itself
```

**Over budget by 8.9 kB, and 29.6 kB of it is a right-click menu the landing page does not have.**
`hero-demo.tsx` imports `canvasRect` and `computeSnap` — two pure functions — from the
`@motion-studio/canvas` barrel, and the whole graph behind the barrel came with them.

### The cause was a rule already written down and not applied

PERFORMANCE.md § Tree-shaking discipline: *"`sideEffects: false` in every package's `package.json`
except those with CSS imports, which list the CSS files explicitly."* Seven packages did not have it
— `canvas`, `codegen`, `dnd`, `editor`, `schema`, `tokens`, `utils`. Without the declaration webpack
must assume that evaluating any module in the package can matter, so a barrel that re-exports a
`'use client'` module is not shakeable and the import of two functions pulls the file that defines
`CanvasContextMenu`.

So this is § 9.1, not a new design: apply what the document says, then measure.

### The alternative that was measured and rejected

`experimental.optimizePackageImports` on the five large barrels — Next rewrites a named import from
a barrel into an import of the declaring module at build time. It was tried first, before the cause
was found, and it works. It is not kept, because it is strictly worse than the rule that was already
written and adds nothing on top of it:

| | Before | `optimizePackageImports` | `sideEffects: false` | Both |
| --- | --- | --- | --- | --- |
| Hero demo, everything it pulls | 48.9 kB | 8.6 kB | **2.8 kB** | 2.8 kB |
| All three islands together | 73.9 kB | 33.5 kB | **27.9 kB** | 27.9 kB |
| `/studio` first-load JS | 373 kB | 372 kB | **365 kB** | 365 kB |
| `/playground` first-load JS | 185 kB | 184 kB | **181 kB** | 181 kB |

The combination measures identically to the declaration alone, so the experimental flag earns
nothing and `next.config.ts` keeps only the analyzer.

### Measured, after

| Island | Own chunks | Everything it pulls |
| --- | --- | --- |
| Hero demo | 2.8 kB gzip | **2.8 kB gzip** — budget 40 kB |
| Effect grid | 4.3 kB gzip | — |
| Inspector walkthrough | 2.9 kB gzip | — |
| All three, plus what they share | | **27.9 kB gzip** |

`/` first-load JS is 108 kB either way: none of those 46 kB was ever on the critical path. It was
46 kB downloaded a second after the paint for no reason. Lighthouse is unchanged, which is the
expected result and the reason the defect survived four Lighthouse passes.

### Consequences
- `/studio` is 8 kB lighter and `/playground` 4 kB, from a change made for the landing page. The
  studio's 250 kB budget is still 115 kB away — ADR-292 has the attribution, and prompt 54 the pass.
- `packages/config` is the one package still without the declaration. It ships tsconfig, biome and
  vitest presets that are read as files rather than imported as modules, so there is no graph for
  the bundler to shake and the field would assert something about nothing.
- The declaration is a promise: a module in one of these seven packages that does work at import
  time will now be dropped silently. None does — they export functions, components and constants —
  and a package that needs to break the promise has to list its exceptions like `blocks` and `ui`
  already do.

## ADR-301 — Five of the six effect tiles were below 3:1, and the first measurement of them was wrong

**Date** 2026-08-30 · **Prompt** 51 · **Status** Accepted

### Question
`prompts/51` asks for a judgement on "the finish on the effect grid". Four of the six tiles looked
like empty rectangles at 1×. Do they, or is that an impression?

### The first attempt measured the wrong thing, twice

Recorded because both failures are easy to repeat and the second one is a property of the tool.

1. **Wrong property.** The first metric was the 5th-to-95th-percentile luminance spread of the tile,
   with a threshold of 12/255. It reported a spread of 0 for the border beam, the dot grid and the
   particles. That is arithmetically true and says nothing: a 2 px arc covers about 1 % of a
   310 × 128 tile, so 95 % of its pixels are the bare surface whether the arc is black or white. A
   metric that fails every thin-line and sparse-point effect by construction is not measuring
   legibility.
2. **Wrong sample.** Playwright's `locator.screenshot()` rewinds every CSS animation to its first
   frame before capturing. Every rerun therefore photographed phase zero — where a travelling beam
   has not travelled and a particle field has not risen — which is why the numbers never moved.

Two further attempts to sample real phases failed and are recorded so nobody repeats them:
`screenshot({ animations: 'allow' })` waits for the element to hold still, which a continuous effect
never does; and CDP `Page.captureScreenshot` needs a document-relative clip, so a `boundingBox()`
passed to it straight returns a blank capture.

**Between the broken metric and a look at a 3× screenshot, the tiles were called fine. That was the
banned fourth way and it was also the wrong answer.**

### Criterion (set before the second measurement)
On a card whose entire subject is the effect, the effect is the content, not decoration. So it is
held to what ACCESSIBILITY.md asks of any non-text carrier of meaning:

1. **Contrast ≥ 3:1** between the effect's lit peak — the 99.9th percentile, not the maximum, so one
   antialiased sub-pixel is not a feature — and the tile's own painted surface, read from its darkest
   corner rather than from a declared token. WCAG relative luminance, linearised.
2. **Lit area ≥ 0.5 %** of the tile, counted at least halfway from surface to peak. A 1 px line across
   a 310 px tile is 0.78 % of it, so 0.5 % sits under the thinnest feature these effects legitimately
   draw and over the level at which stray pixels pass.

Two states, both defined rather than caught: the **first frame**, which is what the tool can capture
and is also the frame a visitor sees as the grid scrolls in, and **reduced motion**, which is static
by definition and is therefore its own steady state.

### Measurement

| Tile | First frame, before | Reduced, before | First frame, after | Reduced, after |
| --- | --- | --- | --- | --- |
| Aurora | 2.97 · 78.6 % | 3.00 · 69.6 % | **3.83** · 82.1 % | **3.86** · 73.3 % |
| Spotlight | **1.52** · 7.5 % | **1.52** · 7.5 % | 3.67 · 10.4 % | 3.67 · 10.4 % |
| Border beam | 5.34 · 0.55 % | 5.32 · 0.55 % | 5.14 · 0.53 % | 5.32 · 0.55 % |
| Dot grid | **2.84** · 0.66 % | **2.84** · 0.66 % | 10.58 · 2.44 % | 10.58 · 2.44 % |
| Beams | **2.90** · 10.3 % | **1.71** · 26.6 % | 6.42 · 19.2 % | 3.92 · 23.9 % |
| Particles | 4.69 · **0.22 %** | 7.15 · **0.41 %** | 6.97 · 0.78 % | 7.15 · 1.48 % |

**Five of six failed, in one state or both.** Only the border beam — the one that looked emptiest and
that the first metric scored 0 — was already correct. The impression and the first metric were both
wrong, in opposite directions.

### Decision
The landing tiles set every effect's props for a 128 px card instead of inheriting catalogue defaults
tuned for a full-width section. The components are untouched: what changed is how this page presents
them, which is what an inspector is for.

- Spotlight `intensity` 0.45 → 1, `reach` 55 → 70. It follows the pointer, and a visitor who has not
  moved one was seeing the unlit default.
- Dot grid `intensity` 0.35 → 0.75, `dotSize` 1.5 → 2, `spacing` 16 → 14.
- Beams `intensity` 0.5 → 1. Its reduced-motion state was the worst cell in the table at 1.71.
- Aurora `intensity` 0.75 → 0.95, from 2.97 — under the line by 0.03, and under it is under it.
- Particles `count` 44 → 130, `size` 2 → 2.5. Its contrast was never the problem; 44 points of 2 px
  in a 310 × 128 tile is 0.2 % of it.

### Consequences
- The grid is louder than it was. That is the correction, not a side effect: it was the deficit the
  side-by-side against the reference found first, and four tiles reading as black rectangles is an
  argument against a page whose claim is that these are real components.
- The dot grid is now the loudest tile at 10.58:1. It is texture rather than a figure, so it can carry
  it, and dropping it back to the threshold would put it one measurement away from failing again.
- The threshold is a judgement about this card, not a general rule: an aurora behind a hero is
  decoration and 3:1 would be wrong for it. Here the effect is the subject of the card.
- Not enforced in CI. The measurement wants a rasterised page, which is the visual-regression pass in
  prompt 57; this entry is the number it should be given.

## ADR-302 — A control row has a minimum height, not a fixed one

**Date** 2026-08-31 · **Prompt** 52 · **Status** Accepted

### Question
The gallery's props panel renders `hero-split`, whose `headline` and `subtitle` are `textarea`
controls. Both drew straight over the rows beneath them.

### Measurement
`controlRowStyles` was `flex items-center gap-1.5 pr-1` plus `HEIGHT_CLASS.controlRow`, which is
`h-[28px]`. A `textarea` control is `minRows: 2`, about 40 px, and a list control is as many rows as
it has items. A fixed height does not clip an overflowing child; it lets it paint outside the box, so
the row below is covered by content that belongs to the row above.

This is not the gallery's bug. The studio's inspector renders the same descriptor through the same
`ControlRow`, so it has drawn the same overlap for every multi-line control since prompt 23. The
gallery is only where someone looked at one.

### Decision
`min-h-[28px]` in place of `h-[28px]`, plus `py-0.5`. Every single-line control is 26 px inside a
28 px row and is unchanged; the tall ones now take the room they need.

`DENSITY.controlRow` stays 28 — the scale in UI_GUIDELINES.md § Density is a statement about the
rhythm of a panel, and the rhythm is unchanged. What changed is that 28 is a floor.

### Consequences
- The studio's inspector is fixed by the same edit, which is the argument for fixing the primitive
  rather than working around it in one consumer.
- 65 `packages/ui` tests and 64 `apps/web` tests pass unchanged; none of them asserted the height.
- A panel with several `textarea` controls is taller than it was. That is the correct height and it
  was always the correct height.

## ADR-303 — A live preview brings its own headings, and it is not an iframe

**Date** 2026-08-31 · **Prompt** 52 · **Status** Accepted

### Question
`/blocks/hero-centered` renders the real `hero-centered`, which contains a real `h1`. The page has
its own `h1` too. ACCESSIBILITY.md § Landing, gallery, docs says "One `h1`".

### The options, and what each costs

| | Outline | Theme | Cost |
| --- | --- | --- | --- |
| Preview in an `iframe` | Scoped, correct | A separate document: `ThemeScope` no longer cascades in, so each frame needs its own theme write | A document per card, 72 of them on `/blocks`; container queries replaced by a resize observer per frame |
| Preview inline | Two `h1`s on 6 of 72 pages | One `ThemeScope`, variables only | None |
| Preview inline, `aria-hidden` | One `h1` | — | The component is unreachable, which is the surface's whole point |

### Decision
Inline, and the document changed to say so before this code was written. A preview is a
demonstration, not part of the page's structure, and the rule was about structure. What the preview
owes instead is a labelled `region`, so a reader is told they are entering a demonstration rather
than dropped into a second document with no warning — `block-preview.tsx` renders
`<section aria-label="Hero — centred, live preview">` and `gallery.spec.ts` asserts it.

The iframe is rejected on the table above rather than on taste. It is the only option that fixes the
outline, and it costs the two things this surface is built out of: one theme cascading into every
preview, and a container query doing the scaling arithmetic with no JavaScript.

### Consequences
- Six of the seventy-two detail pages have two `h1`s: the hero blocks. The others have one.
- `grab-effect.spec.ts` scopes its heading assertion to `main > header`, so the page's own heading is
  still checked on all seventy-two.
- A future docs surface embedding the same previews inherits this decision and the same obligation.

## ADR-304 — A card nobody has scrolled to is an aspect-ratio box, not a container query

**Date** 2026-08-31 · **Prompt** 52 · **Status** Accepted

### Question
`/blocks` renders 72 cards. Mobile Lighthouse opened at Performance 94 with 545 ms of Style & Layout
and a 250 ms long task attributed to the document before any script ran.

### Measurement

| | Before | After |
| --- | --- | --- |
| Style & Layout | 545 ms | 308 ms |
| CLS | 0.026 | 0.0007 |
| Accessibility | 96 | 100 |

Three causes, each measured separately:

1. **72 container query contexts.** `PreviewFrame` scales its stage with `100cqw`, which needs
   `container-type: inline-size` — and it was on every card at first paint, including the sixty a
   visitor never scrolls to. An unmounted card is now a plain `aspect-ratio` box with the same
   geometry and none of the containment work.
2. **72 running animations.** Every placeholder was `animate-pulse`. A skeleton animates to say
   "something is coming"; a card nobody has scrolled to is not waiting for anything.
3. **A wrapping row of category chips** re-wrapped when Geist Mono replaced its fallback — 0.026 of a
   0.02 budget, and the same defect ADR-295 found in the landing page's stat row. It is one line that
   scrolls now, because a row that cannot wrap cannot re-wrap.

The accessibility point is separate and was found in the same run: `opacity-60` on a count beside a
`foreground-muted` label drops it under 4.5:1. The opacity is gone; the token was already correct.

### What the first three runs of this measurement were worth

Nothing, and the reason is worth recording. Lighthouse was run while a `next build` was running on
the same machine, and TBT swung 92–326 ms across four identical runs — Performance 92 to 99 on bytes
that did not change. **The final numbers below were taken on an idle machine**, and any performance
number in this repository taken beside a build should be assumed to be noise.

### Measured, on an idle machine, three runs each

| | `/blocks` | `/blocks/aurora-background` |
| --- | --- | --- |
| Performance | 100, 100, 100 | 98, 99, 99 |
| Accessibility | 100 | 100 |
| Best practices | 100 | 100 |
| SEO | 100 | 100 |
| LCP | 1.4–1.5 s | 1.4–1.6 s |
| CLS | 0.0007 | 0.0005 |
| TBT | 0–6 ms | 0–30 ms |

### Consequences
- The catalogue's first paint is HTML and 72 boxes. Everything else waits for a scroll.
- `card-preview.test.tsx` asserts the negative — that nothing loads before the observer fires —
  because that is the half an eye cannot check.

## ADR-305 — The gallery's detail page carries 36 kB of animation runtime it does not use

**Date** 2026-08-31 · **Prompt** 52 · **Status** Accepted, and not acted on here

### Question
`/blocks/[slug]` is 190 kB of first-load JS. What is in it?

### Measurement
Every chunk the page requests, gzipped from disk, timed from navigation:

```
53.0 kB  at 18 ms  framework
44.9 kB  at 18 ms  shared
36.4 kB  at 18 ms  motion — framer-motion's projection, drag, animation and value modules
12.6 kB  at 18 ms  …
```

The 36.4 kB arrives with the route's own scripts, not on demand. The chain is:
`ControlRow`/`ControlRenderer` → `@motion-studio/ui` barrel → `controls/index.ts` →
`segmented-field` → `Segmented` → `motion/react`.

`ControlRenderer` lazy-loads `control-fields` precisely so that the control library is not in a
consumer's first load (prompt 23). **The barrel undoes it**: `packages/ui/src/index.ts` does
`export * from './controls/index'`, and that module eagerly re-exports every field, so importing one
row component pulls the graph the lazy boundary exists to defer.

One narrower path was found and taken because it is unambiguous: `spring-curve.ts` imported
`simulateSpring` from the `@motion-studio/motion` barrel, which exports `FramerMotion`. It now
imports from `@motion-studio/motion/curves`, a subpath that already existed and now points at the
folder's barrel rather than at `easings.ts` alone. That is correct on its own terms and it did not
move the number.

### Decision
**Record it; do not restructure `packages/ui`'s public surface in a prompt about a gallery.**

The fix is to stop `controls/index.ts` re-exporting the fields eagerly, which changes what
`@motion-studio/ui` exports and touches every consumer — most of all `/studio`, whose 250 kB budget
is over by 115 kB and which prompt 54 owns. The gallery meets its own bar without it: 98–99 mobile
Performance, TBT under 30 ms, because none of those 36 kB is on the critical path.

Doing it here would be a change to a shared package's API, measured against a page that does not
need the change, in a prompt whose subject is something else.

### Consequences
- Prompt 54 has a named first target with a measured size and a reproduced import chain.
- Until then `/blocks/[slug]` ships an animation runtime it never calls.

## ADR-306 — A scoped theme did not reach a single Tailwind class

**Date** 2026-08-31 · **Prompt** 52 · **Status** Accepted

### Question
The detail page's theme switcher renders the preview inside a `ThemeScope`. Switching to `paper`, a
**light** preset, left the preview dark.

### Measurement
Reading the scope element after the switch:

```
scopeMode        light          ← the scope knows
--ms-color-surface-0    oklch(98.50% 0.0013 81.00)   ← the variable is written
background-color        oklch(0.095 0.006 265)       ← what is painted: the dark root value
```

The engine was doing its job and nothing looked at the result. Tailwind v4's `@theme` emits
`--color-surface-0: var(--ms-color-surface-0)` **on `:root`**. CSS substitutes a custom property in
the context of the element that declares it, and descendants inherit the *substituted* value — so
`class="bg-surface-0"` inside a scope keeps the root's colour however many `--ms-*` variables the
scope overwrites.

Every block in the catalogue is built out of those classes. So `ThemeScope` changed the palette for
anything written as `var(--ms-color-…)` directly — a handful of effects — and nothing else.
THEME_ENGINE.md § Scoped themes has claimed this works since prompt 6.

### Decision
The generator emits the alias block a second time, keyed on `[data-color-mode]` — the attribute
`applyTheme` already sets on whatever root it is given:

```css
[data-color-mode] {
  --color-surface-0: var(--ms-color-surface-0);
  …
}
```

Inside a scope the aliases re-substitute in the scope's own context. `:root` carries the attribute
too and is matched with identical values, so this is additive rather than a second source of truth,
and `generate.test.ts`'s existing assertions — committed bytes match a fresh run, every referenced
`--ms-*` is declared, no value is ever inlined — cover the new block unchanged.

### Measured, after

```
--ms-color-surface-0    oklch(98.50% 0.0013 81.00)
background-color        oklch(0.985 0.0013 81)      ← the scope's own value
```

### Consequences
- Both generated stylesheets grow by 133 lines. They are generated; the source of truth is one list
  of mappings emitted twice.
- Every scoped theme in the product now works, not only the gallery's. The studio's theme builder
  previews the same way.
- The rule is `[data-color-mode]`, so an element that carries the attribute without being a theme
  scope would also re-resolve — to the same values it already had.

## ADR-307 — Documentation markdown is compiled by `marked`'s lexer, not MDX

**Date** 2026-08-31 · **Prompt** 53 · **Status** Accepted

### Question
`/docs/[...slug]` renders 29 existing `.md` files. Prompt 53 names `docs-content.tsx` as "MDX
components", which implies compiling the documents as MDX. Three candidates: MDX, an external
markdown parser, or a hand-written one.

### Criterion (set before measuring)
The prompt states the criterion itself, for the nav source, and it applies unchanged here:
*robustness against ordinary edits* — "a build failure caused by editing prose is not acceptable".
Two further checks, from TECH_STACK.md § Adding a dependency: what the candidate does that we cannot
do in ~50 lines, and what it costs in the bundle it lands in.

### Measurement
MDX makes `<` and `{` syntax in prose. A specification document is prose about code, so
`{ id: string }` or `<button>` written outside a fence is an ordinary edit that becomes a build
failure. A census of today's corpus found **0 prose lines** carrying either character outside a
fence, so MDX is not blocked today; the exposure is prospective and it is exactly the class the
prompt refuses.

A hand-written parser was measured against the corpus instead of guessed at. The documents use 11
block constructs and 5 inline ones: paragraph, heading, fenced code (216 fences), GFM table (179),
list and nested list (614 lists, 2053 items, 49 task checkboxes), `hr`, blockquote, and inline text,
code span (8562), strong, em, link. Tables carry code spans containing `|`, which is the case a
line-splitting table parser gets wrong. That is not a ~50-line job, and its failure mode is a
mis-rendered specification page.

`marked` 18: one package, GFM by default, ships its own types, and exposes a token tree
(`Lexer.lex`) rather than an HTML string — so the renderer stays ours and no HTML is injected.

### Decision
`marked`'s lexer, with our own React renderer over its tokens. No `dangerouslySetInnerHTML`, no MDX
compiler, no bundler plugin.

The route is fully static, so the parser runs during `next build` and never in a browser.

### Consequences
- Accepted: one dependency, 480 kB unpacked, in `apps/web`'s `dependencies` because `next build`
  resolves it. It contributes 0 bytes to any client chunk.
- Accepted: a construct nobody uses today (raw HTML in a document, images, footnotes) renders as
  nothing until the renderer handles it. The renderer's test asserts the token types the corpus
  actually contains, so a new one arriving is a test failure and not a silent blank.
- The renderer owns anchors, `scope` on table headers, callouts and code blocks, which an HTML
  string from a parser could not carry.

## ADR-308 — Documentation code fences use the existing tokeniser, not `shiki`

**Date** 2026-08-31 · **Prompt** 53 · **Status** Accepted

### Question
Prompt 53 § Code blocks asks for "Shiki at build time, our theme". ADR-124 already removed `shiki`
from this repository in favour of a 168-line tokeniser, and ADR-245 reused that tokeniser for the
export dialog rather than adding a second highlighter. Does the docs site add `shiki` back?

### Criterion (set before measuring)
Three checks, all answerable with numbers:
1. Coverage — what fraction of the corpus's fences the tokeniser's language list can highlight.
2. Colour-mode correctness — how each candidate resolves colours through `--ms-color-*`, since the
   prompt requires both modes to be right.
3. Bytes shipped to a reader.

### Measurement
Fence census over `docs/*.md`, 432 fences:

| Language | Fences | Tokeniser |
| --- | --- | --- |
| *(none)* | 273 | plain text — ASCII diagrams and trees, nothing to highlight |
| `ts` | 112 | yes |
| `tsx` | 14 | yes |
| `yaml` | 6 | via the `bash` rules — `#` comments and quoted strings, no keywords |
| `js` | 6 | yes |
| `css` | 5 | yes |
| `html` | 4 | yes |
| `bash` | 4 | yes |
| `jsonc` | 3 | via `json` |
| `markdown` | 2 | plain text |
| `svg` | 1 | via `html` |
| `dockerfile` | 1 | via `bash` |

Coverage after a 5-line alias map: 432 of 432. The degradation is confined to 13 fences (3.0 %),
where a language's own keywords are not painted; comments, strings and numbers still are.

Colour mode: the tokeniser emits five token kinds which map to five token-backed classes, so both
modes are the theme's own variables and correctness is inherited. `shiki` emits computed colours and
needs its dual-theme CSS-variable output plus a rule per mode — the same post-processing the prompt
rejects Mermaid for.

Bytes to a reader: both are zero, because highlighting happens at build time either way. The
tokeniser is pure TypeScript, so build-time use costs no dependency at all.

### Decision
Reuse `tokenize` from `@motion-studio/blocks/highlight` at build time, with an alias map from the
corpus's languages to the tokeniser's. `shiki` is not added.

Line highlighting reuses `parseHighlightLines` from the same module, driven by the fence's info
string.

Prompt 53's instruction is not followed, and this entry is the record of why: the repository already
answered the question twice, the second time explicitly to prevent two highlighters in one product.
Code in the gallery and code in the docs are now painted by one implementation.

### Consequences
- Accepted: 13 fences show no keyword colour. `yaml` keys are still legible; they are not code.
- Accepted: `packages/blocks` is now imported by a build-time module in `apps/web`. It is the
  `./highlight` subpath, which exists for exactly this — ADR-245 — and it carries no React.
- No dependency, no WASM in the build, and no second theme to keep in step with the tokens.

## ADR-309 — The docs nav is rendered by the pages, not by the layout

**Date** 2026-08-31 · **Prompt** 53 · **Status** Accepted

### Question
Prompt 53 lists `app/docs/layout.tsx` as "sidebar + content + toc". The sidebar has to mark the
current page with `aria-current="page"`. A Next layout at `app/docs/` cannot see the `[...slug]`
params, so where does the current page come from?

### Criterion (set before measuring)
ACCESSIBILITY.md § Landing, gallery, docs requires the landmark and its state to be correct with no
JavaScript — the same rule that made the gallery's cards server-rendered. So: the option that keeps
`aria-current` in the static HTML wins; ties break on bytes.

### Measurement
`usePathname()` in a client sidebar puts 29 links plus their group wrappers into a hydrated tree and
makes `aria-current` a client-side effect: with JavaScript blocked — `page.route` abort, the method
ACCESSIBILITY.md § Testing already uses — the nav renders but no item is current.

Rendering the sidebar from each page's own slug keeps the attribute in the HTML the reader receives
and adds no client component.

### Decision
`app/docs/layout.tsx` owns the chrome that does not depend on the slug — skip link, header, search
trigger, the two-column grid. `DocsSidebar` is rendered by `app/docs/page.tsx` and
`app/docs/[...slug]/page.tsx`, which know their own slug. Collapsible groups are `<details>`
elements, so the disclosure needs no script either.

### Consequences
- Accepted: the deliverable list's file roles are not followed literally; the sidebar is a component
  the pages render rather than the layout.
- Accepted: the sidebar's markup is repeated in both pages' HTML. It is 29 links, and it is the
  price of a nav that is correct without JavaScript.
- The only client components under `/docs` are the table of contents' scroll-spy, the code blocks'
  copy button, and the search dialog.

## ADR-310 — Docs search reuses the palette's combobox, not the palette

**Date** 2026-08-31 · **Prompt** 53 · **Status** Accepted

### Question
Prompt 53 § Search asks for `⌘K` "reusing the palette component with a docs source". The studio's
`CommandPalette` takes its items from `usePaletteItems(context)`, its open state from
`useStudioStore`, its recency from `useRecentItems`, and virtualizes its rows. What exactly is
reused?

### Criterion (set before measuring)
Reuse is worth doing where the shared code has one behaviour and one test. Two numbers decide the
boundary: how many studio-only dependencies would have to become injectable, and what the shared
part costs the docs route in bytes.

### Measurement
Making `CommandPalette` itself the shared component means injecting four things — the store's
open-state setter, `StudioShortcutContext`, the item source, and the recency store — and shipping
`@tanstack/react-virtual` to a docs route whose result list is bounded by the search index's 29
documents and their headings.

The part that is genuinely one behaviour is smaller, and it is the part that is easy to get wrong: a
combobox that keeps focus in its input, points at the active option with `aria-activedescendant`,
moves with the arrow keys, swallows `Tab` because it is modal, and commits on `Enter`.

### Decision
That behaviour moves to `apps/web/src/components/palette/palette-combobox.tsx`, which renders its
rows through a child function. The studio's palette keeps its virtualizer, its recency ordering and
its option row; the docs search passes its own rows. `fuzzyScore` is imported by both, unchanged.

### Consequences
- Accepted: the studio's palette is refactored by a prompt that is not about the studio.
  `command-palette.test.tsx` is the check, and it is unchanged.
- The keyboard contract is tested once and both surfaces get it.
- Docs search ships no virtualizer.

## ADR-311 — What the cross-reference gate checks, and what it cannot

**Date** 2026-08-31 · **Prompt** 53 · **Status** Accepted

### Question
Prompt 53 calls the link test "the important one": every internal doc link must resolve. The corpus
also carries 538 `§` section references in prose — `EDITOR_ENGINE.md § Coalescing`. Are those in the
gate, and matched how?

### Criterion (set before measuring)
A gate is worth having if it is green today and a genuine defect turns it red. A gate that can only
be made green by editing a file whose own rules forbid editing is not a gate.

### Measurement
- Markdown links in `docs/`: **82**, of which 82 point at documents and 0 carry an `#anchor`. Nine
  further links are external `https://`.
- `§` references naming a document: **401**. All 401 name a file that exists, once a reference's
  explicit path is honoured (`prompts/00-GLOBAL_RULES.md`) and a bare name is resolved against
  `docs/` and then the repository root (`CONTRIBUTING.md`).
- Section names, matched by normalising case and whitespace and accepting a numbered heading by its
  number: **22 mismatches, all 22 inside `DECISIONS.md`**, 0 in the other 28 documents. They are
  references that abbreviate a heading — `§ Auto-behaviours` for "Auto-behaviours during drag".

`DECISIONS.md` § Rules 2 makes that file append-only: "Never edit history". So the 22 cannot be
fixed, and a gate that fails on them can never go green.

### Decision
`links.test.ts` gates three things and reports the counts:
1. every markdown link resolves to a file that exists, and its `#anchor` to a heading that exists;
2. every `§` reference names a document that exists;
3. every `§` section name resolves to a heading of the target — for the 28 documents that are not
   `DECISIONS.md`.

### Consequences
- Accepted: `DECISIONS.md`'s 22 abbreviated section names are not checked, and a 23rd would not be
  caught. The exclusion is one named file, asserted in the test, not a threshold.
- 483 cross-references are checked on every run, and adding a document that another document
  references by a section it does not have fails the build.
- Accepted: a `§` reference with no document name — 137 of them, referring to the current document —
  is not checked. Deciding whether `§ 9` in prose means this document or the contract it just named
  needs a parser for English, not for markdown.

## ADR-312 — The block definitions leave the studio's first load behind a deferred registry

**Date** 2026-08-31 · **Prompt** 54 · **Status** Accepted

### Question
`/studio` was 369.7 kB gzip of first-load JavaScript against a 250 kB budget — ENGINEERING_CONTRACT.md
§ 6, missed by 120 kB. ADR-292 attributed the largest single item and named the pass: the 72 block
definitions. How do they leave the first load without making the registry asynchronous?

### Criterion (set before measuring)
The budget is the criterion, and the constraint on how to meet it comes from
ARCHITECTURE.md § The registry seam: `BlockRegistry` is four synchronous methods — `get`, `require`,
`list`, `byCategory` — and commands, drop resolution and the inspector call them during a render or a
gesture. A fix that pushes `await` into `insertNode` fails, whatever it saves.

### Measurement
Every chunk `/studio` loads, gzipped from disk, attributed by module through `pnpm analyze`
(`scripts/measure-routes.mjs`, `scripts/eager-graph.mjs`):

| | gzip |
| --- | --- |
| framework and shared runtime | 105.4 kB |
| `app/studio` — shell, panels, store, commands | 55.8 kB |
| **`packages/blocks` definitions, nine category chunks** | **69.4 kB** |
| Radix primitives | 41.7 kB |
| `motion` | 34.7 kB |
| `@dnd-kit` + virtualizer + toast + `immer` | 30.0 kB |
| `zod` | 12.6 kB |
| everything else | 19.9 kB |

The graph says why they are there: **six modules that load before the shell paints** import the
registry, and the registry is a module-scope `createRegistry(DEFINITIONS)` over all 72 —
`store/editor-store.ts`, `store/escape-hatch-bridge.ts`, `dnd-host.tsx`,
`documents/documents-context.tsx`, `inspector/inspector.tsx`, and `layers/use-flat-layers.ts` through
`layer-rects.ts`.

Every one of the six reads a definition **at interaction time**: a command running, a drag starting, a
document being imported, a node being selected. None reads one to paint.

### Decision
`apps/web/src/store/block-registry.ts` holds a `BlockRegistry` that delegates to an empty registry
until `import('@motion-studio/blocks/registry')` resolves, and the studio requests that on mount, in
parallel with the canvas island's own chunk. The six modules hold the deferred instance. The four
methods stay synchronous, so nothing downstream changes.

The one consumer that reads a definition while rendering — the inspector, on a selection restored
from a session — subscribes through `useBlockRegistry()`, so it renders again when the chunk lands
instead of showing its unknown-block state.

### Measured, after
`/studio` first-load JS **369.7 → 306.1 kB**, and the eager module count 1348 → 708.

### Consequences
- Accepted: for a few hundred milliseconds after hydration the registry is empty. Nothing can be
  clicked in that window — the canvas island has not mounted either — and the inspector is the only
  component that could render into it.
- Accepted: `blockRegistry` is no longer the app's composition-root value; `deferredBlockRegistry` is.
  A new eager import of `@motion-studio/blocks` would silently put 69.4 kB back, which
  `scripts/eager-graph.mjs` is how a reviewer sees.
- The canvas island keeps its own static import of the real registry, so the definitions arrive with
  the code that renders them and webpack dedupes the module.

## ADR-313 — Three more items leave the first load: the control barrel, the sliding indicators, and the closed dialogs

**Date** 2026-08-31 · **Prompt** 54 · **Status** Accepted

### Question
After ADR-312 `/studio` was 306.1 kB against 250. The remaining first load held 41.7 kB of Radix,
34.7 kB of `motion`, and 26 control fields the studio's shell does not render. What is actually
holding them there?

### Criterion (set before measuring)
Two rules decide each candidate, and both are checkable:
1. Does anything that paints the shell *render* it? If not, it does not belong in the first load.
2. Does deferring it break a promise the documents make about interaction? UI_GUIDELINES.md § Loading
   and empty states, and the export dialog's own "visible in the frame the button is pressed".

A chunk fetched **on idle** rather than on the click satisfies (2), because the click then costs a
render. That is the whole difference between this and the trade ADR-290 and the export dialog's own
comment declined.

### Measurement
`scripts/eager-graph.mjs`, which walks static imports only and ignores `import type` —
`verbatimModuleSyntax` erases those, and `control-renderer/coerce.ts` names eight field modules
without importing one:

| Holder | What it held | Renders it at boot? |
| --- | --- | --- |
| `packages/ui/src/index.ts` → `export * from './controls/index'` | 26 field components, `@radix-ui/react-select`, `react-radio-group` | No — the shell imports `ToastProvider` |
| `export/options-panel.tsx` | `@motion-studio/ui/controls` | No — inside a closed dialog |
| `export/file-tree.tsx` | `@tanstack/react-virtual` | No — inside a closed dialog |
| `ui/src/segmented/segmented.tsx` | `motion/react`, for one `layoutId` highlight | Yes, the control; no, the animation |
| `ui/src/tabs/tabs.tsx` | `motion/react`, for one `layoutId` underline | Yes, the strip; no, the animation |
| `status-bar.tsx` → `@motion-studio/motion` barrel | the framer-motion applier, to read one media query | No |
| `export-dialog.tsx` and `documents-host.tsx`'s five dialogs | `@radix-ui/react-dialog`, `react-remove-scroll`, dismissable layer | No — all closed |

The two `layoutId` indicators carried a second defect: the id is a string constant, so every
`Segmented` on the page shared `ms-segmented-indicator` and the highlight could travel between two
unrelated controls.

### Decision
Four changes, each at its cause:

1. `controls/index.ts` is no longer re-exported by the chrome barrel; it is the `@motion-studio/ui/controls`
   subpath. Twelve call sites import from there, and `index.test.ts` now checks each directory against
   the barrel it belongs to.
2. `OptionsPanel` and `FileTree` are `dynamic()` inside the export dialog, prefetched on idle.
3. Both indicators are one span placed from the checked element's own offsets, written to
   `--ms-segmented-x/-w` and `--ms-tabs-x/-w` in a layout effect and transitioned in CSS with the
   theme's own duration — so reduced motion zeroes them through the variable every other transition
   uses (ADR-021). The offsets are read on a selection change and on a resize, never per frame.
   `@motion-studio/motion` gains a `./reduced` subpath for the status bar's media query.
4. The export dialog and the five document dialogs mount from the first time each opens, and their
   chunks are prefetched on idle. This supersedes ADR-290's measurement, whose stated premise — "the
   weight is the schema and the registry, which the store already brings" — ADR-312 removed.

### Measured, after
| | before | after |
| --- | --- | --- |
| `/studio` first load | 306.1 kB | **246.2 kB** |
| `/playground` first load | 179.9 kB | **145.6 kB** |
| eager modules under `/studio` | 708 | 418 |

`/studio` is under its 250 kB budget for the first time, at **246.2 kB**, and the whole pass took it
from 369.7 kB.

### Consequences
- Accepted: the sliding indicators now read `offsetLeft`/`offsetWidth` on a selection change. That is
  a layout read, which PERFORMANCE.md § Anti-patterns bans **in a loop**; this one runs once per
  commit and once per resize.
- Accepted: an indicator is hidden until its group has measured a checked item, so a group with no
  selection shows none. It was previously rendered inside the selected item, so the behaviour is the
  same by construction.
- Accepted: `@motion-studio/ui`'s public surface is smaller, and a consumer that wants a field says
  so. `check:deps` is exports-aware, so the new subpath is legal and a deep import still is not.
- Accepted: the first open of a dialog depends on an idle prefetch having run. Under a load heavy
  enough to starve `requestIdleCallback` for the whole session, the first open costs a request.
- `motion` is no longer in any route's first load: it arrives with the blocks that animate.

## ADR-314 — `size-limit` gates first-load JS per route, from the build manifest

**Date** 2026-08-31 · **Prompt** 54 · **Status** Accepted

### Question
Prompt 54 gives a `.size-limit.js` whose entries are globs over chunk directories —
`.next/static/chunks/app/studio/**`. PERFORMANCE.md § Budgets states the budgets as **first-load JS**.
Those are different numbers: the studio's own chunk is 47 kB and its first load is 246 kB. Which does
the gate measure?

### Criterion (set before measuring)
The gate has to measure the number the budget names, or it is not that budget. ENGINEERING_CONTRACT.md
§ 6 says "first-load JS ≤ 250 kB gzip" for `/studio`, and PERFORMANCE.md § Public pages says
"First-load JS ≤ 120 kB gzip" for `/`. Both are what a browser downloads before the route is
interactive: the route's own chunks **plus** the shared ones.

### Measurement
A glob over `app/studio/**` matches 47.0 kB — 19 % of what the route loads. It would have passed
every day the route was 120 kB over.

### The unit, which turned out to matter
`size-limit` reported 251.77 kB for files this repository's own script measured at 246.2 — the same
bytes, 1.024 apart. `size-limit` and `next build` print decimal kB; every number in `PERFORMANCE.md`
is KiB, which the history settles rather than asserts: ADR-292 recorded `/studio` at "370 kB gzip" for
a build whose files gzip to 369.7 **KiB** and which `next build` printed as **378 kB**.

So "250 kB" in the documents means 250 KiB, and a limit written as `kB` would be a 2 % tighter budget
than the one the contract states. The entries carry byte limits, which cannot be read two ways, and
PERFORMANCE.md § Budgets now says which unit its numbers are in.

### Decision
`.size-limit.js` is generated from `.next/app-build-manifest.json`: one entry per gated route, its
`path` the exact file list that route's first load consists of, `gzip: true`, `@size-limit/file` so
the files are measured as built rather than re-bundled, and `limit` in bytes.

`/` and `/studio` are gated on first-load JS. `/playground` and `/blocks` are gated on the route's own
chunks, because PERFORMANCE.md § Route budgets writes them as globs at `app/<route>/page-*.js` and 90
kB cannot be a first-load number when the shared baseline alone is 105 KiB.

The prompt's globs are not used, and this is the record of why. `/blocks/[slug]` and `/docs` are
reported rather than gated, because no document gives them a number.

### Measured, after
```
landing first-load JS (120 KiB)     108.94 kB of 122.88 kB
studio first-load JS (250 KiB)      251.77 kB of 256.00 kB
playground route chunk (90 KiB)      44.29 kB of  92.16 kB
blocks route chunk (140 KiB)         10.86 kB of 143.36 kB
```

### Consequences
- Accepted: `pnpm size-limit` needs a build first. It is the same requirement `pnpm analyze` has.
- A route added without an entry is not gated. `scripts/measure-routes.mjs` prints every route in the
  manifest, so the omission is visible rather than silent.
- The gate and the report read the same manifest, so a number in `PERFORMANCE.md` can be reproduced
  by either.

## ADR-315 — The exact-render budgets are measured in a production build with the counters left in

**Date** 2026-09-01 · **Prompt** 54 · **Status** Accepted

### Question
PERFORMANCE.md § Rendering states four budgets as counts rather than timings — a scrub, a theme
change, a drag and a marquee each cost the canvas **zero** React renders. A count needs a counter in
the page. Prompt 54 also requires that counter to be absent from production, verified by grepping the
bundle. Those two requirements are only compatible if the build the specs measure is not the build
that ships.

The third option, measuring a development build, was rejected before it was tried: development React
renders twice under `StrictMode`, skips the production reconciler's bailouts, and ships the profiling
hooks. A render count taken there describes a build nobody uses.

### Criterion (set before implementing)
1. `pnpm build` — the build that ships — contains no counter, no `window.studio`, and no reference to
   the switch that would enable them. Checked by grep over `apps/web/.next/static`.
2. The perf specs run against production React.
3. One switch, and no second code path: the instrumented build differs from the shipping build only
   in the value of one build-time constant.

### Measurement
`MS_INSTRUMENT=1` is declared in `next.config.ts` through `env: {}` and read as
`process.env.NODE_ENV === 'production' && process.env.MS_INSTRUMENT !== '1'`. Both operands are
build-time constants, so the minifier reduces `countRender` to its early return and deletes the rest.

Declaring it is load-bearing. An **undeclared** `process.env.X` is not inlined: it survives
minification as a runtime property lookup, and the branch behind it survives with it — which is the
version that leaves `__renderCounts` in the shipping bundle.

Grep over a clean `pnpm build`, `apps/web/.next/static/**/*.js`:

```
__renderCounts   0 hits
MS_INSTRUMENT    0 hits
.studio=         0 hits
studio:{store    0 hits
```

`pnpm size-limit` on the same build: landing 108.93 kB / 122.88, studio 251.84 kB / 256, playground
44.3 / 92.16, blocks 10.86 / 143.36.

### Decision
`apps/web/src/lib/dev/render-counter.tsx` exports `countRender(id)` and a `RenderCounter` component,
both writing to `window.__renderCounts`. `pnpm build:instrumented` — `scripts/build-instrumented.mjs`
— is `pnpm build` plus `MS_INSTRUMENT=1`, and `pnpm test:e2e:perf` runs it before the specs. The same
switch keeps the `window.studio` handle, which is how `memory-leak.spec.ts` scripts five hundred edits
and `studio-latency.spec.ts` times an undo.

A wrapper script rather than a shell prefix because `VAR=1 cmd` is not portable to PowerShell.

### Consequences
- Accepted: `pnpm test:e2e:perf` builds before it runs, so the perf suite is slower to start than the
  rest of the e2e suite. It is the price of measuring the right build.
- Accepted: the instrumented build is not byte-identical to the shipping one — the counters are in it.
  The budgets it measures are counts, which the counter does not change; the byte budgets are measured
  on the shipping build by `size-limit`, which never sees this one.
- A spec that finds `window.__renderCounts` absent fails with a message naming the build, rather than
  reading a count of zero and passing.

## ADR-316 — The canvas auto-pan subscription lives one component below the host

**Date** 2026-09-01 · **Prompt** 54 · **Status** Accepted

### Question
`drag-no-rerender.spec.ts`, written to assert zero canvas renders while a drag is in flight, measured
**32**. The document does not change until the drop commits, so what re-rendered, and why?

### Measurement
`CanvasHost` called `useCanvasAutoPan(island)`, which calls `useDragActive()`, which reads dnd-kit's
`useDndContext()`. A context consumer re-renders on every context value change, and dnd-kit publishes
a new value on every `pointermove` of every drag. So the host re-rendered once per pointer move, and
`Canvas` — its child — re-rendered with it: 32 renders for one drag of one layer row, over a 200-node
document.

Nothing about the auto-pan behaviour was wrong. The subscription was in the wrong component.

### Decision
`CanvasAutoPan` is a component that calls the hook and returns `null`, rendered as a sibling of the
canvas. The pointer moves now re-render a component that renders nothing.

Measured after: **0** canvas renders across the whole gesture, with the count taken while the button
is still down.

### Consequences
- The general rule this is an instance of: a subscription that updates at gesture rate belongs in a
  leaf that renders nothing, never in a component that has children. PERFORMANCE.md § Rendering
  states the pattern for values; this is the same pattern for subscriptions.
- Accepted: one more component in the tree, whose name is the only thing that explains why it exists.
  The comment at its definition and this entry are that explanation.
- The spec that found it now guards it.

## ADR-317 — `radius` on `image` and `video` is a select, not the four-corner control

**Date** 2026-09-01 · **Prompt** 54 · **Status** Accepted

### Question
Found while walking the inspector for prompt 54's measurements: the `Radius` control on an `image`
block showed `0px` for a block whose radius is `lg`, and dragging it changed nothing. The same for
`video`.

### Measurement
Both definitions declared `kind: 'radius'` — the four-corner control, which reads and writes a
`{ topLeft, topRight, bottomRight, bottomLeft }` object. The prop is a token:
`z.enum(IMAGE_RADII).default('lg')`. And the options declared beside it,
`optionsFrom(IMAGE_RADII)`, are read by the select and by nothing else, which is what says the
control was mis-typed rather than the prop.

The consequence was silent in both directions. Reading, the four-corner control found no object and
displayed zeros. Writing, its commit failed the prop's schema and was dropped: `props.radius` stayed
`"lg"` and the history stayed empty. No error surfaced anywhere.

### Decision
`kind: 'select'` in both definitions, which is the control the options were written for. Two blocks'
radius controls now read and commit.

### Consequences
- The generated inspector accepts a control whose `kind` cannot produce a value its prop's schema
  admits, and reports nothing when the commit is dropped. That is the general defect; this entry
  fixes its two instances. A registry check that pairs every control kind against the prop schema it
  writes to belongs with the other registry gates in `scripts/check-registry.ts`, and is not in this
  prompt's scope.
- Accepted: a document saved with a four-corner radius object on an `image` was already invalid
  against the prop schema and was already being dropped on load. Nothing that worked stops working.

## ADR-318 — The default theme's mode is in the HTML the server sends

**Date** 2026-09-01 · **Prompt** 54 · **Status** Accepted

### Question
`/`'s LCP element is the hero `<h1>` — static text in server-rendered HTML — and Lighthouse
attributed 81 % of its 2.4 s to *render delay*. The first hypothesis: `ThemeBoot` applies
`studioDark` in an effect after hydration, so the page paints in one palette and repaints in another,
and the repaint is what the LCP was being recorded at.

### Measurement
The flip is real. `studioDark.colorMode` is `'dark'`, so the resolution is dark whatever the visitor's
system says, while the generated stylesheet's `:root` block is the **light** palette and its dark
block is selected by `[data-color-mode='dark']` — an attribute nothing set until the effect ran. Every
public page therefore painted light and turned dark at hydration. It is the same window
`e2e/a11y/docs.spec.ts` works around: axe reads computed colours and scans inside it report a contrast
failure that the settled page does not have.

The 37 colour variables in the stylesheet's dark block and the 37 the resolution produces are the same
colours, differing only in how the numbers are written (`oklch(9.5% 0.006 265)` against
`oklch(9.50% 0.0060 265.00)`), so the attribute alone is enough to paint the theme.

**And it did not move the LCP.** Three mobile runs before: 2327, 2324, 2343 ms. Three after: 2366,
2363, 2343 ms. The hypothesis was wrong, and the reason is in ADR-319: `observedLargestContentfulPaint`
is 261 ms and equal to `observedFirstContentfulPaint`, so there was never a late paint of the `<h1>`
to remove.

### Decision
`apps/web/app/layout.tsx` writes `data-color-mode`, `data-elevation` and `data-glass` onto `<html>`
from the `studioDark` preset it already ships. The blocking colour-mode script still overrides the
attribute from a stored preference, and `ThemeBoot` still writes the full variable set and opens the
transition gate; what it no longer does is change what the page looks like.

### Consequences
- The light frame on every public page load is gone, and with it the contrast-failure window the a11y
  specs settle around. The workaround in those specs is left alone — it is prompt 55's to remove.
- Accepted: the attribute is now always present, so `@media (prefers-color-scheme: dark)` on
  `:root:not([data-color-mode])` no longer reaches the app's own pages (ADR-026 keeps it for exported
  ones). Nothing changes for a visitor: `studioDark` forced dark either way. The open question of
  whether a public page should follow the system preference at all is the owner's, and is unchanged
  by this entry.
- Accepted: this did not buy the LCP it was written to buy. It is kept for the repaint it removes.

## ADR-319 — The Lighthouse gate throttles the browser instead of extrapolating an unthrottled run

**Date** 2026-09-01 · **Prompt** 54 · **Status** Accepted

### Question
The first wired Lighthouse CI run failed the LCP assertion on all four public routes: 2327 ms on `/`
against a 2000 ms budget, with 2324, 2618 and 2178 on the others. PERFORMANCE.md records 1.7 s for `/`
and 1.6 s for `/docs`, measured in prompts 51 and 53. Either the pages regressed by 600 ms, or the two
measurements are not measuring the same thing.

### Criterion (set before investigating)
A gate that reports a number the page does not have is worse than no gate. Before changing either the
budget or the page, the measurement has to be shown to be about the page.

### Measurement
The trace says the LCP is not late at all:

```
observedFirstContentfulPaint       261 ms
observedLargestContentfulPaint     261 ms
firstContentfulPaint (reported)   1224 ms
largestContentfulPaint (reported) 2366 ms
```

The `<h1>` — server-rendered static text — paints with the first paint, and nothing repaints it. Yet
the reported LCP is 1.1 s behind the reported FCP for that one paint event. The two numbers come from
Lighthouse's default `simulate` throttling: the page is loaded unthrottled and the metrics are
extrapolated through a simulated 4G-and-4×-CPU graph. Every resource here arrives inside 265 ms on a
local server, so this machine paints *after* the scripts have run, and the simulation puts the whole
hydration cost in front of the LCP paint that follows it. On a throttled device the paint comes first.

The same four routes with `throttlingMethod: 'devtools'`, which throttles the browser for real, three
runs each, medians:

| Route | Performance | LCP | CLS | TBT |
| --- | --- | --- | --- | --- |
| `/` | 99 | 1638 ms | 0 | 3 ms |
| `/blocks` | 100 | 1448 ms | 0.0007 | 22 ms |
| `/blocks/section` | 99 | 1459 ms | 0.0010 | 101 ms |
| `/docs` | 99 | 1639 ms | 0 | 48 ms |

1638 ms on `/` against the 1.7 s the document already recorded. The pages did not regress; the default
method does not describe them.

### Decision
`lighthouserc.cjs` sets `throttlingMethod: 'devtools'` on both presets. No budget moved.

### Consequences
- Accepted: real throttling is noisier than simulation and slower to collect — the mobile leg takes
  about seven minutes for twelve runs. Three runs per URL with the median taken is what absorbs the
  noise, and the headroom is 360 ms on the tightest route.
- Accepted: `simulate` is Lighthouse's recommendation for CI precisely because it is stable. It is
  stable here too — 2327, 2324, 2343 ms across runs — and stably wrong about this page.
- The numbers in PERFORMANCE.md and the numbers the gate asserts are now taken the same way, so a
  failure means the page moved.

## ADR-320 — The gallery's 36 kB of animation runtime came from a barrel import, one module deep

**Date** 2026-09-01 · **Prompt** 54 · **Status** Accepted, supersedes ADR-305's diagnosis

### Question
ADR-305 measured 36.4 kB of `motion` in `/blocks/[slug]`'s first load, attributed it to
`@motion-studio/ui`'s barrel re-exporting every control field, and left it for this prompt. ADR-313
then took that barrel apart for the studio's sake. The bytes were still there: 195.5 KiB for the
route, with a 34.7 KiB chunk that is framer-motion and nothing else.

### Measurement
`scripts/eager-graph.mjs` over the page, looking for `motion`, found exactly one chain and it is not
the one ADR-305 recorded:

```
motion/react
    apps/web/src/components/gallery/detail/block-source.ts
  → packages/motion/src/index.ts
  → packages/motion/src/apply/motion-node.tsx
  → packages/motion/src/apply/framer-motion.tsx
```

`block-source.ts` needs `presetRegistry`, one object, and took it from the package barrel, which also
exports the framer-motion applier. `use-source.ts` imports that module at runtime, so the applier
came with it. The chunk was in the route's load and in no other route's.

`packages/motion/src/presets/index.ts` imports no animation runtime at all — 57 modules eagerly, none
of them `motion`. So the registry was always reachable without the applier; there was simply no
subpath that said so.

### Decision
`@motion-studio/motion` gains a `./presets` export, and `block-source.ts` imports from it. Two lines.

| | before | after |
| --- | --- | --- |
| `/blocks/[slug]` first load | 195.5 KiB, 14 files | **154.4 KiB, 12 files** |
| `motion` markers in that load | `MotionConfig`, `motionValue` | none |

ADR-305's diagnosis is superseded: the barrel it named was a real defect and ADR-313 fixed it, but it
was not what held these bytes.

### Consequences
- `motion` is now absent from every route's first load, which is what ADR-313 claimed and what
  `pnpm measure:routes --markers` can now be asked.
- Accepted: one more subpath on a package that has four. The rule it follows is the one ADR-305 set
  for `./curves` — a consumer that wants a pure value should not have to import a runtime to get it.
- The general lesson is about the tool, not the package: an import chain that is *reproduced* costs
  two minutes, and ADR-305 attributed these bytes to a chain it had reasoned about instead.

## ADR-321 — What each gate actually catches, demonstrated on a deliberate regression

**Date** 2026-09-01 · **Prompt** 54 · **Status** Accepted

### Question
Prompt 54 asks for the Lighthouse gate to be shown failing on a deliberate regression — "add a 200 kB
eager import to the landing, watch it fail, revert". A gate nobody has seen go red is a gate nobody
knows is wired.

### Measurement
200 kB of incompressible data, imported eagerly into `hero-demo-island.tsx` — a client component in
the landing's first load — behind a runtime-dependent read so the minifier could not fold it away.
The first attempt used `PAYLOAD.length === 0`, which it folded, and the landing did not move at all;
that is worth knowing about any bundle experiment.

| | clean | +212 KiB | +636 KiB | +1.5 s of blocking work |
| --- | --- | --- | --- | --- |
| `/` first-load JS | 106.6 KiB | 318.9 KiB | 742.2 KiB | 106.6 KiB |
| `size-limit` | passes, 108.87 kB of 122.88 | **fails, over by 203.38 kB** | fails | passes |
| Lighthouse Performance | 99 | 97 | 97 | **70** |
| LCP | 1638 ms | 1911 ms | 1730 ms | 1863 ms |
| TBT | 3 ms | 148 ms | 152 ms | **2981 ms** |
| Lighthouse gate | passes | **passes** | **passes** | **fails** |

So the bytes gate went red on the byte regression and Lighthouse did not. That is not a hole in the
Lighthouse configuration — it is what the metric measures. Next's scripts do not block the first
paint, so 636 KiB of dead weight arrives after the page is on screen and costs 100 ms of parse; the
same page with 1.5 s of synchronous work at hydration scores 70 and fails two assertions.

### Decision
Both gates stay, and the documents say which one guards what: `size-limit` is the only gate that sees
bytes, and Lighthouse is the only gate that sees the main thread. Neither substitutes for the other,
and a change that adds a megabyte of unused code will be caught by exactly one of them.

### Consequences
- The Lighthouse gate is demonstrated to fail — on a regression of the kind it measures.
- Accepted: a route with no `size-limit` entry has no byte gate at all, and Lighthouse will not stand
  in for it. `/blocks/[slug]` and `/docs` are those routes, which is why ADR-320's 41 KiB was found by
  a measurement nobody was forced to take.
- The regression files were deleted; `git status` on the landing is clean.
## ADR-322 — `ThemeBoot` applies the stored colour mode, not the preset's own

**Date** 2026-09-01 · **Prompt** 55 · **Status** Accepted

### Question
Prompt 55 requires zero axe violations on every route **in both colour modes**. Light mode turned out
to be unreachable: `ThemeBoot` called `applyTheme(studioDark)` on mount, `studioDark.colorMode` is
`dark`, and `applyTheme` writes that mode onto the root — so the blocking mode script's reading of the
stored preference was overwritten a moment later, and a scan of "light mode" measured dark mode twice.

### Measurement
With the stored preference honoured, the sweep runs in both modes and finds what only light mode has:
two `color-contrast` violations, on `/blocks/hero-centered` and `/playground`, both from the same token
(ADR-323). Dark mode had passed all along, which is why nothing had reported them.

### Decision
`apps/web/app/theme-boot.tsx` reads `storedColorMode()` and applies `{ ...studioDark, colorMode: stored }`
when there is one. The preset's mode remains the default for a visitor who has not chosen; ADR-318's
server-rendered attribute is that default in the HTML.

### Consequences
- Light mode is reachable, and `e2e/a11y/axe-all-routes.spec.ts` asserts the mode the page ended in
  before it scans — a test that asked for light and got dark would otherwise pass quietly.
- The `theme-toggle` block, which the gallery renders live, now changes the app's own pages for real
  rather than until the next reload.
- Still open, and still the owner's: whether a public route should follow the **system** preference
  when nothing is stored. Today it does not — the preset decides.

## ADR-323 — `foreground-subtle` is not a text tier, because the ramp has no step for one

**Date** 2026-09-01 · **Prompt** 55 · **Status** Accepted, supersedes ADR-198's escalation

### Question
axe reported two `color-contrast` failures in light mode: 4.30:1 and 4.11:1 for text in
`foreground-subtle`, against a 4.5:1 requirement. ADR-198 had already measured this and escalated it
with two options — move the token into `TEXT_PAIRS` and lighten it, or change two dozen call sites.
Prompt 55 is where that decision belongs, and the first thing it needs is the real number of call sites.

### Measurement
`text-foreground-subtle` appears **111 times across 78 files** — the studio chrome, the blocks
catalogue, the docs components, the playground. Not two dozen.

The token is `NEUTRAL[500]` in both modes. Measured against the surfaces it is used on:

```
light  neutral.500  surface-0 4.10  surface-1 4.28  surface-2 3.87  surface-3 4.28
dark   neutral.500  surface-0 4.82  surface-1 4.65  surface-2 4.27  surface-3 3.52
light  neutral.600  worst 6.30       dark neutral.400  worst 5.64
```

No step clears 4.5:1 except the one `foreground-muted` already occupies, in either mode. The ramp has
twelve steps and none between 500 and 600, so a three-tier text scale where all three tiers meet AA
needs a **new ramp step** — which means a step in every hue ramp (`RampStep` is a closed union that
eight ramps satisfy), in the generated theme ramps, in the exported token formats and in the Figma
tokens.

DESIGN_SYSTEM.md § Contrast contract held tertiary text to 3:1 "under a duplication rule". WCAG 1.4.3
has no such exemption: the exceptions are large text, incidental text, and text in an inactive
control. Duplicated tertiary metadata is none of those.

### Decision
`foreground-subtle` takes the same step as `foreground-muted` — 600 in light, 400 in dark — in the
token set and in the theme engine's `semantic-map`, and its four surface pairs move from `UI_PAIRS`
into `TEXT_PAIRS` in all three contrast tests: `contrast.test.ts`, `presets.test.ts` (all ten presets)
and `neutral.test.ts` (every neutral family). All pass at 4.5:1.

Two lines of token rather than 111 call sites, for the same rendered result: the call sites keep saying
"tertiary", and the value they resolve to now meets AA. A later ramp extension can separate the two
tiers again — the intent survives in the call sites, which is the reason this was not a sweep.

### Consequences
- Accepted: the token is an alias of `foreground-muted` until the ramp gains a step, so both palettes
  have two text tiers where the document described three. DESIGN_SYSTEM.md says so now, and the
  contract no longer contains a 3:1 tier for text.
- Accepted: tertiary text is visually heavier than it was. That is the point of the change.
- The duplication rule stays as a rule about hierarchy, and stops carrying an accessibility claim it
  could not support.

## ADR-324 — In forced colours the focus ring is an outline, declared outside the cascade layer

**Date** 2026-09-01 · **Prompt** 55 · **Status** Accepted

### Question
Prompt 55: "forced colours: borders and focus survive". Do they?

### Measurement
Borders do. With forced colours active the left panel keeps a 1 px `border-inline-end`, the inspector a
1 px `border-inline-start`, the status bar a 1 px `border-top`, and the mode repaints their colours to
`CanvasText`. Nothing in the chrome depends on a change of surface value alone.

Focus did not. The ring is `box-shadow: var(--ms-shadow-focus)` with `outline: none` beside it, and
forced colours **drops every box-shadow**. Measured on a focused link with the mode active:
`box-shadow: none`, `outline-style: none`. There was no focus indicator at all.

The first fix landed inside `@layer base` and changed nothing, because `outline-none` is a utility and
`@layer utilities` beats `@layer base` at equal specificity. The measurement said so before the theory
did: the ring appeared on a public route and stayed missing in the studio, whose controls carry that
utility.

### Decision
`apps/web/app/globals.css` declares, **outside every layer**, so it beats all of them:

```css
@media (forced-colors: active) {
  :focus-visible { outline: 2px solid Highlight; outline-offset: 2px; }
}
```

`Highlight` rather than a token: the mode has replaced the token, and the system's own focus colour is
the one the rest of the desktop uses. Measured after: `outline: solid 2px` on both a public route and a
studio control.

### Consequences
- Accepted: one unlayered rule in a stylesheet that is otherwise entirely layered. The comment above it
  says why, because "move it into the layer" is a tidy-looking change that silently removes the ring.
- `e2e/a11y/forced-colors.spec.ts` asserts `outline-style`, not width: `outline: none` computes to
  `none 3px` in Chrome, so a width assertion passes on a page with no ring — the first version of that
  spec did exactly that.
- Accepted: axe's `color-contrast` rule is disabled in that spec, and only there. Playwright's
  emulation repaints backgrounds with system colours while axe still reads the authored text colour,
  which produced 13,773 lines of violations that do not exist in the real mode.

## ADR-325 — Focus returns to the control that opened a dialog, tracked outside the dialog

**Date** 2026-09-01 · **Prompt** 55 · **Status** Accepted

### Question
ACCESSIBILITY.md § Dialogs: "focus is trapped and restored to the trigger on close". Measured on all
seven of the studio's dialogs — five File-menu dialogs, the export dialog, the command palette — focus
after `Esc` landed on `body`. Every one of them.

### Measurement
The focus sequence, logged with a capturing listener: the dialog's Close button blurs, and **no
`focusin` follows**. Nothing receives focus.

Radix's modal content does this:

```js
onCloseAutoFocus = composeEventHandlers(props.onCloseAutoFocus, (event) => {
  event.preventDefault()
  if (!isRightClickOutside) context.triggerRef.current?.focus()
})
```

It restores to its own `Trigger`. These dialogs have none — they open from a store flag or a shortcut —
so `triggerRef` is null, nothing is focused, and the `preventDefault` stops the focus scope's own
restore on the way out.

The primitive had a tracker for exactly this: a `focusin` listener registered while the dialog is
closed. It could never fire. ADR-313 made the dialogs mount **at the moment they open**, so the
listener starts after the control that opened them was focused. Two further attempts failed for the
same reason before the mounting order was measured: restoring on the next frame, and letting Radix's
default run.

### Decision
`packages/ui/src/dialog/focus-return.ts` — a module-level `focusin` listener, installed the first time
any dialog mounts, recording the last focused element **outside** any `[data-ms-overlay]`. The dialog
captures its own target in a `useLayoutEffect` on open, which runs before the focus scope's passive
effect moves focus, and falls back to the module's record when the active element is inside another
overlay — which is what makes a dialog opened from a menu item return to the menu's trigger rather than
to an item that no longer exists.

Measured after: all seven restore. `e2e/a11y/focus-restore.spec.ts` is one test per dialog.

### Consequences
- Accepted: one document-level listener for the life of the page, with a `closest()` call per focus
  change. It is the only place that can see the trigger of a dialog that mounts late.
- Accepted: the overlay filter means focus is never returned *into* another overlay. For a dialog
  opened from a dropdown that is the correct answer rather than a compromise.
- The primitive's unit tests passed throughout, in jsdom, where `aria-hidden`, cascade layers and
  Radix's trigger ref all behave differently. This is a defect only a browser could show.

## ADR-326 — Every selection change is announced, and a command's result gets its own region

**Date** 2026-09-01 · **Prompt** 55 · **Status** Accepted

### Question
ACCESSIBILITY.md § Canvas asks for a polite live region "on every change" of the selection, and for the
result of an action — "Duplicated Hero. 7 blocks." Measured: a click on the canvas announced, a marquee
announced, a keyboard selection announced. A click in the **layers tree** — the surface the document
names as the screen-reader path — announced nothing, and no command announced its result at all.

### Measurement
The canvas announced from three call sites, each inside a gesture handler. Every other path into the
selection writes it through the store: the tree, an insert from the palette, an undo. None of them
passes through those handlers.

### Decision
Two changes, at two levels.

1. `Canvas` subscribes to the scene and announces `describeSelection` whenever the selected ids differ
   from the last announced set. One subscription replaces the question "did we remember to announce
   here", and the 150 ms debounce that was already there collapses the duplicate when a gesture handler
   announces as well.
2. `CommandAnnouncer` — an app-level `<output>` subscribing to the store's history, saying what the
   last committed command was: `"${entry.label}. ${count} blocks."`, and `"Undone. …"` when the future
   grew. Separate from the selection region because the two describe different events: a duplicate
   changes the selection *and* the document, and one region cannot say both without overwriting itself.

Measured after: "Add Section. 5 blocks.", "Add Tabs. 6 blocks.", "Reorder block. 4 blocks." — each after
a keyboard-only insert or reorder.

### Consequences
- Accepted: a third polite region on the page, after the canvas announcer and dnd-kit's. Each has one
  subject, which is what keeps them from talking over each other.
- Accepted: the announcement is the command's own label, so it reads "Add Section" rather than
  "Inserted a section". That label is the one the undo tooltip shows, and two phrasings for one action
  would be worse than a terse one.
- The store subscription is the store's own, not a hook: PERFORMANCE.md § Studio budgets zero React
  re-renders for the chrome, and `theme-no-rerender.spec.ts` still measures zero.

## ADR-327 — The keyboard drag reorders from the palette and not from the tree

**Date** 2026-09-01 · **Prompt** 55 · **Status** Accepted

### Question
DRAG_AND_DROP.md § Accessibility: "the full drag can be performed with the keyboard on all four
operations." Can it?

### Measurement
Operation 1, a palette card into the canvas — **it can**:

```
Space       Picked up Section, layout block. Use arrow keys to move, space to drop, escape to cancel.
ArrowDown   Section, layout block over Grid, position 3 of 3.
Space       Dropped Section, layout block into Grid at position 4.      nodes 4 → 5
```

Operation 3, a layers row to another position — **it cannot**:

```
Enter        Heading over Grid, position 1 of 2.
ArrowDown ×8 Heading over Grid, position 1 of 2.     (every press, unchanged)
Enter        Dropped Heading into Grid at position 1.  tree order unchanged
```

The difference is where the drag starts. A palette card begins outside every zone, so the first press
takes `canvasAwareCoordinateGetter`'s "step into the next zone" branch and lands on a resolved
position. A tree row begins **inside** its own zone, so every press takes the "stay inside" branch —
and the position the zone resolves for that point never moves, so eight presses and one press are the
same drag. The drop then commits the position it started at, which is why the tree looks like it
accepted a reorder and did nothing.

An earlier draft of this entry claimed the drag jams on both operations. That was wrong: the
measurement above was taken after a failing test of my own making — a fixed number of tab presses that
never reached the card — and the first version of the entry generalised from it. The palette drag has
worked all along.

### Criterion
Is the remaining half a WCAG failure? No. 2.1.1 asks whether the *function* is keyboard operable, and
reordering a row is: `Mod+ArrowUp` / `Mod+ArrowDown` moves a row and announces the result — measured,
and asserted in `e2e/a11y/keyboard-drag.spec.ts`. The tree's keyboard drag is a second path to the same
function, and it is the one that does not work.

### Decision
Assert operation 1 end to end, assert the tree's `Mod+↑`/`↓` reorder, and mark the tree's keyboard
*drag* `fixme` naming this entry. Fixing it means teaching the zone resolution to move a position
inside a list — ADR-127's grid stepping is right for the canvas and has no notion of list positions —
which is a change to the drag layer measured against a surface that is not this prompt's subject.

### Consequences
- Accepted: the layers tree ships a keyboard drag that starts, announces its target and drops it back
  where it began. ACCESSIBILITY.md § Known limitations says so, and the reorder shortcut is the path a
  keyboard user is given.
- Operations 2 and 4 remain unwired for every input device — `useDraggableNode` is attached to layer
  rows only, so there is no canvas gesture to make accessible yet. Both are declared as skips so the
  count of four stays visible in the report.
- The lesson about the measurement is worth more than the finding: a spec that fails proves something
  about the spec until the interaction is reproduced by hand.

## ADR-328 — The canvas describes its key map, because `role="application"` obliges it to

**Date** 2026-09-01 · **Prompt** 55 · **Status** Accepted

### Question
ACCESSIBILITY.md § Canvas writes the canvas element out with `aria-describedby="canvas-help"`. The
implementation had `role="application"`, `aria-label` and a tab stop, and no description.

### Measurement
`role="application"` tells a screen reader to stop offering its own navigation and pass keys through.
The canvas then takes `Tab` for itself, to step between siblings — measured: fourteen consecutive `Tab`
presses leave focus on the canvas. The way out is `F2`, and nothing told the reader that.

### Decision
A visually hidden element, `useId`-keyed, referenced by `aria-describedby`, naming every key the
surface takes: `Tab` / `Shift+Tab` between blocks, `Enter` / `Escape` in and out of a group, arrows to
nudge, `Mod+A` for the level, `F2` to the next panel. The text lives beside the component whose handler
implements those keys.

### Consequences
- WCAG 2.1.2 is satisfied by the documented method rather than by removing the trap: `Tab` inside the
  canvas is the feature, and `F2` is the exit.
- Accepted: the description is a second place the key map is written and it can drift from
  `useKeyboardSelection`. The comment on each names the other.

## ADR-329 — The accessibility suite runs on three browsers

**Date** 2026-09-01 · **Prompt** 55 · **Status** Accepted

### Question
`playwright.config.ts` gave Firefox and WebKit the flows only; `e2e/a11y` ran on Chrome. Prompt 55 asks
for the eight specs on three browsers. Is that worth the runner time, or is one browser's accessibility
tree the same as another's?

### Measurement
It is not. This prompt's findings are engine behaviour: `:focus-visible` is not matched by a
programmatic `focus()`, `outline: none` computes to `none 3px`, forced colours drops `box-shadow`, and
Radix's focus restoration depends on when a component mounts. Every one of those is a browser fact
rather than a React fact.

### Decision
Firefox and WebKit match `**/a11y/*.spec.ts` as well as the flows, and `pnpm test:e2e:a11y` no longer
pins `--project=chrome`. `forced-colors.spec.ts` skips on WebKit, which implements no forced-colours
mode — a skip with a stated reason rather than an assertion that cannot mean anything there.

### Consequences
- Accepted: the a11y job is three times longer. It is the job that stands in for the screen-reader
  sessions nobody can automate.
- The perf specs stay Chrome-only for the reason ADR-280 gives: a budget is comparable to itself.

## ADR-330 — The Node floor moves to 22.18, because the byte gate cannot run below it

**Date** 2026-09-01 · **Prompt** 54 · **Status** Accepted

### Question
`pnpm size-limit` — the byte gate ADR-314 added — fails on every CI run since it was wired, including
the commit that wired it, while passing locally:

```
node_modules/.pnpm/size-limit@13.0.3/node_modules/size-limit/colors.js:1
import { styleText } from 'node:util'
SyntaxError: The requested module 'node:util' does not provide an export named 'styleText'
Node.js v20.11.1
```

`build` is the only red job in `CI`, so every Dependabot pull request inherits a red pipeline and none
of them can be judged on their own contents.

### Criterion (set before changing anything)
This is ADR-048 again — a job green locally and red in CI because the two run different Node — and that
one was resolved by making the code work on the declared floor rather than by moving the floor. So the
question is whether the floor is still the right specification, not which of the two Nodes wins.

### Measurement
It is not the same case. `size-limit@13` declares what it needs:

| | Value |
| --- | --- |
| `size-limit@13.0.3` `engines.node` | `^22.18.0 \|\| ^24.0.0 \|\| >=26.0.0` |
| `.nvmrc` / `engines.node` | `20.11` / `>=20.11` |
| Node on the development machine | `22.20.0` |

`styleText` landed in 20.12, so even the last 20.x would not have carried this. Two further facts
settle it: Node 20 reached end of life in April 2026, and ADR-048 already established that the project
had been running its Vitest presets on a Node feature newer than the floor it claimed. The floor was
describing a Node nobody used.

### Decision
`.nvmrc` becomes `22.20.0` and `engines.node` becomes `>=22.18` — the intersection of what
`size-limit` requires and what the development machine already runs. `TECH_STACK.md` § Runtime
requirements states the same number, which is the file the floor is specified in.

### Consequences
- CI and the development machine now run the same major, so a green local run means something about CI.
- ADR-048's `.mjs` presets stay as they are. Type stripping is no longer the reason they cannot be
  `.ts`, but a file Node loads is still JavaScript, and rewriting two working modules to prove a point
  about a floor that moved is not a change with a reason.
- A dependency that raises its own floor now breaks the build rather than being silently unusable. The
  gate that caught this one was the gate itself.
