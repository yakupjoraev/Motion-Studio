# @motion-studio/config

Shared tooling configuration: TypeScript presets, the Biome ruleset, the Vitest bases, and the
Tailwind preset. Every other package extends from here, so a compiler flag or a lint rule is a
one-file change instead of fifteen.

Development-only. Nothing here is imported at runtime.

## Which preset a package takes

| Preset | Packages | Why |
| --- | --- | --- |
| `tsconfig/library.json` + `vitest/node` | `utils`, `tokens`, `schema`, `editor`, `codegen` | Ship no React, so no test file can ever be `.tsx` |
| `tsconfig/react.json` + `vitest/react` | `icons`, `theme`, `motion`, `hooks`, `ui`, `blocks`, `canvas`, `dnd` | Render React or touch the DOM |
| `tsconfig/next.json` | `apps/web` | Next transforms JSX itself |

The node preset only collects `src/**/*.test.ts`, so a `.test.tsx` in a package on that preset is
silently never run. That failure mode — not the ratio of pure to component tests — is what puts a
package on one side of the line. See ADR-006.

## Notes on the Biome config

`biome.json` carries no comments: Biome parses its own config as strict JSON and a comment is a
parse error. The two choices in it that are not self-evident:

- **Every glob is written to match from a package directory as well as from the repository root.**
  `lint` is a per-package script (`DEVOPS.md` § Turborepo declares the task), and Biome matches
  override globs against paths relative to the working directory — `apps/web/app/**` matches
  nothing when Biome runs inside `apps/web`. See ADR-007.
- **`noDefaultExport` is off for four shapes**, each because a tool reads the default export as its
  contract: Next pages, layouts, routes, and error boundaries under `app/`; Storybook CSF meta in
  `*.stories.tsx`; and the Vitest, Next, PostCSS, and Playwright config files.

`overrides` also turns on the JSONC parser for `tsconfig/*.json`, because Biome infers JSONC only
for a file literally named `tsconfig.json` and the presets carry comments.
