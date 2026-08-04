# 10 — Storybook

**Milestone** M1 · **Depends on** 09 · **Commit** `build(storybook): configure workshop with a11y and theme addons`

## Read first

- `docs/TECH_STACK.md` — § Tooling
- `docs/DEVOPS.md` — § Deploy
- `docs/THEME_ENGINE.md` — § Scoped themes

## Goal

Storybook 8 as a real workshop: theme switching, colour-mode switching, reduced-motion toggling,
a11y checks, and interaction tests. It is where every `ui` component and later every block is
developed and reviewed.

## Deliverables

```
apps/storybook/
├── package.json
├── .storybook/
│   ├── main.ts             Vite builder, stories glob over packages/ui + packages/blocks
│   ├── preview.tsx         decorators, global types, parameters
│   ├── theme.ts            Storybook's own UI theme, from our tokens
│   └── preview-head.html   font preload, tokens stylesheet
└── src/
    ├── decorators/
    │   ├── with-theme.tsx        applies ThemeScope from the toolbar selection
    │   ├── with-color-mode.tsx   toolbar light/dark
    │   ├── with-reduced-motion.tsx
    │   └── with-surface.tsx      background surface options for glass components
    └── docs/
        ├── introduction.mdx
        ├── tokens.mdx            live token tables generated from packages/tokens
        └── motion.mdx            live easing/spring gallery (after prompt 30)
```

Addons: `@storybook/addon-essentials`, `addon-a11y`, `addon-interactions`,
`addon-themes`, `addon-viewport`.

Root script: `"dev:storybook"`, `"build:storybook"`.

## Constraints

- **Toolbar globals**: `theme` (10 presets), `colorMode` (light/dark), `reducedMotion` (on/off),
  `surface` (flat / photo / gradient — for glass components, which need something behind them).
- **`withTheme` uses `ThemeScope`**, not a root write, so switching themes in one story does not
  leak into the docs chrome.
- **`addon-a11y` configured to fail**, not just report: `parameters.a11y.test = 'error'` so an
  interaction-test run catches violations.
- **Stories are typed**: `Meta<typeof Component>` / `StoryObj<typeof Component>`. No `any` in args.
- **Every story has controls derived from the props type** via `argTypes` — automatic where the
  types allow, explicit where they do not.
- **No story fetches anything.** All data is inline fixtures. A story that needs network is a
  broken story.
- **`tokens.mdx` is generated from `packages/tokens`,** not hand-written. A token added in prompt 04
  appears in the docs without anyone editing MDX. Hand-written token docs go stale within a week.
- Storybook is a dev tool: it must not become a dependency of `apps/web`, and
  `check-deps` should confirm nothing imports it.

## Verify

```bash
pnpm dev:storybook       # localhost:6006
pnpm build:storybook     # static build succeeds
```

Manual walkthrough:
- Switch theme in the toolbar → every visible component updates, docs chrome unaffected
- Switch colour mode → same
- Toggle reduced motion → animated components go static
- Switch surface to photo → glass components look correct
- Open the a11y panel on five components → zero violations
- `tokens.mdx` shows every token group with live swatches

Then add `build:storybook` to CI as a non-blocking job (it catches broken stories, which is worth
knowing even if it should not fail a PR).

## Done when

- [ ] Storybook runs and builds
- [ ] Four toolbar globals working
- [ ] `withTheme` uses `ThemeScope`; no leakage into chrome
- [ ] a11y addon configured to fail on violations
- [ ] Every `ui` component has a story with typed args
- [ ] `tokens.mdx` generated from the tokens package
- [ ] `build:storybook` added to CI
- [ ] Manual walkthrough performed and reported
