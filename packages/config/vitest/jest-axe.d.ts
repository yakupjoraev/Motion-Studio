/**
 * `jest-axe` publishes JavaScript only — the tarball contains `index.js` and nothing else — and
 * `@types/jest-axe` pulls in `@types/jest`, whose ambient `expect`/`describe`/`it` globals shadow
 * Vitest's and break every test file's types. The surface we use is two exports wide, so it is
 * declared here instead.
 *
 * The result shape mirrors axe-core's, narrowed to the fields a failure message reads. axe-core's
 * own types are not reachable from this package: it arrives as a transitive dependency of
 * `jest-axe`, and `node-linker=isolated` (.npmrc) means transitive types are not resolvable.
 */
declare module 'jest-axe' {
  export interface AxeViolationNode {
    readonly html: string
    readonly target: readonly string[]
    readonly failureSummary?: string
  }

  export interface AxeViolation {
    readonly id: string
    readonly impact: 'minor' | 'moderate' | 'serious' | 'critical' | null
    readonly description: string
    readonly help: string
    readonly helpUrl: string
    readonly nodes: readonly AxeViolationNode[]
  }

  export interface AxeResults {
    readonly violations: readonly AxeViolation[]
    readonly passes: readonly { readonly id: string }[]
  }

  export function axe(container: Element | Document): Promise<AxeResults>

  export const toHaveNoViolations: {
    readonly toHaveNoViolations: (results: AxeResults) => {
      readonly pass: boolean
      readonly actual: readonly AxeViolation[]
      readonly message: () => string
    }
  }
}
