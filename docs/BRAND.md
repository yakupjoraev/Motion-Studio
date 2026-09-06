---
group: Product
order: 5
summary: Positioning, the three messages and their proof, the pitches, and the voice the copy holds
---

# BRAND

[VISION.md](VISION.md) states why the product exists. This document turns that prose into the
sentences a launch needs — a positioning statement, three messages, the evidence behind each, and
copy short enough to be read — so that the landing page, the README, the OG image and anything said
about the product out loud all say the same thing.

**It adds nothing.** Every claim here already exists in the product, and the column that matters is
the one naming where it is proved. A claim without a proof point does not ship: that is
[ENGINEERING_CONTRACT.md](ENGINEERING_CONTRACT.md) § 9 applied to copy, which is the easiest place in
a repository to break it.

## The framework

**Mission**

> We give frontend developers direct manipulation over real React components — the inspector is
> generated from each component's schema and the export prints the component on screen — so they
> leave with a file they own instead of a screenshot or a dependency.

**Vision**

> A world where trying an interface technique costs one drag, and keeping it costs one file.

**Value proposition**

> For **frontend developers** who need a specific interface effect tuned to their own design,
> **Motion Studio** is a **visual editor over a real component registry** that lets them tune the
> component itself and take its source. Unlike **design tools**, which return a picture or a hosted
> page, and unlike **component libraries**, which return code that cannot be tried before it is
> pasted in, **the thing being manipulated and the thing being exported are the same component.**

**Positioning**

> Motion Studio is the **visual editor for frontend developers** who want a tuned component *and* its
> source, because the canvas renders the registry's own components and the export button prints the
> one they were just looking at.

### The alternatives, stated honestly

The differentiation is a gap between two good categories, not a claim that either is bad. Copy that
pretends otherwise is disprovable in a minute, and a reader who disproves one line stops believing
the rest of the page.

| Category | What it does well | Where it stops |
| --- | --- | --- |
| Design tools — Figma, Framer, Webflow | Direct manipulation, and the best of it in the industry | The output is a picture or a hosted page; never idiomatic React you own |
| Component libraries — shadcn/ui, Aceternity, Magic UI, React Bits | Real code, well written, yours to keep | Discovery is a static grid: one hard-coded demo per effect, nothing to try first |

**The gap is discovery, not quality.** shadcn/ui is vendored into this project precisely because it
is good ([DESIGN_REFERENCES.md](DESIGN_REFERENCES.md) § Vendored), and saying so costs nothing —
the middle of the gap is still empty.

## Message architecture

**Primary message**

> Drag it. Tune it. Take the code.

**Supporting messages**

| Message | The need it answers | Proof |
| --- | --- | --- |
| The blocks are real components, not pictures | "Will this survive contact with my layout?" | The gallery renders the same component the exporter prints; 72 blocks, each with a screenshot baseline in both colour modes |
| Motion is a value you drag, not a demo you watch | "How does 0.4 damping actually feel?" | 51 presets over six channels, spring and bezier editors, and a per-channel reduced-motion behaviour asserted for every preset in the catalogue |
| The export compiles, and none of it is ours | "Will this pass review, and what am I taking on?" | `pnpm test:compile` builds and type-checks the emitted project; the output imports nothing from this repository |

Each of the three answers a different question a developer asks in the first minute, in the order
they ask it: *is it real*, *can I feel it*, *what does it cost me*.

## Proof points

Every row is checkable by a reader who does not trust us, which is the only kind of proof worth
printing.

| Claim | Where it is proved | How a reader checks it |
| --- | --- | --- |
| The blocks are real React components, not pictures | The gallery and the studio render the registry; the block page prints its source with the shipped exporter | Open `/blocks/<slug>`, copy the component, paste it into a project |
| Motion is tunable, not a fixed demo | 51 presets across six channels plus curve and spring editors | Apply a preset, drag its stiffness, watch the curve and the exported numbers follow |
| The export compiles | The compile suite builds the emitted project and type-checks it in CI | `pnpm test:compile` |
| It is yours, offline, with no account | Local-first persistence in IndexedDB; the only server route is the container's health check; MIT | Load `/studio`, go offline, keep working; read the network panel |
| It is responsive in a way you can see | The artboard is the band the block asks for ([ADR-356](DECISIONS.md)) | Switch the breakpoint and watch the block re-arrange rather than scale |
| The code is reviewed as code | 8,370 unit tests, 215 end-to-end tests across three browsers, 208 screenshot baselines, budgets enforced in CI | The CI badge, then [TESTING.md](TESTING.md) |

## Elevator pitches

**10 seconds** — 23 words, which is 8.6 seconds at 160 words per minute. The count is how this one
is checked; "it sounds about right" is the banned fourth way with a stopwatch missing.

> Motion Studio is a visual editor over real React components: drag a block, tune it, take the
> source. No account, nothing to install.

**30 seconds**

