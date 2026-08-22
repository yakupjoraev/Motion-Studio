import type { ExportOptions } from '../options.types'

/**
 * Every `(document × target × option-set)` the golden tree asserts — EXPORT_ENGINE.md § Testing.
 *
 * The list is not arbitrary and the rule it satisfies is stated here so a reader can check it: **every
 * document appears at least once, and every field of `ExportOptions` appears at least once at a
 * non-default value.** Two fields are covered by unit tests instead, and both say why below.
 *
 * `format: false` is one: a golden file that was not formatted would be a golden file that asserts our
 * line-breaking rather than the output a user gets, and `format.test.ts` covers the unformatted path
 * directly. `assets: 'inline'` is the other: no fixture document carries a data-URL asset, because a
 * base64 blob in a fixture is bytes nobody can read in a diff — `handle-assets.test.ts` covers it.
 */
export interface GoldenCase {
  /** The directory under `__golden__/expected/`, and the name a failing assertion reports. */
  readonly id: string
  /** A key of `GOLDEN_DOCUMENTS`. */
  readonly document: string
  readonly options: Partial<ExportOptions>
  /** Node id, for the one case that exports a selection rather than the document. */
  readonly selection?: string
}

export const GOLDEN_CASES: readonly GoldenCase[] = [
  { id: 'single-hero/react', document: 'single-hero', options: { target: 'react' } },
  { id: 'single-hero/next', document: 'single-hero', options: { target: 'next' } },
  {
    id: 'single-hero/react-js',
    document: 'single-hero',
    options: { target: 'react', language: 'js' },
  },
  { id: 'full-landing/react', document: 'full-landing', options: { target: 'react' } },
  { id: 'full-landing/next', document: 'full-landing', options: { target: 'next' } },
  {
    id: 'full-landing/next-single-file',
    document: 'full-landing',
    options: { target: 'next', singleFile: true },
  },
  {
    id: 'full-landing/next-plain-images',
    document: 'full-landing',
    options: { target: 'next', imageComponent: 'img', assets: 'bundle' },
  },
  {
    id: 'full-landing/react-no-motion',
    document: 'full-landing',
    options: { target: 'react', includeMotion: false },
  },
  {
    id: 'full-landing/react-no-theme',
    document: 'full-landing',
    options: { target: 'react', includeTheme: false },
  },
  {
    /** Copy React on one section — ADR-231's case, and the one path `scope` has. */
    id: 'full-landing/react-selection',
    document: 'full-landing',
    options: { target: 'react', scope: 'selection' },
    selection: 'node_pricing',
  },
  { id: 'repeated-subtrees/react', document: 'repeated-subtrees', options: { target: 'react' } },
  {
    id: 'repeated-subtrees/react-no-props',
    document: 'repeated-subtrees',
    options: { target: 'react', extractProps: false },
  },
  {
    id: 'responsive-overrides/react',
    document: 'responsive-overrides',
    options: { target: 'react' },
  },
  { id: 'nested-containers/react', document: 'nested-containers', options: { target: 'react' } },
  { id: 'eight-fade-up/react', document: 'eight-fade-up', options: { target: 'react' } },
]
