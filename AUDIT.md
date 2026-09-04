# v1.0 Release Audit — 2026-09-04

## Summary

**16 findings: 11 resolved, 5 documented as limitations, none open.**

The blocking one was GSAP: its licence forbids use in tools that let people build visual animations
without writing code, which is a description of this product (F1). The owner's answer on 2026-09-04
was to remove it, and it is gone — the two scroll presets and the split-text reveal run on the
platform now, verified in all three engines. The other two escalations were answered the same day:
the line limit gained a stated exemption (F5) and the cast rule now says what it means (F6).

The rest of the audit came out better than a project this size has a right to expect. Every contract
non-negotiable greps clean except two — file length and one banned cast. The block and preset
catalogues match their registries exactly, the coverage contract matches all ten package configs,
the git history carries no tooling attribution, no secrets and no local paths, and nothing from the
roadmap's pre-agreed cut list was cut. What was wrong was mostly documentation drift: numbers that
had moved, a shortcut table that could not be checked mechanically, and a licence file the
documentation required and nobody had written.

Two checks are now tests, so the two divergences this audit found by hand cannot recur.

## Acceptance criteria

`PRODUCT.md` § Acceptance criteria (v1.0), every line, with the evidence rather than an opinion.

| Criterion | Verdict | Evidence |
| --- | --- | --- |
| All four flows pass as Playwright specs on Chromium, Firefox, WebKit | **Pass** | Nine `e2e` jobs green on `5cd05e7`: chrome/firefox/webkit × 3 shards, 2m35s–5m14s. Flow B additionally run against the production deployment: 2 tests, 12.4 s and 3.6 s |
| 60+ blocks, 30+ presets, 12+ effects registered and documented | **Pass** | 72 blocks (59 placeable + 13 effect layers), 51 presets, 13 effects. Counted by `pnpm stats` from the registries; the documents' own counts are now asserted by `catalogue-parity.test.ts` |
| All four export targets produce compiling output, locked by golden files | **Pass** | `compile-exports` job green, 1m6s. Golden files in `packages/codegen/src/printers/__golden__`; `verify-export-compile.mjs` runs `tsc --noEmit` against each target with the declared dependencies installed |
| Canvas 60 fps with 200 nodes; studio initial JS ≤ 250 kB gzip | **Pass** | Pan p95 16.8 ms with 0 long tasks (`canvas-200-nodes`); studio first-load **249.6 KiB** against a 250 KiB budget on the CI run of 2026-09-04. The margin is 0.4 KiB — see F11 |
| Lighthouse ≥ 95 × 4 on `/`, `/blocks`, `/docs` | **Pass on desktop, fails one metric on mobile** | `lighthouse (desktop)` green, 7m14s. `lighthouse (mobile)` red on a single assertion — `total-blocking-time` over 200 ms on `/blocks/section`. Known debt, ADR-332, not a regression; the four category scores pass |
| Zero axe violations on every surface; full keyboard operation verified | **Pass** | `e2e/a11y/**` on three engines, including `all-blocks` (72 blocks, 0 violations), `keyboard-only-compose`, `keyboard-drag`, `focus-restore`, `zoom-200`, `forced-colors`. Screen-reader sessions remain a recorded gap — `ACCESSIBILITY_AUDIT.md` § 4, owner's decision |
| Unit coverage ≥ 80 % on `editor`, `codegen`, `schema`, `motion` | **Pass** | Floors enforced per package and exceeded: editor 99.5/96.5, schema 95.9/91.4, codegen 96.7/92.6, motion 95.7/88.9 |
| `docs/` complete and consistent with the implementation | **Pass after this audit** | Four divergences found and fixed: F3, F5, F6, F7. 754 file paths named across 29 documents resolve, bar the historical ones in `DECISIONS.md` (F12) |
| CI enforces every gate above | **Pass** | 16 required checks on `main`, all ten gates proven to fail on their violation during prompt 60. `Deploy` added and verified during this session's predecessor |

## Findings

### F1 — GSAP's licence forbids exactly this kind of product [severity: blocking] — **resolved**

