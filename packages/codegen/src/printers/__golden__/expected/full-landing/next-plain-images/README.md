# Fixture

A Next.js app exported from Motion Studio: Tailwind CSS v4 and the Fixture theme
resolved into CSS variables. Nothing of the editor is left in it — this is an ordinary Next
project, and every file below is one you would have written.

## Run

```bash
npm install
npm run dev
```

## Structure

| Path | What it is |
| --- | --- |
| `app/layout.tsx` | Fonts, metadata, and the script that sets the colour mode before first paint |
| `app/page.tsx` | The composition. One line per section |
| `app/globals.css` | Tailwind, the theme variables, and the rules this document generated |
| `components/` | One file per section |
| `lib/` | Shared constants and the runtime helpers a block needs |

The path alias `@/*` is declared in `tsconfig.json`.
