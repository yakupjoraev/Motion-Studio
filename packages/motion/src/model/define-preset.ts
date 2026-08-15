import type { ControlDescriptor, MotionChannel } from '@motion-studio/schema'
import type { TypeOf, ZodType, ZodTypeDef } from 'zod'

import type { CodegenContext, MotionCodegenFragment } from '../codegen/fragment.types'

import type {
  MotionPreset,
  MotionPresetId,
  PresetCapabilities,
  PresetParams,
  ResolveContext,
  ResolvedMotion,
} from './preset.types'

export interface DefinePresetConfig<S extends ZodType<PresetParams, ZodTypeDef, unknown>> {
  readonly id: MotionPresetId
  readonly name: string
  readonly channel: MotionChannel
  readonly engine: ResolvedMotion['engine']
  readonly paramsSchema: S
  readonly defaults: TypeOf<S>
  readonly controls: readonly ControlDescriptor[]
  readonly capabilities: PresetCapabilities
  resolve(params: TypeOf<S>, ctx: ResolveContext): ResolvedMotion
  /** ANIMATION_SYSTEM.md § Preset definition: not optional, and the type is where that is enforced. */
  resolveReduced(params: TypeOf<S>, ctx: ResolveContext): ResolvedMotion
  codegen(params: TypeOf<S>, ctx: CodegenContext): MotionCodegenFragment
}

/**
 * The typed door into the catalogue, and — like `defineBlock` — the identity function at runtime. The
 * schema is the source of the params type, so `defaults` and every `resolve` signature are checked
 * against it rather than against a second declaration of the same shape.
 */
export function definePreset<S extends ZodType<PresetParams, ZodTypeDef, unknown>>(
  config: DefinePresetConfig<S>,
): MotionPreset<TypeOf<S>> {
  return config
}

/** The catalogue as a lookup. Prompt 32 builds one of these; the model only reads it (ADR-138). */
export function createPresetRegistry(presets: readonly MotionPreset[]) {
  const byId = new Map(presets.map((preset) => [preset.id, preset]))

  return {
    get: (id: MotionPresetId) => byId.get(id),
    list: () => presets,
  }
}
