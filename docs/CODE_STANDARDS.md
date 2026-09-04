---
group: Engineering foundations
order: 5
summary: Types, naming, file layout, patterns, banned patterns
---

# CODE_STANDARDS

The rules that make a large codebase readable by one person a month later.

## TypeScript

### Compiler configuration

`packages/config/tsconfig/base.json`:

```jsonc
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2023", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true,
    "noPropertyAccessFromIndexSignature": true,
    "verbatimModuleSyntax": true,
    "isolatedModules": true,
    "skipLibCheck": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "noEmit": true
  }
}
```

`noUncheckedIndexedAccess` is the one people try to remove. It stays. The document model is a
`Record<NodeId, Node>` and every lookup genuinely can miss — the compiler is right.

### Banned

```ts
any                    // use unknown + a narrowing guard
as unknown as T        // model the type correctly
@ts-ignore             // @ts-expect-error with a comment, only for third-party bugs
!  (non-null assert)   // except immediately after an explicit throw-guard
enum                   // const object + union type
namespace
default export         // named exports only, except Next.js page/layout files
```

`!` exception:

```ts
const node = nodes[id]
if (!node) throw new NodeNotFoundError(id)
// node is Node here, no assertion needed
```

### Preferred forms

```ts
// discriminated unions over optional-field soup
type Background =
  | { kind: 'solid'; color: string }
  | { kind: 'linear'; stops: ColorStop[]; angle: number }
  | { kind: 'mesh'; points: MeshPoint[] }

// const objects instead of enums
export const BLOCK_CATEGORIES = {
  layout: 'Layout',
  hero: 'Hero',
  marketing: 'Marketing',
} as const
export type BlockCategory = keyof typeof BLOCK_CATEGORIES

// branded ids — a NodeId is not interchangeable with a BlockId
export type NodeId = string & { readonly __brand: 'NodeId' }
export type BlockId = string & { readonly __brand: 'BlockId' }

// readonly on anything not meant to be mutated
export interface Node {
  readonly id: NodeId
  readonly blockId: BlockId
  readonly children: readonly NodeId[]
}

// infer from zod, never declare twice
export const heroPropsSchema = z.object({ title: z.string(), align: z.enum(['left', 'center']) })
export type HeroProps = z.infer<typeof heroPropsSchema>

// exhaustive switches
function render(bg: Background): string {
  switch (bg.kind) {
    case 'solid': return bg.color
    case 'linear': return linear(bg)
    case 'mesh': return mesh(bg)
    default: return assertNever(bg)
  }
}
```

`assertNever` lives in `packages/utils`. Adding a union member breaks the build until every
switch handles it — that is the feature.

## React

### Component rules

- Function declarations, named exports. No `React.FC`.
- Props interface named `<Component>Props`, exported.
- **One component per file, and split early.** The 300-line ceiling in
  [ENGINEERING_CONTRACT.md](ENGINEERING_CONTRACT.md) § 1 is a limit, not a target — a component well
  under it is still too big when it holds several things at once.

  The test is whether a piece of the markup **has a name you can say out loud**: "the terminal
  window", "the attribution under a quote", "one line of code", "the copy button", "the placeholder
  plate". If it does, it is a component, and it goes in its own file in the same directory.

  Three things this buys, and none of them is tidiness: a named piece is a piece you can test
  directly; a small component's props are its own contract rather than five of the parent's
  variables; and a lint suppression lands next to the element it is about instead of twenty lines
  above it. A parent whose `return` is a list of named children reads in one pass — one with five
  levels of nesting does not, whatever its line count says.
- No inline object/array/function props on hot paths (canvas nodes, list rows). Hoist or
  `useCallback`.
- `memo` only where measured: canvas node renderers, layer rows, block cards. Not by default.
- Server Component by default in `apps/web`. `'use client'` is a decision, and the file's top
  comment says why.

```tsx
export interface ScrubFieldProps {
  value: number
  min?: number
  max?: number
  step?: number
  onChange: (value: number) => void
  onCommit: (value: number) => void
}

export function ScrubField({ value, min, max, step = 1, onChange, onCommit }: ScrubFieldProps) {
  // ...
}
```

### Hooks

- Custom hooks in `packages/hooks` when shared, colocated when not.
- A hook returns a stable object or a tuple; never a fresh object literal without `useMemo` if
  consumers put it in a dependency array.
- Effects: one concern per effect, complete dependency arrays, always a cleanup when subscribing.
- No `useEffect` for derived data. Compute it.

```tsx
// ✗
const [total, setTotal] = useState(0)
useEffect(() => setTotal(items.length * price), [items, price])

// ✓
const total = items.length * price
```

### Event handling

- Pointer events, not mouse/touch. `setPointerCapture` for drags.
- Passive listeners for `wheel`/`scroll` unless you must `preventDefault` — and if you must,
  say so in a comment.
- Every listener added in an effect is removed in its cleanup.
- Keyboard handlers check `event.defaultPrevented` and respect the shortcut layer
  ([SHORTCUTS.md](SHORTCUTS.md)).

## Styling

### Tailwind

- Utilities in markup for one-off layout.
- Recurring variants → `cva` in `<component>.styles.ts`.
- Arbitrary values only for genuinely one-off geometry. A repeated arbitrary value is a missing
  token.
- Colours come from tokens, never raw hex in markup. `bg-surface-2`, not `bg-[#181820]`.
- `cn()` (clsx + tailwind-merge) for conditional classes. Never template-string concatenation.

```ts
export const panelVariants = cva(
  'flex flex-col border-border bg-surface-1 text-foreground',
  {
    variants: {
      side: { left: 'border-r', right: 'border-l' },
      density: { compact: 'gap-1 p-2', comfortable: 'gap-2 p-3' },
    },
    defaultVariants: { side: 'left', density: 'compact' },
  },
)
```

