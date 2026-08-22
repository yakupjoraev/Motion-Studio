import { kebab } from '@motion-studio/utils'

import type { CodegenIR } from '../../ir/ir.types'
import type { ExportOptions } from '../../options.types'
import { printJsonFile } from '../print-json'

/**
 * `package.json` — EXPORT_ENGINE.md § Next.js. "The real accumulated dependencies and working scripts",
 * which is the difference between a project and a folder of files: `npm install && npm run build` has
 * to work on the output with nothing added by hand.
 *
 * The ranges below are the ones this repository builds against, so what the export claims and what it
 * was tested with are the same numbers.
 */
export const RUNTIME_VERSIONS = {
  next: '^15.5.4',
  react: '^19.1.1',
  'react-dom': '^19.1.1',
} as const

export const TOOLING_VERSIONS = {
  '@tailwindcss/postcss': '^4.1.14',
  '@types/node': '^26.1.2',
  '@types/react': '^19.1.13',
  '@types/react-dom': '^19.1.9',
  tailwindcss: '^4.1.14',
  typescript: '~5.6.3',
} as const

const TYPES_ONLY: readonly string[] = [
  '@types/node',
  '@types/react',
  '@types/react-dom',
  'typescript',
]

const sorted = (entries: Readonly<Record<string, string>>): Readonly<Record<string, string>> =>
  Object.fromEntries(Object.entries(entries).sort(([left], [right]) => left.localeCompare(right)))

/** A document called "Landing page" ships as `landing-page`; an unnamed one as `motion-export`. */
export const projectName = (documentName: string): string => kebab(documentName) || 'motion-export'

export function printPackageJson(ir: CodegenIR, options: ExportOptions): string {
  const tooling =
    options.language === 'ts'
      ? TOOLING_VERSIONS
      : Object.fromEntries(
          Object.entries(TOOLING_VERSIONS).filter(([name]) => !TYPES_ONLY.includes(name)),
        )

  const manifest = {
    name: projectName(ir.documentName),
    version: '0.1.0',
    private: true,
    scripts: {
      dev: 'next dev',
      build: 'next build',
      start: 'next start',
    },
    dependencies: sorted({ ...RUNTIME_VERSIONS, ...ir.dependencies }),
    devDependencies: sorted(tooling),
  }

  return printJsonFile(manifest)
}

/**
 * Tailwind v4 runs as a PostCSS plugin and does nothing without this file: `@import 'tailwindcss'`
 * would stay a literal and the page would render with no utilities at all. It is not in
 * EXPORT_ENGINE.md § Next.js's tree because that tree was written against v3's `tailwind.config.ts`.
 */
export const POSTCSS_CONFIG = `const config = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
}

export default config
`
