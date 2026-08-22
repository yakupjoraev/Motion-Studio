import type { CodegenIR } from '../../ir/ir.types'
import type { ExportOptions } from '../../options.types'
import type { PrintedTheme } from '../printer.types'

import { type FontPlan, fontPlan } from './fonts'

/**
 * `app/layout.tsx` — EXPORT_ENGINE.md § Next.js: "fonts, metadata, theme class". Three jobs, and the
 * third one is the one that is easy to get wrong: the colour mode has to be on `<html>` before first
 * paint, or every reload flashes the other theme (THEME_ENGINE.md § Colour mode, ADR-026).
 */
export interface LayoutInput {
  readonly ir: CodegenIR
  readonly options: ExportOptions
  readonly theme?: PrintedTheme | undefined
}

const fontConstants = (plan: FontPlan): readonly string[] =>
  plan.imports.map((entry) =>
    [
      `const ${entry.local} = ${entry.family}({`,
      "  subsets: ['latin'],",
      `  variable: '${entry.variable}',`,
      "  display: 'swap',",
      '})',
    ].join('\n'),
  )

/**
 * `system` sets no attribute at all, which is what makes the generated stylesheet's
 * `prefers-color-scheme` block decide for a visitor who has never chosen — ADR-026.
 */
const colorModeAttribute = (mode: CodegenIR['theme']['colorMode']): string =>
  mode === 'system' ? '' : ` data-color-mode="${mode}"`

const bodyClass = (plan: FontPlan): string => {
  const variables = plan.imports.map((entry) => `\${${entry.local}.variable}`).join(' ')

  return variables === '' ? '"antialiased"' : `{\`${variables} antialiased\`}`
}

export function printLayout(input: LayoutInput): string {
  const { ir, options, theme } = input
  const plan = fontPlan(ir.theme.fontPairing)
  const typed = options.language === 'ts'
  const script = theme?.colorModeScript
  const imports = [
    ...(typed ? ["import type { Metadata } from 'next'"] : []),
    ...(plan.imports.length === 0
      ? []
      : [
          `import { ${plan.imports.map((entry) => entry.family).join(', ')} } from 'next/font/google'`,
        ]),
    '',
    "import './globals.css'",
  ]
  const metadata = [
    `export const metadata${typed ? ': Metadata' : ''} = {`,
    `  title: '${ir.documentName.replace(/'/g, "\\'")}',`,
    `  description: '${ir.documentName.replace(/'/g, "\\'")}, built with Motion Studio.',`,
    '}',
  ]
  const children = typed ? '{ children }: { children: React.ReactNode }' : '{ children }'

  return [
    imports.join('\n'),
    '',
    ...(plan.imports.length === 0 ? [] : [fontConstants(plan).join('\n\n'), '']),
    ...(script === undefined ? [] : [`const colorMode = ${JSON.stringify(script)}`, '']),
    metadata.join('\n'),
    '',
    `export default function RootLayout(${children}) {`,
    '  return (',
    `    <html lang="en"${colorModeAttribute(ir.theme.colorMode)}${
      script === undefined ? '' : ' suppressHydrationWarning'
    }>`,
    ...(script === undefined
      ? []
      : [
          '      <head>',
          '        <script dangerouslySetInnerHTML={{ __html: colorMode }} />',
          '      </head>',
        ]),
    `      <body className=${bodyClass(plan)}>{children}</body>`,
    '    </html>',
    '  )',
    '}',
  ]
    .join('\n')
    .concat('\n')
}
