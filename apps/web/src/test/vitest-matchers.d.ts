import 'vitest'

/**
 * `expect.extend(toHaveNoViolations)` runs in `packages/config/vitest/setup-react.ts`; this is the
 * type side of it, repeated here because a declaration types only its own tsconfig program — the same
 * reason `packages/ui/src/test/vitest-matchers.d.ts` exists. ADR-029.
 *
 * This file **is** a module — the `import 'vitest'` at the top is what makes `declare module 'vitest'`
 * an augmentation of the real types rather than a replacement of them.
 */
declare module 'vitest' {
  interface Assertion {
    toHaveNoViolations(): void
  }
}
