import type { ControlDescriptor, MotionChannel, MotionStagger } from '@motion-studio/schema'
import type { EasingCurve } from '@motion-studio/tokens'
import type { ZodType, ZodTypeDef } from 'zod'

import type { CodegenContext, MotionCodegenFragment } from '../codegen/fragment.types'
import type { SpringConfig } from '../curves/simulate'

/**
 * `MotionSpec.presetId` is a plain string in the file format, so this is an alias rather than a brand:
 * a second, stricter type on this side of the seam would have to be cast at every document read.
 */
export type MotionPresetId = string

/** What a preset takes. The document stores exactly these three value kinds — FILE_FORMAT.md. */
export type PresetParams = Readonly<Record<string, number | string | boolean>>

/** A single value or a keyframe list, which is how both Motion and CSS express the same thing. */
export type TargetValue = number | string | readonly (number | string)[]

export type TargetProperties = Readonly<Record<string, TargetValue>>

export interface TransitionConfig {
  /** Milliseconds, like `DURATION` — not seconds. The engine adapter converts if its API wants seconds. */
  readonly duration?: number
  readonly delay?: number
  readonly ease?: EasingCurve
  /** Mutually exclusive with `ease`: a spring has no bezier form. */
  readonly spring?: SpringConfig
  readonly repeat?: number | 'infinite'
  readonly repeatType?: 'loop' | 'mirror' | 'reverse'
  readonly stagger?: MotionStagger
}

/** What the applier subscribes to, described rather than wired — the scheduler owns the wiring. */
export interface ListenerSpec {
  readonly event: 'hover' | 'press' | 'inView' | 'scroll' | 'pointerMove' | 'frame'
  /** The variant this event activates. */
  readonly variant: string
  readonly options?: Readonly<Record<string, number | string | boolean>>
}

/**
 * ANIMATION_SYSTEM.md § The model, the middle of the pipeline: engine-agnostic, serialisable, and pure
 * output of a preset. `properties` is the one field the document's shape does not name — ADR-140.
 */
export interface ResolvedMotion {
  readonly engine: 'css' | 'motion' | 'gsap'
  readonly variants?: Readonly<Record<string, TargetProperties>>
  readonly transition?: TransitionConfig
  readonly listeners?: readonly ListenerSpec[]
  readonly cssVars?: Readonly<Record<string, string>>
  readonly className?: string
  readonly keyframes?: string
  /**
   * Properties this resolution animates that no variant names — a class or a GSAP timeline. Composition
   * compares property sets, and a preset that animates through a stylesheet has to say so or it looks
   * like it animates nothing.
   */
  readonly properties?: readonly string[]
}

/** Nothing runs. What a disabled spec, an unknown preset and a disabled channel all resolve to. */
export const DISABLED_MOTION: ResolvedMotion = { engine: 'css' }

export interface MotionPresetRegistry {
  get(id: MotionPresetId): MotionPreset | undefined
  list(): readonly MotionPreset[]
}

/**
 * What resolution is told about the world outside the spec. The catalogue arrives here rather than
 * being imported, so `packages/motion`'s model does not depend on the presets it plays (ADR-138).
 */
export interface ResolveContext {
  readonly reduced: boolean
  /** `theme.motionScale` — 0 / 0.5 / 1 / 1.5. Multiplies every duration; `0` means reduced (ADR-141). */
  readonly scale: number
  readonly presets: MotionPresetRegistry
}

export interface PresetCapabilities {
  readonly composableWith: readonly MotionChannel[]
  readonly requiresLayoutId?: boolean
  readonly requiresChildren?: boolean
  readonly gpuHeavy?: boolean
  /** ANIMATION_SYSTEM.md § GPU discipline: shown in the gallery, warned about in the inspector. */
  readonly cost: 'cheap' | 'moderate' | 'heavy'
}

/**
 * ANIMATION_SYSTEM.md § Preset definition. `resolveReduced` and `codegen` are required by the type
 * because a preset without them is a preset that lies to a reduced-motion user or to the export.
 *
 * `resolve` and friends are methods, not function-typed properties: that keeps a `MotionPreset<P>`
 * assignable to `MotionPreset` so a registry can hold the catalogue without a cast.
 */
export interface MotionPreset<P extends PresetParams = PresetParams> {
  readonly id: MotionPresetId
  readonly name: string
  readonly channel: MotionChannel
  readonly engine: ResolvedMotion['engine']
  readonly paramsSchema: ZodType<P, ZodTypeDef, unknown>
  readonly defaults: P
  /** Drives the motion panel, exactly as a block's controls drive the inspector. */
  readonly controls: readonly ControlDescriptor[]
  readonly capabilities: PresetCapabilities
  resolve(params: P, ctx: ResolveContext): ResolvedMotion
  resolveReduced(params: P, ctx: ResolveContext): ResolvedMotion
  codegen(params: P, ctx: CodegenContext): MotionCodegenFragment
}