**What.** `gsap` was a runtime dependency of `packages/motion` and `packages/codegen`. Its licence is
not OSI — `pnpm licenses list` reported it as `Standard 'no charge' license:
https://gsap.com/standard-license`. Verified at the source on 2026-09-04: the no-charge grant covers
commercial projects, but it **forbids use in "tools that allow users to build visual animations
without code"** competing with Webflow's capabilities. Motion Studio is a visual editor whose motion
panel exists so a user can animate without writing code. It also reached the user:
`collect-motion.ts` mapped the import onto a `gsap ^3.15.0` dependency, so an export using one of
those presets added a non-OSI dependency to somebody else's project.

**Escalated and answered.** Three options were put to the owner — remove it, keep it and record the
risk, or ask GSAP for written clarification. The owner chose to remove it on 2026-09-04. ADR-349
carries the reasoning; the short version is that the applier never did the two things GSAP was there
for:

- `GsapMotion` built a paused `gsap.timeline` and seeked it from the shared scroll bus. It never
  pinned and never split text — `ScrollTrigger` and `SplitText` appeared only in generated source.
- So `horizontal-scroll` and `scroll-timeline` are `css` presets now: the first translates its
  children against `--ms-scroll-progress`, the second prints its own `@keyframes`, holds them at
  `animation-play-state: paused` and seeks them with a negative `animation-delay`. `text-reveal` is a
  `motion` preset, and the export carries a `splitText` of its own — words and characters by
  wrapping, lines by measuring every word's top edge before moving any of them, re-measured on resize.

**Measured, because the reason GSAP was reached for is a browser-support fact.**
`e2e/verify-scrub.mjs` drives the emitted CSS in Chrome, Firefox and WebKit and reads computed values
back. All three agree, in the numbers that matter:

| Progress | Opacity | Timeline transform | Track transform |
| --- | --- | --- | --- |
| 0 | 0.000 | none | none |
| 0.25 | 0.500 | `translateY(-10px)` | `translateX(-400px)` |
| 0.5 | 1.000 | `translateY(-20px)` | `translateX(-800px)` |
| 1 | 1.000 | `translateY(-40px)` | `translateX(-1600px)` |

The opacity column is the carry-forward working: the sequence fades in over the first half and then
lifts without fading back out, which is what CSS would have done with a property missing from the
last keyframe. After scrolling 600 px the pinned card sits at `top: 0` in all three engines and the
page has no horizontal overflow — `overflow-x: clip` clips without making the window a scroll
container, which `overflow: hidden` would have done, taking the sticky children out of the page's
scrollport.

The dependency is out of both manifests, out of the compile fixtures, out of `DEPENDENCIES` in
`collect-motion.ts`, and out of the dynamic-import table in `PERFORMANCE.md`. An export can now add
`motion` or `next` and nothing else, both MIT. The studio's first load did not move — the chunk was
lazy — but the 0.4 KiB of headroom in F11 is 1.1 KiB now.

### F2 — the MIT notice for vendored shadcn/ui source did not exist [severity: major] — **fixed**

`DESIGN_REFERENCES.md` § Vendored says: "copy the component into `packages/ui`, adapt it to our
tokens and density, keep the MIT notice in `packages/ui/LICENSES.md`". That file did not exist.
`packages/ui/README.md` states the package is "shadcn-derived, vendored", so the notice MIT requires
of anyone distributing the source was missing — and this product's whole point is that a user
exports and ships component source.

Fixed: `packages/ui/LICENSES.md`, with the licence and copyright line verified on 2026-09-04 against
`https://raw.githubusercontent.com/shadcn-ui/ui/main/LICENSE.md` and the full notice reproduced.

### F3 — `SHORTCUTS.md` and the registry could not be compared [severity: major] — **fixed**

`studio-registry.test.ts` asserted that every documented key is registered — against a **copy** of
the document's key list, transcribed into the test. A copy cannot fail when the document changes,
and the reverse direction was never checked at all.

Fixed: the test reads `docs/SHORTCUTS.md` and compares both directions. Making that possible turned
up one real ambiguity: the Transform table wrote `Shift` + arrows and `Alt` + arrows as prose, which
is four bindings each and unparseable; the rows now read `Shift+↑ ↓ ← →`. The parser understands the
document's three shorthands (continuation spans, multiple bare keys in one span, `Mod+1` … `Mod+6`
ranges) and skips pointer gestures, which belong to the canvas.

