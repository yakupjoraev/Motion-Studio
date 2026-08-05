/**
 * `DESIGN_SYSTEM.md` § Semantic tokens. The full key set, transcribed exactly: this interface is the
 * completeness gate. Both mode maps are typed `SemanticColors`, so a missing key is a compile error
 * rather than an undefined CSS variable discovered in a screenshot.
 *
 * Three layers: primitive → semantic → component. A component never references a primitive —
 * `bg-surface-2` is legal, `bg-slate-800` is not.
 */
export interface SemanticColors {
  // surfaces, ascending elevation
  readonly 'surface-0': string
  readonly 'surface-1': string
  readonly 'surface-2': string
  readonly 'surface-3': string
  readonly 'surface-inset': string

  // text
  readonly foreground: string
  readonly 'foreground-muted': string
  readonly 'foreground-subtle': string
  readonly 'foreground-onAccent': string

  // lines
  readonly border: string
  readonly 'border-strong': string
  readonly 'border-subtle': string

  // accent
  readonly accent: string
  readonly 'accent-hover': string
  readonly 'accent-active': string
  readonly 'accent-muted': string
  readonly 'accent-ring': string

  // status
  readonly success: string
  readonly 'success-muted': string
  readonly warning: string
  readonly 'warning-muted': string
  readonly danger: string
  readonly 'danger-muted': string
  readonly info: string
  readonly 'info-muted': string

  // canvas-specific
  readonly 'canvas-bg': string
  readonly 'canvas-grid': string
  readonly 'canvas-guide': string
  readonly 'canvas-selection': string
  readonly 'canvas-hover': string
  readonly 'canvas-snap': string
}

export type SemanticColorToken = keyof SemanticColors

export type ColorMode = 'light' | 'dark'
