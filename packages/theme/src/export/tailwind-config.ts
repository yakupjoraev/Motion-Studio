import { overrideNotes, warningNotes } from './theme-export'

import type { ThemeExport } from './theme-export'

/**
 * A `tailwind.config.ts` for a project on Tailwind 3, where `@theme` does not exist — the v4 setup
 * this repository uses needs no config file at all.
 *
 * The extension points at the variables rather than at values, which is the same indirection
 * `packages/tokens` § to-tailwind makes: one stylesheet carries the theme, and switching modes stays a
 * variable write. Emitting resolved colours here instead would produce a config that cannot change
 * mode at all.
 */

interface Section {
  /** The `theme.extend` key. */
  readonly key: string
  readonly prefix: string
  /** Keeps `--ms-text-lg-line-height` out of `fontSize`, where only the size belongs. */
  readonly reject?: readonly string[]
}

const SECTIONS: readonly Section[] = [
  { key: 'colors', prefix: '--ms-color-' },
  { key: 'borderRadius', prefix: '--ms-radius-' },
  { key: 'spacing', prefix: '--ms-space-' },
  { key: 'fontSize', prefix: '--ms-text-', reject: ['-line-height', '-tracking'] },
  { key: 'boxShadow', prefix: '--ms-shadow-' },
  { key: 'blur', prefix: '--ms-blur-' },
  { key: 'transitionDuration', prefix: '--ms-duration-' },
  { key: 'transitionTimingFunction', prefix: '--ms-ease-' },
]

/** `--ms-font-sans` and its two siblings are a family list, not a scale, so they are named directly. */
const FONT_FAMILY: readonly (readonly [string, string])[] = [
  ['sans', '--ms-font-sans'],
  ['display', '--ms-font-display'],
  ['mono', '--ms-font-mono'],
]

const entriesFor = (
  variables: Readonly<Record<string, string>>,
  section: Section,
): readonly (readonly [string, string])[] =>
  Object.keys(variables)
    .filter(
      (name) =>
        name.startsWith(section.prefix) &&
        !(section.reject ?? []).some((suffix) => name.endsWith(suffix)),
    )
    .map((name) => [name.slice(section.prefix.length), name] as const)

const renderEntries = (entries: readonly (readonly [string, string])[]): string =>
  entries.map(([token, variable]) => `        '${token}': 'var(${variable})',`).join('\n')

const renderSection = (key: string, entries: readonly (readonly [string, string])[]): string =>
  `      ${key}: {\n${renderEntries(entries)}\n      },`

const header = (theme: ThemeExport): string =>
  [`// Theme: ${theme.config.name}`, ...overrideNotes(theme), ...warningNotes(theme)]
    .map((line) => (line.startsWith('//') ? line : `// ${line}`))
    .join('\n')

export function toTailwindConfig(theme: ThemeExport): string {
  const sections = SECTIONS.map((section) =>
    renderSection(section.key, entriesFor(theme.light.variables, section)),
  )

  return [
    header(theme),
    "import type { Config } from 'tailwindcss'",
    '',
    '// The variables come from the exported theme.css; this file only names them as utilities.',
    'export default {',
    "  content: ['./src/**/*.{ts,tsx}'],",
    '  theme: {',
    '    extend: {',
    ...sections,
    renderSection('fontFamily', FONT_FAMILY),
    '    },',
    '  },',
    '} satisfies Config',
    '',
  ].join('\n')
}