### F4 — the catalogue counts were unasserted [severity: minor] — **fixed**

`COMPONENT_LIBRARY.md` claims a count per category and `ANIMATION_SYSTEM.md` enumerates presets per
channel. Both were **correct** — 72 and 51, matching the registries entry for entry — and nothing
would have said so had they stopped being correct.

Fixed: `apps/web/src/lib/docs/catalogue-parity.test.ts` asserts the per-category counts, their total
against `blockRegistry`, and every channel's preset ids against `PRESETS`.

### F5 — 20 tracked files are over 300 lines [severity: major] — **resolved**

Contract § 1.2 said "No file over 300 lines", with no exemption for tests or data. Counted on
`5cd05e7` with `git ls-files`:

| Kind | Count | Largest |
| --- | --- | --- |
| Test files | 9 | `packages/motion/src/scheduler/scheduler.test.ts` (459) |
| Data and fixtures | 3 | `scripts/templates/definitions.ts` (629) |
| Barrels | 1 | `packages/blocks/src/index.ts` (440) |
| Implementation | 7 | `packages/canvas/src/canvas.tsx` (371) |

The rule as written made all four kinds a violation, and it could not be amended after the count
without becoming the banned fourth way. **Escalated and answered on 2026-09-04:** § 1.2 gains a
stated exemption for a test file, a table of data with no logic, and a package's barrel — ADR-347,
written before the code — and the implementation files are split.

Eight were split, not seven. `scripts/generate-thumbnails.mjs` (355) is filed above under data and it
is not data: it is a script with logic, so the exemption does not cover it. Its capture stage now sits
beside the clip and browser helpers it already used, and the generator was re-run for one block
against the committed output — identical bytes, which is what its determinism contract asks for.

| File | Was | Is | Cut at |
| --- | --- | --- | --- |
| `schema/document/validate.ts` | 302 | 71 | codes, structural invariants, registry invariants |
| `blocks/pricing-table/pricing-table.markup.ts` | 307 | 66 | one file per part, mirroring the components |
| `ui/control-renderer/control-fields.tsx` | 309 | 241 | the `lazy` list, the prop groups, the switch |
| `canvas/canvas.tsx` | 371 | 225 | props, the measured-geometry handle, the live region |
| `codegen/ir/build-ir.ts` | 321 | 231 | naming, component props, hoist placement |
| `web/playground/presets.ts` | 349 | 30 | one file per property group |
| `storybook/docs/token-groups.tsx` | 320 | 10 | a barrel over one file per kind of token |
| `scripts/generate-thumbnails.mjs` | 355 | 228 | the capture stage |

What is left over 300 is the thirteen the exemption names: nine tests, three data tables, one barrel.

### F6 — `as unknown as` in two production files [severity: major] — **resolved**

Contract § 1.1 banned it outright. 22 occurrences in 18 files; 19 are in tests, where the cast is the
point (feeding a function a shape the types forbid, to assert it survives). Two are in production
code:

- `apps/web/src/store/editor-store.ts:55` — `(window as unknown as { studio?: unknown }).studio`,
  the instrumentation handle behind `MS_INSTRUMENT` (ADR-315).
- `apps/web/src/components/studio/export/format.worker.ts:30` — `self as unknown as
  DedicatedWorkerGlobalScope`, the standard way to type a worker's global in a DOM-typed project.

Both are seams onto untyped host globals, which is the one place a cast is not covering for a wrong
model. **Escalated and answered on 2026-09-04:** § 1.1 now bans a cast that launders a type this
repository declares, and permits `as unknown as` in exactly two places — a host-global seam, and a
test feeding a function a shape its types forbid — each naming its reason in a comment (ADR-348).
Both production casts carry that comment, and `CODE_STANDARDS.md` § Required comments carries the
obligation, where the GSAP line used to be.

### F7 — measured numbers in README and PERFORMANCE.md had drifted [severity: minor] — **fixed**

