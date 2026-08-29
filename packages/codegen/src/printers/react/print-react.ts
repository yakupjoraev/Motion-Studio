import type { ImportSpec } from '@motion-studio/schema'

import type { CodegenIR, IRComponent, IRElement } from '../../ir/ir.types'
import { warning } from '../../warnings'
import { isEmpty, printStylesheet } from '../print-stylesheet'
import {
  type ExportFile,
  type ExportResult,
  type PrintInput,
  moduleExtension,
  withoutExtension,
} from '../printer.types'
import { themeStylesheet } from '../theme-css'

import { printComponent } from './print-component'
import { printModule } from './print-hoisted'

/**
 * The React target — EXPORT_ENGINE.md § Printers, React: "One file, or one file per component with a
 * barrel." Flat, because the user is pasting these into a project whose directory layout is theirs and
 * a `components/` prefix we invented would be one more thing to undo.
 */
const BARREL = 'index'

const THEME_FILE = 'theme.css'

const STYLES_FILE = 'styles.css'

const MISSING_THEME =
  'The export carries no theme stylesheet, so the output styles with Tailwind classes only.'

/** Every component tag in the tree, so a file imports exactly the components it renders. */
export function referencedNames(element: IRElement, known: ReadonlySet<string>): readonly string[] {
  const here = known.has(element.tag) ? [element.tag] : []
  const below = element.children.flatMap((child) =>
    child.kind === 'element' ? referencedNames(child, known) : [],
  )

  return [...new Set([...here, ...below])]
}

export function referencesOf(
  component: IRComponent,
  byName: ReadonlyMap<string, IRComponent>,
  specifier: (target: IRComponent) => string,
): readonly ImportSpec[] {
  const names = referencedNames(component.root, new Set(byName.keys()))

  return names.flatMap((name) => {
    const target = name === component.name ? undefined : byName.get(name)

    return target === undefined ? [] : [{ from: specifier(target), named: [target.name] }]
  })
}

export function printReact(input: PrintInput): ExportResult {
  const { ir, options, theme } = input
  const byName = new Map(ir.components.map((component) => [component.name, component]))
  const specifier = (target: IRComponent): string => `./${withoutExtension(target.fileName)}`
  const files: ExportFile[] = ir.components.map((component) => ({
    path: component.fileName,
    contents: printComponent({
      component,
      options,
      references: referencesOf(component, byName, specifier),
      exportKind: 'named',
    }),
  }))

  if (!options.singleFile && ir.components.length > 1) {
    files.push({ path: `${BARREL}${moduleExtension(options)}`, contents: barrel(ir) })
  }

  for (const module of ir.modules) {
    files.push({ path: module.path, contents: printModule(module) })
  }

  if (!isEmpty(ir.stylesheet)) {
    files.push({ path: STYLES_FILE, contents: `${printStylesheet(ir.stylesheet)}\n` })
  }

  const missingTheme = options.includeTheme && theme === undefined

  if (options.includeTheme && theme !== undefined) {
    // ADR-262: the namespaces and the base layer travel with the variables, or the theme is a file
    // the user's project never applies.
    files.push({ path: THEME_FILE, contents: `${themeStylesheet(theme.css)}\n` })
  }

  return {
    files,
    warnings: [...ir.warnings, ...(missingTheme ? [warning('unsupported', MISSING_THEME)] : [])],
    dependencies: ir.dependencies,
  }
}

/**
 * The barrel, entry component first. A user who wants one import gets the page; a user who wants one
 * section gets the section, and neither has to read the file list to find out which name is which.
 */
function barrel(ir: CodegenIR): string {
  const ordered = [
    ...ir.components.filter((component) => component.name === ir.entry),
    ...ir.components.filter((component) => component.name !== ir.entry),
  ]

  return `${ordered
    .map(
      (component) =>
        `export { ${component.name} } from './${withoutExtension(component.fileName)}'`,
    )
    .join('\n')}\n`
}
