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