| Claim | Was | Is |
| --- | --- | --- |
| Unit tests | 8,235 in 458 files | 8,259 in 459 files |
| End-to-end tests | 408 in 46 specs, 630 runs | 200 in 41 specs, 422 runs |
| Studio first-load JS | 247.6 KiB / 246.3 KiB / 245.9 KiB | 249.6 KiB (CI) |
| Landing first-load JS | 106.5 KiB / 106.3 KiB | 106.9 KiB (CI) |

The e2e figure is the instructive one: it did not fall, the **suite** was split. Prompt 60 took the
208 visual specs out of the functional run (`testIgnore: ['visual/**']`), and the README's 408 had
been counting both. Both numbers are now stated, separately, and the README says which is which.

### F8 — 13 transitive vulnerabilities, none reachable at runtime [severity: minor] — **documented**

`pnpm audit`: 1 critical, 6 high, 6 moderate. Every one is transitive and every one sits in a
development or build path:

| Severity | Package | Path | Reachable in the product? |
| --- | --- | --- | --- |
| critical | vitest | `apps/web > vitest` | No — the advisory is the Vitest **UI** server, which this repository never starts |
| high | playwright | `e2e > @playwright/test` | No — browser download integrity, CI and dev only |
| high | vite | `apps/web > vitest > vite` | No — `server.fs.deny` bypass in the dev server |
| high | sharp | `apps/web > next > sharp` | No — libvips CVEs; the image excludes sharp from the trace, and Vercel optimises images on the platform |
| high ×2, moderate ×2 | postcss | `apps/web > next > postcss` | No — build-time CSS processing of our own sources |
| high | nanoid | `apps/storybook > … > postcss > nanoid` | No — Storybook build |
| moderate | esbuild, uuid | `apps/storybook > storybook > …` | No — Storybook build |
| moderate ×2 | vite | `apps/web > vitest > vite` | No — dev server |

Fixing them means major upgrades that are already queued as separate passes (`next` 15→16, tooling,
`motion` 11→13 — the open Dependabot pull requests). Not done here: an audit that also performs four
major upgrades reports on neither properly.

`pnpm dedupe --check` is also not clean — `esbuild` 0.21.5 → 0.25.12 under Storybook and duplicate
`@playwright/test`/`playwright` entries. Same reasoning: a lockfile change wants its own run.

### F9 — two dependency licences were nowhere justified [severity: minor] — **fixed**

`TECH_STACK.md` justified every dependency's presence but no dependency's **licence**, and two are
not the permissive default: `gsap` (F1) and `ffmpeg-static` (**GPL-3.0-or-later**). Three more are
worth a sentence: MPL-2.0 for `axe-core` and `lightningcss`, and `Apache-2.0 AND LGPL-3.0-or-later`
for the Windows sharp binary. Of 460 MIT / 22 Apache-2.0 / 18 ISC / 11 BSD dependencies, those five
are the whole list.

Fixed: `TECH_STACK.md` § Licences, with what each one means for a repository that redistributes
generated source.

### F10 — two dead re-exports [severity: minor] — **fixed**

`knip` reports ~54 exported types that nothing imports. Read one by one, all but two are Props
interfaces used inside their own file — a redundant `export` keyword, not dead code, and stripping
them all would churn 50 files to no reader's benefit. Two were genuinely dead: `GradientControlProps`
and `IconControlProps` were re-exported from `control-renderer/index.ts`, reached no further barrel
and were imported nowhere. Removed, along with the now-pointless `export` on the types themselves.

`knip` also reports "unused files" per workspace — 103 in `packages/codegen`. Those are the golden
fixtures, which are read by the compile suite rather than imported. No configuration was added for
it: a `knip.json` tuned until the output is empty is a report about the configuration.

### F11 — the studio bundle has 0.4 KiB of headroom [severity: minor] — **documented**

249.6 KiB against 250 KiB, on the CI run that gates it. Not a violation and not new — ADR-312 and
ADR-313 brought it down from 369.7 KiB — but the margin was smaller than the difference between two
builds of the same commit (0.3–0.6 KiB, measured locally versus CI). The next lazily-loaded surface
that is not lazy enough turns the gate red. Recorded rather than acted on, because the budget is the
contract's and moving it is forbidden by § 9.

