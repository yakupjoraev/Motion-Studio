# TECH_STACK

Every dependency, why it is here, and what it is not allowed to do. A dependency without a
reason in this file does not belong in `package.json`.

## Runtime requirements

| | Version | Note |
| --- | --- | --- |
| Node | `>=20.11` | LTS. Pinned in `.nvmrc` and `engines`. |
| pnpm | `>=9` | Workspaces + strict node-linker. Enable via `corepack`. |

## Core

### Next.js 15 (App Router)
Server Components for the landing, `/blocks`, and `/docs` — those pages are content and should
ship almost no JS. Streaming with `Suspense` for the block gallery. The studio is a client
island mounted inside a prerendered shell.

Not used for: any server mutation. There is no backend. No route handlers except a static
`/api/health` for the Docker healthcheck.

### React 19
`useOptimistic` is unused (no server state). What matters: the improved `ref` handling, the
`use` hook for lazily reading resources in the block gallery, and the stabilised concurrent
rendering that lets us mark canvas re-renders as non-urgent via `startTransition`.

### TypeScript 5.6, strict
`strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`,
`verbatimModuleSyntax`. `any` is a lint error, not a style preference. The document model,
registry, and codegen IR are all fully typed — that is the point of the project.

### Tailwind CSS v4
CSS-first configuration via `@theme`. Our design tokens generate the `@theme` block, so
Tailwind utilities and runtime CSS variables come from a single source. v4's engine is fast
enough to keep the studio's HMR usable with a large class surface.

Rule: blocks use Tailwind utility classes because **the exported code must be Tailwind**. The
studio chrome may use utilities too, but shared chrome patterns live in `packages/ui` as `cva`
variants, not copy-pasted class strings.

## State

### Zustand 5
One store, sliced. Chosen over Redux Toolkit (too much ceremony for a single-store app) and
over Context (re-render storms are fatal here). The decisive feature is selector-level
subscription: the inspector can update while the canvas does not re-render.

### Immer 10
Commands mutate a draft; we take `produceWithPatches` output and store the patches. That gives
undo/redo for free and makes history entries small enough to keep hundreds of them.

Rule: patches are the history unit. Never snapshot the whole document.

### TanStack Query 5
Only for the `/blocks` gallery and `/docs` search index — cached, deduped fetching of static
JSON. Not used for editor state. If you reach for it inside the editor, you are wrong.

### TanStack Table 8
The data-heavy blocks and the export file list. Headless, so it composes with our own chrome:
`data/table` takes it for the sorting model and writes every element itself, which is the only way the
markup can be the semantic table a screen reader needs. `comparison-table` and `pricing-table` do not
take it — neither sorts, and a matrix of fixed columns is markup rather than a model.

### TanStack Virtual 3
Layers tree, block list, export file list. Anything that can exceed ~50 rows.

## Motion

### Motion (Framer Motion) 11
Declarative variants map cleanly onto our data-driven `MotionPreset` model, and the layout
animations are the best available. Used for: entrance, hover, tap, layout, exit, and
`useScroll`-driven progress.

### GSAP 3
Only where Motion is the wrong tool: long scroll-scrubbed timelines with pinning, complex
sequenced choreography, and SplitText-style character reveals. Loaded dynamically, never in the
initial bundle. Every GSAP usage must be justified in a comment naming what Motion could not do.

Rule: **do not mix both on one element.** Ownership per element is exclusive.

### Lenis (optional, scroll)
Smooth scroll for the landing page only, and disabled under `prefers-reduced-motion`. Never in
the studio — it fights the canvas.

## Interaction

### dnd-kit 6
Drag & drop for the block palette → canvas, canvas reordering, and layers tree reparenting.
Chosen because it is accessible by default (keyboard sensors, live-region announcements) and
does not use the HTML5 drag API, which cannot render a custom preview reliably.

### Radix UI
Dialog, Popover, Dropdown, Tooltip, Tabs, Slider, Switch, Toggle Group, Context Menu,
Scroll Area, Collapsible, Accordion, Navigation Menu. Unstyled, correct, accessible. This is the
studio chrome's skeleton.

Some of them are a **block's** dependency rather than the chrome's, and that changes where the package
is declared. A block is exported into the user's project, so the primitive it uses travels with it
through the codegen descriptor's `dependencies` and is installed by the emitted `package.json`.
`packages/blocks` therefore depends on those primitives directly — a block that imported one through
`@motion-studio/ui` would export code that does not compile outside this repository. Nine do so far:

| Primitive | Blocks | Why that primitive |
| --- | --- | --- |
| Accordion | `faq-accordion`, `accordion` | Toggle keyboard, `aria-expanded` and `aria-controls` both ways |
| Navigation Menu | `navbar` | A menu bar's focus movement, `Esc` and outside-click, which a hand-rolled dropdown gets wrong |
| Dialog | `navbar`, `modal-trigger` | The focus trap, `Esc`, and focus restored to the trigger |
| Collapsible | `sidebar-nav` | Group disclosure with the `hidden` attribute managed |
| Dropdown Menu | `breadcrumbs` | The collapsed-middle overflow menu, keyboard-operable |
| Tabs | `tabs` | Roving tabindex, `aria-selected`, and panel association both ways |
| Toggle Group | `button-group` | One roving tab stop for a segmented control, multiple selection |
| Radio Group | `button-group` | Single selection, where the arrow keys have to *check* and not only move — ADR-208 |
| Select | `select-field` | A styleable listbox with type-ahead. Its trigger is a `<button>`, which moves the accessible name — ADR-216 |