> Every UI-effect library shows you a static grid: one hard-coded demo per effect, and you cannot
> tell how a spring feels from a screenshot. Design tools let you manipulate the thing, but hand
> back a picture or a hosted page. Motion Studio is the middle — direct manipulation over a real
> component registry, with code as the output format. The inspector is generated from each
> component's schema, so a prop that exists has a control, and the export button prints the
> component you were just looking at: React, Next, HTML, JSON or the theme as tokens.

**60 seconds**

> Every UI-effect library shows you a static grid: one hard-coded demo per effect, and you cannot
> tell how a spring behaves at 0.4 damping, or whether an aurora background survives a dark theme,
> from a screenshot. Design tools let you manipulate the interface directly, but what comes out is a
> picture or a hosted page rather than code you own. Motion Studio sits in the gap: an infinite
> canvas rendering 72 real blocks, an inspector generated from each block's Zod schema, and 51
> motion presets over six channels with the springs and curves exposed as things you drag. When it
> looks right, you export it — React, Next.js, standalone HTML, a portable `.motion` document, or
> the theme as tokens — and what you get is ordinary React with ordinary Tailwind classes and no
> import from this project, so you have taken a component rather than a dependency. It runs entirely
> in the browser: local-first, MIT, no account and no backend. The compile suite in CI builds the
> emitted project and type-checks it, which is why the export is a claim we are willing to print.

## Message by audience

The three audiences are [VISION.md](VISION.md) § Who it is for. They need different first sentences.

| Audience | Pain | Message | Call to action |
| --- | --- | --- | --- |
| Frontend developer, wants one effect | Reading a stranger's CSS in a devtools panel | Tune it against your own design, then take the source | Open the block page |
| Designer-developer, composing a page | Building the same eight sections again, by hand | Compose the page, theme it once, export the Next.js project | Open the studio |
| Hiring engineer, reading the repository | Portfolios that demo well and read badly | Fifteen packages, one direction of dependency, a document per subsystem and a decision log | Read `docs/ARCHITECTURE.md`, then any source file |

## Voice

The repository already has a voice — the documents are direct, specific, and lead with the
measurement. The marketing keeps it. Three traits, each with a do and a don't, so the landing copy
and the documents cannot drift apart.

| Trait | What it means | Do | Don't |
| --- | --- | --- | --- |
| **Specific, not grand** | A number beats an adjective, and a number that can be checked beats one that cannot | "51 presets across six channels" | "a rich motion system" |
| **Honest about the edges** | The product says what it refuses to be; the marketing does the same | "No screen-reader session has been run; the work was verified with axe and keyboard passes" | "Fully accessible" |
| **Plain, not clever** | A sentence a developer can check beats one they have to decode | "The export button prints the component you were just looking at" | "Bridging the design-development chasm" |

### Sample rewrites

| Before | After | Why |
| --- | --- | --- |
| "Powerful animation capabilities" | "51 presets across six channels, each with a reduced-motion behaviour its channel defines" | The first is unfalsifiable; the second names the number and the rule |
| "Production-ready code export" | "The compile suite builds the emitted project and type-checks it in CI" | "Production-ready" is a claim about the future; the suite is a claim about the last commit |
| "Seamless developer experience" | "No account, no install, no backend — it runs in this browser" | Three checkable facts instead of one word nobody can disagree with |

## What we do not claim

The [VISION.md](VISION.md) § What it refuses to be table is marketing copy as much as it is
specification, and the same restraint applies to the things that are simply not finished. Both are in
the README already; a launch that quietly drops them is a launch that can be caught.

- **Not a hosted builder.** No accounts, no cloud documents, no publishing.
- **Not a Figma competitor.** Components, not shapes: no vector editing, no plugin platform.
- **Not a marketplace.** One curated registry, no submissions.
- **Not screen-reader-certified.** Zero axe violations on every route and a keyboard path on every
  surface, but no session with a real screen reader has been run — `ACCESSIBILITY_AUDIT.md` in the
  repository root says so in its own words.
- **Not finished in the layers tree.** Reordering a block by keyboard inside the tree moves the
  selection but not the node ([ADR-327](DECISIONS.md)).

## Where the numbers come from

`pnpm stats` counts the registries, runs the unit suite and reads the build manifest — the
repository README's "Project stats" table is its output, and this document quotes that table rather
than remembering it. Two numbers are not in it and say when they were taken instead: Lighthouse, which
is a property of the host as much as of the page ([ADR-332](DECISIONS.md)), and coverage.

**A number in the copy is the same number in the README, or one of them is a defect.** Two had
drifted when this document was written — the landing said seventeen packages where the README, the
architecture diagram and the repository all say fifteen, and the hero and the OG image counted four
export targets where [EXPORT_ENGINE.md](EXPORT_ENGINE.md) prints five ([ADR-370](DECISIONS.md)).
Both were found by writing the proof column rather than by any test, which is the argument for
keeping this document rather than the sentences it contains.
