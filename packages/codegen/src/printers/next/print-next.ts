import { warning } from '../../warnings'
import type { ExportFile, ExportResult, PrintInput } from '../printer.types'
import { printComponent } from '../react/print-component'
import { printModule } from '../react/print-hoisted'
import { referencesOf } from '../react/print-react'

import { fontPlan } from './fonts'
import { printGlobalsCss } from './print-globals-css'
import { printLayout } from './print-layout'
import { POSTCSS_CONFIG, RUNTIME_VERSIONS, printPackageJson } from './print-package-json'
import { COMPONENTS_DIR, componentSpecifier, printPage } from './print-page'
import { printReadme } from './print-readme'
import { printTsconfig, tsconfigFileName } from './print-tsconfig'

/**
 * The Next target — EXPORT_ENGINE.md § Next.js, the tree in that section plus the PostCSS config
 * Tailwind v4 needs to run at all.
 *
 * The entry component becomes `app/page.tsx` and every other component becomes a file under
 * `components/`, which is what makes the page composition readable: five lines, five sections, and the
 * markup for each one is one click away rather than nine hundred lines down.
 */
const MISSING_THEME =
  'The export carries no theme stylesheet, so `app/globals.css` sets up Tailwind and nothing else.'

const unavailableFonts = (families: readonly string[]): string =>
  `${families.join(' and ')} cannot be fetched at build time and ${
    families.length === 1 ? 'is' : 'are'
  } not self-hosted by this export; the stack falls back until you add the files.`

export function printNext(input: PrintInput): ExportResult {
  const { ir, options, theme } = input
  const byName = new Map(ir.components.map((component) => [component.name, component]))
  const page = printPage(ir, options)
  const plan = fontPlan(ir.theme.fontPairing)
  const extension = options.language === 'ts' ? 'tsx' : 'jsx'
  const files: ExportFile[] = [
    { path: `app/layout.${extension}`, contents: printLayout({ ir, options, theme }) },
    { path: `app/page.${extension}`, contents: page },
    { path: 'app/globals.css', contents: printGlobalsCss({ ir, theme }) },
  ]

  for (const component of ir.components) {
    if (component.name === ir.entry) {
      continue
    }

    files.push({
      path: `${COMPONENTS_DIR}/${component.fileName}`,
      contents: printComponent({
        component,
        options,
        references: referencesOf(component, byName, componentSpecifier),
        exportKind: 'named',
      }),
    })
  }

  for (const module of ir.modules) {
    files.push({ path: module.path, contents: printModule(module) })
  }

  files.push(
    { path: 'package.json', contents: printPackageJson(ir, options) },
    { path: 'postcss.config.mjs', contents: POSTCSS_CONFIG },
    { path: tsconfigFileName(options), contents: printTsconfig(options) },
    { path: 'README.md', contents: printReadme(ir, options) },
  )

  const missingTheme = options.includeTheme && theme === undefined

  return {
    files,
    warnings: [
      ...ir.warnings,
      ...(missingTheme ? [warning('unsupported', MISSING_THEME)] : []),
      ...(plan.unavailable.length === 0
        ? []
        : [warning('unsupported', unavailableFonts(plan.unavailable))]),
    ],
    dependencies: { ...RUNTIME_VERSIONS, ...ir.dependencies },
  }
}