Radix Tooltip is deliberately **not** on that list. It needs a `Tooltip.Provider` above it, and a block
cannot supply an application root — ADR-190, restated for `tooltip-target` in ADR-202.

`theme-toggle` takes **no** primitive: three buttons with `aria-pressed` in a labelled group is the whole
control, and its export has to be self-contained (ADR-201).

### React Aria (`react-aria` / `react-stately`)
Used where Radix does not reach: the colour picker (`useColorArea`, `useColorSlider`) and the
toolbar focus management. Also for `useHover`/`usePress` where pointer-event correctness matters.
Not the number scrub field — `useNumberField` cannot pass a typed expression through to the value,
so that one control is ours (ADR-037).

Rule: prefer Radix for overlays, React Aria for value-editing widgets. Do not implement both
for the same control.

### shadcn/ui
Vendored, not installed — the components are copied into `packages/ui` and adapted to our
tokens. That is the intended usage. Never `import from "shadcn/ui"`.

### impeccable.style
The primary **design reference** for the high-end surface effects: aurora, mesh gradients, glass,
spotlight, border beams, noise, shine, magnetic and tilt interactions. It defines the visual bar the
`effects` category and the hero blocks are held to.

It is a reference, not a dependency. Nothing is installed from it and nothing is imported at
runtime. See [`docs/DESIGN_REFERENCES.md`](DESIGN_REFERENCES.md) for the required workflow —
including the licence check that must happen **before** any code is adapted from it.

The short version: study the effect, understand the technique, then implement it against our schema,
our tokens, our motion presets, and our reduced-motion policy. A verbatim paste fails review on
three counts — it bypasses the registry contract, it hard-codes an animation, and it may carry
licence obligations we have not verified.

## Validation and data

### Zod 3
The single source of truth for shape. Block prop schemas drive both runtime validation and
inspector generation. The `.motion` file format is a Zod schema, and import validation is that
schema plus migrations. Types are inferred from schemas — never declared twice.

### React Hook Form 7
Only in genuine forms: the theme builder's numeric form, export options, and the Form blocks'
own previews. Not for the inspector — the inspector is command-driven, not form-driven.

Validation reaches it through **`@hookform/resolvers`**, imported as `@hookform/resolvers/zod`. 866 B
gzipped, no dependencies of its own, and the part worth not owning is flattening a `ZodError`'s `path`
array into RHF's dotted field names — ADR-212 has the measurement. `contact-form` and `waitlist-form`
are the only two blocks that take it, and both carry it plus `react-hook-form` and `zod` in their
codegen descriptors, so the emitted project installs what the emitted component imports.

## Tooling

| Tool | Role | Note |
| --- | --- | --- |
| **Turborepo 2** | Task graph, caching | `lint`, `typecheck`, `test`, `build` per package |
| **pnpm workspaces** | Package linking | Strict; no phantom deps |
| **Biome 1.9** | Lint + format | Replaces ESLint + Prettier for source. One binary, fast enough for a pre-commit hook |
| **Prettier 3** | Formatting *output* only | Used by `codegen` as a library to format generated code. Not for our source. |
| **Storybook 8** | Component workshop | Every `ui` and `blocks` entry has a story; a11y and interaction addons enabled |
| **Vitest 2** | Unit + component tests | `jsdom` for components, `node` for pure logic |
| **Testing Library** | Component queries | Role-based queries only; `getByTestId` is a last resort |
| **fast-check 3** | Property-based tests | `TESTING.md` § Property-based tests: command sequences, coordinate round-trips |
| **Playwright 1.48** | E2E | Chromium, Firefox, WebKit. Traces on failure |
| **axe-core / @axe-core/playwright** | A11y gate | Zero violations required |
| **Lighthouse CI** | Perf gate | Budgets in `docs/PERFORMANCE.md` |
| **size-limit** | Bundle gate | Per-entry byte budgets |
| **Changesets** | Versioning | Package versions + changelog |
| **lefthook** | Git hooks | Pre-commit: format + lint changed files. Pre-push: typecheck |
| **Docker + compose** | Local parity | Multi-stage build, standalone Next output |
| **GitHub Actions** | CI/CD | See `docs/DEVOPS.md` |

## Deliberately not used

| Rejected | Why |
| --- | --- |
| Redux Toolkit | Ceremony without benefit for one store; patches give us history more cheaply |
| Jotai / Valtio | Atomic model does not fit a single normalized document; harder to snapshot for undo |
| ESLint + Prettier | Two tools, slow, config sprawl. Biome covers both for source |
| Styled Components / Emotion | Runtime CSS-in-JS is a perf cost, and the export target is Tailwind |
| Monaco | ~2 MB for a CSS textarea. CodeMirror 6 does the job at a fraction of the size |
| React DnD | HTML5 drag API limitations; worse a11y story than dnd-kit |
| Three.js | No 3D in v1. WebGL effects are done with shaders on a 2D canvas where needed |
| Konva / Fabric | The canvas renders DOM React components, not a bitmap scene graph |
| tRPC / Prisma / any DB | No backend. Local-first |
| Sentry / analytics | No telemetry, by design |

## Adding a dependency

Answer these in the PR body. If any answer is weak, do not add it.

1. What exactly does it do that we cannot do in ~50 lines?
2. What does it cost, gzipped, in the bundle it lands in?
3. Is it tree-shakeable, and is the used surface small?
4. Does it ship its own types?
5. Is it maintained (release in the last 6 months, open-issue trend)?
6. Which bundle does it land in — and can it be dynamically imported instead?

Anything above 20 kB gzip in the studio's initial chunk needs an explicit exemption recorded in
`docs/PERFORMANCE.md`.