### CSS variables

Runtime-changing values are CSS variables, not classes: theme tokens, viewport transform,
in-flight scrub values, effect parameters. Naming: `--ms-<group>-<name>`.

Direct `element.style.setProperty` is allowed **only** in the transient-state pattern described
in [STATE_MANAGEMENT.md](STATE_MANAGEMENT.md). Anywhere else it is a smell.

## Errors

```ts
// packages/utils/src/errors/errors.ts
export class MotionStudioError extends Error {
  constructor(message: string, readonly code: string, readonly cause?: unknown) {
    super(message)
    this.name = new.target.name
  }
}

export class NodeNotFoundError extends MotionStudioError {
  constructor(id: string) {
    super(`Node not found: ${id}`, 'NODE_NOT_FOUND')
  }
}
```

- Throw typed errors for programmer mistakes (invalid tree operation, missing registry entry).
- Return `Result<T, E>` for expected failures (parsing a `.motion` file, parsing user CSS).
- `try/catch` only where you actually handle it. A catch that rethrows unchanged is noise.
- Never swallow. A caught-and-ignored error needs a comment explaining why that is correct.

```ts
export type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E }
```

## Comments

Comments explain **why**. The code already says what.

```ts
// ✗
// increment the version
state.version += 1

// ✓
// Version is a monotonic counter that memoised selectors compare instead of deep-equalling
// the document. Any committed mutation must bump it or caches go stale.
state.version += 1
```

Required comments:
- Non-obvious algorithms (snapping, IR dedupe, patch coalescing) — a short paragraph at the top.
- Every `as unknown as` — which host global it describes, per contract § 1.1.
- Every `@ts-expect-error` — the upstream issue.
- Every performance workaround — what was measured.

Banned: commented-out code, `// TODO` without an issue link, restating the signature,
changelog comments (git has that).

Also banned, and this is the important one — comments that justify a decision without a criterion:

```ts
// ✗ every one of these is unfalsifiable
// simpler this way
// good enough for now
// seemed cleaner than the alternative
// using X because it's easier

// ✓ a criterion, a number, or a pointer to where the decision is recorded
// Semi-implicit Euler: explicit Euler diverges above ~500 N/m stiffness, which
// SPRINGS.stiff (550) exceeds. Measured divergence at dt=1/60 in simulate.test.ts.

// ✓ deferring to a recorded decision
// Main thread, not a worker: 81ms measured on the 60-node fixture. See ADR-014.
```

If you cannot write the criterion, you have not made a decision — you have made a guess, and
[ENGINEERING_CONTRACT.md](ENGINEERING_CONTRACT.md) § 9 says what to do instead.

## Async

- `async/await`, no raw `.then` chains.
- Every `await` of something that can fail is either in a `try` that handles it or wrapped in a
  `Result` helper.
- `AbortController` for anything cancellable. Every fetch in the app takes a signal.
- No floating promises. `void promise` when fire-and-forget is intended, with a comment.

## Imports

```ts
// 1. node builtins
import { readFile } from 'node:fs/promises'

// 2. external
import { create } from 'zustand'
import { motion } from 'motion/react'

// 3. workspace packages
import { cn } from '@motion-studio/utils'
import { tokens } from '@motion-studio/tokens'

// 4. relative
import { panelVariants } from './panel.styles'
import type { PanelProps } from './panel.types'
```

Biome enforces the order. `import type` for type-only imports — `verbatimModuleSyntax` requires
it and it keeps the emitted graph honest.

## Testing style

See [TESTING.md](TESTING.md) for strategy. Style:

```ts
describe('coalesceHistory', () => {
  it('merges consecutive entries with the same key within the window', () => {
    // arrange
    const first = entry({ coalesceKey: 'set-prop:a:opacity', timestamp: 1000 })
    const second = entry({ coalesceKey: 'set-prop:a:opacity', timestamp: 1200 })

    // act
    const past = coalesce([first], second)

    // assert
    expect(past).toHaveLength(1)
    expect(past[0]?.inversePatches).toEqual(first.inversePatches)
  })
})
```

- Test names are sentences describing behaviour, not `it('works')`.
- Arrange / act / assert, visually separated.
- One behaviour per test.
- No snapshot tests except codegen golden files, which are reviewed on change.
- Factories (`entry()`, `node()`, `doc()`) in `<package>/src/test/factories.ts`.

## Git

```
feat(scope): add thing
fix(scope): stop doing wrong thing
perf(scope): make thing fast
refactor(scope): move thing
docs(scope): explain thing
test(scope): cover thing
build|ci|chore(scope): plumbing
```

Imperative, lowercase, no trailing period, English. The body explains why when the subject
cannot. Commit messages describe the change and nothing else — no tooling or assistant
attribution, ever.

One logical change per commit. `git add -p` exists for a reason.

## Review checklist

- [ ] Every non-obvious choice traces to a document section, a recorded measurement, or an ADR —
      nothing rests on the author's preference
- [ ] No comment justifies a decision without a criterion ("simpler", "cleaner", "good enough")
- [ ] No silent scope reduction; anything cut was the owner's call and is recorded
- [ ] No `any`, no unchecked casts, no `@ts-ignore`
- [ ] No file over 300 lines
- [ ] No cross-package deep import
- [ ] Store access via selector; mutation via command
- [ ] Reduced motion handled if anything animates
- [ ] Keyboard path exists and is tested
- [ ] Accessible name on every interactive element
- [ ] Test covers the branch that was added
- [ ] Comments explain why, not what
- [ ] No new dependency, or one justified in the PR body
- [ ] `pnpm lint && pnpm typecheck && pnpm test && pnpm build` green
