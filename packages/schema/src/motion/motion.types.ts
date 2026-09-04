/**
 * The motion a document stores, as opposed to the motion an engine runs. ANIMATION_SYSTEM.md puts the
 * pipeline as `MotionSpec (document) → ResolvedMotion → Motion / CSS`; only the first of those
 * three is a document shape, so only the first lives here. `packages/motion` owns the rest and reads
 * these types rather than redeclaring them — the dependency runs schema → motion, never back.
 */

export type MotionChannel =
  | 'entrance'
  | 'scroll'
  | 'hover'
  | 'press'
  | 'cursor'
  | 'continuous'
  | 'exit'

/** A discriminated union rather than an optional-field soup — CODE_STANDARDS.md § Preferred forms. */
export type MotionTrigger =
  | { readonly kind: 'mount' }
  | {
      readonly kind: 'inView'
      readonly amount: number
      readonly once: boolean
      readonly margin: string
    }
  | { readonly kind: 'scrollProgress'; readonly start: string; readonly end: string }
  | { readonly kind: 'hover' }
  | { readonly kind: 'press' }
  | { readonly kind: 'pointerMove'; readonly within: 'element' | 'viewport' }
  | { readonly kind: 'always' }

export type MotionTriggerKind = MotionTrigger['kind']

export interface MotionStagger {
  readonly each: number
  readonly from: 'first' | 'last' | 'center'
}

export interface MotionSpec {
  readonly presetId: string
  readonly channel: MotionChannel
  readonly trigger: MotionTrigger
  readonly params: Readonly<Record<string, number | string | boolean>>
  readonly stagger?: MotionStagger | undefined
  readonly disabled?: boolean | undefined
}