Removing GSAP took `GsapMotion` out of the studio chunk with it: **248.9 KiB, 1.1 KiB of headroom**,
measured by `pnpm size-limit` on 2026-09-04 after F1. Better, and still inside the difference between
two builds — the finding stands as a thing to watch rather than a thing that was fixed.

### F12 — `DECISIONS.md` cannot be checked mechanically [severity: minor] — **documented**

347 ADRs, numbered 1–347 with no gaps and no duplicates, every one carrying a `Date`. Every entry
resolves through one of § 9's three legal routes — but the section heading that says which varies:
`Measurement`, `What was measured`, `Question resolved by`, `Options put to the owner`, `Escalated`,
`Checked first`, `Cause (verified in the session)`. A parser cannot tell a criterion-bearing entry
from one that shrugged, so the guarantee rests on a reader. Left as it is deliberately: the entries
are legible to a human and renaming 347 headings for a linter's benefit serves the linter.

Spot-check against `git log` for post-hoc entries: ADR-346, ADR-340, ADR-332, ADR-313 and ADR-250
were each added by a commit of the same date the entry carries. Three entries are marked
`Superseded` (084, 137, 207) and each names its successor (090, 179, 209). Two are `Escalated` (159,
261).

### F13 — 33 of 754 documented paths do not resolve [severity: minor] — **documented**

Of the 33, seven are file-extension patterns in prose (`.test.tsx`, `.d.ts`), four are generated
artifacts (`app-build-manifest.json`, printed theme files), two are routes rather than files, and one
points into `node_modules` on purpose. The remaining nineteen are all in `DECISIONS.md`, where they
were correct when written and the file moved afterwards — `packages/config/vitest/react.ts` is
`react.mjs` now, and so on. A dated decision record describes the repository as it was, and
rewriting those paths would falsify the record. The one that mattered was
`packages/ui/LICENSES.md` (F2), named by a **current** document.

### F14 — four `outline-none` declarations without a focus replacement [severity: minor] — **documented**

`ACCESSIBILITY.md` § Focus allows `outline: none` only beside a replacement. Twelve occurrences;
eight pair with `focus-visible:shadow-focus` in the same file. Of the remaining four, two are Radix
menu items (`dropdown.styles.ts`, `select.styles.ts`) where keyboard position is shown by
`data-[highlighted]` rather than focus — a replacement, just not that one. Two are on elements that
never take focus: the snap-guide label and the toast **viewport**. The viewport is the one worth
naming, because Radix can focus it programmatically (its `F8` hotkey); nothing in the product does,
and no axe run or keyboard spec has found it.

### F15 — `pnpm stats` could report zero and pass [severity: major] — **fixed**

Found while refreshing the numbers above: `pnpm stats` printed **`Unit tests 0 in 0 files`** for a
repository with 8,273 of them. The counter runs `pnpm test` and parses Vitest's summary line, and
Turbo replays a cached task's log verbatim — including the colour codes the log was captured with.
`Test Files\s+(\d+) passed` does not match `Test Files ESC[2m ESC[1mESC[32m460 passed`, so both
counts fell to zero, and nothing failed: a zero is a number.

This is the same defect as F7 one level up. F7 was numbers in documents drifting from the code; this
is the tool those numbers are copied from, reporting a figure it did not measure. `scripts/stats.ts`
now strips ANSI escapes and runs the child process with `NO_COLOR`, and the numbers in this document
and in the README come from the fixed run: 8,273 unit tests in 460 files.

### F16 — most of a preset card could not be clicked [severity: major] — **fixed**

Found while writing the studio spec for F1's rewrite, and older than it: applying a preset from the
motion panel worked on some cards and silently did nothing on others — no error, no toast, no console
message. Nine scroll presets were effectively unreachable with a mouse, and several others were a
coin flip.

A card plays its preview on focus as well as on hover, and playing remounts the preview (ADR-100: an
entrance replays by mounting again). A press inside the preview focuses the button, so the remount
lands between `mousedown` and `mouseup`, and a browser fires no `click` when the element its press
landed on has been removed. Whether a card applied came down to whether the pointer was over the
32-pixel tile or the padding around it.

