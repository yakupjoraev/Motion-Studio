import { configure } from '@testing-library/react'

/**
 * The control renderer is code-split (ADR-109), so a query for a control waits for a dynamic import.
 * One second is Testing Library's default and it is enough on an idle machine and not while eleven
 * packages' test runs share the CPU — which is what turned `pnpm test` red intermittently while
 * `pnpm --filter @motion-studio/ui test` stayed green. `apps/web` carries the same line for the same
 * reason.
 *
 * Five seconds is a timeout, not a sleep: a test that finds its element in 40 ms still takes 40 ms.
 */
configure({ asyncUtilTimeout: 5000 })
