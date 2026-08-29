/**
 * PLAYGROUND.md § Parsing and validation. The shape is shared by the three consumers — the importer,
 * the inspector's `css` field and the playground — because they are the same check, and a security
 * boundary with two shapes grows two behaviours.
 */
export type CssLayer = 'structural' | 'blocklist' | 'native' | 'feature'

export interface CssError {
  /** Says what, and where, and implies what to do: "Unexpected ')' — 3 open parens, 4 closing". */
  readonly message: string
  /** 1-based, so it matches what a reader counts in the editor. */
  readonly line: number
  /** 1-based. */
  readonly column: number
  readonly severity: 'error' | 'warning'
  readonly layer: CssLayer
}

/** A modern construct in the value, with the note the playground shows beside it. */
export interface CssFeature {
  readonly id: string
  /** How the feature is written: `oklch()`, `backdrop-filter`. */
  readonly label: string
  /** Where it landed: "Safari 15.4+, Chrome 111+". */
  readonly support: string
}

export type CssValidation =
  | {
      readonly ok: true
      readonly normalized: string
      readonly features: readonly CssFeature[]
      /**
       * ADR-268: `CSS.supports` was unavailable, so layer 3 did not run. Layers 1, 2 and 5 — the
       * security-relevant ones — always do, so this is "validity unknown", never "unchecked".
       */
      readonly unverified: boolean
    }
  | { readonly ok: false; readonly errors: readonly CssError[] }

export interface Position {
  readonly line: number
  readonly column: number
}
