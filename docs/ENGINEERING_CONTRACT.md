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

1. **TypeScript strict. Zero `any`.** No `@ts-ignore`, no `as unknown as`. If types fight you,
   the model is wrong — fix the model.
2. **No file over 300 lines.** Split by responsibility, not by size.
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

Heavy modules (codegen, GSAP timelines, Monaco/CodeMirror, colour picker) are **dynamically
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

## 9. Working style

- Plan in ≤ 5 bullets before multi-file work, then execute.
- Prefer editing an existing file over creating a new one.
- Never rename or move files unless the task says to.
- If a task is ambiguous in a way that changes the output, state the assumption and continue.
- If a task is blocked, finish everything unblocked and report precisely what is left.
