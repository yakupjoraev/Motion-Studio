import type { CodegenIR } from '../../ir/ir.types'
import { isEmpty, printStylesheet } from '../print-stylesheet'
import type { PrintedTheme } from '../printer.types'
import { themeStylesheet } from '../theme-css'

import { type FontPlan, fontPlan } from './fonts'

/**
 * `app/globals.css` — EXPORT_ENGINE.md § Next.js: "tailwind + theme variables". Four sections in a
 * fixed order, because CSS is order-dependent and a reader should be able to say why each one is where
 * it is: the framework, then the theme's variables, then the font wiring, then what the document's own
 * props generated.
 *
 * Tailwind v4 takes its configuration from CSS rather than a JS file, which is why there is an
 * `@import` here and no `tailwind.config.ts` unless the user asks for the config form.
 */
export const TAILWIND_IMPORT = "@import 'tailwindcss';"

/**
 * The pairing spends one family on body and display text, so the display variable follows the sans one
 * — but only inside `<body>`, where `next/font`'s class defines it. At `:root` the theme's own stack is
 * still the right answer, because that is what `<html>` and anything outside the body resolve against.
 */
function fontAliases(plan: FontPlan): string | undefined {
  const entries = Object.entries(plan.aliases)

  if (entries.length === 0 || plan.imports.length === 0) {
    return undefined
  }

  const declarations = entries.map(([name, source]) => `  ${name}: var(${source});`)

  return `body {\n${declarations.join('\n')}\n}`
}

export interface GlobalsInput {
  readonly ir: CodegenIR
  readonly theme?: PrintedTheme | undefined
}

export function printGlobalsCss(input: GlobalsInput): string {
  const { ir, theme } = input
  const aliases = fontAliases(fontPlan(ir.theme.fontPairing))

  return [
    TAILWIND_IMPORT,
    // ADR-262: the namespaces, the variables and the base layer that paints them.
    ...(theme === undefined ? [] : [themeStylesheet(theme.css)]),
    ...(aliases === undefined ? [] : [aliases]),
    ...(isEmpty(ir.stylesheet) ? [] : [printStylesheet(ir.stylesheet)]),
  ]
    .join('\n\n')
    .concat('\n')
}
