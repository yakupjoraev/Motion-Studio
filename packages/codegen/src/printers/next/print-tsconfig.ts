import type { ExportOptions } from '../../options.types'
import { printJsonFile } from '../print-json'

/**
 * `tsconfig.json` — EXPORT_ENGINE.md § Next.js: "the `@/*` path alias that the imports use". Every
 * component import the page prints is `@/components/…` and every shared constant is `@/lib/…`, so this
 * file is the one that decides whether the project resolves or not.
 *
 * A JavaScript export gets `jsconfig.json` instead, which is where Next looks for the same alias when
 * there is no TypeScript in the project.
 */
const ALIAS = { '@/*': ['./*'] }

const COMPILER_OPTIONS = {
  target: 'ES2022',
  lib: ['dom', 'dom.iterable', 'esnext'],
  allowJs: true,
  skipLibCheck: true,
  strict: true,
  noEmit: true,
  esModuleInterop: true,
  module: 'esnext',
  moduleResolution: 'bundler',
  resolveJsonModule: true,
  isolatedModules: true,
  jsx: 'preserve',
  incremental: true,
  plugins: [{ name: 'next' }],
  paths: ALIAS,
}

export const tsconfigFileName = (options: ExportOptions): string =>
  options.language === 'ts' ? 'tsconfig.json' : 'jsconfig.json'

export function printTsconfig(options: ExportOptions): string {
  if (options.language === 'js') {
    return printJsonFile({ compilerOptions: { paths: ALIAS } })
  }

  const config = {
    compilerOptions: COMPILER_OPTIONS,
    include: ['next-env.d.ts', '**/*.ts', '**/*.tsx', '.next/types/**/*.ts'],
    exclude: ['node_modules'],
  }

  return printJsonFile(config)
}
