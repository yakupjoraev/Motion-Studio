# 43 — Printers: React and Next.js

**Milestone** M9 · **Depends on** 42 · **Commit** `feat(codegen): add react and next printers`

## Read first

- `docs/EXPORT_ENGINE.md` — § Printers (React, Next.js), § Formatting
- The React output example in that document, **line by line** — every detail in it is a rule
- `docs/CODE_STANDARDS.md` — the generated code follows our own standards

## Goal

Generated React and Next.js that compiles with zero edits and would survive code review. This is the
prompt that determines whether the whole project reads as credible.

## Deliverables

```
packages/codegen/src/printers/
├── react/
│   ├── print-react.ts          IR → files
│   ├── print-component.ts      IRComponent → a .tsx string
│   ├── print-element.ts        IRElement → JSX
│   ├── print-props.ts          the props interface + destructuring with defaults
│   ├── print-imports.ts
│   ├── print-hoisted.ts        module constants
│   └── *.test.ts
├── next/
│   ├── print-next.ts           the full project structure
│   ├── print-layout.ts         fonts, metadata, theme class
│   ├── print-page.ts           the deliberately boring composition
│   ├── print-globals-css.ts    tailwind + theme variables
│   ├── print-package-json.ts
│   ├── print-tsconfig.ts
│   ├── print-readme.ts
│   └── *.test.ts
├── format/
│   ├── format.ts               Prettier standalone, dynamically imported
│   └── format.test.ts
└── __golden__/                  documents + expected output
```

## Constraints

### Every rule from the doc's example table

| Rule | Check |
| --- | --- |
| `'use client'` only when hooks or interactivity require it | A static section stays a Server Component |
| Props extracted with defaults | `extractProps: true` produces an interface + destructuring |
| Named export, no default | Except Next's `page.tsx`/`layout.tsx`, which must be default |
| Variants and transitions hoisted | No inline object literals in JSX |
| `useReducedMotion` honoured | Present whenever motion is present |
| `aria-hidden` on decorative layers | Aurora, noise, glow layers |
| `isolate` + negative z-index on background layers | No stacking surprises when dropped into a page |
| `text-balance` on headings | Typographic quality by default |
| No editor artifacts | Zero `data-node-id`, zero wrappers, zero dead classes |

Each of these is a test on the golden output, not just a hope.

### JSX printing

- 2-space indent, single quotes in TS, double in JSX attributes
- Self-closing when childless
- Multi-line attributes when the line exceeds 100 chars, one per line
- Children on their own lines unless there is exactly one short text child
- `{' '}` handling for meaningful whitespace between inline elements — an easy thing to get wrong that
  produces visibly different output
- Expression children printed as `{expr}` with the expression already validated by the IR

### `'use client'` determination

From each block's codegen descriptor plus actual usage: a block declaring conditional client-ness only
gets the directive when the condition holds. Test both branches for `button` (with and without an
`onClick`-bearing prop).

The directive goes on the **component's file**, and a Next page composing client components does not
itself need it. Getting this wrong means a fully client-rendered page, which defeats the point of the
Next export. Test it.

### Next project structure

Exactly the tree from the doc. `page.tsx` must be boring:

```tsx
import { HeroSection } from '@/components/hero-section'
import { FeatureGrid } from '@/components/feature-grid'

export default function Page() {
  return (
    <main>
      <HeroSection />
      <FeatureGrid />
    </main>
  )
}
```

Plus:
- `layout.tsx` with `next/font` setup for the theme's pairing, `metadata`, and the colour-mode script
- `globals.css` with the Tailwind import and the resolved theme variables
- `package.json` with the real accumulated dependencies and working scripts
- `tsconfig.json` with the `@/*` path alias that the imports use
- `README.md` saying what this is and how to run it

### Formatting

`prettier/standalone` plus the estree, typescript, and postcss plugins, **dynamically imported**. On
load failure, ship unformatted with a warning — working unformatted code beats a failed export.

Config for the output: 2 spaces, single quotes, no semicolons, 100 print width, trailing commas.
Matching our own style, because the user is likely to paste it into a codebase like ours.

### Golden files

Every `(document × target × option-set)` from the doc's list. Generate them, then **read every single
one** and ask: would I approve this in review? Fix what you would not approve. That reading is the
actual deliverable of this prompt.

## Verify

```bash
pnpm test:codegen
pnpm --filter @motion-studio/codegen test --coverage
```

Then the compilation test, which is what makes the "zero edits" claim real:

```bash
pnpm test:compile
```

`test:compile` writes each golden React/Next output into a fixture project with the declared
dependencies installed and runs `tsc --noEmit`. **Every golden output must type-check.**

Then the end-to-end proof, done manually once here and automated in prompt 46:

```bash
pnpm generate:export-fixture --document full-landing --target next --out /tmp/exported
cd /tmp/exported && npm install && npm run build && npm run dev
```

Open it. Report: did it build with zero edits? Does it look identical to the canvas? Do the animations
run? Does reduced motion work? Does the theme toggle work?

## Done when

- [ ] Every rule from the doc's example table implemented and tested on golden output
- [ ] `'use client'` correct in both branches; a Next page composing client components is not itself a
      client component
- [ ] JSX formatting correct including `{' '}` whitespace handling
- [ ] Next project structure complete and `page.tsx` boring
- [ ] Prettier dynamically imported with a graceful failure path
- [ ] Golden files for every document × target × option-set
- [ ] **Every golden output passes `tsc --noEmit`**
- [ ] The full-landing Next export builds and runs in a fresh project with zero edits — verified
      manually and reported
- [ ] Every golden file read and judged as review-quality; fixes applied
