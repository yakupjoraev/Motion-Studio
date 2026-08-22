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

export const resolveOptions = (overrides: Partial<ExportOptions> = {}): ExportOptions => ({
  ...DEFAULT_EXPORT_OPTIONS,
  ...overrides,
})