Fixed: the preview subtree is `pointer-events: none`, which is what an `aria-hidden` decoration
should always have been. ADR-350 carries the event logs that pinned it, and
`e2e/editor/scroll-presets.spec.ts` is the regression — it applies both rewritten presets by clicking
their cards, which is what failed before.

This one is also a comment on the audit itself: the acceptance criteria were checked against 422
end-to-end runs, and none of them applied a preset by clicking a card in a channel below the fold.
The suite covers `magnetic`, whose card happens to sit where the pointer misses the tile.

## Verified clean

Each with the command, so a reader can disagree with the method rather than the conclusion.

| Check | Command | Result |
| --- | --- | --- |
| No `any` in types | `rg ':\s*any\b' -g '*.ts*'` | 3 hits, all inside comments or a description string. Zero type positions |
| No `@ts-ignore` family | `rg '@ts-ignore\|@ts-expect-error\|@ts-nocheck'` | 0 |
| No deep imports across packages | `rg "from '@motion-studio/[a-z-]+/(src\|dist)"` | 0 |
| No selector-less store subscriptions | `rg 'useEditorStore\(\)\|useStudioStore\(\)'` | 0 |
| No `console.log` | `rg 'console\.log' packages apps` | 0 |
| No deferral markers | `rg 'TODO\|FIXME\|XXX\|HACK'` | 0 |
| No unfalsifiable justifications | `rg -i 'for simplicity\|good enough\|seemed better\|felt right'` | 0 |
| No "for now" | `rg -i '\bfor now\b'` | 0. Of 276 hits on the wider pattern, 274 are the `placeholder` attribute |
| No assistant or tooling attribution in history | `git log --format='%s%n%b' \| rg -i 'claude\|copilot\|generated with\|🤖'` | 0. Two `Co-authored-by: dependabot[bot]` lines, which are a real contributor |
| One author | `git log --all --format='%an %ae' \| sort -u` | `yakupjoraev`, plus `dependabot[bot]` and `github-actions[bot]` (the visual baselines commit) |
| No secrets | `git ls-files \| xargs rg 'sk-\|ghp_\|AKIA\|BEGIN.*PRIVATE KEY\|vcp_'` | 0 |
| No local paths | same over `*.ts *.tsx *.json *.md *.mjs *.yml` | 0 |
| No build output, deps or `.env` committed | `git ls-files \| rg '^(node_modules\|.*\.next/\|.*/dist/\|coverage/)'` | 0 |
| Repository size | `git count-objects -vH` | 6.92 MiB packed, 45.8 MiB loose, 7,847 objects. The 16 MB of demo assets are the bulk |
| Budgets match the configs | `.size-limit.js` vs `PERFORMANCE.md` | 120 / 250 / 90 / 140 KiB, identical |
| Coverage contract matches the configs | `TESTING.md` vs ten `vitest.config.ts` | All ten identical |
| Blocks and presets match their documents | `catalogue-parity.test.ts` | 72 blocks across nine categories, 51 presets across six channels |
| Shortcuts match the registry | `studio-registry.test.ts` | Both directions |
| Attribution comments on the registry | doc comment ≥ 200 chars in the block's own directory | 70 of 72. The two thin ones are `spacer` (140) and `stack` (196), layout primitives with no technique to attribute |
| Reference licences | `packages/blocks/LICENSES.md` | Every reference in `DESIGN_REFERENCES.md`, each with the licence as verified and the date |
| Nothing silently cut | `ROADMAP.md` § If time runs short vs the code | All six survive: multi-frame responsive, playground compare mode, version history, 72 blocks (not 40), the HTML target, the visual suite |

### Cross-browser, measured on the deployment

`e2e/audit-browsers.mjs` probes what the specs do not: computed style and feature support in Chrome,
Firefox and WebKit against `motion-studio-y3dev.vercel.app`.

