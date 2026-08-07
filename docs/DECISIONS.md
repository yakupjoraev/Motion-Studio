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
