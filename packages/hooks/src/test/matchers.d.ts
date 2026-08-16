/// <reference types="@testing-library/jest-dom/vitest" />

/**
 * `packages/config/vitest/setup-react.ts` imports the jest-dom matchers at runtime, but a declaration
 * types only its own `tsc` program — ADR-029 — so each package that asserts with them pulls the types
 * in for itself. `packages/ui` and `apps/web` carry the same one line.
 */
export {}
