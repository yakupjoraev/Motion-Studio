import type { CodegenIR } from '../../ir/ir.types'
import type { ExportOptions } from '../../options.types'

import { fontPlan } from './fonts'
import { tsconfigFileName } from './print-tsconfig'

/**
 * `README.md` — EXPORT_ENGINE.md § Next.js: "what this is, how to run it". Short on purpose. A reader
 * who opens this project wants two commands and a map of the directories, and anything past that is
 * documentation for a project they have not written yet.
 *
 * The one thing it must not omit is a family the export could not fetch: a page that silently renders
 * in the fallback stack is a page whose author never finds out why it looks wrong.
 */
export function printReadme(ir: CodegenIR, options: ExportOptions): string {
  const plan = fontPlan(ir.theme.fontPairing)
  const sections = ir.components.filter((component) => component.name !== ir.entry)
  const rows = [
    '| Path | What it is |',
    '| --- | --- |',
    '| `app/layout.tsx` | Fonts, metadata, and the script that sets the colour mode before first paint |',
    sections.length === 0
      ? '| `app/page.tsx` | The whole document, in one component |'
      : '| `app/page.tsx` | The composition. One line per section |',
    '| `app/globals.css` | Tailwind, the theme variables, and the rules this document generated |',
    ...(sections.length === 0 ? [] : ['| `components/` | One file per section |']),
    ...(ir.modules.length === 0
      ? []
      : ['| `lib/` | Shared constants and the runtime helpers a block needs |']),
  ]

  return [
    `# ${ir.documentName}`,
    '',
    `A Next.js app exported from Motion Studio: Tailwind CSS v4 and the ${ir.theme.name} theme`,
    'resolved into CSS variables. Nothing of the editor is left in it — this is an ordinary Next',
    'project, and every file below is one you would have written.',
    '',
    '## Run',
    '',
    '```bash',
    'npm install',
    'npm run dev',
    '```',
    '',
    '## Structure',
    '',
    rows.join('\n'),
    '',
    ...(plan.unavailable.length === 0
      ? []
      : [
          '## Fonts',
          '',
          `${plan.unavailable.join(' and ')} ${plan.unavailable.length === 1 ? 'is' : 'are'} licensed and cannot be fetched at build time.`,
          'The CSS variables name the family and fall back to the system stack; drop the files in and',
          '`next/font/local` picks them up.',
          '',
        ]),
    `The path alias \`@/*\` is declared in \`${tsconfigFileName(options)}\`.`,
    '',
  ].join('\n')
}
