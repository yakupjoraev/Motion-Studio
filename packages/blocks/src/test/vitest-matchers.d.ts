import 'vitest'

/**
 * `expect.extend(toHaveNoViolations)` runs in `packages/config/vitest/setup-react.ts`; this is the type side
 * of it, and it closes the item ADR-008 left open. ADR-029.
 *
 * This file **is** a module — the `import 'vitest'` at the top is what makes `declare module 'vitest'` an
 * augmentation of the real types rather than a replacement of them. Without that import the whole `vitest`
 * module is redeclared and `describe`/`it`/`expect` disappear.
 */
declare module 'vitest' {
  interface Assertion {
    toHaveNoViolations(): void
  }
}
