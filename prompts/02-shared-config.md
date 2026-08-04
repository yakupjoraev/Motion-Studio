# 02 — Shared configuration

**Milestone** M0 · **Depends on** 01 · **Commit** `build: add shared tsconfig, biome, and vitest presets`

## Read first

- `docs/CODE_STANDARDS.md` — § TypeScript (all of it), § Imports, § Testing style
- `docs/TECH_STACK.md` — § Tooling
- `docs/TESTING.md` — § Coverage contract

## Goal

`packages/config` becomes the single source of tooling configuration. Every other package extends
from it. Changing a compiler flag or a lint rule is then a one-file change instead of fifteen.

## Deliverables

```
packages/config/
├── package.json
├── tsconfig/
│   ├── base.json          strict flags per CODE_STANDARDS
│   ├── library.json        extends base; for pure TS packages
│   ├── react.json          extends base; jsx: react-jsx, DOM libs
│   └── next.json           extends base; Next plugin, allowJs
├── biome.json              lint + format + import ordering
├── vitest/
│   ├── node.ts             defineConfig for pure logic packages
│   ├── react.ts            jsdom + setup file + testing-library
│   └── setup-react.ts      jest-dom, jest-axe, cleanup, matchMedia stub
└── tailwind/
    └── preset.css          @import tailwindcss + placeholder @theme
```

Then update every package's `tsconfig.json` to extend the right preset, and add a `vitest.config.ts`
per package importing the right base.

## Constraints

### tsconfig/base.json

Exactly the flags in `docs/CODE_STANDARDS.md` § Compiler configuration. `noUncheckedIndexedAccess`
and `exactOptionalPropertyTypes` are included and **stay** included — they will produce errors in
later prompts and those errors are correct.

### biome.json

Rules that must be errors, not warnings:

```jsonc
{
  "linter": {
    "rules": {
      "suspicious": { "noExplicitAny": "error", "noConsole": { "level": "error", "options": { "allow": ["warn", "error"] } } },
      "style": {
        "noDefaultExport": "error",
        "useImportType": "error",
        "noNonNullAssertion": "error",
        "useConst": "error"
      },
      "correctness": { "noUnusedImports": "error", "noUnusedVariables": "error" },
      "a11y": { "recommended": true },
      "nursery": { "useSortedClasses": { "level": "warn", "options": { "functions": ["cn", "cva"] } } }
    }
  }
}
```

Overrides: `noDefaultExport` off for `apps/web/app/**` (Next requires default exports for pages
and layouts) and for `*.stories.tsx`.

Plus a custom restriction: no import matching `@motion-studio/*/src/*` (deep imports). If Biome
cannot express it, add it to `scripts/check-deps.mjs` in prompt 05 and note that here.

Formatter: 2 spaces, single quotes, no semicolons, trailing commas, 100-char line width, LF.

### vitest presets

- `node.ts` — `environment: 'node'`, `globals: false`, coverage provider `v8`, `include:
  ['src/**/*.test.ts']`
- `react.ts` — `environment: 'jsdom'`, `setupFiles`, `include: ['src/**/*.test.{ts,tsx}']`
- `setup-react.ts` — `@testing-library/jest-dom`, `expect.extend(toHaveNoViolations)`, `afterEach`
  cleanup, and stubs for `matchMedia`, `ResizeObserver`, and `IntersectionObserver` (jsdom has
  none of the three and every component test will need them)

Coverage thresholds are set **per package** in each package's own `vitest.config.ts`, using the
numbers in `docs/TESTING.md` § Coverage contract. Do not set a global threshold.

## Verify

```bash
pnpm biome check .        # clean
pnpm typecheck            # clean
pnpm test                 # no tests yet, exits 0 with --passWithNoTests
```

Then deliberately break things to prove the config works, and revert:
- Add `const x: any = 1` → `pnpm lint` errors
- Add `export default function f() {}` in a package → errors
- Add `import { x } from '@motion-studio/utils/src/x'` → errors
- Add an unused import → errors

Report which of the four were caught. If any was not, fix the config.

## Done when

- [ ] `packages/config` exports all four tsconfig presets, biome config, three vitest presets
- [ ] Every package extends the correct preset
- [ ] Every package has a `vitest.config.ts` with its own coverage thresholds
- [ ] All four deliberate violations are caught by `pnpm lint`
- [ ] `pnpm lint && pnpm typecheck` clean
- [ ] jsdom setup stubs `matchMedia`, `ResizeObserver`, `IntersectionObserver`
