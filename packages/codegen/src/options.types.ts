/**
 * EXPORT_ENGINE.md § Options, transcribed. Every field is a user-visible control in the export dialog,
 * which is why `scope` names a subtree size and not a node: the node itself arrives on `BuildIRInput`,
 * so the option set stays serialisable and memoisable on its own hash.
 */
export const EXPORT_TARGETS = ['react', 'next', 'html', 'json', 'tokens'] as const

export type ExportTarget = (typeof EXPORT_TARGETS)[number]

export const ASSET_MODES = ['reference', 'inline', 'bundle'] as const

export type AssetMode = (typeof ASSET_MODES)[number]

export const IMAGE_COMPONENTS = ['next-image', 'img'] as const

export type ImageComponent = (typeof IMAGE_COMPONENTS)[number]

export interface ExportOptions {
  readonly target: ExportTarget
  readonly language: 'ts' | 'js'
  readonly singleFile: boolean
  readonly includeMotion: boolean
  readonly includeTheme: boolean
  readonly extractProps: boolean
  readonly assets: AssetMode
  readonly imageComponent: ImageComponent
  readonly format: boolean
  /** `'selection'` is what powers **Copy React** on one node — one pipeline, one subtree. */
  readonly scope: 'document' | 'selection'
}

/**
 * What the dialog opens on. `react` rather than `next` because the single-component output is what a
 * user pastes into an existing project, and `next` is the answer to a different question — a project.
 */
export const DEFAULT_EXPORT_OPTIONS: ExportOptions = {
  target: 'react',
  language: 'ts',
  singleFile: false,
  includeMotion: true,
  includeTheme: true,
  extractProps: true,
  assets: 'reference',
  imageComponent: 'next-image',
  format: true,
  scope: 'document',
}

/**
 * Two fields the HTML target does not leave open. `singleFile` because a single self-contained document
 * has no module boundary to spend components on, and pass 1 is where component boundaries are decided
 * — ADR-237. `imageComponent` because `next/image` is a React component, and a document with no React
 * in it would print `<image>`, which HTML reads as the SVG element and renders as nothing — ADR-242.
 *
 * Both are resolved here rather than worked around in the printer, so the dialog shows what the export
 * will actually do and the IR is built from the same set the printer reads.
 */
export const resolveOptions = (overrides: Partial<ExportOptions> = {}): ExportOptions => {
  const resolved = { ...DEFAULT_EXPORT_OPTIONS, ...overrides }

  return resolved.target === 'html'
    ? { ...resolved, singleFile: true, imageComponent: 'img' }
    : resolved
}
