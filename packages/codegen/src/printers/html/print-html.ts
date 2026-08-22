import type { CodegenIR } from '../../ir/ir.types'
import { type IRWarning, warning } from '../../warnings'
import type { ExportResult, PrintInput } from '../printer.types'

import { REVEAL_CLASS, approximateMotion, approximationRules } from './approximate-motion'
import { printCss, utilitySheet } from './print-css'
import { type MarkupContext, printMarkup } from './print-markup'
import { type ScriptFeature, printScripts } from './print-scripts'

/**
 * The HTML target — one self-contained `index.html` that opens from the filesystem. No framework, no
 * build step, no CDN link, and therefore no `dependencies`: the empty record is the statement, not an
 * omission.
 *
 * The entry component is the whole document because `resolveOptions` resolved `singleFile` for this
 * target (ADR-237), so there is no component reference left to inline and this file only assembles.
 */
export const HTML_FILE = 'index.html'

/** Prompt 44's budget for a typical landing page. Past it, something belongs in CSS. */
export const SCRIPT_BUDGET = 3 * 1024

const MISSING_THEME =
  'The export carries no theme stylesheet, so the document has no variables to resolve and paints with browser defaults.'

const MISSING_MODE_KEY =
  'The export carries no colour-mode storage key, so the toggle flips the mode but the choice does not survive a reload.'

const REMOTE_ASSETS =
  "Images keep their original URLs, so the document is self-contained except for them; export with assets 'inline' to remove the last network request."

const BUNDLED_ASSETS =
  "assets 'bundle' rewrote the image paths to a public/ directory this target does not emit, so the document references files it does not ship."

/**
 * With no JavaScript the observer never runs, and `.ms-reveal` starts at zero opacity — so the page
 * would be blank. The reduced-motion block in the stylesheet is the other half of the same guarantee.
 */
const NOSCRIPT = `<noscript>
      <style>
        .${REVEAL_CLASS} {
          opacity: 1;
          transform: none;
          filter: none;
          clip-path: none;
        }
      </style>
    </noscript>`

/** A CSS-engine preset's class already has its rule; it is not a utility and not an unknown one. */
function coveredClasses(ir: CodegenIR): ReadonlySet<string> {
  const covered = new Set([
    REVEAL_CLASS,
    'ms-reveal-blur',
    'ms-reveal-clip',
    'ms-spring',
    'ms-magnetic',
    'ms-pointer',
    'ms-sticky',
  ])

  for (const rule of ir.stylesheet.rules) {
    for (const selector of rule.selector.split(',')) {
      const trimmed = selector.trim()

      if (/^\.[a-zA-Z0-9_-]+$/.test(trimmed)) {
        covered.add(trimmed.slice(1))
      }
    }
  }

  return covered
}

/** Where Prettier puts the body of a `<style>` or `<script>` at this document's depth. Measured. */
const EMBEDDED = '      '

const indent = (source: string, pad: string): string =>
  source
    .split('\n')
    .map((line) => (line === '' ? line : `${pad}${line}`))
    .join('\n')

const escapeTitle = (value: string): string =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

export function printHtml(input: PrintInput): ExportResult {
  const { ir, options, theme } = input
  const entry = ir.components.find((component) => component.name === ir.entry)

  if (entry === undefined) {
    return { files: [], warnings: [...ir.warnings], dependencies: {} }
  }

  const approximation = approximateMotion(ir)
  const context: MarkupContext = {
    extraClasses: approximation.classNames,
    warnings: [],
    usedClasses: new Set<string>(),
    features: new Set<ScriptFeature>(approximation.features),
  }
  const markup = printMarkup(entry.root, context, 2)
  const utilities = utilitySheet(context.usedClasses, coveredClasses(ir))
  const css = printCss({
    ...(options.includeTheme && theme !== undefined ? { themeCss: theme.css } : {}),
    assets: options.assets,
    utilities: utilities.rules,
    approximations: approximationRules(context.usedClasses),
    stylesheet: ir.stylesheet,
  })
  const script = printScripts({
    features: context.features,
    ...(theme?.colorModeStorageKey === undefined
      ? {}
      : { colorModeStorageKey: theme.colorModeStorageKey }),
  })

  return {
    files: [
      {
        path: HTML_FILE,
        contents: document({ ir, css, markup, script, ...(theme === undefined ? {} : { theme }) }),
      },
    ],
    warnings: [
      // A `dependency` warning names a package the emitted `package.json` will install. This target
      // emits no `package.json` and installs nothing, so repeating it here would be false.
      ...ir.warnings.filter((entry) => entry.code !== 'dependency'),
      ...approximation.warnings,
      ...context.warnings,
      ...utilities.warnings,
      ...reportOf({ ir, options, theme, script, features: context.features }),
    ],
    dependencies: {},
  }
}

interface DocumentInput {
  readonly ir: CodegenIR
  readonly css: string
  readonly markup: string
  readonly script: string | undefined
  readonly theme?: PrintInput['theme']
}

function document(input: DocumentInput): string {
  const { ir, css, markup, script, theme } = input
  const mode = ir.theme.colorMode
  const meta = [
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    `<title>${escapeTitle(ir.documentName)}</title>`,
    ...(theme === undefined ? [] : [`<script>${theme.colorModeScript}</script>`]),
  ]

  // Both embedded bodies arrive at their final indentation. Measured: Prettier re-indents the rules and
  // statements it parses, but leaves the interior lines of a block comment exactly where it found them
  // — so a flush-left stylesheet formats to a document whose comments sit at column 0.
  return `<!doctype html>
<html lang="en"${mode === 'system' ? '' : ` data-color-mode="${mode}"`}>
  <head>
${indent(meta.join('\n'), '    ')}
    <style>
${indent(css, EMBEDDED)}
    </style>
    ${NOSCRIPT}
  </head>
  <body>
${markup}
${script === undefined ? '' : `    <script>\n${indent(script, EMBEDDED)}\n    </script>\n`}  </body>
</html>
`
}

interface ReportInput {
  readonly ir: CodegenIR
  readonly options: PrintInput['options']
  readonly theme: PrintInput['theme']
  readonly script: string | undefined
  readonly features: ReadonlySet<ScriptFeature>
}

/** What the export report says about the document as a whole, as opposed to about one element. */
function reportOf(input: ReportInput): readonly IRWarning[] {
  const { options, theme, script, features } = input
  const bytes = script === undefined ? 0 : Buffer.byteLength(script, 'utf8')

  return [
    ...(options.includeTheme && theme === undefined ? [warning('unsupported', MISSING_THEME)] : []),
    ...(features.has('color-mode') && theme?.colorModeStorageKey === undefined
      ? [warning('unsupported', MISSING_MODE_KEY)]
      : []),
    ...(options.assets === 'reference' && input.ir.assets.length > 0
      ? [warning('perf', REMOTE_ASSETS)]
      : []),
    ...(options.assets === 'bundle' ? [warning('unsupported', BUNDLED_ASSETS)] : []),
    ...(bytes > SCRIPT_BUDGET
      ? [
          warning(
            'perf',
            `The document's script is ${bytes} bytes, over the ${SCRIPT_BUDGET}-byte target for a landing page.`,
          ),
        ]
      : []),
  ]
}
