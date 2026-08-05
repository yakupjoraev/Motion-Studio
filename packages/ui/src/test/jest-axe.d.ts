/// <reference types="@testing-library/jest-dom/vitest" />

/**
 * `jest-axe` publishes JavaScript only, so the surface this package uses is declared here — the same reason
 * `packages/config/vitest/jest-axe.d.ts` exists, and it has to be repeated because a declaration types only
 * the tsconfig program it belongs to. ADR-029.
 *
 * This file is deliberately a **global script** — no imports, no exports. `declare module` in a module file
 * is an *augmentation*, which requires the module to already have types; here there are none to augment.
 * The `reference` above pulls in the jest-dom matchers for the same reason.
 */
declare module 'jest-axe' {
  interface AxeViolation {
    readonly id: string
    readonly help: string
    readonly nodes: readonly { readonly html: string }[]
  }

  interface AxeResults {
    readonly violations: readonly AxeViolation[]
  }

  export function axe(container: Element | Document): Promise<AxeResults>
}
