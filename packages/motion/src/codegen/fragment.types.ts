import type { ImportSpec } from '@motion-studio/schema'

/** A helper function a fragment needs in the emitted module, deduped by name across the document. */
export interface NamedHelper {
  readonly name: string
  readonly source: string
}

/**
 * ANIMATION_SYSTEM.md § Codegen: what a preset contributes to the exported source. `buildIR`
 * (EXPORT_ENGINE.md) collects these, dedupes helpers and keyframes by content, and hoists shared
 * transitions to module constants — which is why a fragment describes its pieces instead of printing
 * a finished element.
 */
export interface MotionCodegenFragment {
  readonly imports: readonly ImportSpec[]
  /** Hook calls to place in the component body, verbatim. */
  readonly hooks?: readonly string[]
  readonly wrapper?: { readonly tag: string; readonly props: Readonly<Record<string, string>> }
  /** For css-engine presets. */
  readonly classNames?: readonly string[]
  /** Keyframes or custom properties, as source. */
  readonly css?: string
  readonly helpers?: readonly NamedHelper[]
}

/** What a preset's `codegen` is told about the document it is being printed into. */
export interface CodegenContext {
  /** The variable name the fragment should read for its element, when it needs one. */
  readonly nodeName: string
  /** `theme.motionScale`, already applied to the durations the fragment prints. */
  readonly scale: number
  /** Emit the reduced variant beside the full one — ANIMATION_SYSTEM.md § Reduced motion. */
  readonly reduced: boolean
}
