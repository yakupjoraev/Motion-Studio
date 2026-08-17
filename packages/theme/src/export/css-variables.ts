import { overrideNotes, warningNotes } from './theme-export'

import type { ThemeExport } from './theme-export'

/**
 * The `:root` blocks for both modes — `THEME_ENGINE.md` § Theme in export, the React and HTML targets'
 * `theme.css`. The dark block is selected the same way the shipped stylesheet selects it, by
 * `data-color-mode`, so a document that already sets the attribute needs nothing else.
 *
 * The `@media (prefers-color-scheme: dark)` twin is emitted for a root that carries no attribute at
 * all: an exported page that never runs the mode script still follows the visitor's system.
 */

const declarations = (variables: Readonly<Record<string, string>>, indent: string): string =>
  Object.entries(variables)
    .map(([name, value]) => `${indent}${name}: ${value};`)
    .join('\n')

const header = (theme: ThemeExport): string => {
  const notes = [...overrideNotes(theme), ...warningNotes(theme)]
  const lines = [`Theme: ${theme.config.name}`, ...notes]

  return `/*\n${lines.map((line) => ` * ${line}`).join('\n')}\n */`
}

export function toCssVariables(theme: ThemeExport): string {
  const light = declarations(theme.light.variables, '  ')
  const dark = declarations(theme.dark.variables, '  ')

  return [
    header(theme),
    `:root {\n${light}\n}`,
    `:root[data-color-mode='dark'] {\n${dark}\n}`,
    `@media (prefers-color-scheme: dark) {\n  :root:not([data-color-mode]) {\n${declarations(
      theme.dark.variables,
      '    ',
    )}\n  }\n}`,
  ].join('\n\n')
}
