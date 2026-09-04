---
group: Engineering foundations
order: 1
summary: "**Start here.** The rules every change obeys. Overrides every other document"
---

# Motion Studio — Engineering Contract

> This file is the **contract**: the rules every change in this repository obeys. Everything else
> in `docs/` specifies a subsystem and is read when working on it. If another document contradicts
> this one, **this one wins**.
>
> Read it once before your first contribution. It is short on purpose.

## 0. What this project is

Motion Studio is a **visual editor for modern React interfaces**: an infinite canvas, a
component registry of production-grade blocks, a live inspector, a motion engine, and a code
generator that emits real React / Next / HTML.

It is not a demo. It is built as a shippable product and read as a portfolio artifact:
someone opens the repo and concludes the author can build systems, not pages.

## 1. Non-negotiables

1. **TypeScript strict. Zero `any`.** No `@ts-ignore`. No cast that launders a type this
   repository declares — if types fight you, the model is wrong, so fix the model. `as unknown as`
   is permitted in exactly two places, because there it describes the world instead of hiding it:
   a seam onto an untyped host global (`window`, a worker's `self`), and a test that hands a
   function the shape its types forbid in order to assert what it does with it. Both name the
   reason in a comment. Anywhere else it is a defect (ADR-348).
2. **No file over 300 lines.** Split by responsibility, not by size. Three kinds are exempt,
   because splitting them splits one subject rather than one responsibility: a test file, a file
   that is a table of data with no logic, and a package's barrel. The exemption is that list and
   nothing else — a file outside it is over the line or it is not (ADR-347).
3. **Every package is a real package.** Own `package.json`, own `tsconfig.json`, explicit
   `exports`. No deep imports across package boundaries (`@motion-studio/ui/src/...` is banned).
4. **Public API is barrel-only.** Each package exports through `src/index.ts`.
5. **New behaviour ships with tests.** Unit (Vitest) for logic, Playwright for flows.
   Rendering-only components are exempt; anything with branches is not.
6. **`prefers-reduced-motion` is honoured everywhere.** No exceptions, no "it's just a fade".
7. **Accessibility is a build gate, not a phase.** Keyboard path + ARIA + focus management on
   every interactive surface.
8. **No secrets, no analytics keys, no personal paths in the repo.**
9. **Commits: Conventional Commits, English, imperative.** No AI/assistant attribution
   anywhere in commit messages, code comments, docs, or PR bodies.
10. **No new dependency** without a one-line justification in the PR body and a check that
    the standard library or an existing dep cannot do it.

## 2. Directory law

```
apps/web              Next.js 15 app: landing, /studio, /playground, /docs
apps/storybook         Storybook host
packages/tokens        Design tokens (source of truth) → CSS variables
packages/theme          Runtime theme engine
packages/motion         Motion primitives, presets, easings, springs
packages/ui             Studio chrome primitives (shadcn-based)
packages/blocks         Component registry (the things users place)
packages/editor         Document model, commands, history, selection, clipboard
packages/canvas         Infinite canvas: viewport, zoom/pan, snap, guides, rulers
packages/dnd            Drag & drop layer on dnd-kit
packages/codegen        Export engine: IR → React / Next / HTML / CSS / JSON
packages/schema         Zod schemas, .motion file format, migrations
packages/hooks          Shared React hooks
packages/utils          Pure helpers
packages/icons          Icon set
packages/config         Shared tsconfig / biome / tailwind / vitest presets
e2e                     Playwright specs
docs                    Production Bible
prompts                 Build prompts (the plan)
```

**Dependency direction is one-way.** Anything may depend on `utils`, `tokens`, `schema`.
Nothing depends on `apps/*`. `blocks` may depend on `motion`, `theme`, `tokens`, `ui`.
`editor` must not import `blocks` — it talks to the registry through `schema` types only.

## 3. File layout inside a package

```
packages/ui/src/button/
  button.tsx          markup + behaviour
  button.types.ts     public types
  button.styles.ts    cva variants / class maps
  button.motion.ts    motion config (if animated)
  button.test.ts      unit tests
  button.stories.tsx  Storybook
  index.ts            re-export
```

One concept per directory. `index.ts` re-exports; nothing else imports across siblings.

## 4. Naming

| Thing | Convention | Example |
| --- | --- | --- |
| Files / dirs | `kebab-case` | `mesh-gradient.tsx` |
| Components | `PascalCase` | `MeshGradient` |
| Hooks | `useX` | `useViewportTransform` |
| Types | `PascalCase`, no `I` prefix | `MotionPreset` |
| Zustand slices | `createXSlice` | `createSelectionSlice` |
| Commands | `verbNoun` | `insertNode`, `reorderNode` |
| Stores | `useXStore` | `useEditorStore` |
| Test ids | `data-testid="kebab-case"` | `data-testid="canvas-root"` |
| CSS variables | `--ms-<group>-<name>` | `--ms-color-accent-500` |

Explicit over short. `nodeRegistry`, not `reg`.

## 5. State rules

- One store: `useEditorStore`, composed of slices (`document`, `selection`, `viewport`,
  `history`, `ui`, `theme`).
- **Always subscribe with a selector.** `useEditorStore((s) => s.selection.ids)`. Never
  destructure the whole store in a component.
- Mutations go through **commands**, never direct `set()` from a component. Commands are
  pure functions on an Immer draft; the store records patches for undo.
- **High-frequency values never live in React state.** Pan, zoom, drag deltas, slider scrub →
  refs + CSS custom properties + `requestAnimationFrame`. React re-renders on commit only.
- Derived data goes in memoised selectors in `packages/editor/src/selectors/`, not in components.

See `docs/STATE_MANAGEMENT.md`.

## 6. Performance budget (enforced in CI)

| Metric | Budget |
| --- | --- |
| Lighthouse Performance (landing, mobile) | ≥ 95 |
| Lighthouse A11y / Best Practices / SEO | ≥ 95 |
| LCP (landing, mobile 4G) | ≤ 2.0 s |
| CLS | ≤ 0.02 |
| INP | ≤ 200 ms |
| `/studio` first-load JS | ≤ 250 kB gzip |
| Canvas interaction | 60 fps with 200 nodes |
| Inspector slider drag | zero React re-render of canvas subtree |

Heavy modules (codegen, prettier, Monaco/CodeMirror, colour picker) are **dynamically
imported**. Never in the initial studio chunk.

## 7. Before you say "done"

Run and read the output. Do not claim success from intent.

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

Then state, in the reply: what you changed, what you verified, what you did not.

## 8. Where to look things up

| Question | Document |
| --- | --- |
| Why does this product exist? | `docs/VISION.md` |
| What exactly must it do? | `docs/PRODUCT.md` |
| How is it structured? | `docs/ARCHITECTURE.md` |
| Which library, which version, why? | `docs/TECH_STACK.md` |
| What should the studio look like? | `docs/UI_GUIDELINES.md` |
| Tokens, scales, colour, elevation | `docs/DESIGN_SYSTEM.md` |
| Easings, springs, presets, reduced motion | `docs/ANIMATION_SYSTEM.md` |
| Registry contract, block catalogue | `docs/COMPONENT_LIBRARY.md` |
| Document model, commands, history | `docs/EDITOR_ENGINE.md` |
| Canvas maths, zoom, snap, guides | `docs/CANVAS.md` |
| Drag semantics, drop targets | `docs/DRAG_AND_DROP.md` |
| Store shape, slices, selectors | `docs/STATE_MANAGEMENT.md` |
| `.motion` schema + migrations | `docs/FILE_FORMAT.md` |
| Code generation, IR, printers | `docs/EXPORT_ENGINE.md` |
| Playground / live CSS editor | `docs/PLAYGROUND.md` |
| Theme engine, runtime theming | `docs/THEME_ENGINE.md` |
| Responsive engine, breakpoints | `docs/RESPONSIVE_ENGINE.md` |
| Keyboard map, command palette | `docs/SHORTCUTS.md` |
| Perf techniques and budgets | `docs/PERFORMANCE.md` |
| A11y requirements per surface | `docs/ACCESSIBILITY.md` |
| Test strategy and coverage rules | `docs/TESTING.md` |
| CI, Docker, deploy, releases | `docs/DEVOPS.md` |
| Lint rules, patterns, anti-patterns | `docs/CODE_STANDARDS.md` |
| Build order and milestones | `docs/ROADMAP.md` |
| Term definitions | `docs/GLOSSARY.md` |

Read the relevant document **before** writing code for that subsystem. Do not re-derive a
design that is already written down, and do not contradict it — if a document is wrong, say so
and propose an edit to the document first.

## 9. Decision discipline

**There are exactly three legal ways to resolve a decision. There is no fourth.**

### 1. It is already specified

The answer is in `docs/`. Find it and follow it. Do not re-derive it, do not improve on it, do not
substitute a preference for it. If a document is wrong, change the document in its own commit
first — with the reasoning — and then write code against it.

### 2. It is decided by measurement

The decision has an objective criterion and a threshold stated in advance. Measure, record the
number, and let the number decide.

```
"Measure buildIR + print + format on the 60-node fixture.
 Under 100 ms → main thread with startTransition.
 Over 100 ms → move to a worker.
 Record the measured number."
```

The threshold comes before the measurement, never after. Choosing the threshold to match the number
you got is the same defect wearing a lab coat.

### 3. It is escalated to the owner

Genuinely open, consequential, and not answerable by measurement. Stop, state the options with their
real trade-offs, give a recommendation, and wait. Do not proceed on a guess and mention it later.

### The banned fourth way

Any of these, in any form, in code, comments, commits, or a session report:

| Banned | Why it is banned |
| --- | --- |
| "It seemed better this way" | An unbacked preference presented as an engineering result |
| "This was simpler" | Simpler for the author, at unmeasured cost to the reader and the product |
| "Good enough" | Nobody defined enough, so nobody can check it |
| "I assumed X" (unrecorded) | An assumption nobody can find is a defect nobody can fix |
| "I chose A over B" (no criterion) | A coin flip with a justification bolted on |
| "It works" | Working is the floor, not the standard |
| "I'll note it as a TODO" | Deferral disguised as a decision |

The problem with all seven is the same: **they cannot be checked.** A reader six months later cannot
tell a considered decision from a shrug, so they have to re-litigate everything or trust blindly.
Both are worse than a recorded decision they can disagree with.

### Every decision leaves a record

If the answer was not already in `docs/`, it goes in [`DECISIONS.md`](DECISIONS.md) **before** the
code that depends on it. Entry format is in that file. This is not paperwork — it is what makes
resolution #2 and #3 distinguishable from the banned fourth way after the fact.

A session report that changed behaviour and lists no decisions either made none — state that — or
hid some.

### Applies to visual work too

"Looks fine" is the banned fourth way in a different costume. Visual quality is judged against
[DESIGN_REFERENCES.md](DESIGN_REFERENCES.md) by direct side-by-side comparison, and the verdict is
reported. "Merely competent" is not done, and neither is "I think it looks good."

## 10. Working style

- Plan in ≤ 5 bullets before multi-file work, then execute.
- Prefer editing an existing file over creating a new one.
- Never rename or move files unless the task says to.
- If a task is ambiguous, § 9 applies: specified, measured, or escalated. An assumption is only
  acceptable when the alternatives produce **equivalent** output — and it is still recorded.
- If a task is blocked, finish everything unblocked and report precisely what is left. Never
  decide that the blocked part was unnecessary — scope is the owner's.
