# 03 — Utils package

**Milestone** M0 · **Depends on** 02 · **Commit** `feat(utils): add shared helpers with full test coverage`

## Read first

- `docs/CODE_STANDARDS.md` — § TypeScript, § Errors
- `docs/GLOSSARY.md` — for exact naming
- `docs/TESTING.md` — § Unit tests

## Goal

`packages/utils` — the leaf dependency everything else uses. Small, pure, exhaustively tested. This
is where the awkward primitives live so they are not reimplemented five times.

Target coverage: **95 % lines, 90 % branches.** There is no excuse for less in a package of pure
functions.

## Deliverables

```
packages/utils/src/
├── cn/                 cn.ts, cn.test.ts              clsx + tailwind-merge
├── assert/             assert.ts, assert.test.ts      assertNever, invariant, assertDefined
├── result/             result.ts, result.test.ts      Result<T,E>, ok, err, map, unwrapOr, isOk
├── errors/             errors.ts, errors.test.ts      MotionStudioError + typed subclasses
├── id/                 id.ts, id.test.ts              createId(prefix), counterIds() for tests
├── math/               math.ts, math.test.ts          clamp, lerp, inverseLerp, round, snapTo, approxEqual
├── geometry/           geometry.ts, geometry.test.ts   Rect helpers: intersects, contains, union, center, expand
├── object/             object.ts, object.test.ts      getPath, setPath, deletePath, deepEqual, pick, omit
├── array/              array.ts, array.test.ts        move, insertAt, removeAt, unique, groupBy, partition
├── string/             string.ts, string.test.ts      kebab, camel, pascal, humanize, truncate, escapeHtml
├── color/              color.ts, color.test.ts        parseOklch, formatOklch, contrastRatio, relativeLuminance, clampChroma
├── radius/             radius.ts, radius.test.ts      innerRadius(outer, gap)
├── clone/              clone.ts, clone.test.ts        typed structuredClone wrapper
└── index.ts
```

Dependencies added: `clsx`, `tailwind-merge`. Nothing else — `colord` and friends are not needed
for the ~80 lines of colour maths here.

## Constraints

### `assertNever`

```ts
export function assertNever(value: never, message?: string): never {
  throw new MotionStudioError(
    message ?? `Unhandled case: ${JSON.stringify(value)}`,
    'UNHANDLED_CASE',
  )
}
```

Every exhaustive switch in the codebase depends on this. It must be `never`-typed or the compiler
stops catching missing union members.

### `getPath` / `setPath`

Used by every prop-editing command, so they carry weight:

- Dot and bracket notation: `plans[0].price`, `theme.palette.accent`
- `setPath` mutates in place (it runs on an Immer draft)
- Creates intermediate objects/arrays as needed, choosing array vs object by whether the next
  segment is numeric
- Returns `undefined` for a missing path, never throws
- Typed as `unknown` in and out — path-based access cannot be soundly typed, and pretending
  otherwise with a generic is worse than being honest

### Colour maths

- `parseOklch` accepts `oklch(58% 0.18 285)`, `oklch(58% 0.18 285 / 0.5)`, and hex, returning
  `{ l, c, h, a }` with `l` in 0–1
- `contrastRatio` implements WCAG 2.x relative luminance, converting OKLCH → sRGB first
- `clampChroma(c, l, h)` binary-searches the maximum in-gamut chroma for that lightness and hue —
  the theme engine's ramp generation depends on it
- Precision: `contrastRatio` accurate to 2 decimals against known reference pairs; include
  reference-value tests (black/white = 21:1, and three published pairs)

### `createId`

```ts
export function createId(prefix: string): string   // 'node_' + 22 base58 chars
export function counterIds(prefix?: string): () => string   // deterministic, for tests
```

Uses `crypto.getRandomValues`. `counterIds` exists so every test is deterministic — see
`docs/TESTING.md` § Determinism.

### General

- Every function is pure. No module-level mutable state except `counterIds`' closure.
- Every function has an explicit return type.
- No function over 30 lines.
- Zero dependencies beyond `clsx` and `tailwind-merge`.

## Verify

```bash
pnpm --filter @motion-studio/utils test --coverage
```

Read the coverage table. Every file at ≥ 95 % lines. Then:

```bash
pnpm lint && pnpm typecheck
```

Specific assertions to confirm exist:
- `contrastRatio('#000', '#fff')` → `21`
- `getPath({ a: [{ b: 1 }] }, 'a[0].b')` → `1`
- `setPath({}, 'a[0].b', 1)` → `{ a: [{ b: 1 }] }`
- `innerRadius(12, 8)` → `4`; `innerRadius(4, 8)` → `0` (never negative)
- `clampChroma` output is in-gamut for 20 sampled (l, h) pairs

## Done when

- [ ] All 13 modules implemented with tests beside them
- [ ] ≥ 95 % lines, ≥ 90 % branches, confirmed by reading the coverage output
- [ ] Only `clsx` and `tailwind-merge` as dependencies
- [ ] Every export has an explicit return type
- [ ] `assertNever` returns `never` and is used in at least one test's exhaustive switch
- [ ] `pnpm lint && pnpm typecheck` clean