| Property | Chrome | Firefox | WebKit |
| --- | --- | --- | --- |
| `CSS.supports('backdrop-filter')` | yes | yes | **no** |
| Elements with a computed `backdrop-filter` | 0 | 0 | **411** |
| `oklch()` supported and resolved | yes | yes | yes |
| `IntersectionObserver` thresholds honoured | 3 of 3 | 3 of 3 | 3 of 3 |
| `animation-timeline: scroll()` | yes | **no** | **no** |
| Horizontal overflow at 1280 px | none | none | none |
| Studio canvas mounts | yes | yes | yes |

The WebKit row is the one the prompt warned about, and it resolves in the product's favour: WebKit
rejects the unprefixed property name, but every rule that declares `backdrop-filter` in the shipped
CSS also declares `-webkit-backdrop-filter` — checked by parsing the production stylesheet, 0 rules
without the sibling. The glass survives Safari.

The `animation-timeline` row is why GSAP was in the dependency graph at all, and it is still red — the
replacement does not use a native scroll timeline. It seeks a paused animation from the one scroll
listener the scheduler already runs, which every engine supports: `e2e/verify-scrub.mjs` measures it
in all three (F1).

Not covered: a real Safari on macOS, and a real Windows High Contrast Mode. Both are recorded gaps
from prompt 55 and neither is available on this machine.

### Cold read

Three packages read as a stranger would, chosen for being the ones this session had not touched:
`dnd/drop-placement.ts`, `theme/apply/apply-theme.ts`, `tokens/build/to-css.ts`. All three were
followable without asking anyone: each non-obvious choice carries either an ADR reference (021, 026,
315) or a comment stating the criterion, and none contradicted its subsystem document. Two small
observations, neither worth a fix:

- `nextCell` in `drop-placement.ts` reuses the last child's width to decide whether another cell
  fits, which assumes a uniform grid. True of the grid blocks, unstated in the comment.
- `--ms-glass-backdrop-filter` reads like the CSS property `backdrop-filter`; it is the `backdrop`
  glass level's `filter`. The naming pattern is right and the instance is ambiguous.

## Known limitations

| Limitation | Why it ships this way | Reference |
| --- | --- | --- |
| Lighthouse mobile fails `total-blocking-time` on `/blocks/section` | Hydration of the source view's per-token spans. Diagnosed with numbers, fix designed, not implemented | ADR-332 |
| No screen-reader session | VoiceOver needs macOS; NVDA not installed, owner's decision | `ACCESSIBILITY_AUDIT.md` § 4 |
| Pipeline is 9m43s, not under 8 minutes warm | `quality` holds it — 8,259 unit tests | `prompts/60` § Done when |
| No custom domain; Storybook is not hosted | Domain is a purchase; hosting Storybook is a roadmap item | `DEVOPS.md` § Deploy |
| 13 transitive advisories | All in dev/build paths, unreachable at runtime; fixes are queued major upgrades | F8 |
| 13 files over 300 lines | The exemption ADR-347 states: nine tests, three data tables, one barrel | Contract § 1.2 |

## Metrics

The final numbers, all counted on 2026-09-04.

| | |
| --- | --- |
| Blocks | 72 — effects 13, marketing 12, content 9, interactive 9, layout 7, hero 6, navigation 6, data 5, forms 5 |
| Motion presets | 51 — entrance 13, hover 11, scroll 9, continuous 8, cursor 5, exit 5 |
| Animation engines | 2 — `css` and `motion` (ADR-349) |
| Unit tests | 8,273 in 460 files |
| End-to-end tests | 200 in 41 specs, 422 runs across three engines |
| Screenshot baselines | 208 |
| ADRs | 347 |
| Documents | 29 in `docs/`, plus README, CONTRIBUTING, this file |
| Coverage — editor / schema / codegen / motion | 99.5 / 95.9 / 96.7 / 95.7 % lines |
| Studio first-load JS | **248.9 KiB** gzip local `size-limit` after F1, budget 250. The gate's own number is a CI run: 249.6 KiB before F1, re-measured on the next push |
| Landing first-load JS | 106.9 KiB gzip, budget 120 |
| Lighthouse — landing, mobile | 96 / 100 / 100 / 100 |
| Container image | 249 MB, budget 260 |
| Repository | 6.92 MiB packed |
| Production | `motion-studio-y3dev.vercel.app`, seven routes answering 200 |
